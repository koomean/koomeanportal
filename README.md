# Koo Mean Portal 🚀

ศูนย์รวมแอปพลิเคชันและเครื่องมือสำหรับองค์กร (Application Hub) ที่ออกแบบมาเพื่อจัดการสิทธิ์การเข้าถึงแอปต่างๆ ในที่เดียว รองรับระบบยืนยันตัวตนผ่าน Google Account พร้อมระบบจัดการหลังบ้านแบบ Real-time และแถบแสดงช่องทางการติดต่อ (Marquee Scroller) สุดล้ำสมัย

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Theme](https://img.shields.io/badge/theme-Dark%20%7C%20Light-purple)
![Lang](https://img.shields.io/badge/lang-TH%20%7C%20EN-orange)

---

## ✨ ฟีเจอร์หลัก

### 👤 สำหรับผู้ใช้งานทั่วไป
- **Modern Hero Section:** ดีไซน์หน้าตาทันสมัย พร้อมพื้นหลังวิดีโอเคลื่อนไหว (Video Background) และข้อความต้อนรับส่วนบุคคล (Welcome Greeting) ที่ดึงชื่อจริงของผู้ใช้มาแสดงอัตโนมัติเมื่อเข้าสู่ระบบ
- **Seamless Marquee Logo Scroller:** แถบเลื่อนโลโก้และช่องทางการติดต่อแบบไร้รอยต่อ ดึงข้อมูลลิงก์แบบ Public จาก Google Sheets มาแสดงผล พร้อมรองรับ FontAwesome Icons และกดคลิกเพื่อติดต่อไปยังอีเมลหรือลิงก์ภายนอกได้ทันที
- **Single Sign-On (SSO):** เข้าสู่ระบบด้วย Google Account อย่างปลอดภัย
- **Smart Search & Filter:** ค้นหาและกรองแอปพลิเคชันได้ทันทีแบบ Real-time
- **Personalization:** ปรับแต่งธีม (Dark/Light/Auto) และภาษา (ไทย/อังกฤษ) ได้ตามต้องการ
- **Keyboard Shortcuts:** เพิ่มประสิทธิภาพการทำงานด้วยปุ่มลัด (`/`, `R`, `⌘K`, `Esc`)
- **Responsive Design:** ใช้งานได้สมบูรณ์ทั้งบน Desktop, Tablet และ Mobile
- **Auto-Retry & Loader:** ระบบจัดการการโหลดหน้าเว็บสุดสมูทด้วย Loading Animation และพยายามเชื่อมต่อใหม่อัตโนมัติ

### 🛠️ สำหรับผู้ดูแลระบบ (Admin)
- **App Management:** เพิ่ม แก้ไข ลบ และจัดลำดับแอปพลิเคชันได้ทันที
- **User Management:** จัดการ Role และสิทธิ์การเข้าถึงของผู้ใช้แต่ละคน
- **Icon Picker:** เลือกไอคอนจากคลัง theSVG หรือรองรับการใส่ไอคอน FontAwesome (`fa-facebook` ฯลฯ) ได้อย่างอิสระ
- **Real-time Sync:** การเปลี่ยนแปลงจะสะท้อนสู่หน้า Portal ทันที

### 🔒 ความปลอดภัย
- **Token-Based Auth:** ใช้ Google ID Token ตรวจสอบสิทธิ์ ไม่มีการเก็บรหัสผ่าน
- **XSS Protection:** Sanitize ข้อมูลทุกจุดก่อนแสดงผล (Escape HTML, Safe URL)
- **CSP Friendly:** ไม่มี Inline Event Handler ใช้ Event Delegation แทน
- **Secure Headers:** กำหนด Referrer Policy และ Content-Type Options อย่างเข้มงวด
- **Session Management:** ตรวจสอบ Token Expiry อัตโนมัติ และ Logout เมื่อหมดอายุ

---

## ⌨️ Keyboard Shortcuts

| ปุ่ม | การทำงาน |
| :--- | :--- |
| `/` | โฟกัสช่องค้นหา |
| `R` | รีเฟรชข้อมูลแอปพลิเคชัน |
| `⌘ + K` / `Ctrl + K` | เปิด Command Palette |
| `Esc` | ปิด Modal / ยกเลิกการค้นหา |

> 💡 **Note:** ปุ่มลัดจะทำงานเฉพาะเมื่อไม่ได้กำลังพิมพ์ข้อความอยู่ในช่อง Input เท่านั้น

---

## 🏗️ โครงสร้างโปรเจกต์

เนื่องจากเป็น Single File Application (SPA) เพื่อความง่ายในการ Deploy ผ่าน GitHub Pages โครงสร้างจึงรวมอยู่ในไฟล์ `index.html` ไฟล์เดียว:

```text
index.html
├── <style>        # CSS Variables, Themes, Modern Hero, Marquee & Animations
├── <body>         # Semantic HTML Structure + Modals + Loading Overlay
└── <script>       # IIFE Wrapped Logic
    ├── i18n       # Dictionary (TH/EN)
    ├── State      # Global State Management
    ├── API        # Fetch Wrapper + Error Handling
    ├── Auth       # Google GSI Integration
    ├── Render     # DOM Manipulation + Sanitization + FontAwesome & Marquee Renderer
    └── Events     # Event Delegation + Keyboard Shortcuts
