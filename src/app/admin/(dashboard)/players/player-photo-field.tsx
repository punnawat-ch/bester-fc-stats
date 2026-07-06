"use client";

import { useState } from "react";

import {
  ImageUpload,
  type UploadResult,
} from "@/components/admin/ImageUpload";
import { deletePlayerPhoto, savePlayerPhoto } from "./action";

type PlayerPhotoFieldProps = Readonly<{
  playerId: string;
  initialUrl: string | null;
  /** Bubbles the newly persisted URL (or null after delete) to the editor so
   * the live card preview updates and the change is reflected in editor state. */
  onUrlChange?: (url: string | null) => void;
}>;

/**
 * Player photo uploader (edit only — the id must exist before we can store at
 * `players/{id}/…`). The processed cut-out PNG is POSTed through the guarded
 * `savePlayerPhoto` Server Action, so the client never holds a storage key.
 */
export function PlayerPhotoField({
  playerId,
  initialUrl,
  onUrlChange,
}: PlayerPhotoFieldProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl);

  async function handleUpload(blob: Blob): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", blob, "player.png");
    return savePlayerPhoto(playerId, formData);
  }

  function handleDelete(): Promise<UploadResult> {
    return deletePlayerPhoto(playerId);
  }

  function handleUploaded(url: string | null) {
    setCurrentUrl(url);
    onUrlChange?.(url);
  }

  return (
    <ImageUpload
      label="Player photo"
      description="Cut-out PNG shown on the squad card. Auto removes the background."
      currentUrl={currentUrl}
      enableCutout
      previewVariant="card"
      onUpload={handleUpload}
      onDelete={handleDelete}
      onUploaded={handleUploaded}
    />
  );
}
