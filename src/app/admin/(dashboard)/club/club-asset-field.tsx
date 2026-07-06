"use client";

import type { ControllerRenderProps } from "react-hook-form";

import {
  ImageUpload,
  type UploadResult,
} from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/input";

import { saveClubAsset, type ClubAssetKind } from "./action";
import type { ClubFormValues } from "./schema";

type AssetFieldName = "crestUrl" | "ogImageUrl";

type ClubAssetFieldProps = Readonly<{
  kind: ClubAssetKind;
  field: ControllerRenderProps<ClubFormValues, AssetFieldName>;
  label: string;
  uploadDescription: string;
}>;

/**
 * Club image field: upload (resize/compress → preview → save via the guarded
 * `saveClubAsset` Server Action) with a paste-URL text input as a fallback.
 * No background removal — crest/OG keep their own backgrounds.
 */
export function ClubAssetField({
  kind,
  field,
  label,
  uploadDescription,
}: ClubAssetFieldProps) {
  async function handleUpload(blob: Blob): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", blob, `${kind}.png`);
    return saveClubAsset(kind, formData);
  }

  const currentUrl = field.value.trim() === "" ? null : field.value;

  return (
    <div className="flex flex-col gap-3">
      <ImageUpload
        label={label}
        description={uploadDescription}
        currentUrl={currentUrl}
        enableCutout={false}
        previewVariant="image"
        onUpload={handleUpload}
        onUploaded={(url) => field.onChange(url ?? "")}
      />
      <Input
        {...field}
        type="url"
        inputMode="url"
        placeholder="…or paste an image URL"
        aria-label={`${label} URL`}
      />
    </div>
  );
}
