"use client";

import Image from "next/image";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Form", href: "#form" },
  { label: "Matches", href: "#matches" },
  { label: "Ranking", href: "#ranking" },
];

export default function TopBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1124]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Bester FC"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg bg-white p-1"
          />
          <div className="text-sm font-semibold text-white">
            Bester FC
          </div>
        </div>

        <nav className="hidden items-center gap-5 text-sm text-white/70 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:text-white md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span className="text-xl">{isOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-[#0b1124]/95 md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-3 text-sm text-white/70">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

