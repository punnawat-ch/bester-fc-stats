"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";

/**
 * KeywordsInput — chips/tag editor that maps to `seoKeywords` (string[]).
 * Type a keyword and press Enter or comma to add a chip; each chip has a
 * remove button. Duplicates and blanks are ignored. Controlled via the RHF
 * field's `value`/`onChange`. (admin-ux-spec §4.6 "seoKeywords → chips").
 */
type KeywordsInputProps = Readonly<{
  value: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
}>;

const ADD_KEYS = new Set(["Enter", ",", "Tab"]);

export function KeywordsInput({
  value,
  onChange,
  disabled = false,
  id,
  describedBy,
}: KeywordsInputProps) {
  const [draft, setDraft] = useState("");

  function addKeyword() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      return;
    }
    setDraft("");
    if (value.includes(trimmed)) {
      return;
    }
    onChange([...value, trimmed]);
  }

  function removeKeyword(keyword: string) {
    onChange(value.filter((item) => item !== keyword));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (ADD_KEYS.has(event.key) && draft.trim() !== "") {
      event.preventDefault();
      addKeyword();
      return;
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeKeyword(value[value.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Current keywords">
          {value.map((keyword) => (
            <li key={keyword}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-1 pr-1 pl-3 text-sm text-white ring-1 ring-white/10">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  disabled={disabled}
                  aria-label={`Remove ${keyword}`}
                  className="flex size-6 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:outline-none disabled:opacity-60"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={draft}
        disabled={disabled}
        aria-describedby={describedBy}
        placeholder="Add a keyword, press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addKeyword}
      />
    </div>
  );
}
