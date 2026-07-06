"use client";

import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { setTutorialEnabled } from "@/app/admin/(dashboard)/help/action";

type TutorialToggleProps = Readonly<{
  initialEnabled: boolean;
}>;

/** Master toggle เปิด/ปิด auto-tutorial (spec §6) — sync กับ setTutorialEnabled */
export function TutorialToggle({ initialEnabled }: TutorialToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const result = await setTutorialEnabled(next);
      if (!result.ok) {
        setEnabled(!next);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-white">
          เปิด/ปิด tutorial อัตโนมัติ
        </span>
        <span className="text-xs text-white/50">
          เมื่อเปิด ระบบจะเล่นทัวร์แนะนำให้อัตโนมัติเมื่อเข้าหน้าใหม่ครั้งแรก
        </span>
      </div>
      <Switch
        checked={enabled}
        disabled={pending}
        onCheckedChange={handleChange}
        aria-label="เปิด/ปิด tutorial อัตโนมัติ"
      />
    </div>
  );
}
