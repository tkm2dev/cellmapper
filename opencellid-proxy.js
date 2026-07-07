/* opencellid-proxy.js — proxy เล็กๆ แก้ปัญหา CORS ของ OpenCellID
   วางบน VPS (Node 20+ / Express) แล้วชี้ Proxy URL ในแอปมาที่ endpoint นี้
   by.MerCy-TKM

   ติดตั้ง:  npm i express
   รัน:      pm2 start opencellid-proxy.js --name oc-proxy   (เลือก port ที่ไม่ชนกับ project อื่น)
   ในแอป:   ตั้ง Proxy URL = https://your-domain/api/opencellid?
            (คีย์จะถูกส่งไปกับ query อยู่แล้ว หรือจะ hardcode ฝั่ง server ก็ได้)
*/
const express = require('express');
const app = express();
const PORT = process.env.OC_PROXY_PORT || 5231; // <- เลือก port ไม่ชนกับ PM2 อื่น

// เปิด CORS ให้เฉพาะโดเมนแอปของคุณ (ปรับตามจริง)
const ALLOW = process.env.OC_ALLOW || '*';
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', ALLOW);
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/opencellid', async (req, res) => {
  try {
    const p = new URLSearchParams(req.query);
    // ถ้าต้องการ hardcode key ฝั่ง server: p.set('key', process.env.OC_KEY);
    if (!p.get('format')) p.set('format', 'json');
    const url = 'https://opencellid.org/cell/get?' + p.toString();
    const r = await fetch(url);
    const body = await r.text();
    res.type('application/json').status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'proxy_failed', message: String(e) });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log('OpenCellID proxy on :' + PORT));
