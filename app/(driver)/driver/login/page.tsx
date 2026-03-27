"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

export default function DriverLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-tippd-blue mx-auto flex items-center justify-center text-white mb-6">
          <Smartphone className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Driver Sign In</h1>
        <p className="text-gray-500 text-sm mt-2 mb-8">
          Enter your email and we&apos;ll send you a magic link. One tap to sign
          in — no password needed.
        </p>

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border-2 border-gray-200 text-lg outline-none focus:border-tippd-blue"
              placeholder="you@company.com"
              required
            />
            <button
              type="submit"
              className="w-full h-12 bg-tippd-blue text-white rounded-lg text-base font-semibold hover:opacity-90 transition-opacity"
            >
              Send Magic Link
            </button>
          </form>
        ) : (
          <div className="rounded-lg bg-green-50 border border-green-200 p-6">
            <p className="text-green-800 font-semibold">Check your email!</p>
            <p className="text-green-700 text-sm mt-1">
              We sent a sign-in link to <strong>{email}</strong>. Tap it from
              your phone to get started.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-tippd-blue mt-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
