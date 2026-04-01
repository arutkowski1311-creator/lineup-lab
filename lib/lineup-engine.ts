import {
  Position,
  POSITIONS,
  OUTFIELD_POSITIONS,
  INNINGS,
  CoachMode,
  PlayerSuitability,
  PlayerHistory,
  BattingOrderEntry,
  FieldingAssignment,
  LineupData,
  PlayerData,
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
    case "LF": case "LC": case "RC": case "RF": return suit.outfieldScore;
    default: return 0;
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
    case "fairness": return { suitability: 0.3, fairness: 0.5, development: 0.2 };
    case "balanced": return { suitability: 0.45, fairness: 0.35, development: 0.2 };
    case "win-now": return { suitability: 0.65, fairness: 0.2, development: 0.15 };
  }
}

// ─── Fielding Generation ───────────────────────────────────────────────

interface FieldingContext {
  playerIds: string[];
  suitabilities: Map<string, PlayerSuitability>;
  histories: Map<string, PlayerHistory>;
  mode: CoachMode;
  lockedFielding: Map<string, { playerId: string }>; // key: "inning-position"
}

function makeFieldingKey(inning: number, position: Position): string {
  return `${inning}-${position}`;
}

export function generateFieldingPlan(ctx: FieldingContext): FieldingAssignment[] {
  const weights = getModeWeights(ctx.mode);
  const numPlayers = ctx.playerIds.length;
  const assignments: FieldingAssignment[] = [];

  // Track per-player outfield streaks and innings assigned
  const outfieldStreak = new Map<string, number>(); // consecutive outfield innings
  const inningsAssigned = new Map<string, number>();  // total innings on field
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
    for (const pos of POSITIONS) {
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

    // 3. Assign priority positions: P, 1B, 3B
    const priorityOrder: Position[] = ["P", "1B", "3B", "SS", "2B"];
    for (const pos of priorityOrder) {
      if (assignedThisInning.has(pos)) continue;
      const best = pickBestForPosition(
        pos, inning, ctx, usedThisInning, outfieldStreak, inningsAssigned, weights
      );
      if (best) {
        assignedThisInning.set(pos, best);
        usedThisInning.add(best);
      }
    }

    // 4. Assign outfield positions
    const outfieldPositions: Position[] = ["LF", "LC", "RC", "RF"];
    for (const pos of outfieldPositions) {
      if (assignedThisInning.has(pos)) continue;
      const best = pickBestForPosition(
        pos, inning, ctx, usedThisInning, outfieldStreak, inningsAssigned, weights
      );
      if (best) {
        assignedThisInning.set(pos, best);
        usedThisInning.add(best);
      }
    }

    // If we still have empty spots, fill with remaining players
    const emptyPositions = POSITIONS.filter((p) => !assignedThisInning.has(p));
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
      if (posForPlayer && OUTFIELD_POSITIONS.includes(posForPlayer[0] as Position)) {
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
  inning: number,
  ctx: FieldingContext,
  usedThisInning: Set<string>,
  outfieldStreak: Map<string, number>,
  inningsAssigned: Map<string, number>,
  weights: ModeWeights
): string | null {
  const isOutfield = OUTFIELD_POSITIONS.includes(position);
  const candidates = ctx.playerIds.filter((id) => {
    if (usedThisInning.has(id)) return false;
    // Enforce outfield streak rule: no more than 2 consecutive
    if (isOutfield && (outfieldStreak.get(id) || 0) >= 2) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const scored = candidates.map((id) => {
    const suit = ctx.suitabilities.get(id)!;
    const hist = ctx.histories.get(id);

    // Suitability score for this position
    const suitScore = positionScore(suit, position);

    // Fairness: prefer players with fewer innings
    const totalInnings = inningsAssigned.get(id) || 0;
    const maxPossible = 6;
    const fairnessScore = 1 - totalInnings / maxPossible;

    // Development: younger players get outfield bonus
    let devScore = 0;
    if (isOutfield && suit.ageOnGameDate < 10) devScore = 0.5;
    if (!isOutfield && suit.ageOnGameDate >= 10) devScore = 0.3;

    // Historical position fairness
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
      Math.random() * 0.3; // small randomness for variety

    return { id, score: total };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

function planCatcherBlocks(
  ctx: FieldingContext
): Map<number, string> {
  const plan = new Map<number, string>();

  // Find top catcher candidates
  const catcherCandidates = ctx.playerIds
    .map((id) => ({
      id,
      score: ctx.suitabilities.get(id)!.catcherScore,
      hist: ctx.histories.get(id),
    }))
    .sort((a, b) => {
      // Prefer players who haven't caught recently
      const aConsec = a.hist?.consecutiveGamesCaught ?? 0;
      const bConsec = b.hist?.consecutiveGamesCaught ?? 0;
      if (aConsec !== bConsec) return aConsec - bConsec;
      // Then by total catcher innings (less = higher priority for rotation)
      const aTotal = a.hist?.totalCatcherInnings ?? 0;
      const bTotal = b.hist?.totalCatcherInnings ?? 0;
      if (aTotal !== bTotal) return aTotal - bTotal;
      // Then by suitability
      return b.score - a.score;
    });

  if (catcherCandidates.length === 0) return plan;

  // Check for locked catchers
  const lockedCatcherInnings = new Set<number>();
  for (const inning of INNINGS) {
    const key = makeFieldingKey(inning, "C");
    const locked = ctx.lockedFielding.get(key);
    if (locked) {
      plan.set(inning, locked.playerId);
      lockedCatcherInnings.add(inning);
    }
  }

  // Assign catcher in 2-3 inning blocks for unlocked innings
  const unlockedInnings = INNINGS.filter((i) => !lockedCatcherInnings.has(i));

  if (unlockedInnings.length === 0) return plan;

  // Split into blocks of 2-3
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
  // fallback
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
  const weights = getModeWeights(mode);
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

  // Categorize players
  const strong: string[] = [];
  const medium: string[] = [];
  const weaker: string[] = [];

  for (const id of unlockedPlayers) {
    const suit = suitabilities.get(id)!;
    if (suit.battingTier === "strong") strong.push(id);
    else if (suit.battingTier === "medium") medium.push(id);
    else weaker.push(id);
  }

  // Shuffle within tiers for variety
  shuffle(strong);
  shuffle(medium);
  shuffle(weaker);

  // Apply history adjustments
  const adjusted = adjustForHistory(
    strong, medium, weaker, histories, unlockedSlotNumbers, totalSlots
  );

  // Build the interleaved order: spread strong, fill with medium, place weaker avoiding adjacency
  const orderedPlayers = interleave(adjusted.strong, adjusted.medium, adjusted.weaker);

  // Assign to unlocked slots
  const result: BattingOrderEntry[] = [];

  // First, add locked slots
  for (const [slot, playerId] of lockedSlots) {
    result.push({ battingSlot: slot, playerId });
  }

  // Then assign unlocked
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
  unlockedSlots: number[],
  totalSlots: number
): { strong: string[]; medium: string[]; weaker: string[] } {
  const lastSlot = totalSlots;
  const bottom3Start = totalSlots - 2;

  // Players who were last or in bottom 3 should move up
  const moveUp: string[] = [];

  for (const id of [...weaker]) {
    const hist = histories.get(id);
    if (!hist) continue;

    if (hist.wasLastInOrder || hist.wasInBottom3) {
      // Remove from weaker, add to moveUp
      const idx = weaker.indexOf(id);
      if (idx >= 0) {
        weaker.splice(idx, 1);
        moveUp.push(id);
      }
    }
  }

  // Put moveUp players into medium pool (they'll get better slots)
  medium.push(...moveUp);
  shuffle(medium);

  return { strong, medium, weaker };
}

function interleave(strong: string[], medium: string[], weaker: string[]): string[] {
  const result: string[] = [];
  const all = [...strong, ...medium, ...weaker];
  const total = all.length;

  if (total === 0) return result;

  // Strategy: distribute strong hitters evenly, fill with medium, then weaker at end
  // but avoid consecutive weaker hitters

  const strongPositions: number[] = [];
  if (strong.length > 0) {
    const spacing = Math.floor(total / (strong.length + 1));
    for (let i = 0; i < strong.length; i++) {
      strongPositions.push(Math.min((i + 1) * spacing - 1, total - 1));
    }
  }

  // Place strong hitters at their positions
  const placed = new Array<string | null>(total).fill(null);
  for (let i = 0; i < strong.length; i++) {
    const pos = strongPositions[i];
    placed[pos] = strong[i];
  }

  // Fill remaining slots, avoiding consecutive weaker hitters
  const remaining = [...medium, ...weaker];
  let rIdx = 0;
  for (let i = 0; i < total; i++) {
    if (placed[i] !== null) continue;
    if (rIdx < remaining.length) {
      placed[i] = remaining[rIdx];
      rIdx++;
    }
  }

  // Post-process: swap consecutive weaker hitters if possible
  const weakerSet = new Set(weaker);
  for (let i = 0; i < total - 1; i++) {
    if (
      placed[i] &&
      placed[i + 1] &&
      weakerSet.has(placed[i]!) &&
      weakerSet.has(placed[i + 1]!)
    ) {
      // Try to find a non-weaker to swap with
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
  histories: Map<string, PlayerHistory>,
  lockedBatting?: { slot: number; playerId: string }[],
  lockedFielding?: { inning: number; position: Position; playerId: string }[]
): LineupData {
  const playerIds = players.map((p) => p.id);
  const suitabilities = new Map<string, PlayerSuitability>();

  for (const p of players) {
    suitabilities.set(p.id, computeSuitability(p, gameDate));
  }

  // Convert locked fielding to map
  const lockedFieldingMap = new Map<string, { playerId: string }>();
  if (lockedFielding) {
    for (const { inning, position, playerId } of lockedFielding) {
      lockedFieldingMap.set(makeFieldingKey(inning, position), { playerId });
    }
  }

  const fieldingCtx: FieldingContext = {
    playerIds,
    suitabilities,
    histories,
    mode,
    lockedFielding: lockedFieldingMap,
  };

  const fieldingAssignments = generateFieldingPlan(fieldingCtx);
  const battingOrder = generateBattingOrder(
    playerIds, suitabilities, histories, mode, lockedBatting
  );

  return { battingOrder, fieldingAssignments };
}

// ─── History Helpers ──────────────────────────────────────────────────

export function buildEmptyHistory(playerId: string): PlayerHistory {
  const positionCounts: Record<Position, number> = {} as Record<Position, number>;
  for (const pos of POSITIONS) {
    positionCounts[pos] = 0;
  }
  return {
    playerId,
    battingSlots: [],
    lastBattingSlot: null,
    wasLastInOrder: false,
    wasInBottom3: false,
    positionCounts,
    totalCatcherInnings: 0,
    consecutiveGamesCaught: 0,
    totalInfieldInnings: 0,
    totalOutfieldInnings: 0,
  };
}
