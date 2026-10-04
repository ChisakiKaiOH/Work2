import type { Allocation, GameState, Platform, TimeSpeed } from "../types";
import type { NewProjectChoice } from "../systems/projectFactory";

export type GameAction =
  | { type: "TICK" }
  | { type: "SET_SPEED"; speed: TimeSpeed }
  | { type: "START_PROJECT"; choice: NewProjectChoice; allocation: Allocation; employeeIds: string[] }
  | { type: "UPDATE_PROJECT_ALLOCATION"; projectId: string; allocation: Allocation }
  | { type: "ASSIGN_EMPLOYEE"; projectId: string; employeeId: string }
  | { type: "UNASSIGN_EMPLOYEE"; employeeId: string }
  | { type: "PUBLISH_PROJECT"; projectId: string; price: number }
  | { type: "HIRE_EMPLOYEE"; candidateId: string }
  | { type: "FIRE_EMPLOYEE"; employeeId: string }
  | { type: "PROMOTE_EMPLOYEE"; employeeId: string }
  | { type: "TRAIN_EMPLOYEE"; employeeId: string }
  | { type: "REFRESH_CANDIDATES" }
  | { type: "START_RESEARCH"; techId: string }
  | { type: "UPGRADE_OFFICE"; upgradeId: string }
  | { type: "SET_MARKETING_BUDGET"; amount: number }
  | { type: "APPLY_DISCOUNT"; gameId: string; discount: number }
  | { type: "RELEASE_UPDATE"; gameId: string }
  | { type: "RELEASE_DLC"; gameId: string }
  | { type: "PORT_GAME"; gameId: string; platform: Platform }
  | { type: "MAKE_SEQUEL"; gameId: string }
  | { type: "RESOLVE_EVENT"; choiceIndex: number | null }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "NEW_GAME"; studioName: string }
  | { type: "SET_ACTIVE_SLOT"; slot: number | null }
  | { type: "START_TUTORIAL" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "SKIP_TUTORIAL" }
  | { type: "CLEAR_GAME" };
