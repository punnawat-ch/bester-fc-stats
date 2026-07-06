import type { Metadata } from "next";

import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/admin/PageHeader";

import { HelpHubClient } from "./help-hub-client";

export const metadata: Metadata = {
  title: "Help",
  robots: { index: false, follow: false },
};

/**
 * Help hub (ชั้น 3, spec §6) — คู่มือรวมทุกฟีเจอร์: ค้นหา, accordion เต็ม,
 * ปุ่มดูทัวร์ต่อฟีเจอร์, master toggle และปุ่มเล่นทัวร์แนะนำใหม่.
 * ทุก role (dashboard:view) เข้าได้.
 */
export default async function AdminHelpPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="คู่มือ"
        title="คู่มือการใช้งาน"
        description="เรียนรู้แต่ละเมนู ค้นหาวิธีใช้ และเล่นทัวร์แนะนำได้ที่นี่"
      />
      <HelpHubClient />
    </div>
  );
}
