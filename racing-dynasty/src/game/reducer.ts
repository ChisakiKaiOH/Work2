import type { PlayerState } from '../types';
import type { GameAction } from './actions';
import { createNewPlayer, createCarInstance } from './initialState';
import { canAfford, spend, add, clamp } from '../services/economy';
import { applyXp, maxEnergyForLevel, tickEnergy, ENERGY_PER_RACE } from '../services/progression';
import { checkNewAchievements } from '../services/achievements';
import { generateMarket, MARKET_REFRESH_MS } from '../services/market';
import { openPack } from '../services/packs';
import { upgradeCost, isMaxLevel } from '../services/performanceRating';
import { CAR_BY_ID, ACHIEVEMENTS, PACK_BY_ID, DAILY_REWARDS, CHAMPIONSHIPS, BOSSES, COLLECTIONS } from '../data';
import { hashSeed, mulberry32 } from '../simulation/rng';

function grantCurrency(player: PlayerState, credits: number, tokens: number): PlayerState {
  return {
    ...player,
    credits: add(player.credits, credits),
    tokens: add(player.tokens, tokens),
    totalCreditsEarned: credits > 0 ? player.totalCreditsEarned + credits : player.totalCreditsEarned,
  };
}

function grantXp(player: PlayerState, xp: number): PlayerState {
  const { level, xp: newXp, rewards } = applyXp(player.level, player.xp, xp);
  let next: PlayerState = { ...player, level, xp: newXp, maxEnergy: maxEnergyForLevel(level) };
  for (const r of rewards) {
    next = grantCurrency(next, r.credits, r.tokens);
    next = { ...next, energy: clamp(next.energy + r.energy, 0, next.maxEnergy) };
  }
  return next;
}

function applyAchievements(player: PlayerState): PlayerState {
  const newly = checkNewAchievements(player);
  if (!newly.length) return player;
  let next = player;
  for (const id of newly) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) continue;
    next = grantCurrency(next, def.rewardCredits, def.rewardTokens);
  }
  return { ...next, achievementsUnlocked: [...next.achievementsUnlocked, ...newly] };
}

function updateCollectionProgress(player: PlayerState): PlayerState {
  const ownedDefIds = new Set(player.ownedCars.map(c => c.defId));
  const progress = { ...player.collectionProgress };
  let creditsGain = 0, tokensGain = 0;
  let changed = false;
  for (const col of COLLECTIONS) {
    const already = progress[col.id] === true;
    const complete = col.carDefIds.every(id => ownedDefIds.has(id));
    if (complete && !already) {
      progress[col.id] = true;
      creditsGain += col.rewardCredits;
      tokensGain += col.rewardTokens;
      changed = true;
    }
  }
  if (!changed) return player;
  return grantCurrency({ ...player, collectionProgress: progress }, creditsGain, tokensGain);
}

function ensureMarket(player: PlayerState): PlayerState {
  const now = Date.now();
  if (player.marketGeneratedAt && now - player.marketGeneratedAt < MARKET_REFRESH_MS && player.marketListings.length) {
    return player;
  }
  const rng = mulberry32(hashSeed(`market_${Math.floor(now / MARKET_REFRESH_MS)}`));
  return { ...player, marketListings: generateMarket(rng, now), marketGeneratedAt: now };
}

function postProcess(player: PlayerState): PlayerState {
  let next = applyAchievements(player);
  next = updateCollectionProgress(next);
  next = ensureMarket(next);
  return next;
}

