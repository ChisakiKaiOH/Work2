import type { EmployeeRole, QualityAxis } from "../types";

export interface RoleProfile {
  role: EmployeeRole;
  label: string;
  baseSalary: number; // al livello 1
  salaryPerLevel: number;
  primaryAxis: QualityAxis | null; // asse di qualità che alimenta principalmente
  phaseAffinity: string[]; // fasi di sviluppo in cui è più efficace
}

export const ROLE_PROFILES: Record<EmployeeRole, RoleProfile> = {
  Programmer: {
    role: "Programmer",
    label: "Programmatore",
    baseSalary: 1900,
    salaryPerLevel: 480,
    primaryAxis: "technology",
    phaseAffinity: ["Programming", "Testing"],
  },
  Designer: {
    role: "Designer",
    label: "Designer",
    baseSalary: 1750,
    salaryPerLevel: 440,
    primaryAxis: "gameplay",
    phaseAffinity: ["Concept", "Design"],
  },
  Artist: {
    role: "Artist",
    label: "Artista",
    baseSalary: 1700,
    salaryPerLevel: 420,
    primaryAxis: "graphics",
    phaseAffinity: ["Art", "Polish"],
  },
  AudioDesigner: {
    role: "AudioDesigner",
    label: "Sound Designer",
    baseSalary: 1500,
    salaryPerLevel: 380,
    primaryAxis: "sound",
    phaseAffinity: ["Audio", "Polish"],
  },
  Producer: {
    role: "Producer",
    label: "Producer",
    baseSalary: 2200,
    salaryPerLevel: 520,
    primaryAxis: null,
    phaseAffinity: ["Testing", "Polish"],
  },
};

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  "Programmer",
  "Designer",
  "Artist",
  "AudioDesigner",
  "Producer",
];

export function salaryForLevel(role: EmployeeRole, level: number): number {
  const profile = ROLE_PROFILES[role];
  return Math.round(profile.baseSalary + profile.salaryPerLevel * (level - 1));
}
