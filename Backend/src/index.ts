import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

// 1. READ: Ambil semua data siswa (mendukung pencarian ?search=...)
app.get('/api/siswa', async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    if (search) {
      const result = await pool.query(
        `SELECT id, kode_siswa, nama_siswa, jurusan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') AS tanggal_lahir, alamat 
         FROM sekolah.siswa 
         WHERE kode_siswa ILIKE $1 OR nama_siswa ILIKE $1 OR jurusan ILIKE $1 
         ORDER BY id ASC`,
        [`%${search}%`]
      );
      res.json(result.rows);
    } else {
      const result = await pool.query(
        `SELECT id, kode_siswa, nama_siswa, jurusan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') AS tanggal_lahir, alamat 
         FROM sekolah.siswa 
         ORDER BY id ASC`
      );
      res.json(result.rows);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. READ BY ID: Ambil 1 data siswa
app.get('/api/siswa/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, kode_siswa, nama_siswa, jurusan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') AS tanggal_lahir, alamat 
       FROM sekolah.siswa WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Data siswa tidak ditemukan' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE: Tambah data siswa baru
app.post('/api/siswa', async (req: Request, res: Response) => {
  const { kode_siswa, nama_siswa, jurusan, tanggal_lahir, alamat } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO sekolah.siswa (kode_siswa, nama_siswa, jurusan, tanggal_lahir, alamat) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, kode_siswa, nama_siswa, jurusan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') AS tanggal_lahir, alamat`,
      [kode_siswa, nama_siswa, jurusan, tanggal_lahir, alamat]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE: Edit data siswa
app.put('/api/siswa/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { kode_siswa, nama_siswa, jurusan, tanggal_lahir, alamat } = req.body;
  try {
    const result = await pool.query(
      `UPDATE sekolah.siswa 
       SET kode_siswa = $1, nama_siswa = $2, jurusan = $3, tanggal_lahir = $4, alamat = $5 
       WHERE id = $6 
       RETURNING id, kode_siswa, nama_siswa, jurusan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') AS tanggal_lahir, alamat`,
      [kode_siswa, nama_siswa, jurusan, tanggal_lahir, alamat, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Data siswa tidak ditemukan' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE: Hapus data siswa
app.delete('/api/siswa/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sekolah.siswa WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Data siswa tidak ditemukan' });
      return;
    }
    res.json({ message: 'Data siswa berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Data Siswa berjalan di http://localhost:${PORT}`);
});
