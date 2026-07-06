"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Camera,
  ImageOff,
  Loader2,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  processImage,
  removeImageBackground,
} from "@/components/admin/image-processing";

/** Result contract shared with the server actions that persist the upload. */
export type UploadResult = Readonly<{
  ok: boolean;
  url?: string | null;
  error?: string;
}>;

type CutoutMode = "auto" | "manual";

type PendingImage = Readonly<{ blob: Blob; url: string; hasAlpha: boolean }>;

type ImageUploadProps = Readonly<{
  label: string;
  description?: string;
  /** Current persisted public URL (or null when none). */
  currentUrl: string | null;
  /** Enable the 2-mode background-removal toggle (players only). */
  enableCutout: boolean;
  /** "card" = player pitch mockup, "image" = plain contained preview. */
  previewVariant: "card" | "image";
  disabled?: boolean;
  onUpload: (blob: Blob) => Promise<UploadResult>;
  onDelete?: () => Promise<UploadResult>;
  /** Notifies the parent of the new persisted URL (or null after delete). */
  onUploaded?: (url: string | null) => void;
}>;

const PITCH_STYLE = {
  background:
    "linear-gradient(180deg,#0c3620 0%,#0a2a19 55%,#06160d 100%)," +
    "repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 0 14px,transparent 14px 28px)",
} as const;

type ModeToggleProps = Readonly<{
  mode: CutoutMode;
  onChange: (mode: CutoutMode) => void;
  disabled: boolean;
}>;

function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Background removal mode"
      className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-semibold"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "auto"}
        disabled={disabled}
        onClick={() => onChange("auto")}
        className={
          mode === "auto"
            ? "rounded-lg bg-sky-500/90 px-3 py-1.5 text-[#08110c]"
            : "rounded-lg px-3 py-1.5 text-white/70"
        }
      >
        Auto remove
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "manual"}
        disabled={disabled}
        onClick={() => onChange("manual")}
        className={
          mode === "manual"
            ? "rounded-lg bg-sky-500/90 px-3 py-1.5 text-[#08110c]"
            : "rounded-lg px-3 py-1.5 text-white/70"
        }
      >
        Manual PNG
      </button>
    </div>
  );
}

function PitchPreview({ src }: Readonly<{ src: string | null }>) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/10"
      style={PITCH_STYLE}
      role="img"
      aria-label="Card preview"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[88%] w-auto object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)]"
        />
      ) : (
        <UserRound className="absolute inset-0 m-auto size-16 text-white/25" />
      )}
    </div>
  );
}

function PlainPreview({
  src,
  label,
}: Readonly<{ src: string | null; label: string }>) {
  if (src == null) {
    return (
      <div
        className="flex h-40 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 ring-1 ring-white/10"
        role="img"
        aria-label={`${label} (empty)`}
      >
        <ImageOff className="size-8 text-white/30" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className="h-40 w-full rounded-2xl border border-white/10 bg-white/5 object-contain ring-1 ring-white/10"
    />
  );
}

export function ImageUpload({
  label,
  description,
  currentUrl,
  enableCutout,
  previewVariant,
  disabled = false,
  onUpload,
  onDelete,
  onUploaded,
}: ImageUploadProps) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<CutoutMode>("auto");
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [busy, setBusy] = useState<null | "processing" | "uploading">(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    return () => {
      if (pending) {
        URL.revokeObjectURL(pending.url);
      }
    };
  }, [pending]);

  function clearPending() {
    setPending((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }

  async function handleFileSelected(file: File) {
    setError(null);
    setWarning(null);
    clearPending();
    setBusy("processing");
    try {
      const useAuto = enableCutout && mode === "auto";
      const source = useAuto ? await removeImageBackground(file) : file;
      const processed = await processImage(source);
      const url = URL.createObjectURL(processed.blob);
      setPending({ blob: processed.blob, url, hasAlpha: processed.hasAlpha });
      if (enableCutout && !processed.hasAlpha) {
        setWarning(
          "No transparent background detected — use Auto remove or upload a cut-out PNG.",
        );
      }
    } catch {
      setError("Could not process this image. Try another file.");
    } finally {
      setBusy(null);
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      handleFileSelected(file).catch(() => {
        setError("Could not read this image.");
      });
    }
  }

  function handleConfirm() {
    if (!pending) {
      return;
    }
    setBusy("uploading");
    startSaving(async () => {
      const result = await onUpload(pending.blob);
      setBusy(null);
      if (result.ok) {
        toast.success("Image saved");
        clearPending();
        onUploaded?.(result.url ?? null);
        return;
      }
      setError("Upload failed. Please try again.");
      toast.error("Upload failed");
    });
  }

  function handleRemove() {
    if (!onDelete) {
      return;
    }
    startSaving(async () => {
      const result = await onDelete();
      if (result.ok) {
        toast.success("Image removed");
        onUploaded?.(null);
        return;
      }
      toast.error("Could not remove image");
    });
  }

  const displayUrl = pending?.url ?? currentUrl;
  const controlsDisabled = disabled || busy != null || isSaving;
  const processingLabel =
    enableCutout && mode === "auto"
      ? "Removing background… (first run downloads the model)"
      : "Processing image…";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{label}</span>
          {description ? (
            <span className="text-xs text-white/50">{description}</span>
          ) : null}
        </div>
        {enableCutout ? (
          <ModeToggle
            mode={mode}
            onChange={setMode}
            disabled={controlsDisabled}
          />
        ) : null}
      </div>

      {previewVariant === "card" ? (
        <PitchPreview src={displayUrl} />
      ) : (
        <PlainPreview src={displayUrl} label={label} />
      )}

      {busy === "processing" ? (
        <p className="flex items-center gap-2 text-xs text-sky-200">
          <Loader2 className="size-4 animate-spin" />
          {processingLabel}
        </p>
      ) : null}
      {warning ? <p className="text-xs text-amber-300">{warning}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {pending ? (
          <>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={controlsDisabled}
              aria-busy={busy === "uploading"}
            >
              {busy === "uploading" ? "Saving…" : "Save image"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={clearPending}
              disabled={controlsDisabled}
            >
              Discard
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => libraryRef.current?.click()}
              disabled={controlsDisabled}
            >
              <Upload />
              {displayUrl ? "Replace" : "Choose"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => cameraRef.current?.click()}
              disabled={controlsDisabled}
            >
              <Camera />
              Camera
            </Button>
            {displayUrl != null && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={controlsDisabled}
              >
                <Trash2 />
                Remove
              </Button>
            ) : null}
          </>
        )}
      </div>

      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onInputChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={onInputChange}
      />
    </div>
  );
}
