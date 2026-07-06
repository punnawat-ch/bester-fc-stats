"use client";

import {
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Play, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startTour } from "@/components/admin/help/tour";
import { TutorialToggle } from "@/components/admin/help/TutorialToggle";
import { useTutorialPrefs } from "@/components/admin/help/tutorial-prefs";
import {
  getHelpEntry,
  helpRegistry,
  type FeatureKey,
  type HelpEntry,
} from "@/content/help";

import { resetTour } from "./action";

const WELCOME_KEY: FeatureKey = "welcome";

/** ดึงข้อความล้วนจาก ReactNode (ใช้ทำ index สำหรับค้นหา) */
function nodeToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeToText).join(" ");
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeToText(props.children);
  }
  return "";
}

/** ข้อความค้นหาของ 1 entry: title + summary + heading + body */
function searchTextFor(entry: HelpEntry): string {
  const sections = entry.sections
    .map((section) => `${section.heading} ${nodeToText(section.body)}`)
    .join(" ");
  return `${entry.title} ${nodeToText(entry.summary)} ${sections}`.toLowerCase();
}

const HELP_ENTRIES: readonly HelpEntry[] = Object.values(helpRegistry);

type HelpEntryCardProps = Readonly<{
  entry: HelpEntry;
}>;

/** การ์ด accordion 1 ฟีเจอร์ — anchor id, ปุ่มดูทัวร์ และ sections เต็ม */
function HelpEntryCard({ entry }: HelpEntryCardProps) {
  const hasTour = entry.tour.length > 0;

  return (
    <details
      id={entry.key}
      className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
        {entry.title}
        <span className="text-xs font-normal text-white/40">
          {entry.sections.length} หัวข้อ
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-white/10 px-4 py-4">
        {hasTour ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => startTour(entry.tour)}
          >
            <Play className="size-4" aria-hidden="true" />
            ดูทัวร์
          </Button>
        ) : null}
        <div className="flex flex-col gap-4">
          {entry.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold text-white">
                {section.heading}
              </h3>
              <div className="text-sm leading-relaxed text-white/70 [&_b]:font-semibold [&_b]:text-white">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}

/** ส่วนโต้ตอบของ Help hub: master toggle + replay + ค้นหา + accordion */
export function HelpHubClient() {
  const { tutorialEnabled } = useTutorialPrefs();
  const [query, setQuery] = useState("");

  const searchIndex = useMemo(
    () =>
      HELP_ENTRIES.map((entry) => ({
        entry,
        text: searchTextFor(entry),
      })),
    [],
  );

  const trimmed = query.trim().toLowerCase();
  const results =
    trimmed === ""
      ? HELP_ENTRIES
      : searchIndex
          .filter((item) => item.text.includes(trimmed))
          .map((item) => item.entry);

  useEffect(() => {
    const raw = globalThis.window.location.hash.replace("#", "");
    if (raw === "") {
      return;
    }
    const target = document.getElementById(raw);
    if (target) {
      target.setAttribute("open", "");
      target.scrollIntoView({ block: "start" });
    }
  }, []);

  function replayWelcome() {
    resetTour(WELCOME_KEY)
      .then(() => {
        startTour(getHelpEntry(WELCOME_KEY).tour);
      })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col gap-5">
      <TutorialToggle initialEnabled={tutorialEnabled} />

      <Button
        type="button"
        variant="secondary"
        className="self-start"
        onClick={replayWelcome}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        เล่นทัวร์แนะนำใหม่
      </Button>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        />
        <Input
          type="search"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาในคู่มือ…"
          aria-label="ค้นหาในคู่มือ"
          className="pl-10"
        />
      </div>

      {results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {results.map((entry) => (
            <HelpEntryCard key={entry.key} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/50">
          ไม่พบผลการค้นหาสำหรับ “{query}”
        </p>
      )}
    </div>
  );
}
