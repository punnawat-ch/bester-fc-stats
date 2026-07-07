import type { HelpEntry } from "./index";

/**
 * คู่มือ/ทัวร์ของ sheet เพิ่ม/แก้นัด (event-form, Addendum 2 §B) — auto เฉพาะตอน
 * เปิดฟอร์มเพิ่มนัดใหม่ (create) ส่วนปุ่ม `?` เรียกซ้ำได้ทั้งสร้างและแก้ไข
 */
export const matchEditorHelp: HelpEntry = {
  key: "match-editor",
  title: "เพิ่ม/แก้นัด",
  summary: (
    <p>
      กรอกคู่แข่ง วัน–เวลา และสนาม เพื่อสร้างนัดใหม่ ตั้งนัดซ้ำรายสัปดาห์ได้ในฟอร์ม
      เดียวกัน แล้วบันทึก
    </p>
  ),
  sections: [
    {
      heading: "คู่แข่งและวัน–เวลา",
      body: (
        <p>
          กรอกชื่อคู่แข่ง เลือกวันที่ และช่วงเวลาเตะ ถ้ายังไม่รู้เวลาให้เปิด
          <b> All-day / TBD</b> เพื่อเว้นเวลาไว้ก่อน
        </p>
      ),
    },
    {
      heading: "สนามและสัปดาห์",
      body: (
        <p>
          ระบุสนาม/ฟิลด์ที่เตะ ระบบเดา “สัปดาห์ที่” ให้จากวันที่โดยอัตโนมัติ
          แก้เองได้
        </p>
      ),
    },
    {
      heading: "ตั้งนัดซ้ำรายสัปดาห์",
      body: (
        <p>
          เปิด <b>“เตะซ้ำทุกสัปดาห์”</b> แล้วเลือกวันสิ้นสุด ระบบจะสร้างนัดให้เอง
          ทุก 7 วันจนถึงวันนั้น (เฉพาะตอนสร้างนัดใหม่)
        </p>
      ),
    },
  ],
  tour: [
    {
      selector: '[data-tour="match-opponent"]',
      title: "คู่แข่ง",
      description: "กรอกชื่อทีมที่จะเจอในนัดนี้",
    },
    {
      selector: '[data-tour="match-datetime"]',
      title: "วันและเวลา",
      description: "เลือกวันที่และช่วงเวลาเตะ หรือเปิด All-day/TBD ถ้ายังไม่รู้เวลา",
    },
    {
      selector: '[data-tour="match-venue"]',
      title: "สนาม",
      description: "ระบุสนามและฟิลด์ที่ใช้แข่ง",
    },
    {
      selector: '[data-tour="match-recurrence"]',
      title: "นัดซ้ำ",
      description: "เปิดเพื่อตั้งเตะซ้ำทุกสัปดาห์ แล้วเลือกวันสิ้นสุด",
    },
    {
      selector: '[data-tour="match-save"]',
      title: "บันทึก",
      description: "กดบันทึกเมื่อกรอกครบ",
    },
  ],
};
