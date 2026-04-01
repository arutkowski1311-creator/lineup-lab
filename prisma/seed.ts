import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create default team
  const team = await prisma.team.upsert({
    where: { id: "default-team" },
    update: {},
    create: {
      id: "default-team",
      name: "Thunder",
    },
  });

  console.log("Created team:", team.name);

  // Create roster of 14 players (typical youth softball)
  const players = [
    { firstName: "Emma", lastName: "Johnson", dob: "2014-03-15", fieldingOverall: 4, catching: 3, throwing: 4, battingOverall: 5 },
    { firstName: "Olivia", lastName: "Martinez", dob: "2014-07-22", fieldingOverall: 5, catching: 4, throwing: 5, battingOverall: 4 },
    { firstName: "Sophia", lastName: "Williams", dob: "2015-01-10", fieldingOverall: 3, catching: 5, throwing: 4, battingOverall: 3 },
    { firstName: "Ava", lastName: "Brown", dob: "2014-11-08", fieldingOverall: 4, catching: 3, throwing: 4, battingOverall: 4 },
    { firstName: "Isabella", lastName: "Davis", dob: "2015-05-20", fieldingOverall: 3, catching: 2, throwing: 3, battingOverall: 2 },
    { firstName: "Mia", lastName: "Garcia", dob: "2014-09-03", fieldingOverall: 4, catching: 3, throwing: 3, battingOverall: 4 },
    { firstName: "Charlotte", lastName: "Rodriguez", dob: "2015-08-12", fieldingOverall: 2, catching: 2, throwing: 2, battingOverall: 3 },
    { firstName: "Amelia", lastName: "Wilson", dob: "2014-04-25", fieldingOverall: 5, catching: 3, throwing: 5, battingOverall: 5 },
    { firstName: "Harper", lastName: "Anderson", dob: "2015-12-01", fieldingOverall: 3, catching: 3, throwing: 3, battingOverall: 2 },
    { firstName: "Evelyn", lastName: "Thomas", dob: "2014-06-18", fieldingOverall: 4, catching: 4, throwing: 4, battingOverall: 3 },
    { firstName: "Luna", lastName: "Jackson", dob: "2015-02-14", fieldingOverall: 2, catching: 2, throwing: 3, battingOverall: 3 },
    { firstName: "Camila", lastName: "White", dob: "2014-10-30", fieldingOverall: 3, catching: 3, throwing: 3, battingOverall: 4 },
    { firstName: "Lily", lastName: "Harris", dob: "2015-07-07", fieldingOverall: 3, catching: 2, throwing: 2, battingOverall: 2 },
    { firstName: "Zoe", lastName: "Clark", dob: "2014-08-19", fieldingOverall: 4, catching: 3, throwing: 4, battingOverall: 3 },
  ];

  for (const p of players) {
    await prisma.player.upsert({
      where: {
        id: `player-${p.firstName.toLowerCase()}-${p.lastName.toLowerCase()}`,
      },
      update: { ...p, dob: new Date(p.dob) },
      create: {
        id: `player-${p.firstName.toLowerCase()}-${p.lastName.toLowerCase()}`,
        teamId: team.id,
        ...p,
        dob: new Date(p.dob),
      },
    });
  }

  console.log(`Seeded ${players.length} players`);

  // Create a sample completed game
  const game = await prisma.game.upsert({
    where: { id: "sample-game-1" },
    update: {},
    create: {
      id: "sample-game-1",
      teamId: team.id,
      opponentName: "Lightning",
      gameDate: new Date("2026-03-25"),
      coachMode: "balanced",
      lineupLocked: true,
      gameStatus: "final",
      currentInning: 6,
      currentHalf: "bottom",
      currentOuts: 3,
      finalTeamScore: 8,
      finalOpponentScore: 5,
      finalizedAt: new Date("2026-03-25T16:30:00Z"),
    },
  });

  // Add batting order for sample game
  const playerRecords = await prisma.player.findMany({
    where: { teamId: team.id },
    orderBy: { lastName: "asc" },
  });

  for (let i = 0; i < Math.min(playerRecords.length, 14); i++) {
    await prisma.gameBattingOrder.upsert({
      where: {
        gameId_battingSlot: { gameId: game.id, battingSlot: i + 1 },
      },
      update: { playerId: playerRecords[i].id },
      create: {
        gameId: game.id,
        battingSlot: i + 1,
        playerId: playerRecords[i].id,
      },
    });
  }

  // Add fielding assignments for sample game
  const positions = ["P", "C", "1B", "2B", "SS", "3B", "LF", "LC", "RC", "RF"];
  for (let inning = 1; inning <= 6; inning++) {
    for (let p = 0; p < positions.length; p++) {
      const playerIdx = (p + inning - 1) % playerRecords.length;
      await prisma.gameFieldingAssignment.upsert({
        where: {
          gameId_inningNumber_position_assignmentType: {
            gameId: game.id,
            inningNumber: inning,
            position: positions[p],
            assignmentType: "planned",
          },
        },
        update: { playerId: playerRecords[playerIdx].id },
        create: {
          gameId: game.id,
          inningNumber: inning,
          position: positions[p],
          playerId: playerRecords[playerIdx].id,
          assignmentType: "planned",
        },
      });
    }
  }

  // Add score by inning for sample game
  const scores = [
    { inning: 1, half: "top", us: 2, opp: 1 },
    { inning: 1, half: "bottom", us: 0, opp: 0 },
    { inning: 2, half: "top", us: 1, opp: 0 },
    { inning: 2, half: "bottom", us: 0, opp: 2 },
    { inning: 3, half: "top", us: 0, opp: 0 },
    { inning: 3, half: "bottom", us: 0, opp: 1 },
    { inning: 4, half: "top", us: 3, opp: 0 },
    { inning: 4, half: "bottom", us: 0, opp: 0 },
    { inning: 5, half: "top", us: 1, opp: 1 },
    { inning: 5, half: "bottom", us: 0, opp: 0 },
    { inning: 6, half: "top", us: 1, opp: 0 },
    { inning: 6, half: "bottom", us: 0, opp: 0 },
  ];

  for (const s of scores) {
    await prisma.gameScoreByInning.upsert({
      where: {
        gameId_inningNumber_half: {
          gameId: game.id,
          inningNumber: s.inning,
          half: s.half,
        },
      },
      update: {},
      create: {
        gameId: game.id,
        inningNumber: s.inning,
        half: s.half,
        usRuns: s.us,
        opponentRuns: s.opp,
        outsRecorded: 3,
        completed: true,
      },
    });
  }

  console.log("Created sample game: Thunder vs Lightning (8-5 W)");
  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
