import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TEAM_ID = "default-team";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const game = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
      include: {
        scoreByInning: {
          orderBy: [{ inningNumber: "asc" }, { half: "asc" }],
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Calculate running totals
    let totalUsRuns = 0;
    let totalOppRuns = 0;
    for (const score of game.scoreByInning) {
      totalUsRuns += score.usRuns;
      totalOppRuns += score.opponentRuns;
    }

    return NextResponse.json({
      currentInning: game.currentInning,
      currentHalf: game.currentHalf,
      currentOuts: game.currentOuts,
      gameStatus: game.gameStatus,
      totalUsRuns,
      totalOppRuns,
      finalTeamScore: game.finalTeamScore,
      finalOpponentScore: game.finalOpponentScore,
      scoreByInning: game.scoreByInning,
    });
  } catch (error) {
    console.error("Failed to get live state:", error);
    return NextResponse.json(
      { error: "Failed to get live state" },
      { status: 500 }
    );
  }
}

async function getOrCreateScoreRecord(gameId: string, inningNumber: number, half: string) {
  let record = await prisma.gameScoreByInning.findUnique({
    where: {
      gameId_inningNumber_half: { gameId, inningNumber, half },
    },
  });

  if (!record) {
    record = await prisma.gameScoreByInning.create({
      data: {
        gameId,
        inningNumber,
        half,
        usRuns: 0,
        opponentRuns: 0,
        outsRecorded: 0,
        completed: false,
      },
    });
  }

  return record;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    const game = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const validActions = [
      "add_out", "undo_out",
      "add_run_us", "sub_run_us",
      "add_run_opp", "sub_run_opp",
      "next_half", "undo_last",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    let { currentInning, currentHalf, currentOuts } = game;

    if (action === "undo_last") {
      // Find and reverse the most recent event
      const lastEvent = await prisma.gameEvent.findFirst({
        where: { gameId: id },
        orderBy: { createdAt: "desc" },
      });

      if (!lastEvent) {
        return NextResponse.json(
          { error: "No events to undo" },
          { status: 400 }
        );
      }

      const scoreRecord = await getOrCreateScoreRecord(
        id,
        lastEvent.inningNumber,
        lastEvent.half
      );

      switch (lastEvent.eventType) {
        case "out": {
          // Undo an out - if we auto-advanced, we need to go back
          const previousValue = lastEvent.value ? JSON.parse(lastEvent.value) : null;
          if (previousValue?.autoAdvanced) {
            // Go back to the previous half-inning with 2 outs
            await prisma.game.update({
              where: { id },
              data: {
                currentInning: lastEvent.inningNumber,
                currentHalf: lastEvent.half,
                currentOuts: 2,
              },
            });
            // Unmark the score record as completed
            await prisma.gameScoreByInning.update({
              where: { id: scoreRecord.id },
              data: {
                outsRecorded: 2,
                completed: false,
              },
            });
          } else {
            const newOuts = Math.max(0, game.currentOuts - 1);
            await prisma.game.update({
              where: { id },
              data: { currentOuts: newOuts },
            });
            await prisma.gameScoreByInning.update({
              where: { id: scoreRecord.id },
              data: { outsRecorded: Math.max(0, scoreRecord.outsRecorded - 1) },
            });
          }
          break;
        }
        case "run_us": {
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { usRuns: Math.max(0, scoreRecord.usRuns - 1) },
          });
          break;
        }
        case "run_opp": {
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { opponentRuns: Math.max(0, scoreRecord.opponentRuns - 1) },
          });
          break;
        }
        case "next_half": {
          const previousValue = lastEvent.value ? JSON.parse(lastEvent.value) : null;
          if (previousValue) {
            await prisma.game.update({
              where: { id },
              data: {
                currentInning: previousValue.previousInning,
                currentHalf: previousValue.previousHalf,
                currentOuts: previousValue.previousOuts,
              },
            });
          }
          break;
        }
      }

      // Delete the event
      await prisma.gameEvent.delete({ where: { id: lastEvent.id } });

      // Fetch updated state
      const updatedGame = await prisma.game.findUnique({
        where: { id },
        include: {
          scoreByInning: {
            orderBy: [{ inningNumber: "asc" }, { half: "asc" }],
          },
        },
      });

      let totalUsRuns = 0;
      let totalOppRuns = 0;
      for (const score of updatedGame!.scoreByInning) {
        totalUsRuns += score.usRuns;
        totalOppRuns += score.opponentRuns;
      }

      return NextResponse.json({
        currentInning: updatedGame!.currentInning,
        currentHalf: updatedGame!.currentHalf,
        currentOuts: updatedGame!.currentOuts,
        gameStatus: updatedGame!.gameStatus,
        totalUsRuns,
        totalOppRuns,
        finalTeamScore: updatedGame!.finalTeamScore,
        finalOpponentScore: updatedGame!.finalOpponentScore,
        scoreByInning: updatedGame!.scoreByInning,
      });
    }

    // Handle non-undo actions
    const scoreRecord = await getOrCreateScoreRecord(id, currentInning, currentHalf);

    switch (action) {
      case "add_out": {
        currentOuts++;
        let autoAdvanced = false;

        await prisma.gameScoreByInning.update({
          where: { id: scoreRecord.id },
          data: { outsRecorded: scoreRecord.outsRecorded + 1 },
        });

        if (currentOuts >= 3) {
          // Mark half-inning as completed
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { outsRecorded: 3, completed: true },
          });

          // Auto-advance
          autoAdvanced = true;
          if (currentHalf === "top") {
            currentHalf = "bottom";
          } else {
            currentInning++;
            currentHalf = "top";
          }
          currentOuts = 0;
        }

        await prisma.game.update({
          where: { id },
          data: { currentInning, currentHalf, currentOuts, gameStatus: "live" },
        });

        await prisma.gameEvent.create({
          data: {
            gameId: id,
            eventType: "out",
            inningNumber: game.currentInning,
            half: game.currentHalf,
            value: JSON.stringify({ autoAdvanced }),
          },
        });
        break;
      }

      case "undo_out": {
        if (currentOuts > 0) {
          currentOuts--;
          await prisma.game.update({
            where: { id },
            data: { currentOuts },
          });
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { outsRecorded: Math.max(0, scoreRecord.outsRecorded - 1) },
          });
        }
        break;
      }

      case "add_run_us": {
        await prisma.gameScoreByInning.update({
          where: { id: scoreRecord.id },
          data: { usRuns: scoreRecord.usRuns + 1 },
        });

        await prisma.game.update({
          where: { id },
          data: { gameStatus: "live" },
        });

        await prisma.gameEvent.create({
          data: {
            gameId: id,
            eventType: "run_us",
            inningNumber: currentInning,
            half: currentHalf,
          },
        });
        break;
      }

      case "sub_run_us": {
        if (scoreRecord.usRuns > 0) {
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { usRuns: scoreRecord.usRuns - 1 },
          });

          await prisma.gameEvent.create({
            data: {
              gameId: id,
              eventType: "sub_run_us",
              inningNumber: currentInning,
              half: currentHalf,
            },
          });
        }
        break;
      }

      case "add_run_opp": {
        await prisma.gameScoreByInning.update({
          where: { id: scoreRecord.id },
          data: { opponentRuns: scoreRecord.opponentRuns + 1 },
        });

        await prisma.game.update({
          where: { id },
          data: { gameStatus: "live" },
        });

        await prisma.gameEvent.create({
          data: {
            gameId: id,
            eventType: "run_opp",
            inningNumber: currentInning,
            half: currentHalf,
          },
        });
        break;
      }

      case "sub_run_opp": {
        if (scoreRecord.opponentRuns > 0) {
          await prisma.gameScoreByInning.update({
            where: { id: scoreRecord.id },
            data: { opponentRuns: scoreRecord.opponentRuns - 1 },
          });

          await prisma.gameEvent.create({
            data: {
              gameId: id,
              eventType: "sub_run_opp",
              inningNumber: currentInning,
              half: currentHalf,
            },
          });
        }
        break;
      }

      case "next_half": {
        const previousInning = currentInning;
        const previousHalf = currentHalf;
        const previousOuts = currentOuts;

        // Mark current half as completed
        await prisma.gameScoreByInning.update({
          where: { id: scoreRecord.id },
          data: { completed: true },
        });

        if (currentHalf === "top") {
          currentHalf = "bottom";
        } else {
          currentInning++;
          currentHalf = "top";
        }
        currentOuts = 0;

        await prisma.game.update({
          where: { id },
          data: { currentInning, currentHalf, currentOuts, gameStatus: "live" },
        });

        await prisma.gameEvent.create({
          data: {
            gameId: id,
            eventType: "next_half",
            inningNumber: previousInning,
            half: previousHalf,
            value: JSON.stringify({ previousInning, previousHalf, previousOuts }),
          },
        });
        break;
      }
    }

    // Fetch final updated state
    const finalGame = await prisma.game.findUnique({
      where: { id },
      include: {
        scoreByInning: {
          orderBy: [{ inningNumber: "asc" }, { half: "asc" }],
        },
      },
    });

    let totalUsRuns = 0;
    let totalOppRuns = 0;
    for (const score of finalGame!.scoreByInning) {
      totalUsRuns += score.usRuns;
      totalOppRuns += score.opponentRuns;
    }

    return NextResponse.json({
      currentInning: finalGame!.currentInning,
      currentHalf: finalGame!.currentHalf,
      currentOuts: finalGame!.currentOuts,
      gameStatus: finalGame!.gameStatus,
      totalUsRuns,
      totalOppRuns,
      finalTeamScore: finalGame!.finalTeamScore,
      finalOpponentScore: finalGame!.finalOpponentScore,
      scoreByInning: finalGame!.scoreByInning,
    });
  } catch (error) {
    console.error("Failed to update live state:", error);
    return NextResponse.json(
      { error: "Failed to update live state" },
      { status: 500 }
    );
  }
}
