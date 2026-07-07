# CellMapper Forensic (PWA)

ระบบถอดรหัส CGI/PLMN/LAC-CI + สร้างแผนที่สัญญาณเพื่อการสืบสวน — ทำงานออฟไลน์ได้ ติดตั้งเป็นแอปได้
`by.MerCy-TKM` · Anachak AI

## ไฟล์ในชุด
```
index.html               หน้าแอปหลัก
sw.js                    service worker (offline cache)
manifest.webmanifest     PWA manifest
icon-192.png / 512 / maskable / apple-touch / favicon
```

## Deploy → GitHub Pages
```powershell
# 1. วางไฟล์ทั้งหมดใน repo (root หรือ /docs)
git add .
git commit -m "CellMapper Forensic PWA"
git push

# 2. Settings → Pages → Branch: main /(root)
# เปิดที่ tkm2dev.github.io/cellmapper/
```
> ทุก path ใช้แบบสัมพัทธ์ (`./`) รองรับ subpath ของ GitHub Pages อยู่แล้ว
> PWA ต้องเสิร์ฟผ่าน **HTTPS** — GitHub Pages ให้อัตโนมัติ

## รันทดสอบในเครื่อง (ต้องผ่าน server, เปิดไฟล์ตรงๆ SW จะไม่ทำงาน)
```powershell
npx serve .        # หรือ python -m http.server 8080
```

## ฟีเจอร์ PWA
- ติดตั้งเป็นแอป (ปุ่ม "ติดตั้งแอป" หรือ Add to Home screen)
- ออฟไลน์: แคช app shell + Leaflet + tile แผนที่ที่เคยเปิด (สูงสุด ~900 tile)
- Auto-save ลง localStorage — ข้อมูลเสา/CDR ไม่หายเวลารีเฟรช
- แจ้งเตือนเมื่อมีเวอร์ชันใหม่
- ตัวบอกสถานะออนไลน์/ออฟไลน์

## อัปเดตเวอร์ชัน
แก้ `VERSION` ใน `sw.js` (เช่น `v1.0.1`) แล้ว push — ผู้ใช้จะเห็นแถบ "อัปเดตเดี๋ยวนี้"

---

## อัปเดต v1.1 — ค้นหาเสา + แปลงพิกัด

### 🔍 ค้นหาเสา (แท็บใหม่)
- ป้อน PLMN + LAC/TAC + CI → คืนพิกัด
- ลำดับ: ฐานข้อมูลในเครื่อง (CSV) → OpenCellID API
- ดึงค่าจาก Decoder ได้ตรงๆ, เพิ่มผลลง map ได้
- แยก **TAC** (4G/5G) กับ **LAC** (2G/3G) อัตโนมัติ

### 🌐 แปลงพิกัด (แท็บเครื่องมือ)
- WGS84 → DMS / UTM / MGRS + ลิงก์ Google Maps

### นำเข้าฐานข้อมูลเสา (CSV)
คอลัมน์ที่รองรับ: `mcc,mnc,lac/tac,cellid,lat,lon[,name,az,tech]`
เก็บใน localStorage — ค้นหาออฟไลน์ได้ 100%

### OpenCellID
1. สมัคร API key ที่ opencellid.org (ฟรี, ต้อง contribute data)
2. ใส่ key ที่ ⚙ ในแท็บค้นหาเสา
3. **ถ้าโดน CORS block** → deploy `opencellid-proxy.js` บน VPS แล้วตั้ง Proxy URL

> attribution: ผลจาก OpenCellID ต้องเครดิต "OpenCelliD" ลิงก์ https://opencellid.org/ (CC BY-SA 4.0)
