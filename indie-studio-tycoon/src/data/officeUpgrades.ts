import type { OfficeUpgrade } from "../types";

// Stato iniziale degli upgrade dell'ufficio (livello 0 = non ancora acquistato).
export function createInitialOfficeUpgrades(): OfficeUpgrade[] {
  return [
    {
      id: "office",
      name: "Ufficio",
      description: "Spazio di lavoro: aumenta la capacità massima del team e il morale di base.",
      level: 0,
      maxLevel: 4,
      costForNextLevel: [5_000, 15_000, 40_000, 90_000],
      upkeepPerLevel: 500,
    },
    {
      id: "workstations",
      name: "Postazioni di lavoro",
      description: "Computer e strumenti migliori: aumenta la produttività di Programmatori e Artisti.",
      level: 0,
      maxLevel: 4,
      costForNextLevel: [4_000, 12_000, 30_000, 70_000],
      upkeepPerLevel: 300,
    },
    {
      id: "servers",
      name: "Server",
      description: "Infrastruttura server: riduce i bug nei progetti grandi e serve per il multiplayer online.",
      level: 0,
      maxLevel: 4,
      costForNextLevel: [6_000, 18_000, 45_000, 100_000],
      upkeepPerLevel: 450,
    },
    {
      id: "meetingRoom",
      name: "Sala riunioni",
      description: "Favorisce la comunicazione: aumenta il recupero di morale del team.",
      level: 0,
      maxLevel: 3,
      costForNextLevel: [3_000, 9_000, 20_000],
      upkeepPerLevel: 150,
    },
    {
      id: "rndLab",
      name: "Laboratorio R&D",
      description: "Riduce il costo e la durata della ricerca tecnologica.",
      level: 0,
      maxLevel: 3,
      costForNextLevel: [8_000, 22_000, 55_000],
      upkeepPerLevel: 350,
    },
    {
      id: "marketingDept",
      name: "Area marketing",
      description: "Aumenta l'efficacia di ogni euro investito in marketing.",
      level: 0,
      maxLevel: 3,
      costForNextLevel: [5_000, 16_000, 38_000],
      upkeepPerLevel: 250,
    },
  ];
}
