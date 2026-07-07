"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AppearanceStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { contrastRatio, pickForeground } from "@/lib/appearance/contrast";

import { APPEARANCE_PRESETS } from "./presets";
import {
  clearPreview,
  deleteDraft,
  publishRevision,
  revertToRevision,
  saveDraft,
  setPreview,
  type ActionResult,
} from "./action";

export type RevisionView = Readonly<{
  id: string;
  status: AppearanceStatus;
  brand: string;
  brandForeground: string;
  label: string | null;
  note: string | null;
  createdAt: string;
  publishedAt: string | null;
  isActive: boolean;
}>;

type AppearanceClientProps = Readonly<{
  revisions: readonly RevisionView[];
  activeBrand: string;
  previewId: string | null;
}>;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const AA_MIN = 4.5;

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INPUT: "That color looks invalid. Use a 6-digit hex.",
  CLUB_NOT_FOUND: "Club record not found.",
  REVISION_NOT_FOUND: "That revision no longer exists.",
  NOT_A_DRAFT: "Only drafts can be deleted.",
  SAVE_FAILED: "Something went wrong. Please try again.",
};

function messageFor(result: Extract<ActionResult, { ok: false }>) {
  return ERROR_MESSAGES[result.error] ?? "Something went wrong.";
}

function brandStyle(brand: string): CSSProperties {
  const foreground = pickForeground(brand);
  return {
    "--brand": brand,
    "--brand-foreground": foreground,
    "--brand-ring": `color-mix(in srgb, ${brand} 60%, transparent)`,
  } as CSSProperties;
}

