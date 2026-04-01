"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, ShieldCheck } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  email?: string;
  role?: string;
  teamName?: string;
  linkedPlayer?: string | null;
  error?: string;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken);

  useEffect(() => {
    if (!inviteToken) {
      setLoadingInvite(false);
      return;
    }

    fetch(`/api/invites/validate?token=${encodeURIComponent(inviteToken)}`)
      .then((res) => res.json())
      .then((data: InviteInfo) => {
        setInviteInfo(data);
        if (data.valid && data.email) {
          setEmail(data.email);
        }
      })
      .catch(() => {
        setInviteInfo({ valid: false, error: "Failed to validate invite" });
      })
      .finally(() => setLoadingInvite(false));
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create account");
      }

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-muted-foreground">Validating invite...</p>
      </div>
    );
  }

  // No invite token provided
  if (!inviteToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="size-14 rounded-xl bg-primary flex items-center justify-center">
              <PlayCircle className="size-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lineup Lab</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <ShieldCheck className="size-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Invite Required</h2>
                <p className="text-sm text-muted-foreground">
                  Lineup Lab is invite-only to keep your team safe. Ask your
                  coach or team manager to send you an invite link.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (inviteInfo && !inviteInfo.valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="size-14 rounded-xl bg-primary flex items-center justify-center">
              <PlayCircle className="size-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lineup Lab</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <ShieldCheck className="size-12 text-destructive" />
                <h2 className="text-lg font-semibold">Invalid Invite</h2>
                <p className="text-sm text-muted-foreground">
                  {inviteInfo.error ||
                    "This invite link is no longer valid. Ask your coach for a new one."}
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Valid invite — show signup form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="size-14 rounded-xl bg-primary flex items-center justify-center">
            <PlayCircle className="size-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Lineup Lab</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        {inviteInfo && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-medium">
                  You&apos;ve been invited to join{" "}
                  <span className="text-primary">{inviteInfo.teamName}</span>
                </p>
                <p className="text-muted-foreground">
                  Role: {inviteInfo.role?.replace("_", " ")}
                  {inviteInfo.linkedPlayer &&
                    ` \u00B7 Linked to ${inviteInfo.linkedPlayer}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@example.com"
                  required
                  readOnly={!!inviteInfo?.email}
                  className={inviteInfo?.email ? "bg-muted" : ""}
                />
                {inviteInfo?.email && (
                  <p className="text-xs text-muted-foreground">
                    Must match the invited email address
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
