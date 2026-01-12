# KruAi - ติวเตอร์อัจฉริยะ

แอปพลิเคชัน AI สำหรับสรุปบทเรียนและสร้างแบบทดสอบ สำหรับนักเรียนชั้นประถมศึกษาปีที่ 4-6

## การติดตั้ง

**Prerequisites:** Node.js

1. ติดตั้ง dependencies:
   ```bash
   npm install
   ```

2. ตั้งค่า `GEMINI_API_KEY` ในไฟล์ `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. รันแอป:
   ```bash
   npm run dev
   ```

แอปจะทำงานที่ http://localhost:3000

## การติดตั้งด้วย Docker

**Prerequisites:** Docker และ Docker Compose

1. สร้างไฟล์ `.env` จาก `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. แก้ไขไฟล์ `.env` ใส่ Gemini API Key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. รัน Docker Compose:
   ```bash
   docker compose up -d
   ```

แอปจะทำงานที่ http://localhost:3000

### Docker Volumes

- `kruai-uploads` - เก็บไฟล์ที่อัปโหลด (`/app/uploads`)
- `kruai-data` - เก็บ SQLite database (`/app/data`)

### คำสั่ง Docker ที่ใช้บ่อย

```bash
# รัน container
docker compose up -d

# หยุด container
docker compose down

# ดู logs
docker compose logs -f

# build ใหม่
docker compose up -d --build
```

### เปิดใช้งานผ่าน ngrok

1. เพิ่ม `NGROK_AUTHTOKEN` ในไฟล์ `.env`:
   ```
   NGROK_AUTHTOKEN=your_ngrok_authtoken_here
   ```

2. รัน Docker พร้อม ngrok:
   ```bash
   docker compose --profile tunnel up -d
   ```

3. ดู URL จาก ngrok:
   ```bash
   docker compose logs ngrok
   ```
   หรือเปิด http://localhost:4040 เพื่อดู ngrok dashboard