export function AppearanceClient({
  revisions,
  activeBrand,
  previewId,
}: AppearanceClientProps) {
  const router = useRouter();
  const [brand, setBrand] = useState(activeBrand);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const isValid = HEX_RE.test(brand);
  const foreground = isValid ? pickForeground(brand) : "#ffffff";
  const ratio = isValid ? contrastRatio(brand, foreground) : 0;

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(messageFor(result));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Editor
        brand={brand}
        onBrand={setBrand}
        label={label}
        onLabel={setLabel}
        isValid={isValid}
        ratio={ratio}
        pending={pending}
        onSave={() =>
          run(
            () => saveDraft({ brand, label }),
            "Draft saved. Preview it, then publish.",
          )
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-fg">
          Revisions
        </h2>
        {revisions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-glass-xs px-4 py-6 text-center text-sm text-fg-muted">
            No revisions yet. Save a draft above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {revisions.map((revision) => (
              <RevisionRow
                key={revision.id}
                revision={revision}
                isPreviewing={previewId === revision.id}
                pending={pending}
                onPreview={() =>
                  run(() => setPreview(revision.id), "Previewing this draft.")
                }
                onExitPreview={() =>
                  run(clearPreview, "Exited preview.")
                }
                onPublish={() =>
                  run(
                    () => publishRevision(revision.id),
                    "Published to the live site.",
                  )
                }
                onRestore={() =>
                  run(
                    () => revertToRevision(revision.id),
                    "Cloned to a new draft. Preview, then publish.",
                  )
                }
                onDelete={() =>
                  run(() => deleteDraft(revision.id), "Draft deleted.")
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type EditorProps = Readonly<{
  brand: string;
  onBrand: (value: string) => void;
  label: string;
  onLabel: (value: string) => void;
  isValid: boolean;
  ratio: number;
  pending: boolean;
  onSave: () => void;
}>;

function Editor({
  brand,
  onBrand,
  label,
  onLabel,
  isValid,
  ratio,
  pending,
  onSave,
}: EditorProps) {
  const swatch = isValid ? brand : "#38bdf8";
  return (
    <section className="rounded-3xl border border-border bg-panel/80 p-5 shadow-panel ring-1 ring-border">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-fg" htmlFor="brand-hex">
              Brand color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Brand color picker"
                value={swatch}
                onChange={(event) => onBrand(event.target.value)}
                className="size-12 shrink-0 cursor-pointer rounded-2xl border border-border bg-transparent"
              />
              <Input
                id="brand-hex"
                value={brand}
                onChange={(event) => onBrand(event.target.value)}
                autoComplete="off"
                placeholder="#38bdf8"
                className="font-mono"
              />
            </div>
            <ContrastHint isValid={isValid} ratio={ratio} />
          </div>

          <PresetGrid selected={brand} onSelect={onBrand} />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-fg" htmlFor="brand-label">
              Label <span className="text-fg-subtle">(optional)</span>
            </label>
            <Input
              id="brand-label"
              value={label}
              onChange={(event) => onLabel(event.target.value)}
              placeholder="CI 2026"
              maxLength={60}
            />
          </div>

          <Button
            type="button"
            onClick={onSave}
            disabled={!isValid || pending}
            className="w-fit"
          >
            Save as draft
          </Button>
        </div>

        <Preview brand={isValid ? brand : "#38bdf8"} />
      </div>
    </section>
  );
}

type ContrastHintProps = Readonly<{ isValid: boolean; ratio: number }>;

function ContrastHint({ isValid, ratio }: ContrastHintProps) {
  if (!isValid) {
    return (
      <p className="text-xs text-danger-fg">Enter a 6-digit hex, e.g. #38bdf8.</p>
    );
  }
  const passes = ratio >= AA_MIN;
  return (
    <p className={passes ? "text-xs text-fg-subtle" : "text-xs text-warning"}>
      Contrast {ratio.toFixed(1)}:1 · {passes ? "AA ✓" : "below AA — labels may be hard to read"}
    </p>
  );
}

type PresetGridProps = Readonly<{
  selected: string;
  onSelect: (value: string) => void;
}>;

function PresetGrid({ selected, onSelect }: PresetGridProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-fg-subtle">
        Presets
      </span>
      <div className="flex flex-wrap gap-2">
        {APPEARANCE_PRESETS.map((preset) => {
          const active = selected.toLowerCase() === preset.brand.toLowerCase();
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onSelect(preset.brand)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary text-fg"
                  : "border-border text-fg-muted hover:border-border-hover hover:text-fg"
              }`}
            >
              <span
                className="size-3.5 rounded-full ring-1 ring-glass-strong"
                style={{ backgroundColor: preset.brand }}
              />
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type PreviewProps = Readonly<{ brand: string }>;

function Preview({ brand }: PreviewProps) {
  return (
    <div
      style={brandStyle(brand)}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <span className="text-xs uppercase tracking-[0.2em] text-fg-subtle">
        Live preview
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Primary
        </span>
        <span className="rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-medium text-primary">
          Accent chip
        </span>
        <span className="rounded-full border border-border bg-glass px-4 py-2 text-sm text-fg-muted">
          Muted
        </span>
      </div>
      <div className="rounded-xl border border-border bg-panel p-4">
        <p className="text-sm font-semibold text-fg">Card surface</p>
        <p className="text-xs text-fg-muted">
          Body text stays neutral; only the accent follows the brand.
        </p>
        <span className="mt-2 inline-block h-1.5 w-16 rounded-full bg-primary" />
      </div>
    </div>
  );
}

type RevisionRowProps = Readonly<{
  revision: RevisionView;
  isPreviewing: boolean;
  pending: boolean;
  onPreview: () => void;
  onExitPreview: () => void;
  onPublish: () => void;
  onRestore: () => void;
  onDelete: () => void;
}>;

const STATUS_VARIANT: Record<AppearanceStatus, "success" | "info" | "neutral"> = {
  PUBLISHED: "success",
  DRAFT: "info",
  ARCHIVED: "neutral",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function RevisionRow({
  revision,
  isPreviewing,
  pending,
  onPreview,
  onExitPreview,
  onPublish,
  onRestore,
  onDelete,
}: RevisionRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-glass px-4 py-3">
      <span
        className="size-8 shrink-0 rounded-lg ring-1 ring-glass-strong"
        style={{ backgroundColor: revision.brand }}
      />
      <div className="min-w-40 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-fg">{revision.brand}</span>
          {revision.label ? (
            <span className="text-sm text-fg-muted">· {revision.label}</span>
          ) : null}
          {revision.isActive ? <Badge variant="success">Live</Badge> : null}
        </div>
        <p className="text-xs text-fg-subtle">
          {formatDate(revision.publishedAt ?? revision.createdAt)}
        </p>
      </div>

      <Badge variant={STATUS_VARIANT[revision.status]}>
        {revision.status.toLowerCase()}
      </Badge>

      <div className="flex flex-wrap items-center gap-2">
        <PreviewToggle
          isPreviewing={isPreviewing}
          pending={pending}
          onPreview={onPreview}
          onExitPreview={onExitPreview}
        />
        {revision.isActive ? null : (
          <Button
            type="button"
            size="sm"
            onClick={onPublish}
            disabled={pending}
          >
            Publish
          </Button>
        )}
        {revision.status === "ARCHIVED" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRestore}
            disabled={pending}
          >
            Restore
          </Button>
        ) : null}
        {revision.status === "DRAFT" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={pending}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </li>
  );
}

type PreviewToggleProps = Readonly<{
  isPreviewing: boolean;
  pending: boolean;
  onPreview: () => void;
  onExitPreview: () => void;
}>;

function PreviewToggle({
  isPreviewing,
  pending,
  onPreview,
  onExitPreview,
}: PreviewToggleProps) {
  if (isPreviewing) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onExitPreview}
        disabled={pending}
      >
        Exit preview
      </Button>
    );
  }
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onPreview}
      disabled={pending}
    >
      Preview
    </Button>
  );
}
