import type { TechNode } from "../types";

// Albero tecnologico originale: ogni nodo sblocca un effetto reale applicato
// in systems/development.ts e systems/sales.ts tramite TECH_EFFECTS sotto.
export const TECH_TREE: TechNode[] = [
  {
    id: "engineBasic",
    name: "Motore Proprietario I",
    description: "Un motore di gioco interno, solido e flessibile. Migliora la qualità tecnologica di base.",
    cost: 10_000,
    durationMonths: 1,
    prerequisites: [],
    category: "Engine",
  },
  {
    id: "engineAdvanced",
    name: "Motore Proprietario II",
    description: "Versione evoluta del motore. Sblocca progetti di dimensione Large.",
    cost: 35_000,
    durationMonths: 2,
    prerequisites: ["engineBasic"],
    category: "Engine",
  },
  {
    id: "advancedAI",
    name: "IA Avanzata",
    description: "Comportamenti intelligenti per NPC e avversari. Aumenta il tetto di Gameplay.",
    cost: 30_000,
    durationMonths: 2,
    prerequisites: ["engineBasic"],
    category: "Gameplay",
  },
  {
    id: "graphics3d",
    name: "Pipeline Grafica 3D",
    description: "Rendering tridimensionale moderno. Sblocca progetti AAA.",
    cost: 60_000,
    durationMonths: 3,
    prerequisites: ["engineAdvanced"],
    category: "Graphics",
  },
  {
    id: "physicsEngine",
    name: "Motore Fisico",
    description: "Simulazione fisica realistica. Migliora Gameplay e Tecnologia per Racing e Action.",
    cost: 45_000,
    durationMonths: 2,
    prerequisites: ["graphics3d"],
    category: "Gameplay",
  },
  {
    id: "onlineMultiplayer",
    name: "Infrastruttura Multiplayer",
    description: "Server e netcode per il gioco online. Apre un canale di ricavi post-lancio continuativo.",
    cost: 55_000,
    durationMonths: 3,
    prerequisites: ["engineAdvanced"],
    category: "Online",
  },
  {
    id: "rayTracing",
    name: "Illuminazione Avanzata",
    description: "Illuminazione e riflessi di nuova generazione. Grande spinta alla Grafica nei progetti AAA.",
    cost: 90_000,
    durationMonths: 3,
    prerequisites: ["graphics3d"],
    category: "Graphics",
  },
  {
    id: "virtualReality",
    name: "Realtà Virtuale",
    description: "Supporto a visori VR. Apre una nicchia di mercato ad alto margine.",
    cost: 70_000,
    durationMonths: 3,
    prerequisites: ["physicsEngine"],
    category: "Immersive",
  },
  {
    id: "proceduralGen",
    name: "Generazione Procedurale",
    description: "Contenuti generati algoritmicamente. Riduce tempo e costo dei progetti Large/AAA.",
    cost: 50_000,
    durationMonths: 2,
    prerequisites: ["advancedAI"],
    category: "Gameplay",
  },
];

export function techById(id: string): TechNode | undefined {
  return TECH_TREE.find((t) => t.id === id);
}

export function prerequisitesMet(tech: TechNode, unlocked: string[]): boolean {
  return tech.prerequisites.every((p) => unlocked.includes(p));
}
