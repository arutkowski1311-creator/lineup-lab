import {
  Position,
  POSITIONS,
  INNINGS,
  CoachMode,
  DefensiveFormat,
  PlayerSuitability,
  PlayerHistory,
  BattingOrderEntry,
  FieldingAssignment,
  LineupData,
  PlayerData,
  getPositionsForFormat,
  getOutfieldPositions,
  getInfieldPositions,
} from "./types";
import { playerAge } from "./utils";

// ─── Suitability Scoring ───────────────────────────────────────────────

export function computeSuitability(
  player: PlayerData,
  gameDate: Date
): PlayerSuitability {
  const age = playerAge(player.dob, gameDate);
  const f = player.fieldingOverall;
  const c = player.catching;
  const t = player.throwing;
  const b = player.battingOverall;

  return {
    playerId: player.id,
    pitcherScore: f * 0.4 + t * 0.6,
    firstBaseScore: f * 0.6 + t * 0.4,
    thirdBaseScore: f * 0.5 + t * 0.5,
    catcherScore: c * 0.5 + f * 0.3 + t * 0.2,
    shortstopScore: f * 0.5 + t * 0.3 + (b > 3 ? 0.5 : 0),
    secondBaseScore: f * 0.5 + t * 0.3 + (b > 3 ? 0.3 : 0),
    outfieldScore: f * 0.5 + t * 0.3 + (age < 10 ? 0.5 : 0),
    battingTier: b >= 4 ? "strong" : b >= 3 ? "medium" : "weaker",
    ageOnGameDate: age,
  };
}

function positionScore(suit: PlayerSuitability, pos: Position): number {
  switch (pos) {
    case "P": return suit.pitcherScore;
    case "C": return suit.catcherScore;
    case "1B": return suit.firstBaseScore;
    case "3B": return suit.thirdBaseScore;
    case "SS": return suit.shortstopScore;
    case "2B": return suit.secondBaseScore;
    // All outfield positions use the same score
    case "LF": case "LC": case "RC": case "RF":
    case "CF": case "LCF": case "RCF":
      return suit.outfieldScore;
    default: return suit.outfieldScore;
  }
}

// ─── Mode Weights ──────────────────────────────────────────────────────

interface ModeWeights {
  suitability: number;
  fairness: number;
  development: number;
}

function getModeWeights(mode: CoachMode): ModeWeights {
  switch (mode) {
    case "development": return { suitability: 0.3, fairness: 0.5, development: 0.2 };
    case "balanced": return { suitability: 0.45, fairness: 0.35, development: 0.2 };
    case "win-now": return { suitability: 0.65, fairness: 0.2, development: 0.15 };
  }
}

// ─── Fielding Generation ───────────────────────────────────────────────

interface FieldingContext {
  playerIds: string[];
  positions: Position[];
  outfieldPositions: Position[];
  suitabilities: Map<string, PlayerSuitability>;
  histories: Map<string, PlayerHistory>;
  mode: CoachMode;
  lockedFielding: Map<string, { playerId: string }>;
}

function makeFieldingKey(inning: number, position: Position): string {
  return `${inning}-${position}`;
}

