# Koo Mean Portal

Active source is `src/index.html`; root `index.html` is the generated Pages artifact. Deploy only `koomean/koomeanportal` with CNAME `koomean.com`. Do not copy Blog/Site builds here.

The 11 October visual refresh uses a muted steel accent, neutral controls and quieter hero media in both themes. It keeps the existing page order, app catalog and saved preferences. Product-led hero copy replaces the generic welcome; controls and cards no longer compete with the application logos. See [design direction and online skills](DESIGN-2026-10-11.md); these color/style choices supersede the earlier blue-outline notes.

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run test:browser
node scripts/verify-portal.mjs
```

Browser checks use `PORTAL_CHROME_PATH` when set; otherwise macOS Google Chrome or Playwright Chromium. Optional `PORTAL_REPORT_DIR` stores results/screenshots. They run in fresh profiles with a synthetic API and no production writes.

Push to main triggers the verified GitHub Pages workflow. It packages only index.html, CNAME, assets and licenses. Keep the Pages build source set to GitHub Actions. Asset changes require rebuilding before commit. `src/enhancements.css` defines the final responsive/motion polish; `src/maintenance.js` owns the 60s visible-tab monitor; `src/vendor.css` contains the original self-hosted fonts. Keep font licenses. The small hero poster is extracted from the original site video. Its optimized local H.264 loop (`assets/hero-loop.mp4`, 960×540, 24fps, 156,921 bytes, no audio) starts automatically after the first paint. Keep its pause/play control, reduced-motion opt-out, and hidden/offscreen/maintenance pause behavior. If the browser blocks autoplay, retain the poster and offer manual play. The default palette uses the original charcoal surfaces with blue/sky outlines and control icons; explicit light/system preferences still work. Lucide control icons are pinned local SVGs under `src/icons`, assembled into an inline sprite at build time; retain `licenses/Lucide-LICENSE.txt`. See [charcoal and alignment notes](UI-ALIGNMENT-2026-10-10.md).

Settings automatically persist in this browser: theme, language, layout, social rail autoplay/speed, background video, data saver and the favorites-only filter. The rail starts automatically at 38s per cycle (slow 52s / fast 28s), with independent pause controls. Data saver uses the poster without loading video. Restoring defaults keeps starred favorites and current account state. Existing preferences migrate without losing their supported values. See [persistent preferences notes](PREFERENCES-2026-10-10.md).

Interface translations live in `src/i18n.js` and the existing status/preference dictionaries in `src/index.html`. Bind static text with `data-i18n`, and attributes with `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria-label` or `data-i18n-content`. Use `t(key)` for dynamic copy and escape translations interpolated into HTML. Language changes update the whole interface, connection status, command actions and maintenance overlay without resetting form inputs or making an extra bootstrap request. Keep account names, permission identifiers and editable app data unchanged; only the original Blog catalog description has an explicit display translation. `tests/i18n.test.mjs` checks dictionary coverage and dynamic states.

Google ID tokens are memory-only. Reload needs sign-in again; preferences/favorites remain. Settings are local to each browser/device, and clearing site storage removes them; blocked storage is reported in Settings. Shared API and databases are managed separately and are not deployed by this repository. See [audit and limitations](AUDIT-2026-10-09.md).

Previous documentation follows for backend context; its older standalone/no-build instructions are superseded by the steps above.

---

<div align="center">

# ⊞ Koo Mean Portal

### ทางเข้าแอปและเว็บไซต์ พร้อมรายการตามสิทธิ์บัญชี

![Frontend](https://img.shields.io/badge/Frontend-Single%20HTML-2563eb?style=flat-square)
![API](https://img.shields.io/badge/API-Cloudflare%20Workers-f38020?style=flat-square)
![Database](https://img.shields.io/badge/Database-D1-7c3aed?style=flat-square)
![Authentication](https://img.shields.io/badge/Auth-Google%20Identity-ea4335?style=flat-square)

[ภาพรวม](#overview) · [ฟีเจอร์](#features) · [ผู้ใช้และสิทธิ์](#roles) · [ติดตั้ง](#setup)

</div>

> Portal รวมทางเข้าแอปไว้ที่เดียว ผู้ใช้เห็นเฉพาะรายการที่ backend อนุญาต ส่วนการจัดการรายการทำได้เมื่อบัญชีมี role ผู้ดูแล

<a id="overview"></a>
## 🌟 ภาพรวม

หน้าเว็บ [`https://koomean.com/`](koomeanportal.html) เป็น HTML/CSS/JavaScript แบบ standalone ไม่ต้อง build สามารถ host บน HTTPS static hosting ใดก็ได้ที่รองรับหน้า HTML คำว่า Portal เป็นชื่อผลิตภัณฑ์ ไม่ได้บังคับให้ต้องมี subdomain `portal.koomean.com`

```mermaid
flowchart TD
    B[ผู้ใช้เปิด Portal] --> L{ล็อกอินด้วย Google?}
    L -->|ไม่| P[Worker ส่งรายการ public]
    L -->|ใช่| T[ส่ง ID token ไป Worker ผ่าน POST]
    T --> V[Worker ตรวจ Google token และบัญชีใน D1]
    V --> R[อ่าน role แล้วกรอง application]
    P --> UI[แสดงรายการที่ได้รับ]
    R --> UI
    UI -->|คำสั่ง admin| A[ตรวจ role admin ซ้ำก่อนเขียน D1]
```

