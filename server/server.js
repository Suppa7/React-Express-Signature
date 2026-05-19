import express from "express";
import multer from "multer";
import cors from "cors";
import pkg, { Result } from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

// สำหรับ __dirname ใน ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use("/uploads", express.static("uploads")); // serve static files

import dotenv from 'dotenv';
dotenv.config();
// PostgreSQL config
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

//ป้องกัน cannot get ในหน้าหลัก 
app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

//ทดสอบการเชื่อม postgres 
app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()"); 
    res.send(`✅ Database connected. Server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error("❌ Database connection error:", err);
    res.status(500).send("❌ Cannot connect to the database.");
  }
});

app.get('/signatures', async (req, res) => {
  try {
    // กรองเฉพาะรายการที่ created_at ตรงกับเดือนนี้
    const result = await pool.query(`
      SELECT id, image FROM signature_co
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY created_at DESC
    `);


    const baseUrl = req.protocol + "://" + req.get("host");
    const response = result.rows.map(row => ({
      id: row.id,
      image: `${baseUrl}/uploads/${path.basename(row.image)}`
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });


// Upload endpoint
app.post("/upload", upload.single("signature"), async (req, res) => {
  try {
    const filename = req.file.filename;
    
    // สร้าง URL ที่อิงจาก server จริง (ไม่ใช่ localhost)
    const baseUrl = req.protocol + '://' + req.get('host');
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    await pool.query("INSERT INTO signature_co (image) VALUES ($1)", [fileUrl]);

    res.json({ url: fileUrl });
    console.log("Uploaded file:", req.file);
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed. Please try again later." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


