import type { Metadata } from "next";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { PageHeader } from "@/components/admin/PageHeader";
import { FeatureTour } from "@/components/admin/help/FeatureTour";

import { ClubForm } from "./club-form";
import { DEFAULT_THEME_COLOR, type ClubFormValues } from "./schema";

export const metadata: Metadata = {
  title: "Club",
  robots: { index: false, follow: false },
};

/**
 * Club / Branding / SEO settings (admin-ux-spec §4.6). Gated by `club:edit`
 * (ADMIN + EDITOR); VIEWER lacks the permission so `requireUser` throws and the
 * shell keeps them out. Loads the single club and hydrates the edit form.
 */
export default async function AdminClubPage() {
  await requireUser("club:edit");
  const club = await getClub();

  const initialValues: ClubFormValues = {
    name: club.name,
    shortName: club.shortName,
    crestUrl: club.crestUrl ?? "",
    facebookUrl: club.facebookUrl ?? "",
    instagramUrl: club.instagramUrl ?? "",
    siteUrl: club.siteUrl ?? "",
    seoTitle: club.seoTitle ?? "",
    seoDescription: club.seoDescription ?? "",
    seoKeywords: club.seoKeywords,
    ogImageUrl: club.ogImageUrl ?? "",
    themeColor: club.themeColor ?? DEFAULT_THEME_COLOR,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Club"
        description="Branding, social links, and SEO metadata for the public site."
        helpKey="club"
      />
      <ClubForm initialValues={initialValues} />
      <FeatureTour featureKey="club" />
    </div>
  );
}
