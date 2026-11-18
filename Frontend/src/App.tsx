import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

interface Siswa {
  id: number;
  kode_siswa: string;
  nama_siswa: string;
  jurusan: string;
  tanggal_lahir: string;
  alamat: string;
}

type MenuTab = 'dashboard' | 'siswa' | 'pengaturan';

const API_URL = 'http://localhost:5000/api/siswa';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getBadgeClass(jurusan: string) {
  if (jurusan.includes('Perangkat Lunak')) return 'badge badge-blue';
  if (jurusan.includes('Komputer')) return 'badge badge-emerald';
  if (jurusan.includes('Multimedia')) return 'badge badge-purple';
  if (jurusan.includes('Akuntansi')) return 'badge badge-amber';
  return 'badge badge-rose';
}

function App() {
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');

  // Modal Form Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [kodeSiswa, setKodeSiswa] = useState('');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [alamat, setAlamat] = useState('');

  // Modal Detail & Konfirmasi Hapus
  const [detailSiswa, setDetailSiswa] = useState<Siswa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Pengaturan
  const [namaSekolah, setNamaSekolah] = useState('SMK Negeri 1 Nusantara');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [darkMode, setDarkMode] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSiswa = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setSiswaList(res.data);
      setApiOnline(true);
    } catch (error) {
      console.error('Gagal mengambil data siswa:', error);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  const statistikJurusan = useMemo(() => {
    const counts: Record<string, number> = {};
    siswaList.forEach((s) => {
      counts[s.jurusan] = (counts[s.jurusan] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [siswaList]);

  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      const cocokKeyword =
        s.kode_siswa.toLowerCase().includes(search.toLowerCase()) ||
        s.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
        s.alamat.toLowerCase().includes(search.toLowerCase());
      const cocokJurusan = filterJurusan ? s.jurusan === filterJurusan : true;
      return cocokKeyword && cocokJurusan;
    });
  }, [siswaList, search, filterJurusan]);

  // CREATE: Buka Modal Tambah
  const openAddModal = () => {
    setEditId(null);
    const nextNum = siswaList.length + 1;
    setKodeSiswa(`SIS-${String(nextNum).padStart(3, '0')}`);
    setNamaSiswa('');
    setJurusan('Rekayasa Perangkat Lunak');
    setTanggalLahir('');
    setAlamat('');
    setIsModalOpen(true);
  };

  // UPDATE: Buka Modal Edit
  const openEditModal = (siswa: Siswa) => {
    setEditId(siswa.id);
    setKodeSiswa(siswa.kode_siswa);
    setNamaSiswa(siswa.nama_siswa);
    setJurusan(siswa.jurusan);
    setTanggalLahir(siswa.tanggal_lahir);
    setAlamat(siswa.alamat);
    setIsModalOpen(true);
  };

  // Simpan Create / Update
  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      kode_siswa: kodeSiswa.trim(),
      nama_siswa: namaSiswa.trim(),
      jurusan,
      tanggal_lahir: tanggalLahir,
      alamat: alamat.trim(),
    };

    try {
      if (editId !== null) {
        await axios.put(`${API_URL}/${editId}`, payload);
        showToast(`Data ${payload.nama_siswa} berhasil diperbarui!`);
      } else {
        await axios.post(API_URL, payload);
        showToast(`Siswa baru ${payload.nama_siswa} berhasil ditambahkan!`);
      }
      setIsModalOpen(false);
      fetchSiswa();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Gagal menyimpan data siswa!', 'error');
    } finally {
      setSaving(false);
    }
  };

  // DELETE: Konfirmasi Hapus
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await axios.delete(`${API_URL}/${deleteTarget.id}`);
      showToast(`Data ${deleteTarget.nama_siswa} berhasil dihapus!`);
      setDeleteTarget(null);
      fetchSiswa();
    } catch (error) {
      showToast('Gagal menghapus data siswa!', 'error');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className={`layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-info">
            <h2>SISFO Akademik</h2>
            <span>TA {tahunAjaran}</span>
          </div>
        </div>

        <div className="nav-label">Menu Utama</div>
        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'siswa' ? 'active' : ''}`}
            onClick={() => setActiveTab('siswa')}
          >
            <span>🎓</span> Data Siswa
          </button>
          <button
            className={`nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`}
            onClick={() => setActiveTab('pengaturan')}
          >
            <span>⚙️</span> Pengaturan
          </button>
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" style={{ backgroundColor: apiOnline ? '#22c55e' : '#ef4444' }} />
          {apiOnline ? 'PostgreSQL Connected' : 'API Disconnected'}
        </div>

        <div className="sidebar-footer">{namaSekolah}</div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <div className="topbar">
              <div>
                <h1>Dashboard</h1>
                <p>Ringkasan informasi akademik & populasi siswa {namaSekolah}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab('siswa')}>
                Kelola Data Siswa →
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <span className="stat-label">Total Siswa Terdaftar</span>
                  <div className="stat-value">{siswaList.length}</div>
                  <span className="stat-sub">Aktif TA {tahunAjaran}</span>
                </div>
                <div className="stat-icon">🎓</div>
              </div>

              <div className="stat-card">
                <div>
                  <span className="stat-label">Program Keahlian</span>
                  <div className="stat-value">{statistikJurusan.length}</div>
                  <span className="stat-sub">Jurusan Aktif</span>
                </div>
                <div className="stat-icon">🏫</div>
              </div>

              <div className="stat-card">
                <div>
                  <span className="stat-label">Jurusan Terbanyak</span>
                  <div className="stat-value" style={{ fontSize: '1.2rem', margin: '0.55rem 0' }}>
                    {statistikJurusan[0]?.nama || '-'}
                  </div>
                  <span className="stat-sub">{statistikJurusan[0]?.jumlah || 0} Siswa Terdaftar</span>
                </div>
                <div className="stat-icon">📈</div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <div className="card-header">
                  <h3>Sebaran Siswa per Jurusan</h3>
                </div>
                {statistikJurusan.map((item) => {
                  const persen = siswaList.length ? Math.round((item.jumlah / siswaList.length) * 100) : 0;
                  return (
                    <div key={item.nama} className="jurusan-item">
                      <div className="jurusan-info">
                        <span>{item.nama}</span>
                        <span>{item.jumlah} siswa ({persen}%)</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${persen}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Siswa Terbaru</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('siswa')}>
                    Lihat Semua
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Nama Siswa</th>
                        <th>Jurusan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswaList.slice(-5).reverse().map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.kode_siswa}</strong></td>
                          <td>
                            <div className="student-cell">
                              <div className="avatar-circle">{getInitials(s.nama_siswa)}</div>
                              <span>{s.nama_siswa}</span>
                            </div>
                          </td>
                          <td><span className={getBadgeClass(s.jurusan)}>{s.jurusan}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: DATA SISWA */}
        {activeTab === 'siswa' && (
          <>
            <div className="topbar">
              <div>
                <h1>Data Siswa</h1>
                <p>Menampilkan {filteredSiswa.length} dari {siswaList.length} total siswa</p>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button className="btn btn-primary" onClick={openAddModal}>
                  + Tambah Siswa
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="toolbar-controls">
                  <input
                    type="text"
                    className="input-control"
                    style={{ width: '270px' }}
                    placeholder="Cari kode, nama, atau alamat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    className="input-control"
                    value={filterJurusan}
                    onChange={(e) => setFilterJurusan(e.target.value)}
                  >
                    <option value="">Semua Jurusan</option>
                    {statistikJurusan.map((j) => (
                      <option key={j.nama} value={j.nama}>{j.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode</th>
                      <th>Nama Siswa</th>
                      <th>Jurusan</th>
                      <th>Tanggal Lahir</th>
                      <th>Alamat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          Memuat data siswa...
                        </td>
                      </tr>
                    ) : filteredSiswa.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          Tidak ada data siswa yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredSiswa.map((s, index) => (
                        <tr key={s.id}>
                          <td>{index + 1}</td>
                          <td><strong>{s.kode_siswa}</strong></td>
                          <td>
                            <div className="student-cell">
                              <div className="avatar-circle">{getInitials(s.nama_siswa)}</div>
                              <span>{s.nama_siswa}</span>
                            </div>
                          </td>
                          <td><span className={getBadgeClass(s.jurusan)}>{s.jurusan}</span></td>
                          <td>{s.tanggal_lahir}</td>
                          <td>{s.alamat}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button className="btn btn-sm btn-view" onClick={() => setDetailSiswa(s)}>
                              Detail
                            </button>
                            <button className="btn btn-sm btn-edit" onClick={() => openEditModal(s)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-delete" onClick={() => setDeleteTarget(s)}>
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: PENGATURAN */}
        {activeTab === 'pengaturan' && (
          <>
            <div className="topbar">
              <div>
                <h1>Pengaturan</h1>
                <p>Konfigurasi identitas sekolah, tema antarmuka, dan koneksi server</p>
              </div>
            </div>

            <div className="settings-grid">
              <div className="card">
                <div className="card-header">
                  <h3>Identitas Sekolah</h3>
                </div>
                <div className="form-stack">
                  <div className="form-field">
                    <label>Nama Instansi / Sekolah</label>
                    <input
                      type="text"
                      className="input-control"
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Tahun Ajaran Aktif</label>
                    <input
                      type="text"
                      className="input-control"
                      value={tahunAjaran}
                      onChange={(e) => setTahunAjaran(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Tampilan & Status Database</h3>
                </div>
                <div className="form-stack">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem' }}>Tema Antarmuka</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Pilih mode terang atau gelap
                      </span>
                    </div>
                    <button className="btn btn-outline" onClick={() => setDarkMode(!darkMode)}>
                      {darkMode ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem' }}>Backend & PostgreSQL</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span
                          className="status-dot"
                          style={{ backgroundColor: apiOnline ? '#22c55e' : '#ef4444' }}
                        />
                        {apiOnline ? 'Terhubung (schema: sekolah)' : 'Terputus — Jalankan Backend'}
                      </span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        fetchSiswa();
                        showToast('Mengecek ulang koneksi server...');
                      }}
                    >
                      Refresh Koneksi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL TAMBAH / EDIT SISWA */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? 'Edit Data Siswa' : 'Tambah Data Siswa Baru'}</h3>
            <form onSubmit={handleSaveSiswa} className="form-stack">
              <div className="form-field">
                <label>Kode Siswa</label>
                <input
                  type="text"
                  className="input-control"
                  value={kodeSiswa}
                  onChange={(e) => setKodeSiswa(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Nama Lengkap Siswa</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Masukkan nama lengkap"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Jurusan</label>
                <select
                  className="input-control"
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  required
                >
                  <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                  <option value="Teknik Komputer dan Jaringan">Teknik Komputer dan Jaringan</option>
                  <option value="Multimedia">Multimedia</option>
                  <option value="Akuntansi">Akuntansi</option>
                  <option value="Administrasi Perkantoran">Administrasi Perkantoran</option>
                  <option value="Teknik Elektronika Industri">Teknik Elektronika Industri</option>
                </select>
              </div>

              <div className="form-field">
                <label>Tanggal Lahir</label>
                <input
                  type="date"
                  className="input-control"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Alamat Lengkap</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Masukkan alamat lengkap"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SISWA */}
      {detailSiswa && (
        <div className="modal-backdrop" onClick={() => setDetailSiswa(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                {getInitials(detailSiswa.nama_siswa)}
              </div>
              <div>
                <h3 style={{ marginBottom: '0.15rem' }}>{detailSiswa.nama_siswa}</h3>
                <span className={getBadgeClass(detailSiswa.jurusan)}>{detailSiswa.jurusan}</span>
              </div>
            </div>

            <div className="detail-row">
              <span>Kode Siswa</span>
              <span>{detailSiswa.kode_siswa}</span>
            </div>
            <div className="detail-row">
              <span>Tanggal Lahir</span>
              <span>{detailSiswa.tanggal_lahir}</span>
            </div>
            <div className="detail-row" style={{ borderBottom: 'none' }}>
              <span>Alamat</span>
              <span>{detailSiswa.alamat}</span>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setDetailSiswa(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Data Siswa?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menghapus data <strong>{deleteTarget.nama_siswa}</strong> ({deleteTarget.kode_siswa})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default App;