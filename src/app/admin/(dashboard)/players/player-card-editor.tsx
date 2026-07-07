"use client";

import { useEffect, useState, useTransition } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { processImage } from "@/components/admin/image-processing";
import { deletePlayerPhoto, savePlayerPhoto } from "./action";
import { POSITION_BADGE } from "./position-pills";
import type { PlayerFormValues } from "./schema";

type PendingImage = Readonly<{ blob: Blob; url: string; hasAlpha: boolean }>;

type BusyState = null | "processing" | "uploading";

function monogram(name: string): string {
  const trimmed = name.trim();
  return trimmed === "" ? "?" : trimmed.slice(0, 2).toUpperCase();
}

type FigureProps = Readonly<{ name: string; imageUrl: string | null }>;

/** Cut-out photo standing on the pitch, or a monogram fallback (mirrors card). */
function CardFigure({ name, imageUrl }: FigureProps) {
  if (imageUrl) {
    return (
      <div className="absolute inset-0 grid items-end justify-items-center">
        <div className="squad-ground-shadow" />
        <div className="relative h-[84%] w-[74%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-x-0 bottom-0 mx-auto h-full w-auto object-contain [filter:drop-shadow(0_18px_18px_rgba(0,0,0,0.45))]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="text-[44px] font-extrabold tracking-tight text-white/15">
        {monogram(name)}
      </span>
    </div>
  );
}

type PlayerCardEditorProps = Readonly<{
  control: Control<PlayerFormValues>;
  /** Player id, or null in create mode (photo editing needs a persisted id). */
  playerId: string | null;
  /** Persisted public photo URL (owned by the sheet; drives the live card). */
  photoUrl: string | null;
  /** Pulse the card glow briefly after a successful save (reduced-motion safe). */
  celebrate: boolean;
  /** Bubbles the newly persisted URL (or null after delete) up to the editor. */
  onPhotoChange: (url: string | null) => void;
}>;

/**
 * Unified "Player Card Editor": the live front-card preview (night pitch,
 * cut-out figure, name/nickname/jersey/position badge) IS the photo surface.
 * An overlaid edit button starts the upload flow — pick an already cut-out
 * transparent PNG; the processed result previews inside the card itself, with a
 * compact confirm / remove cluster below. Uses the shared `.squad-*` pitch
 * styling and the guarded `savePlayerPhoto` / `deletePlayerPhoto` actions.
 */
export function PlayerCardEditor({
  control,
  playerId,
  photoUrl,
  celebrate,
  onPhotoChange,
}: PlayerCardEditorProps) {
  const name = useWatch({ control, name: "name" }) ?? "";
  const nickname = useWatch({ control, name: "nickname" }) ?? "";
  const position = useWatch({ control, name: "position" }) ?? "";
  const jerseyNumber = useWatch({ control, name: "jerseyNumber" }) ?? null;
  const displayName = name.trim() === "" ? "New player" : name;

  const [pending, setPending] = useState<PendingImage | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
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

  const editable = playerId !== null;
  const displayUrl = pending?.url ?? photoUrl;
  const controlsDisabled = busy != null || isSaving;
  const overlayBusy = controlsDisabled;

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
      const processed = await processImage(file);
      const url = URL.createObjectURL(processed.blob);
      setPending({ blob: processed.blob, url, hasAlpha: processed.hasAlpha });
      if (!processed.hasAlpha) {
        setWarning(
          "No transparent background detected — upload a cut-out PNG for the best card.",
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
    if (!pending || !playerId) {
      return;
    }
    setBusy("uploading");
    startSaving(async () => {
      const formData = new FormData();
      formData.append("file", pending.blob, "player.png");
      const result = await savePlayerPhoto(playerId, formData);
      setBusy(null);
      if (result.ok) {
        toast.success("Photo saved");
        clearPending();
        onPhotoChange(result.url ?? null);
        return;
      }
      setError("Upload failed. Please try again.");
      toast.error("Upload failed");
    });
  }

  function handleRemove() {
    if (!playerId) {
      return;
    }
    startSaving(async () => {
      const result = await deletePlayerPhoto(playerId);
      if (result.ok) {
        toast.success("Photo removed");
        onPhotoChange(null);
        return;
      }
      toast.error("Could not remove photo");
    });
  }

  const processingLabel = "Processing image…";

  return (
    <div className="flex flex-col gap-3">
      <div
        data-tour="player-card-preview"
        className={`relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-2xl border border-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.5)] ${
          celebrate ? "squad-celebrate" : ""
        }`}
      >
        <div className="squad-pitch">
          <div className="squad-halo" />
          <div className="squad-arc" />
        </div>
        <CardFigure name={name} imageUrl={displayUrl} />
        <div className="squad-scrim" />

        {position === "" ? null : (
          <span
            className={`absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${POSITION_BADGE[position]}`}
          >
            {position}
          </span>
        )}

        {editable ? (
          <EditPhotoButton disabled={controlsDisabled} onFile={onInputChange} />
        ) : null}

        {overlayBusy ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <Loader2 className="size-6 animate-spin text-sky-200" />
          </div>
        ) : null}

        <div className="absolute inset-x-3 bottom-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold leading-none tracking-tight text-white">
                {displayName}
              </div>
              {nickname.trim() === "" ? null : (
                <div className="mt-1 truncate text-[10px] tracking-wide text-white/60">
                  {nickname}
                </div>
              )}
            </div>
            {jerseyNumber === null ? null : (
              <div className="text-[28px] font-extrabold leading-[0.8] tabular-nums text-white/90 [text-shadow:0_2px_18px_rgba(56,189,248,0.5)]">
                {jerseyNumber}
              </div>
            )}
          </div>
        </div>
      </div>

      {editable ? (
        <div className="flex flex-col gap-2">
          {busy === "processing" ? (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-sky-200">
              <Loader2 className="size-4 animate-spin" />
              {processingLabel}
            </p>
          ) : null}
          {warning ? (
            <p className="text-center text-xs text-amber-300">{warning}</p>
          ) : null}
          {error ? (
            <p className="text-center text-xs text-rose-300">{error}</p>
          ) : null}

          {pending ? (
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={controlsDisabled}
                aria-busy={busy === "uploading"}
              >
                {busy === "uploading" ? "Saving…" : "Save photo"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={clearPending}
                disabled={controlsDisabled}
              >
                Discard
              </Button>
            </div>
          ) : (
            <PhotoControls
              disabled={controlsDisabled}
              hasPhoto={displayUrl != null}
              onRemove={handleRemove}
              onFile={onInputChange}
            />
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/50">
          Save the player first, then reopen to add a photo.
        </p>
      )}
    </div>
  );
}

type EditPhotoButtonProps = Readonly<{
  disabled: boolean;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}>;

/** Overlaid "edit photo" affordance on the card + its hidden library input. */
function EditPhotoButton({ disabled, onFile }: EditPhotoButtonProps) {
  return (
    <label
      data-tour="player-photo"
      className={`absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur transition hover:bg-black/65 focus-within:ring-2 focus-within:ring-sky-400/70 ${
        disabled ? "pointer-events-none opacity-50" : "cursor-pointer"
      }`}
    >
      <ImagePlus className="size-5" />
      <span className="sr-only">Edit photo</span>
      <input
        type="file"
        accept="image/*"
        aria-label="Edit photo"
        className="sr-only"
        disabled={disabled}
        onChange={onFile}
      />
    </label>
  );
}

type PhotoControlsProps = Readonly<{
  disabled: boolean;
  hasPhoto: boolean;
  onRemove: () => void;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}>;

/** Compact control cluster below the card: camera + remove. */
function PhotoControls({
  disabled,
  hasPhoto,
  onRemove,
  onFile,
}: PhotoControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <CameraButton disabled={disabled} onFile={onFile} />
        {hasPhoto ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type CameraButtonProps = Readonly<{
  disabled: boolean;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}>;

/** Camera-capture button (own hidden input with `capture="environment"`). */
function CameraButton({ disabled, onFile }: CameraButtonProps) {
  return (
    <label
      className={`inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-white/30 focus-within:ring-2 focus-within:ring-sky-400/70 ${
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer"
      }`}
    >
      <Camera className="size-4" />
      Camera
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={onFile}
      />
    </label>
  );
}
