"use client";

import type { FeatureKey } from "@/content/help";

import { useFeatureTour } from "./useFeatureTour";

type FeatureTourProps = Readonly<{
  featureKey: FeatureKey;
}>;

/**
 * ตัวห่อ client เล็ก ๆ ให้ server component เรียก auto-tour ได้:
 * วางไว้ในหน้า แล้ว render null (ทัวร์ทำงานผ่าน useFeatureTour)
 */
export function FeatureTour({ featureKey }: FeatureTourProps) {
  useFeatureTour(featureKey);
  return null;
}
