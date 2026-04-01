export const POSITIONS = [
  "P", "C", "1B", "2B", "SS", "3B", "LF", "LC", "RC", "RF",
] as const;

export type Position = (typeof POSITIONS)[number];

export const INFIELD_POSITIONS: Position[] = ["P", "C", "1B", "2B", "SS", "3B"];
export const OUTFIELD_POSITIONS: Position[] = ["LF", "LC", "RC", "RF"];
export const PRIORITY_POSITIONS: Position[] = ["P", "1B", "3B"];

export const INNINGS = [1, 2, 3, 4, 5, 6] as const;
export type InningNumber = (typeof INNINGS)[number];

export type HalfInning = "top" | "bottom";

export type CoachMode = "fairness" | "balanced" | "win-now";

export type GameStatus = "scheduled" | "live" | "final";

export type AssignmentType = "planned" | "actual";

export interface PlayerRatings {
  fieldingOverall: number; // 1-5
  catching: number;        // 1-5
  throwing: number;        // 1-5
  battingOverall: number;  // 1-5
}

export interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  fieldingOverall: number;
  catching: number;
  throwing: number;
  battingOverall: number;
  active: boolean;
  teamId: string;
}

export interface GameData {
  id: string;
  teamId: string;
  opponentName: string;
  gameDate: string;
  coachMode: CoachMode;
  lineupLocked: boolean;
  gameStatus: GameStatus;
  currentInning: number;
  currentHalf: HalfInning;
  currentOuts: number;
  finalTeamScore: number | null;
  finalOpponentScore: number | null;
  notes: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BattingOrderEntry {
  battingSlot: number;
  playerId: string;
}

export interface FieldingAssignment {
  inningNumber: number;
  position: Position;
  playerId: string;
  assignmentType: AssignmentType;
}

export interface LineupData {
  battingOrder: BattingOrderEntry[];
  fieldingAssignments: FieldingAssignment[];
}

export interface LiveGameState {
  currentInning: number;
  currentHalf: HalfInning;
  currentOuts: number;
  gameStatus: GameStatus;
  finalTeamScore: number | null;
  finalOpponentScore: number | null;
  scoreByInning: ScoreByInning[];
}

export interface ScoreByInning {
  inningNumber: number;
  half: HalfInning;
  usRuns: number;
  opponentRuns: number;
  outsRecorded: number;
  completed: boolean;
}

// Derived scores used by the lineup engine
export interface PlayerSuitability {
  playerId: string;
  pitcherScore: number;
  firstBaseScore: number;
  thirdBaseScore: number;
  catcherScore: number;
  shortstopScore: number;
  secondBaseScore: number;
  outfieldScore: number;
  battingTier: "strong" | "medium" | "weaker";
  ageOnGameDate: number;
}

// Historical data for fairness tracking
export interface PlayerHistory {
  playerId: string;
  battingSlots: number[];        // slots used in past games
  lastBattingSlot: number | null;
  wasLastInOrder: boolean;       // last game
  wasInBottom3: boolean;         // last game
  positionCounts: Record<Position, number>;
  totalCatcherInnings: number;
  consecutiveGamesCaught: number;
  totalInfieldInnings: number;
  totalOutfieldInnings: number;
}

export interface GenerateLineupRequest {
  gameId: string;
  playerIds: string[];
  coachMode: CoachMode;
  lockedBatting?: { slot: number; playerId: string }[];
  lockedFielding?: { inning: number; position: Position; playerId: string }[];
}

export interface ValidationWarning {
  type: "error" | "warning";
  message: string;
  inning?: number;
  position?: Position;
  playerId?: string;
}

export interface ImportedPlayer {
  firstName: string;
  lastName: string;
  dob: string;
}