export function generateFieldingPlan(ctx: FieldingContext): FieldingAssignment[] {
  const weights = getModeWeights(ctx.mode);
  const assignments: FieldingAssignment[] = [];

  // Track per-player outfield streaks and innings assigned
  const outfieldStreak = new Map<string, number>();
  const inningsAssigned = new Map<string, number>();
  ctx.playerIds.forEach((id) => {
    outfieldStreak.set(id, 0);
    inningsAssigned.set(id, 0);
  });

  // Determine catcher blocks
  const catcherPlan = planCatcherBlocks(ctx);

  for (const inning of INNINGS) {
    const assignedThisInning = new Map<Position, string>();
    const usedThisInning = new Set<string>();

    // 1. Apply locked assignments first
    for (const pos of ctx.positions) {
      const key = makeFieldingKey(inning, pos);
      const locked = ctx.lockedFielding.get(key);
      if (locked) {
        assignedThisInning.set(pos, locked.playerId);
        usedThisInning.add(locked.playerId);
      }
    }

    // 2. Assign catcher if not locked
    if (!assignedThisInning.has("C")) {
      const catcherId = catcherPlan.get(inning);
      if (catcherId && !usedThisInning.has(catcherId)) {
        assignedThisInning.set("C", catcherId);
        usedThisInning.add(catcherId);
      }
    }

    // 3. Assign priority infield positions: P, 1B, 3B, SS, 2B
    const infieldOrder: Position[] = ["P", "1B", "3B", "SS", "2B"];
    for (const pos of infieldOrder) {
      if (!ctx.positions.includes(pos)) continue;
      if (assignedThisInning.has(pos)) continue;
      const best = pickBestForPosition(
        pos, ctx, usedThisInning, outfieldStreak, inningsAssigned, weights
      );
      if (best) {
        assignedThisInning.set(pos, best);
        usedThisInning.add(best);
      }
    }

    // 4. Assign outfield positions
    for (const pos of ctx.outfieldPositions) {
      if (assignedThisInning.has(pos)) continue;
      const best = pickBestForPosition(
        pos, ctx, usedThisInning, outfieldStreak, inningsAssigned, weights
      );
      if (best) {
        assignedThisInning.set(pos, best);
        usedThisInning.add(best);
      }
    }

    // Fill remaining empty spots with remaining players
    const emptyPositions = ctx.positions.filter((p) => !assignedThisInning.has(p));
    const remainingPlayers = ctx.playerIds.filter((id) => !usedThisInning.has(id));

    for (let i = 0; i < Math.min(emptyPositions.length, remainingPlayers.length); i++) {
      assignedThisInning.set(emptyPositions[i], remainingPlayers[i]);
      usedThisInning.add(remainingPlayers[i]);
    }

    // Update outfield streaks
    for (const [playerId] of outfieldStreak) {
      const posForPlayer = [...assignedThisInning.entries()].find(
        ([_, pid]) => pid === playerId
      );
      if (posForPlayer && ctx.outfieldPositions.includes(posForPlayer[0] as Position)) {
        outfieldStreak.set(playerId, (outfieldStreak.get(playerId) || 0) + 1);
      } else {
        outfieldStreak.set(playerId, 0);
      }
    }

    // Update innings assigned
    for (const [_, playerId] of assignedThisInning) {
      inningsAssigned.set(playerId, (inningsAssigned.get(playerId) || 0) + 1);
    }

    // Convert to assignment objects
    for (const [pos, playerId] of assignedThisInning) {
      assignments.push({
        inningNumber: inning,
        position: pos,
        playerId,
        assignmentType: "planned",
      });
    }
  }

  return assignments;
}

