import type { HelpEntry } from "./index";

export const welcomeHelp: HelpEntry = {
  key: "welcome",
  title: "ยินดีต้อนรับสู่ Bester FC Admin",
  summary: <p>ทัวร์สั้น ๆ แนะนำเมนูหลักและวิธีเริ่มต้นใช้งาน</p>,
  sections: [
    {
      heading: "ภาพรวม",
      body: (
        <p>
          ระบบหลังบ้านสำหรับจัดการทีม — ผู้เล่น ตารางแข่ง ข้อมูลสโมสร และผู้ใช้
        </p>
      ),
    },
  ],
  tour: [
    {
      selector: '[data-tour="nav-dashboard"]',
      title: "หน้าหลัก",
      description: "ดูภาพรวมทีม สถิติ และนัดที่กำลังจะถึง",
    },
    {
      selector: '[data-tour="nav-matches"]',
      title: "ตารางแข่ง",
      description: "เพิ่มนัด บันทึกผล จัดตารางแบบปฏิทิน",
    },
    {
      selector: '[data-tour="nav-players"]',
      title: "ผู้เล่น",
      description: "เพิ่ม/แก้ไขผู้เล่น อัปโหลดรูป และแก้สถิติ",
    },
    {
      selector: '[data-tour="nav-more"]',
      title: "เพิ่มเติม",
      description: "ตั้งค่าสโมสร จัดการผู้ใช้ และเปิดคู่มือได้ที่นี่",
    },
    {
      selector: '[data-tour="topbar-signout"]',
      title: "ออกจากระบบ",
      description: "กดที่นี่เมื่อใช้งานเสร็จ",
    },
  ],
};
