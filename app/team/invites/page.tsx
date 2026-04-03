"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  Mail,
} from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  linkedPlayer: Player | null;
}

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("parent");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/invites");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (res.status === 403) {
        setError("You don't have permission to manage invites");
        return;
      }
      const data = await res.json();
      setInvites(data);
    } catch {
      setError("Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInvites();
    // Load players for the linked player dropdown
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
      })
      .catch(() => {});
  }, [loadInvites]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          linkedPlayerId: linkedPlayerId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite");
      }

      setEmail("");
      setRole("parent");
      setLinkedPlayerId("");
      await loadInvites();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    try {
      await fetch(`/api/invites?id=${inviteId}`, { method: "DELETE" });
      await loadInvites();
    } catch {
      setError("Failed to revoke invite");
    }
  }

  function copyInviteLink(token: string, inviteId: string) {
    const url = `${window.location.origin}/auth/signup?invite=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(inviteId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-600",
    revoked: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Manage Invites</h1>
            <p className="text-sm text-muted-foreground">
              Invite people to join your team
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Create invite form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="parent">Parent / Guardian</option>
                  <option value="assistant_coach">Assistant Coach</option>
                  <option value="scorekeeper">Scorekeeper</option>
                  <option value="head_coach">Head Coach</option>
                </select>
              </div>

              {role === "parent" && players.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Link to player{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={linkedPlayerId}
                    onChange={(e) => setLinkedPlayerId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No player link</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Links this account as a guardian for the selected player
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11"
              >
                <UserPlus className="size-4 mr-2" />
                {submitting ? "Sending..." : "Create Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invites list */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Invites ({invites.length})
        </h2>

        {invites.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Mail className="size-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No invites yet. Send one above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={statusColor[invite.status] || ""}
                        >
                          {invite.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {invite.role.replace("_", " ")}
                        </span>
                      </div>
                      {invite.linkedPlayer && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Linked to {invite.linkedPlayer.firstName}{" "}
                          {invite.linkedPlayer.lastName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {invite.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                              copyInviteLink(invite.token, invite.id)
                            }
                            title="Copy invite link"
                          >
                            {copiedId === invite.id ? (
                              <Check className="size-4 text-green-600" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => handleRevoke(invite.id)}
                            title="Revoke invite"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
