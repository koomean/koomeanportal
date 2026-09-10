# Koo Mean Portal 🚀

ศูนย์รวมแอปพลิเคชันและเครื่องมือสำหรับองค์กร (Application Hub) ที่ออกแบบมาเพื่อจัดการสิทธิ์การเข้าถึงแอปต่างๆ ในที่เดียว รองรับระบบยืนยันตัวตนผ่าน Google Account พร้อมระบบจัดการหลังบ้านแบบ Real-time

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Theme](https://img.shields.io/badge/theme-Dark%20%7C%20Light-purple)
![Lang](https://img.shields.io/badge/lang-TH%20%7C%20EN-orange)

## ✨ ฟีเจอร์หลัก

### 👤 สำหรับผู้ใช้งานทั่วไป
- **Single Sign-On (SSO):** เข้าสู่ระบบด้วย Google Account อย่างปลอดภัย
- **Smart Search & Filter:** ค้นหาและกรองแอปพลิเคชันได้ทันทีแบบ Real-time
- **Personalization:** ปรับแต่งธีม (Dark/Light/Auto) และภาษา (ไทย/อังกฤษ) ได้ตามต้องการ
- **Keyboard Shortcuts:** เพิ่มประสิทธิภาพการทำงานด้วยปุ่มลัด (`/`, `R`, `,`, `?`, `Esc`)
- **Responsive Design:** ใช้งานได้สมบูรณ์ทั้งบน Desktop, Tablet และ Mobile
- **Auto-Retry:** ระบบจะพยายามโหลดข้อมูลใหม่อัตโนมัติเมื่อเครือข่ายมีปัญหา

### 🛠️ สำหรับผู้ดูแลระบบ (Admin)
- **App Management:** เพิ่ม แก้ไข ลบ และจัดลำดับแอปพลิเคชันได้ทันที
- **User Management:** จัดการ Role และสิทธิ์การเข้าถึงของผู้ใช้แต่ละคน
- **Icon Picker:** เลือกไอคอนจากคลัง theSVG หรือกด Slug เองได้ง่ายๆ
- **Real-time Sync:** การเปลี่ยนแปลงจะสะท้อนสู่หน้า Portal ทันทีโดยไม่ต้อง Deploy ใหม่

### 🔒 ความปลอดภัย
- **Token-Based Auth:** ใช้ Google ID Token ตรวจสอบสิทธิ์ ไม่มีการเก็บรหัสผ่าน
- **XSS Protection:** Sanitize ข้อมูลทุกจุดก่อนแสดงผล (Escape HTML, Safe URL)
- **CSP Friendly:** ไม่มี Inline Event Handler (`onclick`, `onerror`) ใช้ Event Delegation แทน
- **Secure Headers:** กำหนด Referrer Policy และ Content-Type Options
- **Session Management:** ตรวจสอบ Token Expiry อัตโนมัติ และ Logout เมื่อหมดอายุ

## ⌨️ Keyboard Shortcuts

| ปุ่ม | การทำงาน |
| :--- | :--- |
| `/` | โฟกัสช่องค้นหา |
| `R` | รีเฟรชข้อมูลแอปพลิเคชัน |
| `,` | เปิดหน้าต่างการตั้งค่า |
| `?` | เปิดหน้าต่างช่วยเหลือ |
| `Esc` | ปิด Modal / ยกเลิกการค้นหา |

> 💡 **Note:** ปุ่มลัดจะทำงานเฉพาะเมื่อไม่ได้กำลังพิมพ์ข้อความอยู่ในช่อง Input เท่านั้น

## 🏗️ โครงสร้างโปรเจกต์

เนื่องจากเป็น Single File Application เพื่อความง่ายในการ Deploy โครงสร้างจึงรวมอยู่ในไฟล์เดียว:

```text
index.html
├── <style>        # CSS Variables, Themes, Components, Animations
├── <body>         # Semantic HTML Structure + Modals
└── <script>       # IIFE Wrapped Logic
    ├── i18n       # Dictionary (TH/EN)
    ├── State      # Global State Management
    ├── API        # Fetch Wrapper + Error Handling
    ├── Auth       # Google GSI Integration
    ├── Render     # DOM Manipulation + Sanitization
    └── Events     # Event Delegation + Shortcuts
