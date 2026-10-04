import type { Platform, Theme } from "../types";

export const PLATFORMS: Platform[] = ["PC", "Console", "Mobile"];
export const THEMES: Theme[] = [
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Medieval",
  "Modern",
  "Futuristic",
  "Mystery",
  "Sports",
];

export interface PlatformProfile {
  platform: Platform;
  costMultiplier: number;
  reachMultiplier: number; // dimensione del mercato potenziale
  platformCut: number; // percentuale trattenuta dalla piattaforma (0-1)
}

export const PLATFORM_PROFILES: Record<Platform, PlatformProfile> = {
  PC: { platform: "PC", costMultiplier: 1, reachMultiplier: 1, platformCut: 0.3 },
  Console: { platform: "Console", costMultiplier: 1.25, reachMultiplier: 1.3, platformCut: 0.3 },
  Mobile: { platform: "Mobile", costMultiplier: 0.8, reachMultiplier: 1.6, platformCut: 0.3 },
};

// Modificatore leggero che alcuni temi applicano a determinati assi (usato in development.ts).
export const THEME_SOUND_STORY_BONUS: Theme[] = ["Horror", "Mystery", "Fantasy"];
