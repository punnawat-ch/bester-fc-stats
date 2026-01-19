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
    <div className="min-h-screen bg-[#08110c] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-rose-400/30 bg-white/5 px-8 py-10 shadow-2xl shadow-rose-500/10">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-200/70">
            Connection error
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            ไม่สามารถเชื่อมต่อ Google Sheet ได้
          </h1>
          <p className="mt-3 text-sm text-white/70">
            กรุณาตรวจสอบ Service Account, สิทธิ์การแชร์ชีต และค่า env แล้วลองใหม่อีกครั้ง
          </p>
          {error?.message && (
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/40 px-4 py-3 text-left text-xs text-rose-100/80">
              {error.message}
            </pre>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-400/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#06120c] transition hover:bg-emerald-300"
              onClick={() => reset()}
            >
              Try again
            </button>
            <span className="text-xs text-white/50">
              หากยังไม่สำเร็จ ให้ตรวจสอบว่าแชร์ชีตให้ service account แล้ว
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