export function gameReducer(state: PlayerState | null, action: GameAction): PlayerState | null {
  switch (action.type) {
    case 'NEW_GAME': {
      return postProcess(ensureMarket(createNewPlayer(action.name)));
    }

    case 'LOAD_SAVE': {
      return postProcess(action.player);
    }

    case 'RESET_SAVE': {
      return null;
    }

    default:
      break;
  }

  if (!state) return state;

  switch (action.type) {
    case 'CHOOSE_STARTER_CAR': {
      if (state.firstCarChosen) return state;
      const instance = createCarInstance(action.carDefId);
      return postProcess({
        ...state,
        ownedCars: [...state.ownedCars, instance],
        selectedCarInstanceId: instance.instanceId,
        firstCarChosen: true,
      });
    }

    case 'COMPLETE_TUTORIAL':
      return { ...state, tutorialCompleted: true };

    case 'SELECT_CAR':
      if (!state.ownedCars.some(c => c.instanceId === action.instanceId)) return state;
      return { ...state, selectedCarInstanceId: action.instanceId };

    case 'SELECT_DRIVER':
      if (!state.ownedDriverIds.includes(action.driverId)) return state;
      return { ...state, selectedDriverId: action.driverId };

    case 'TOGGLE_FAVORITE': {
      return {
        ...state,
        ownedCars: state.ownedCars.map(c => c.instanceId === action.instanceId ? { ...c, favorite: !c.favorite } : c),
      };
    }

    case 'EQUIP_TIRE': {
      return {
        ...state,
        ownedCars: state.ownedCars.map(c => c.instanceId === action.instanceId ? { ...c, equippedTire: action.tire } : c),
      };
    }

    case 'UPGRADE_CAR': {
      const car = state.ownedCars.find(c => c.instanceId === action.instanceId);
      if (!car) return state;
      const level = car.upgrades[action.category];
      if (isMaxLevel(level)) return state;
      let cost = upgradeCost(action.category, level);
      let usePart = false;
      if (state.upgradeParts > 0) {
        cost = Math.round(cost * 0.75);
        usePart = true;
      }
      if (!canAfford(state.credits, cost)) return state;
      const credits = spend(state.credits, cost, 'credits');
      const ownedCars = state.ownedCars.map(c =>
        c.instanceId === action.instanceId
          ? { ...c, upgrades: { ...c.upgrades, [action.category]: level + 1 } }
          : c
      );
      return postProcess({
        ...state,
        credits,
        upgradeParts: usePart ? state.upgradeParts - 1 : state.upgradeParts,
        ownedCars,
      });
    }

    case 'APPLY_RACE_RESULT': {
      const { result, instanceId, source } = action;
      if (state.energy < ENERGY_PER_RACE) return state;

      let next: PlayerState = {
        ...state,
        energy: clamp(state.energy - ENERGY_PER_RACE, 0, state.maxEnergy),
        completedRaceCount: state.completedRaceCount + 1,
        wonRaceCount: state.wonRaceCount + (result.playerPosition === 1 && !result.playerDnf ? 1 : 0),
      };
      next = grantCurrency(next, result.creditsEarned + result.bonusCredits, 0);
      next = grantXp(next, result.xpEarned);

      next = {
        ...next,
        ownedCars: next.ownedCars.map(c => c.instanceId === instanceId
          ? {
              ...c,
              racesCompleted: c.racesCompleted + 1,
              wins: c.wins + (result.playerPosition === 1 && !result.playerDnf ? 1 : 0),
              xp: c.xp + result.xpEarned,
            }
          : c),
      };

      for (const drop of result.drops) {
        if (drop.kind === 'tokens') next = grantCurrency(next, 0, drop.amount ?? 0);
        if (drop.kind === 'upgradePart') next = { ...next, upgradeParts: next.upgradeParts + (drop.amount ?? 1) };
      }

      if (source.kind === 'championship') {
        const champ = CHAMPIONSHIPS.find(c => c.id === source.championshipId);
        const prevProgress = next.championshipProgress[source.championshipId] ?? { racesWon: 0, completed: false, standing: 0 };
        const won = result.playerPosition === 1 && !result.playerDnf;
        const racesWon = prevProgress.racesWon + (won ? 1 : 0);
        const isLastRace = source.raceIndex === (champ?.trackIds.length ?? 5) - 1;
        const nowCompleted = isLastRace && !prevProgress.completed;
        let updated: PlayerState = {
          ...next,
          championshipProgress: {
            ...next.championshipProgress,
            [source.championshipId]: { racesWon, completed: prevProgress.completed || (isLastRace && racesWon >= 3), standing: result.playerPosition },
          },
        };
        if (nowCompleted && racesWon >= 3 && champ) {
          updated = grantCurrency(updated, champ.creditReward, champ.tokenReward);
        }
        next = updated;
      }

      if (source.kind === 'boss') {
        const boss = BOSSES.find(b => b.id === source.bossId);
        const won = result.playerPosition === 1 && !result.playerDnf;
        if (won && boss && !next.bossesDefeated.includes(boss.id)) {
          next = grantCurrency({ ...next, bossesDefeated: [...next.bossesDefeated, boss.id] }, boss.rewardCredits, boss.rewardTokens);
          if (boss.rewardCarId && next.ownedCars.length < next.garageSlots) {
            next = { ...next, ownedCars: [...next.ownedCars, createCarInstance(boss.rewardCarId)] };
          }
        }
      }

      next = {
        ...next,
        raceHistory: [
          ...next.raceHistory.slice(-49),
          {
            raceId: `${source.kind}_${Date.now()}`,
            trackId: result.trackId,
            position: result.playerPosition,
            totalDrivers: result.standings.length,
            creditsEarned: result.creditsEarned + result.bonusCredits,
            xpEarned: result.xpEarned,
            timestamp: Date.now(),
          },
        ],
      };

      return postProcess(next);
    }

    case 'BUY_MARKET_CAR': {
      const listing = state.marketListings.find(l => l.id === action.listingId);
      if (!listing || !canAfford(state.credits, listing.price)) return state;
      if (state.ownedCars.length >= state.garageSlots) return state;
      const instance = { ...createCarInstance(listing.defId), upgrades: { ...listing.upgrades } };
      return postProcess({
        ...state,
        credits: spend(state.credits, listing.price, 'credits'),
        ownedCars: [...state.ownedCars, instance],
        marketListings: state.marketListings.filter(l => l.id !== action.listingId),
      });
    }

    case 'REFRESH_MARKET': {
      const rng = mulberry32(hashSeed(`manual_${Date.now()}`));
      return { ...state, marketListings: generateMarket(rng, Date.now()), marketGeneratedAt: Date.now() };
    }

    case 'OPEN_PACK': {
      const pack = PACK_BY_ID[action.packId];
      if (!pack) return state;
      const balance = pack.currency === 'credits' ? state.credits : state.tokens;
      if (!canAfford(balance, pack.price)) return state;
      if (state.ownedCars.length + pack.carCount > state.garageSlots) return state;

      const rng = mulberry32(hashSeed(`pack_${action.packId}_${Date.now()}_${Math.random()}`));
      const pity = state.packPity[action.packId] ?? 0;
      const { cars, newPityCount } = openPack(pack, pity, rng);
      const newInstances = cars.map(c => createCarInstance(c.id));

      const credits = pack.currency === 'credits' ? spend(state.credits, pack.price, 'credits') : state.credits;
      const tokens = pack.currency === 'tokens' ? spend(state.tokens, pack.price, 'tokens') : state.tokens;

      return postProcess({
        ...state,
        credits,
        tokens,
        ownedCars: [...state.ownedCars, ...newInstances],
        packPity: { ...state.packPity, [action.packId]: newPityCount },
      });
    }

    case 'CLAIM_DAILY_REWARD': {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (state.lastDailyClaim && now - state.lastDailyClaim < oneDay) return state;
      const missedTooLong = state.lastDailyClaim !== null && now - state.lastDailyClaim > oneDay * 2;
      const nextStreak = missedTooLong ? 1 : (state.dailyRewardStreak % 7) + 1;
      const reward = DAILY_REWARDS.find(d => d.day === nextStreak) ?? DAILY_REWARDS[0];

      let next: PlayerState = { ...state, dailyRewardStreak: nextStreak, lastDailyClaim: now };
      switch (reward.kind) {
        case 'credits': next = grantCurrency(next, reward.amount, 0); break;
        case 'tokens': next = grantCurrency(next, 0, reward.amount); break;
        case 'energy': next = { ...next, energy: clamp(next.energy + reward.amount, 0, next.maxEnergy) }; break;
        case 'upgradeParts': next = { ...next, upgradeParts: next.upgradeParts + reward.amount }; break;
        case 'pack':
        case 'premiumPack': {
          const packId = reward.kind === 'premiumPack' ? 'pack_epic' : 'pack_basic';
          const pack = PACK_BY_ID[packId];
          if (pack) {
            const rng = mulberry32(hashSeed(`daily_${now}`));
            const pity = next.packPity[packId] ?? 0;
            const { cars, newPityCount } = openPack(pack, pity, rng);
            next = {
              ...next,
              ownedCars: [...next.ownedCars, ...cars.map(c => createCarInstance(c.id))],
              packPity: { ...next.packPity, [packId]: newPityCount },
            };
          }
          break;
        }
      }
      return postProcess(next);
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'TICK_ENERGY': {
      const { energy, lastTick } = tickEnergy(state.energy, state.maxEnergy, state.lastEnergyTick, Date.now());
      if (energy === state.energy && lastTick === state.lastEnergyTick) return state;
      return { ...state, energy, lastEnergyTick: lastTick };
    }

    case 'WATCH_AD_REWARD': {
      if (action.placement === 'restore_energy') {
        return { ...state, energy: state.maxEnergy };
      }
      if (action.placement === 'free_pack') {
        const pack = PACK_BY_ID['pack_basic'];
        const rng = mulberry32(hashSeed(`ad_pack_${Date.now()}`));
        const pity = state.packPity[pack.id] ?? 0;
        const { cars, newPityCount } = openPack(pack, pity, rng);
        return postProcess({
          ...state,
          ownedCars: [...state.ownedCars, ...cars.map(c => createCarInstance(c.id))],
          packPity: { ...state.packPity, [pack.id]: newPityCount },
        });
      }
      // 'double_reward' is applied by the screen that just showed a result, via a follow-up grant.
      return state;
    }

    case 'GRANT_BONUS': {
      // Used by the "watch an ad to double this reward" flow on the result
      // screen: the screen already knows the amounts (it just displayed
      // them), this just routes the grant through the same currency/XP path
      // every other reward uses instead of mutating state directly.
      let next = grantCurrency(state, action.credits, action.tokens);
      if (action.xp > 0) next = grantXp(next, action.xp);
      return postProcess(next);
    }

    case 'PURCHASE_PRODUCT': {
      // MockMonetizationService never charges real money; this just grants the
      // product's virtual contents so the full UX loop is testable end-to-end.
      switch (action.productId) {
        case 'remove_ads':
          return { ...state, monetization: { ...state.monetization, adsRemoved: true } };
        case 'token_pack_small': return grantCurrency(state, 0, 100);
        case 'token_pack_medium': return grantCurrency(state, 0, 550);
        case 'token_pack_large': return grantCurrency(state, 0, 1200);
        case 'starter_pack': {
          const hasRoom = state.ownedCars.length < state.garageSlots;
          const withCar = hasRoom ? { ...state, ownedCars: [...state.ownedCars, createCarInstance(pickRareStarterCar())] } : state;
          return postProcess(grantCurrency(withCar, 2000, 200));
        }
        case 'premium_pack': {
          const hasRoom = state.ownedCars.length < state.garageSlots;
          const withCar = hasRoom ? { ...state, ownedCars: [...state.ownedCars, createCarInstance(pickRareStarterCar())] } : state;
          return postProcess(grantCurrency(withCar, 4000, 500));
        }
        default:
          return state;
      }
    }

    default:
      return state;
  }
}

function pickRareStarterCar(): string {
  const candidates = Object.values(CAR_BY_ID).filter(c => c.rarity === 'Rare');
  return candidates[Math.floor(Math.random() * candidates.length)]?.id ?? 'car_004';
}