Backend config อยู่ที่ [`../CloudFlare/wrangler.portal.jsonc`](../CloudFlare/wrangler.portal.jsonc) โดยกำหนด `koomean-d1-worker.js` เป็น Worker entry point

<a id="features"></a>
## ✨ ฟีเจอร์

| ฟีเจอร์ | การทำงาน |
|---|---|
| **🧭 รวมแอปและลิงก์** | แสดงชื่อ คำอธิบาย ไอคอน สี และสถานะปักหมุดของรายการใน Portal |
| **🔐 Google Sign-In** | ใช้ Google Identity Services ส่ง ID token ไปให้ Worker ตรวจสอบ |
| **📝 ลงทะเบียนผู้ใช้ใหม่** | ส่งคำขอสมัครเข้าระบบ; การให้ role เพิ่มเติมขึ้นกับการจัดการของ admin |
| **🛡️ Role-based listing** | กรอง application ตาม Group/role ก่อนส่งข้อมูลลง browser |
| **👤 หน้าบัญชี** | แสดงข้อมูลผู้ใช้และรองรับการแก้ชื่อที่ backend เปิดให้ |
| **⚙️ Admin application manager** | เพิ่ม แก้ไข ลบ และจัดลำดับรายการแอปใน D1 |
| **👥 Admin user tools** | ดู/จัดการบัญชีและ role ผ่าน backend actions ที่จำกัดสิทธิ์ |
| **🎨 Preferences** | จำค่าการแสดงผลบางอย่างใน browser ของผู้ใช้ |

<a id="roles"></a>
## 👥 ผู้ใช้และสิทธิ์

| สถานะ | สิ่งที่ทำได้ |
|---|---|
| ไม่ได้ล็อกอิน | ดูรายการสาธารณะที่ Worker ส่งให้ |
| ล็อกอินแต่ยังไม่ลงทะเบียน | ส่งคำขอลงทะเบียนและใช้รายการ public ตาม backend |
| ผู้ใช้ที่มี role | ดูรายการ public และรายการที่ Group ตรงกับ role |
| `admin` | จัดการ application และผู้ใช้ตาม action ที่ Worker อนุญาต |

สิทธิ์หลักเก็บใน D1 (`users` และ `application`) และตรวจใน Worker ทุกครั้ง การแก้ HTML หรือส่งค่า role ปลอมจาก browser ไม่ควรทำให้ได้รับสิทธิ์เพิ่ม

## 🗄️ การจัดเก็บข้อมูล

| D1 table | ใช้เก็บ |
|---|---|
| `application` | รายการแอปและลิงก์ที่ Portal แสดง รวม URL, Group, สี และลำดับ |
| `users` | email, ชื่อ, role และข้อมูลผู้ใช้ |
| `profile` | ข้อมูล profile ที่แสดงร่วมในระบบ |

Portal ไม่เก็บบทความหรือไฟล์ในตัวเอง; การจัดเก็บข้อมูลของ Blog และ Site อธิบายไว้ใน README ประจำเว็บเหล่านั้น

<a id="setup"></a>
## 🚀 เริ่มต้นใช้งาน

### ☁️ เตรียม Worker และ D1

ตรวจว่า `../CloudFlare/wrangler.portal.jsonc` มี D1 binding `DB` ชี้ฐานข้อมูลที่ถูกต้อง และ `ALLOWED_ORIGINS` มีโดเมนที่จะ host Portal จากโฟลเดอร์ `CloudFlare` deploy ด้วย:

```bash
npx wrangler deploy --config wrangler.portal.jsonc
```

เตรียม schema และข้อมูล D1 ก่อนใช้งาน คู่มือย้ายข้อมูลอยู่ที่ [`../CloudFlare/MIGRATE-SHEETS-TO-D1.md`](../CloudFlare/MIGRATE-SHEETS-TO-D1.md); ใช้ `portal-d1-migration.sql` เมื่อ migration นั้นตรงกับสถานะฐานข้อมูล

### 🌐 Host หน้าเว็บและ OAuth

1. เผยแพร่ `koomeanportal.html` บน HTTPS static hosting
2. ตรวจ `API_URL` ในไฟล์ให้ตรง Worker URL
3. เพิ่ม origin ของ Portal ใน Google OAuth Client → **Authorized JavaScript origins**
4. เพิ่ม origin เดียวกันใน Worker `ALLOWED_ORIGINS`
5. ตรวจว่ามีบัญชี admin ที่ใช้งานได้ใน D1 ก่อนทดลองเมนูจัดการ

ระบุเฉพาะ origin เช่น `https://example.com` ไม่ใส่ path `/koomeanportal.html`

## 🧑‍💻 แนวทางพัฒนา

- UI และ client logic อยู่ใน `koomeanportal.html`
- API, การกรอง application และการตรวจ admin อยู่ใน [`../CloudFlare/koomean-d1-worker.js`](../CloudFlare/koomean-d1-worker.js)
- เปลี่ยนโดเมนต้องปรับทั้ง API URL, Google OAuth origins และ Worker CORS
- ทดสอบอย่างน้อยสี่กรณี: anonymous, ผู้ใช้ใหม่, ผู้ใช้ทั่วไป และ admin
- อย่า commit client secret, access token ถาวร หรือ service-account key; public OAuth Client ID ไม่ใช่ secret

## ℹ️ ขอบเขต

README นี้บรรยาย source/config ใน repository ไม่ได้ยืนยันว่า static host หรือ Cloudflare production ใช้ revision ล่าสุดแล้ว
