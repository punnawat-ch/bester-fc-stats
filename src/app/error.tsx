"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-danger/30 bg-glass px-8 py-10 shadow-2xl shadow-danger/10">
          <p className="text-xs uppercase tracking-[0.3em] text-danger-fg/70">
            Connection error
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            ไม่สามารถเชื่อมต่อ Google Sheet ได้
          </h1>
          <p className="mt-3 text-sm text-fg-muted">
            กรุณาตรวจสอบ Service Account, สิทธิ์การแชร์ชีต และค่า env แล้วลองใหม่อีกครั้ง
          </p>
          {error?.message && (
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-scrim/40 px-4 py-3 text-left text-xs text-danger-fg/80">
              {error.message}
            </pre>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-primary/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary"
              onClick={() => reset()}
            >
              Try again
            </button>
            <span className="text-xs text-fg-subtle">
              หากยังไม่สำเร็จ ให้ตรวจสอบว่าแชร์ชีตให้ service account แล้ว
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

