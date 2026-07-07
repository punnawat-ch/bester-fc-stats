import type { HelpEntry } from "./index";

/**
 * คู่มือ/ทัวร์ของ sheet แก้ไขการ์ดผู้เล่น (Addendum 1) — auto เฉพาะตอนสร้างใหม่
 * ส่วนปุ่ม `?` ใน SheetHeader เรียกซ้ำได้ทั้งตอนสร้างและแก้ไข
 */
export const playerEditorHelp: HelpEntry = {
  key: "player-editor",
  title: "แก้ไขการ์ดผู้เล่น",
  summary: (
    <p>
      แต่งการ์ดนักเตะ — อัปรูป (ตัดพื้นหลังอัตโนมัติ) กรอกตำแหน่ง เบอร์ และสถิติ
      พร้อมดูตัวอย่างการ์ดสด ๆ
    </p>
  ),
  sections: [
    {
      heading: "การ์ดตัวอย่างสด",
      body: <p>ด้านบนคือการ์ดจริงที่อัปเดตทันทีตามที่กรอก</p>,
    },
    {
      heading: "อัปโหลดรูป",
      body: (
        <p>
          แตะการ์ด/ปุ่มกล้อง เลือก “ตัด bg อัตโนมัติ” หรืออัป PNG โปร่งใสเอง
          แล้วยืนยันก่อนบันทึก
        </p>
      ),
    },
    {
      heading: "ตำแหน่งและสถิติ",
      body: (
        <p>
          เลือกตำแหน่งด้วยปุ่มสี กรอกสถิติด้วยปุ่ม +/− (ประตู แอสซิสต์ คลีนชีต
          ใบเหลือง–แดง MOTM เซฟ)
        </p>
      ),
    },
  ],
  tour: [
    {
      selector: '[data-tour="player-card-preview"]',
      title: "การ์ดตัวอย่าง",
      description: "อัปเดตสดตามที่กรอก",
    },
    {
      selector: '[data-tour="player-photo"]',
      title: "รูปผู้เล่น",
      description: "แตะที่นี่เพื่ออัป/เปลี่ยนรูป ระบบตัดพื้นหลังให้",
    },
    {
      selector: '[data-tour="player-position"]',
      title: "ตำแหน่ง",
      description: "เลือก GK/DF/MF/FW ด้วยปุ่มสี",
    },
    {
      selector: '[data-tour="player-stat-tiles"]',
      title: "สถิติ",
      description: "กรอกด้วยปุ่ม +/− หรือพิมพ์ตรง ๆ",
    },
    {
      selector: '[data-tour="player-save"]',
      title: "บันทึก",
      description: "กดบันทึกเมื่อแก้เสร็จ",
    },
  ],
};
