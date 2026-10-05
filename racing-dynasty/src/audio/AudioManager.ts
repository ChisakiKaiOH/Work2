// AudioManager — fully procedural (Web Audio API oscillators), so the game
// ships with real music and sound without bundling any audio asset or
// depending on a license. See AUDIO section of ARCHITECTURE.md.

export type SfxName = 'click' | 'upgrade' | 'purchase' | 'reward' | 'packOpen'
  | 'raceStart' | 'overtake' | 'victory' | 'defeat' | 'engineRev';
export type MusicTrack = 'menu' | 'race';

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private musicOn = true;
  private soundOn = true;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTrack: MusicTrack | null = null;

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (this.currentTrack) this.playMusic(this.currentTrack);
  }
  setSoundOn(on: boolean) {
    this.soundOn = on;
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, peak: number, c: AudioContext) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(peak, c.currentTime + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }

  private readonly SFX: Record<SfxName, [number, number, number, OscillatorType, number][]> = {
    click: [[700, 0, 0.05, 'square', 0.05]],
    upgrade: [[440, 0, 0.08, 'triangle', 0.08], [660, 0.07, 0.1, 'triangle', 0.08], [880, 0.15, 0.14, 'triangle', 0.09]],
    purchase: [[520, 0, 0.07, 'sine', 0.07], [780, 0.06, 0.12, 'sine', 0.08]],
    reward: [[523, 0, 0.1, 'square', 0.08], [659, 0.09, 0.1, 'square', 0.08], [880, 0.18, 0.2, 'square', 0.1]],
    packOpen: [[330, 0, 0.1, 'sawtooth', 0.05], [440, 0.09, 0.1, 'sawtooth', 0.05], [660, 0.18, 0.1, 'sawtooth', 0.06], [880, 0.27, 0.22, 'sawtooth', 0.08]],
    raceStart: [[300, 0, 0.12, 'square', 0.07], [300, 0.35, 0.12, 'square', 0.07], [300, 0.7, 0.12, 'square', 0.07], [600, 1.05, 0.3, 'square', 0.1]],
    overtake: [[500, 0, 0.05, 'sawtooth', 0.06], [700, 0.04, 0.08, 'sawtooth', 0.07]],
    victory: [[523, 0, 0.14, 'square', 0.09], [659, 0.13, 0.14, 'square', 0.09], [784, 0.26, 0.14, 'square', 0.09], [1047, 0.39, 0.35, 'square', 0.11]],
    defeat: [[392, 0, 0.18, 'sawtooth', 0.07], [330, 0.17, 0.2, 'sawtooth', 0.07], [262, 0.35, 0.42, 'sawtooth', 0.08]],
    engineRev: [[90, 0, 0.3, 'sawtooth', 0.05], [140, 0.1, 0.25, 'sawtooth', 0.05]],
  };

  play(name: SfxName) {
    if (!this.soundOn) return;
    const c = this.ensureCtx();
    if (!c) return;
    this.SFX[name].forEach(([freq, start, dur, type, peak]) => this.tone(freq, start, dur, type, peak, c));
  }

  private readonly TRACKS: Record<MusicTrack, { tempo: number; type: OscillatorType; peak: number; notes: number[] }> = {
    menu: { tempo: 0.5, type: 'triangle', peak: 0.04, notes: [330, 392, 440, 392, 349, 392, 440, 523] },
    race: { tempo: 0.33, type: 'square', peak: 0.03, notes: [220, 262, 294, 262, 220, 196, 220, 262, 294, 330, 294, 262] },
  };

  private scheduleLoop(track: MusicTrack) {
    const c = this.ensureCtx();
    if (!c || !this.musicOn) return;
    const t = this.TRACKS[track];
    t.notes.forEach((freq, i) => this.tone(freq, i * t.tempo, t.tempo * 0.9, t.type, t.peak, c));
    this.musicTimer = setTimeout(() => this.scheduleLoop(track), t.notes.length * t.tempo * 1000);
  }

  playMusic(track: MusicTrack) {
    this.currentTrack = track;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
    if (this.musicOn) this.scheduleLoop(track);
  }

  stopMusic() {
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }
}

export const AudioManager = new AudioManagerImpl();
