"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ListOrdered,
  Radio,
  BookOpen,
  Printer,
  Trophy,
  Plus,
  ImageIcon,
  Video,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreDisplay } from "@/components/softball/score-display";
import { BaseDiamond } from "@/components/softball/base-diamond";
import { OutTracker } from "@/components/softball/out-tracker";
import { formatDate, playerFullName } from "@/lib/utils";
import type {
  GameData,
  PlayerData,
  BattingOrderEntry,
  FieldingAssignment,
  ScoreByInning,
  PlayerAwardData,
  MediaItemData,
  RunnersState,
} from "@/lib/types";

interface HubData {
  game: GameData;
  players: PlayerData[];
  battingOrder: BattingOrderEntry[];
  fieldingAssignments: FieldingAssignment[];
  scoreByInning: ScoreByInning[];
  totalUsRuns: number;
  totalOppRuns: number;
  recentPlays: { id: string; description: string; inning: number; createdAt: string }[];
  awards: PlayerAwardData[];
  media: MediaItemData[];
  runners: RunnersState | null;
}

export default function GameHubPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingRecap, setGeneratingRecap] = useState(false);

  useEffect(() => {
    fetch(`/api/games/${gameId}/hub`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load game");
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => toast.error("Failed to load game"))
      .finally(() => setLoading(false));
  }, [gameId]);

  async function generateRecap() {
    setGeneratingRecap(true);
    try {
      const res = await fetch(`/api/games/${gameId}/recap`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate recap");
      const result = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              game: { ...prev.game, recapText: result.recapText, recapStatus: "complete" },
            }
          : prev
      );
      toast.success("Recap generated!");
    } catch {
      toast.error("Failed to generate recap");
    } finally {
      setGeneratingRecap(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Game not found</p>
        <Button variant="ghost" onClick={() => router.push("/games")}>
          Back to Games
        </Button>
      </div>
    );
  }

  const { game, players, battingOrder, fieldingAssignments, scoreByInning, totalUsRuns, totalOppRuns, recentPlays, awards, media, runners } = data;
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const isLive = game.gameStatus === "live";
  const isFinal = game.gameStatus === "final";

  function statusColor() {
    if (isLive) return "default";
    if (isFinal) return "secondary";
    return "outline";
  }

  function statusLabel() {
    if (isLive) return "Live";
    if (isFinal) return "Final";
    return "Scheduled";
  }

  const parsedRunners: RunnersState = runners ?? { first: null, second: null, third: null };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/games")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold truncate">
              vs {game.opponentName}
            </h1>
            <Badge variant={statusColor()}>{statusLabel()}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatDate(game.gameDate)}</span>
            <Badge variant="outline" className="text-xs">
              {game.homeOrAway === "home" ? "HOME" : "AWAY"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Score Section */}
      {(isLive || isFinal) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">Us</p>
                <p className="text-4xl font-bold tabular-nums">{totalUsRuns}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {isLive
                    ? `${game.currentHalf === "top" ? "Top" : "Bot"} ${game.currentInning}`
                    : "Final"}
                </p>
                {isLive && (
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <OutTracker outs={game.currentOuts} size="sm" />
                    <BaseDiamond
                      runners={{
                        first: !!parsedRunners.first,
                        second: !!parsedRunners.second,
                        third: !!parsedRunners.third,
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  {game.opponentName.slice(0, 8)}
                </p>
                <p className="text-4xl font-bold tabular-nums">{totalOppRuns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => router.push(`/games/${gameId}/lineup`)}
        >
          <ListOrdered className="size-4 mr-1" />
          Lineup
        </Button>
        {(isLive || game.simpleModeEnabled) && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => router.push(`/games/${gameId}/live`)}
          >
            <Radio className="size-4 mr-1" />
            Live Score
          </Button>
        )}
        {game.advancedModeEnabled && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => router.push(`/games/${gameId}/scorebook`)}
          >
            <BookOpen className="size-4 mr-1" />
            Scorebook
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => window.print()}
        >
          <Printer className="size-4 mr-1" />
          Print
        </Button>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="lineup">
        <TabsList className="w-full">
          <TabsTrigger value="lineup">Lineup</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="plays">Plays</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup">
          <Card className="mt-3">
            <CardHeader>
              <CardTitle className="text-sm">Batting Order</CardTitle>
            </CardHeader>
            <CardContent>
              {battingOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lineup set yet.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {battingOrder
                    .sort((a, b) => a.battingSlot - b.battingSlot)
                    .map((entry) => {
                      const player = playerMap.get(entry.playerId);
                      return (
                        <div
                          key={entry.battingSlot}
                          className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
                        >
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                            {entry.battingSlot}
                          </span>
                          <span className="text-sm font-medium">
                            {player
                              ? playerFullName(player.firstName, player.lastName)
                              : "Unknown"}
                          </span>
                          {player?.jerseyNumber && (
                            <span className="text-xs text-muted-foreground">
                              #{player.jerseyNumber}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini fielding summary */}
          {fieldingAssignments.length > 0 && (
            <Card className="mt-3">
              <CardHeader>
                <CardTitle className="text-sm">Fielding - Inning 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {fieldingAssignments
                    .filter((a) => a.inningNumber === 1)
                    .map((a) => {
                      const player = playerMap.get(a.playerId);
                      return (
                        <div
                          key={`${a.position}`}
                          className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-2"
                        >
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {a.position}
                          </span>
                          <span className="text-xs font-medium truncate max-w-full">
                            {player ? player.firstName : "-"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scoring">
          <Card className="mt-3">
            <CardContent className="py-4">
              <ScoreDisplay
                scoreByInning={scoreByInning}
                opponentName={game.opponentName}
                currentInning={isLive ? game.currentInning : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plays">
          <Card className="mt-3">
            <CardContent className="py-4">
              {recentPlays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No plays recorded yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentPlays.map((play) => (
                    <div
                      key={play.id}
                      className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-xs font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                        {play.inning}
                      </span>
                      <p className="text-sm">{play.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4" />
            Game Recap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {game.recapText ? (
            <p className="text-sm leading-relaxed">{game.recapText}</p>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground">No recap available yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateRecap}
                disabled={generatingRecap}
              >
                {generatingRecap ? (
                  <>
                    <Loader2 className="size-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Recap"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Awards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="size-4" />
            Awards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {awards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No awards yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {awards.map((award) => {
                const player = award.player ?? (award.playerId ? playerMap.get(award.playerId) : null);
                return (
                  <div
                    key={award.id}
                    className="flex flex-col items-center gap-1 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3"
                  >
                    <Trophy className="size-5 text-yellow-600" />
                    <span className="text-xs font-bold text-center">
                      {award.headline || award.awardType.replace(/_/g, " ")}
                    </span>
                    {player && (
                      <span className="text-xs text-muted-foreground">
                        {playerFullName(player.firstName, player.lastName)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="size-4" />
            Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No photos or videos yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.caption || "Game media"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Livestream */}
      {game.livestreamUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Video className="size-4" />
              Livestream
            </CardTitle>
          </CardHeader>
          <CardContent>
            {game.livestreamUrl.includes("youtube") || game.livestreamUrl.includes("youtu.be") ? (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={game.livestreamUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <a
                href={game.livestreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Video className="size-4" />
                Watch Livestream
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
