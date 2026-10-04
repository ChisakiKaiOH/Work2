import type { ActiveEvent, Employee, GameEventId, Genre, ReleasedGame } from "../types";
import { EVENT_DEFINITIONS } from "../data/events";
import { weightedPick, pick, type RandomFn, defaultRandom } from "../utils/random";
import { createId } from "../utils/id";

export const EVENT_CHANCE_PER_MONTH = 0.35;

export interface EventContext {
  employees: Employee[];
  releasedGames: ReleasedGame[];
  genres: Genre[];
}

export function pickEventDefinition(ctx: EventContext, rng: RandomFn = defaultRandom) {
  const eligible = EVENT_DEFINITIONS.filter((def) => {
    if (def.requiresEmployees && ctx.employees.length === 0) return false;
    if (def.requiresReleasedGame && ctx.releasedGames.length === 0) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  return weightedPick(eligible, rng);
}

const CHOICES: Record<GameEventId, { label: string; description: string }[] | null> = {
  talentApplies: [
    { label: "Assumi subito", description: "Lo assumi a condizioni vantaggiose." },
    { label: "Ignora la candidatura", description: "Non hai budget o posizioni libere al momento." },
  ],
  criticalBug: [
    { label: "Correggi subito (costo immediato)", description: "Investi risorse extra per risolverlo ora." },
    { label: "Rimanda la correzione", description: "Il bug resterà nel gioco, con un rischio per le recensioni." },
  ],
  viralPositiveReview: null,
  negativeReview: null,
  competitorRelease: null,
  platformFeeHike: null,
  suddenTrend: null,
  streamerPlay: null,
  raiseRequest: [
    { label: "Concedi l'aumento", description: "Il dipendente è più motivato, ma i costi mensili salgono." },
    { label: "Rifiuta", description: "Risparmi denaro, ma il morale del dipendente ne risente." },
  ],
  investmentOpportunity: [
    { label: "Accetta l'investimento", description: "Ricevi denaro subito, con un rimborso nei mesi successivi." },
    { label: "Rifiuta", description: "Nessun rischio, nessun guadagno immediato." },
  ],
};

export function buildActiveEvent(
  def: (typeof EVENT_DEFINITIONS)[number],
  month: number,
  ctx: EventContext,
  rng: RandomFn = defaultRandom
): ActiveEvent {
  const context: ActiveEvent["context"] = {};
  let description = def.description;

  if (def.requiresEmployees && ctx.employees.length > 0) {
    const emp = pick(ctx.employees, rng);
    context.employeeId = emp.id;
    if (def.id === "raiseRequest") {
      description = `${emp.name} (${emp.role}) chiede un aumento di stipendio, convinto di meritarlo.`;
    }
  }

  if (def.requiresReleasedGame && ctx.releasedGames.length > 0) {
    const game = pick(ctx.releasedGames, rng);
    context.releasedGameId = game.id;
    if (def.id === "viralPositiveReview") {
      description = `Un influente sito di settore ha pubblicato una recensione entusiasta di "${game.name}".`;
    } else if (def.id === "negativeReview") {
      description = `Una recensione molto critica ha colpito "${game.name}".`;
    } else if (def.id === "streamerPlay") {
      description = `Un noto streamer ha trasmesso in diretta "${game.name}", portando grande visibilità.`;
    }
  }

  if (def.id === "suddenTrend" || def.id === "competitorRelease") {
    const genre = pick(ctx.genres, rng);
    context.genre = genre;
    description =
      def.id === "suddenTrend"
        ? `Il genere ${genre} ha avuto un'improvvisa ondata di popolarità presso il pubblico.`
        : `Uno studio rivale ha pubblicato un titolo ${genre} molto simile ai tuoi progetti.`;
  }

  return {
    id: createId("event"),
    type: def.id,
    month,
    title: def.title,
    description,
    choices: CHOICES[def.id],
    context,
  };
}
