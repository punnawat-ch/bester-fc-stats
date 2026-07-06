"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const inputClasses =
  "min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0a1222]/80 px-4 text-base text-white placeholder-white/40 ring-1 ring-white/10 outline-none transition focus:border-sky-400/60 focus:ring-sky-400/40";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-white/70">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@bester.fc"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-white/70">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className={inputClasses}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sky-500 px-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(14,165,233,0.35)] transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