function pickBestForPosition(
  position: Position,
  ctx: FieldingContext,
  usedThisInning: Set<string>,
  outfieldStreak: Map<string, number>,
  inningsAssigned: Map<string, number>,
  weights: ModeWeights
): string | null {
  const isOutfield = ctx.outfieldPositions.includes(position);
  const candidates = ctx.playerIds.filter((id) => {
    if (usedThisInning.has(id)) return false;
    if (isOutfield && (outfieldStreak.get(id) || 0) >= 2) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const scored = candidates.map((id) => {
    const suit = ctx.suitabilities.get(id)!;
    const hist = ctx.histories.get(id);

    const suitScore = positionScore(suit, position);

    const totalInnings = inningsAssigned.get(id) || 0;
    const fairnessScore = 1 - totalInnings / 6;

    let devScore = 0;
    if (isOutfield && suit.ageOnGameDate < 10) devScore = 0.5;
    if (!isOutfield && suit.ageOnGameDate >= 10) devScore = 0.3;

    let histScore = 0;
    if (hist) {
      const posCount = hist.positionCounts[position] || 0;
      const totalPosInnings = Object.values(hist.positionCounts).reduce(
        (a, b) => a + b, 0
      );
      histScore = totalPosInnings > 0 ? 1 - posCount / totalPosInnings : 0.5;
    }

    const total =
      suitScore * weights.suitability * 2 +
      fairnessScore * weights.fairness * 2 +
      devScore * weights.development +
      histScore * weights.fairness +
      Math.random() * 0.3;

    return { id, score: total };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

function planCatcherBlocks(ctx: FieldingContext): Map<number, string> {
  const plan = new Map<number, string>();

  const catcherCandidates = ctx.playerIds
    .map((id) => ({
      id,
      score: ctx.suitabilities.get(id)!.catcherScore,
      hist: ctx.histories.get(id),
    }))
    .sort((a, b) => {
      const aConsec = a.hist?.consecutiveGamesCaught ?? 0;
      const bConsec = b.hist?.consecutiveGamesCaught ?? 0;
      if (aConsec !== bConsec) return aConsec - bConsec;
      const aTotal = a.hist?.totalCatcherInnings ?? 0;
      const bTotal = b.hist?.totalCatcherInnings ?? 0;
      if (aTotal !== bTotal) return aTotal - bTotal;
      return b.score - a.score;
    });

  if (catcherCandidates.length === 0) return plan;

  const lockedCatcherInnings = new Set<number>();
  for (const inning of INNINGS) {
    const key = makeFieldingKey(inning, "C");
    const locked = ctx.lockedFielding.get(key);
    if (locked) {
      plan.set(inning, locked.playerId);
      lockedCatcherInnings.add(inning);
    }
  }

  const unlockedInnings = INNINGS.filter((i) => !lockedCatcherInnings.has(i));
  if (unlockedInnings.length === 0) return plan;

  const blockSizes = splitIntoBlocks(unlockedInnings.length);
  let inningIdx = 0;
  let catcherIdx = 0;

  for (const blockSize of blockSizes) {
    const catcherId = catcherCandidates[catcherIdx % catcherCandidates.length].id;
    for (let i = 0; i < blockSize && inningIdx < unlockedInnings.length; i++) {
      plan.set(unlockedInnings[inningIdx], catcherId);
      inningIdx++;
    }
    catcherIdx++;
  }

  return plan;
}

function splitIntoBlocks(total: number): number[] {
  if (total <= 3) return [total];
  if (total === 4) return [2, 2];
  if (total === 5) return [3, 2];
  if (total === 6) return [3, 3];
  const blocks: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const size = remaining >= 5 ? 3 : remaining >= 3 ? remaining : remaining;
    blocks.push(Math.min(size, 3));
    remaining -= Math.min(size, 3);
  }
  return blocks;
}

// ─── Batting Order Generation ──────────────────────────────────────────

export function generateBattingOrder(
  playerIds: string[],
  suitabilities: Map<string, PlayerSuitability>,
  histories: Map<string, PlayerHistory>,
  mode: CoachMode,
  lockedBatting?: { slot: number; playerId: string }[]
): BattingOrderEntry[] {
  const lockedSlots = new Map<number, string>();
  const lockedPlayers = new Set<string>();

  if (lockedBatting) {
    for (const { slot, playerId } of lockedBatting) {
      lockedSlots.set(slot, playerId);
      lockedPlayers.add(playerId);
    }
  }

  const unlockedPlayers = playerIds.filter((id) => !lockedPlayers.has(id));
  const totalSlots = playerIds.length;
  const unlockedSlotNumbers: number[] = [];

  for (let i = 1; i <= totalSlots; i++) {
    if (!lockedSlots.has(i)) {
      unlockedSlotNumbers.push(i);
    }
  }

  const strong: string[] = [];
  const medium: string[] = [];
  const weaker: string[] = [];

  for (const id of unlockedPlayers) {
    const suit = suitabilities.get(id)!;
    if (suit.battingTier === "strong") strong.push(id);
    else if (suit.battingTier === "medium") medium.push(id);
    else weaker.push(id);
  }

  shuffle(strong);
  shuffle(medium);
  shuffle(weaker);

  const adjusted = adjustForHistory(strong, medium, weaker, histories, totalSlots);
  const orderedPlayers = interleave(adjusted.strong, adjusted.medium, adjusted.weaker);

  const result: BattingOrderEntry[] = [];
  for (const [slot, playerId] of lockedSlots) {
    result.push({ battingSlot: slot, playerId });
  }
  for (let i = 0; i < Math.min(orderedPlayers.length, unlockedSlotNumbers.length); i++) {
    result.push({ battingSlot: unlockedSlotNumbers[i], playerId: orderedPlayers[i] });
  }

  result.sort((a, b) => a.battingSlot - b.battingSlot);
  return result;
}

function adjustForHistory(
  strong: string[],
  medium: string[],
  weaker: string[],
  histories: Map<string, PlayerHistory>,
  _totalSlots: number
): { strong: string[]; medium: string[]; weaker: string[] } {
  const moveUp: string[] = [];
  for (const id of [...weaker]) {
    const hist = histories.get(id);
    if (!hist) continue;
    if (hist.wasLastInOrder || hist.wasInBottom3) {
      const idx = weaker.indexOf(id);
      if (idx >= 0) {
        weaker.splice(idx, 1);
        moveUp.push(id);
      }
    }
  }
  medium.push(...moveUp);
  shuffle(medium);
  return { strong, medium, weaker };
}

function interleave(strong: string[], medium: string[], weaker: string[]): string[] {
  const all = [...strong, ...medium, ...weaker];
  const total = all.length;
  if (total === 0) return [];

  const strongPositions: number[] = [];
  if (strong.length > 0) {
    const spacing = Math.floor(total / (strong.length + 1));
    for (let i = 0; i < strong.length; i++) {
      strongPositions.push(Math.min((i + 1) * spacing - 1, total - 1));
    }
  }

  const placed = new Array<string | null>(total).fill(null);
  for (let i = 0; i < strong.length; i++) {
    placed[strongPositions[i]] = strong[i];
  }

  const remaining = [...medium, ...weaker];
  let rIdx = 0;
  for (let i = 0; i < total; i++) {
    if (placed[i] !== null) continue;
    if (rIdx < remaining.length) {
      placed[i] = remaining[rIdx];
      rIdx++;
    }
  }

  // Post-process: swap consecutive weaker hitters
  const weakerSet = new Set(weaker);
  for (let i = 0; i < total - 1; i++) {
    if (placed[i] && placed[i + 1] && weakerSet.has(placed[i]!) && weakerSet.has(placed[i + 1]!)) {
      for (let j = i + 2; j < total; j++) {
        if (placed[j] && !weakerSet.has(placed[j]!)) {
          [placed[i + 1], placed[j]] = [placed[j], placed[i + 1]];
          break;
        }
      }
    }
  }

  return placed.filter((p): p is string => p !== null);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── Full Lineup Generation ───────────────────────────────────────────

export function generateFullLineup(
  players: PlayerData[],
  gameDate: Date,
  mode: CoachMode,
  defensiveFormat: DefensiveFormat,
  histories: Map<string, PlayerHistory>,
  lockedBatting?: { slot: number; playerId: string }[],
  lockedFielding?: { inning: number; position: Position; playerId: string }[]
): LineupData {
  const playerIds = players.map((p) => p.id);
  const suitabilities = new Map<string, PlayerSuitability>();
  for (const p of players) {
    suitabilities.set(p.id, computeSuitability(p, gameDate));
  }

  const positions = getPositionsForFormat(defensiveFormat);
  const outfieldPositions = getOutfieldPositions(defensiveFormat);

  const lockedFieldingMap = new Map<string, { playerId: string }>();
  if (lockedFielding) {
    for (const { inning, position, playerId } of lockedFielding) {
      lockedFieldingMap.set(makeFieldingKey(inning, position), { playerId });
    }
  }

  const fieldingCtx: FieldingContext = {
    playerIds,
    positions,
    outfieldPositions,
    suitabilities,
    histories,
    mode,
    lockedFielding: lockedFieldingMap,
  };

  const fieldingAssignments = generateFieldingPlan(fieldingCtx);
  const battingOrder = generateBattingOrder(playerIds, suitabilities, histories, mode, lockedBatting);

  return { battingOrder, fieldingAssignments };
}

// ─── History Helpers ──────────────────────────────────────────────────

export function buildEmptyHistory(playerId: string): PlayerHistory {
  return {
    playerId,
    battingSlots: [],
    lastBattingSlot: null,
    wasLastInOrder: false,
    wasInBottom3: false,
    positionCounts: {},
    totalCatcherInnings: 0,
    consecutiveGamesCaught: 0,
    totalInfieldInnings: 0,
    totalOutfieldInnings: 0,
  };
}
