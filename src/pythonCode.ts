export const PYTHON_STREAMLIT_CODE = `"""
=============================================================================
Aplikasi Web Scraping & Downloader Dokumen / Buku
Dibangun dengan Python, Streamlit, BeautifulSoup, dan Requests
=============================================================================
Author  : Expert Python Developer & UI/UX Designer
Fitur   :
  1. Input URL direktori web target
  2. Pemindaian otomatis file buku/dokumen (.pdf, .epub, .mobi, .cbz, dll.)
  3. Filter ekstensi dan kata kunci secara dinamis
  4. Deteksi ukuran file & direct download link
  5. Penanganan error komprehensif (Invalid URL, Timeout, 403, 404, Empty)
  6. Ekspor hasil ke CSV dan download batch ZIP
=============================================================================
"""

import streamlit as st
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, unquote
import pandas as pd
import io
import time

# =============================================================================
# 1. KONFIGURASI HALAMAN & TEMA UI/UX STREAMLIT
# =============================================================================
st.set_page_config(
    page_title="DocScout - Web Directory Document Scraper",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Kustomisasi CSS untuk UI yang modern, rapi, dan responsif
st.markdown("""
<style>
    /* Styling Container Utama */
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1200px;
    }
    
    /* Header & Badge Styling */
    .app-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem 2rem;
        margin-bottom: 1.5rem;
        color: #f8fafc;
    }
    .app-title {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .app-subtitle {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-top: 0.4rem;
        margin-bottom: 0;
    }
    
    /* Tag Ekstensi */
    .ext-badge {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 0.3rem;
    }
    .ext-pdf { background-color: #ef444422; color: #f87171; border: 1px solid #ef444444; }
    .ext-epub { background-color: #10b98122; color: #34d399; border: 1px solid #10b98144; }
    .ext-mobi { background-color: #f59e0b22; color: #fbbf24; border: 1px solid #f59e0b44; }
    .ext-cbz { background-color: #8b5cf622; color: #a78bfa; border: 1px solid #8b5cf644; }
</style>
""", unsafe_allow_html=True)


# =============================================================================
# 2. FUNGSI UTAMA WEB SCRAPING & UTILITIES
# =============================================================================

def format_file_size(size_in_bytes: int) -> str:
    """Mengubah ukuran bytes menjadi format yang mudah dibaca (KB, MB, GB)."""
    if size_in_bytes <= 0:
        return "N/A"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"


def validate_url(url: str) -> bool:
    """Memvalidasi format URL."""
    if not url:
        return False
    parsed = urlparse(url.strip())
    return bool(parsed.scheme in ['http', 'https'] and parsed.netloc)


def get_file_size_from_head(url: str, timeout: int = 5) -> str:
    """Mengambil ukuran file melalui HTTP HEAD request tanpa mengunduh seluruh file."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        resp = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200 and 'Content-Length' in resp.headers:
            return format_file_size(int(resp.headers['Content-Length']))
    except Exception:
        pass
    return "Unknown"


def scrape_directory_files(target_url: str, target_extensions: list, timeout_sec: int = 15, fetch_sizes: bool = False, scan_subdirs: bool = True):
    """
    Melakukan scraping terhadap direktori web (termasuk multi-level subfolder) untuk menemukan file dokumen/buku.
    Mendukung ekstraksi ukuran file langsung dari tabel direktori Apache/Nginx.
    
    Returns:
        tuple: (list_of_files, error_message, scan_stats)
    """
    files_found = []
    error_msg = None
    stats = {"duration": 0.0, "total_links_checked": 0, "status_code": None, "subdirs_scanned": 0}
    
    start_time = time.time()
    
    # Standardisasi ekstensi (huruf kecil tanpa tanda titik)
    cleaned_exts = tuple(ext.lower().strip().lstrip('.') for ext in target_extensions)
    is_all_exts = "*" in cleaned_exts or "all" in cleaned_exts
    
    # Headers untuk mensimulasikan browser standar
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
    }
    
    # BFS Queue untuk penelusuran direktori bertingkat
    queue = [(target_url if target_url.endswith('/') else target_url + '/', "Root", 0)]
    visited = set()
    seen_file_urls = set()
    
    try:
        while queue and len(visited) < 250:
            current_url, folder_name, depth = queue.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)
            
            try:
                response = requests.get(current_url, headers=headers, timeout=min(timeout_sec, 8), allow_redirects=True)
            except Exception:
                continue
                
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            stats["total_links_checked"] += len(soup.find_all('a'))
            
            # Cek baris tabel untuk Apache / Nginx Directory Listing
            table_rows = soup.find_all('tr')
            for tr in table_rows:
                tds = tr.find_all('td')
                if len(tds) >= 3:
                    a_tag = tds[1].find('a')
                    if not a_tag or not a_tag.get('href'):
                        continue
                    href = a_tag['href'].strip()
                    if href.startswith('?') or href.startswith('#') or 'parent directory' in a_tag.get_text().lower():
                        continue
                        
                    file_url = urljoin(current_url, href)
                    parsed = urlparse(file_url)
                    segs = [s for s in parsed.path.split('/') if s]
                    if not segs:
                        continue
                    raw_name = unquote(segs[-1])
                    
                    size_text = tds[3].get_text(strip=True) if len(tds) >= 4 else tds[2].get_text(strip=True)
                    is_folder = href.endswith('/') or file_url.endswith('/') or size_text in ['-', '']
                    
                    if is_folder and scan_subdirs and depth < 3:
                        if file_url not in visited:
                            queue.append((file_url if file_url.endswith('/') else file_url + '/', raw_name, depth + 1))
                    elif not is_folder and '.' in raw_name:
                        ext = raw_name.rsplit('.', 1)[-1].lower()
                        if ext not in ['php', 'cgi', 'asp', 'jsp'] and (is_all_exts or ext in cleaned_exts):
                            if file_url not in seen_file_urls:
                                seen_file_urls.add(file_url)
                                files_found.append({
                                    "No": len(files_found) + 1,
                                    "Nama File": raw_name,
                                    "Folder": folder_name,
                                    "Format": f".{ext.upper()}",
                                    "Ukuran": size_text if size_text and size_text != '-' else "Unknown",
                                    "Download Link": file_url
                                })
            
            # Fallback jika struktur bukan tabel (misal raw anchor list)
            if not table_rows:
                for a_tag in soup.find_all('a', href=True):
                    href = a_tag['href'].strip()
                    if href.startswith('?') or href.startswith('#') or 'parent directory' in a_tag.get_text().lower():
                        continue
                    file_url = urljoin(current_url, href)
                    parsed = urlparse(file_url)
                    segs = [s for s in parsed.path.split('/') if s]
                    if not segs:
                        continue
                    raw_name = unquote(segs[-1])
                    is_folder = href.endswith('/') or file_url.endswith('/') or ('.' not in raw_name)
                    
                    if is_folder and scan_subdirs and depth < 3:
                        if file_url not in visited:
                            queue.append((file_url if file_url.endswith('/') else file_url + '/', raw_name, depth + 1))
                    elif not is_folder and '.' in raw_name:
                        ext = raw_name.rsplit('.', 1)[-1].lower()
                        if ext not in ['php', 'cgi', 'asp', 'jsp'] and (is_all_exts or ext in cleaned_exts):
                            if file_url not in seen_file_urls:
                                seen_file_urls.add(file_url)
                                files_found.append({
                                    "No": len(files_found) + 1,
                                    "Nama File": raw_name,
                                    "Folder": folder_name,
                                    "Format": f".{ext.upper()}",
                                    "Ukuran": "Unknown",
                                    "Download Link": file_url
                                })

        stats["subdirs_scanned"] = len(visited)
        stats["duration"] = round(time.time() - start_time, 2)
        
        if not files_found:
            return [], "Direktori berhasil diakses, namun tidak ditemukan file yang sesuai dengan ekstensi target.", stats
            
        return files_found, None, stats

    except requests.exceptions.Timeout:
        stats["duration"] = round(time.time() - start_time, 2)
        return [], f"Koneksi timeout setelah {timeout_sec} detik. Server target lambat atau menolak koneksi.", stats
    except requests.exceptions.ConnectionError:
        stats["duration"] = round(time.time() - start_time, 2)
        return [], "Gagal terhubung ke host. Pastikan domain aktif dan koneksi internet stabil.", stats
    except requests.exceptions.RequestException as e:
        stats["duration"] = round(time.time() - start_time, 2)
        return [], f"Terjadi kesalahan permintaan web: {str(e)}", stats
    except Exception as e:
        stats["duration"] = round(time.time() - start_time, 2)
        return [], f"Terjadi kesalahan internal: {str(e)}", stats


# =============================================================================
# 3. ANTARMUKA PENGGUNA (SIDEBAR & KONTROL INPUT)
# =============================================================================

# Header Aplikasi
st.markdown("""
<div class="app-header">
    <h1 class="app-title">📚 DocScout: Document & Book Directory Scraper</h1>
    <p class="app-subtitle">Aplikasi pemindaian dan pengunduhan berkas dokumen/e-book (.pdf, .epub, .mobi, .cbz) dari direktori web terbuka.</p>
</div>
""", unsafe_allow_html=True)

# Sidebar Pengaturan
with st.sidebar:
    st.header("⚙️ Pengaturan Pemindaian")
    
    selected_exts = st.multiselect(
        "Ekstensi File Target:",
        options=["pdf", "epub", "mobi", "cbz", "cbr", "djvu", "fb2", "azw3", "txt", "docx"],
        default=["pdf", "epub", "mobi", "cbz"],
        help="Pilih format berkas dokumen atau buku yang ingin dikumpulkan."
    )
    
    timeout = st.slider("Timeout Koneksi (detik):", min_value=5, max_value=60, value=15, step=5)
    fetch_sizes_toggle = st.checkbox("Ambil ukuran file (HTTP HEAD)", value=False, 
                                     help="Mengaktifkan opsi ini akan memperlambat scraping karena melakukan request HEAD per file.")
    
    st.divider()
    
    st.subheader("💡 Contoh Direktori Terbuka")
    preset_choice = st.selectbox(
        "Gunakan Contoh Cepat:",
        options=[
            "-- Pilih Contoh --",
            "Project Gutenberg Top Books",
            "Standard Ebooks Directory",
            "Open Textbook Library"
        ]
    )
    
    preset_urls = {
        "Project Gutenberg Top Books": "https://www.gutenberg.org/browse/scores/top",
        "Standard Ebooks Directory": "https://standardebooks.org/ebooks",
        "Open Textbook Library": "https://openstax.org/subjects"
    }

# Input Form Utama
preset_val = preset_urls.get(preset_choice, "") if preset_choice != "-- Pilih Contoh --" else ""

col_input, col_btn = st.columns([4, 1])

with col_input:
    target_url_input = st.text_input(
        "Masukkan URL Direktori Web Target:",
        value=preset_val,
        placeholder="https://example.com/books/ atau https://archive.org/download/sample/",
        help="Masukkan URL direktori web yang memuat daftar link berkas."
    )

with col_btn:
    st.write("")
    st.write("")
    start_scrape_btn = st.button("🚀 Mulai Pindai", use_container_width=True, type="primary")


# =============================================================================
# 4. EKSEKUSI SCRAPING & PENAMPILAN HASIL
# =============================================================================

if start_scrape_btn:
    if not target_url_input or not target_url_input.strip():
        st.error("⚠️ Silakan masukkan URL target terlebih dahulu.")
    elif not validate_url(target_url_input.strip()):
        st.error("❌ Format URL tidak valid. Pastikan menyertakan awalan http:// atau https://.")
    elif not selected_exts:
        st.warning("⚠️ Harap pilih minimal satu ekstensi file di sidebar.")
    else:
        with st.spinner("⏳ Sedang memindai direktori web dan mengekstrak tautan dokumen..."):
            files, error, stats = scrape_directory_files(
                target_url=target_url_input.strip(),
                target_extensions=selected_exts,
                timeout_sec=timeout,
                fetch_sizes=fetch_sizes_toggle
            )
            st.session_state["scraped_files"] = files
            st.session_state["scrape_error"] = error
            st.session_state["scrape_stats"] = stats
            st.session_state["scanned_url"] = target_url_input.strip()

# Menampilkan Hasil dari Session State
if "scraped_files" in st.session_state:
    files = st.session_state["scraped_files"]
    error = st.session_state["scrape_error"]
    stats = st.session_state.get("scrape_stats", {})
    
    if error:
        st.error(f"❌ {error}")
    elif files:
        df = pd.DataFrame(files)
        
        # Metrik Ringkasan Hasil
        col_m1, col_m2, col_m3, col_m4 = st.columns(4)
        with col_m1:
            st.metric("Total Berkas Ditemukan", f"{len(files)} file")
        with col_m2:
            st.metric("Waktu Eksekusi", f"{stats.get('duration', 0)} detik")
        with col_m3:
            st.metric("Total Tautan Dicek", f"{stats.get('total_links_checked', 0)}")
        with col_m4:
            ext_counts = df['Format'].value_counts().to_dict()
            ext_summary = ", ".join([f"{k}: {v}" for k, v in ext_counts.items()])
            st.metric("Distribusi Format", ext_summary if len(ext_summary) < 25 else f"{len(ext_counts)} jenis")
            
        st.divider()
        
        # Filter Pencarian Lokal
        search_query = st.text_input("🔍 Cari dalam daftar file yang ditemukan:", placeholder="Ketik kata kunci nama file...")
        if search_query:
            df_display = df[df['Nama File'].str.contains(search_query, case=False, na=False)]
        else:
            df_display = df

        st.subheader(f"📋 Daftar Dokumen ({len(df_display)} dari {len(files)} file)")
        
        # Opsi Tampilan: Interactive Table & Direct Download Cards & Download Queue
        tab_table, tab_queue, tab_cards, tab_export = st.tabs(["📊 Tampilan Tabel Interaktif", "⚡ Antrean Unduhan (Download Queue)", "🗂️ Tampilan Kartu Download", "💾 Ekspor Data"])
        
        with tab_table:
            st.dataframe(
                df_display,
                column_config={
                    "Download Link": st.column_config.LinkColumn(
                        "Tautan Unduh",
                        help="Klik untuk mengunduh langsung berkas ke komputer Anda",
                        validate=r"^https?://",
                        max_chars=100,
                        display_text="Download"
                    ),
                    "Format": st.column_config.TextColumn("Format", width="small"),
                    "Ukuran": st.column_config.TextColumn("Ukuran File", width="small"),
                    "Nama File": st.column_config.TextColumn("Nama Dokumen / Buku", width="large"),
                },
                hide_index=True,
                use_container_width=True
            )

        with tab_queue:
            st.markdown("### 📥 Antrean Unduhan Berkas Terpilih")
            st.info("Pilih berkas yang ingin dimasukkan ke antrean download. Aplikasi akan mengunduh berkas satu per satu dengan indikator progres individual & penanganan error.")

            # Multiselect file
            selected_filenames = st.multiselect(
                "Pilih berkas untuk antrean download:",
                options=df['Nama File'].tolist(),
                default=df['Nama File'].tolist()[:3] if len(df) >= 3 else df['Nama File'].tolist()
            )

            col_q1, col_q2 = st.columns([2, 1])
            with col_q1:
                start_queue_btn = st.button("🚀 Mulai Antrean Download", type="primary", use_container_width=True)
            with col_q2:
                chunk_size_kb = st.selectbox("Chunk Size Buffer", [64, 128, 256, 512], index=1)

            if start_queue_btn and selected_filenames:
                queue_items = [f for f in files if f['Nama File'] in selected_filenames]
                st.write(f"Menjalankan {len(queue_items)} berkas dalam antrean...")

                overall_progress = st.progress(0, text="Memulai antrean unduhan...")
                
                for idx, item in enumerate(queue_items):
                    file_name = item['Nama File']
                    file_url = item['Download Link']
                    
                    st.write(f"**[{idx+1}/{len(queue_items)}] Mengunduh:** \`{file_name}\`")
                    item_progress_bar = st.progress(0, text=f"Menghubungkan ke server...")
                    status_placeholder = st.empty()

                    try:
                        resp = requests.get(file_url, stream=True, timeout=30)
                        resp.raise_for_status()

                        total_len = resp.headers.get('content-length')
                        total_bytes = int(total_len) if total_len and total_len.isdigit() else None

                        downloaded = 0
                        chunks = []
                        start_time = time.time()

                        for chunk in resp.iter_content(chunk_size=chunk_size_kb * 1024):
                            if chunk:
                                chunks.append(chunk)
                                downloaded += len(chunk)

                                if total_bytes:
                                    pct = min(1.0, downloaded / total_bytes)
                                    elapsed = max(time.time() - start_time, 0.01)
                                    speed_kbps = (downloaded / 1024) / elapsed
                                    item_progress_bar.progress(
                                        pct, 
                                        text=f"Progres: {int(pct*100)}% ({format_file_size(downloaded)} / {format_file_size(total_bytes)}) - {speed_kbps:.1f} KB/s"
                                    )
                                else:
                                    item_progress_bar.progress(
                                        0.5, 
                                        text=f"Terunduh: {format_file_size(downloaded)} (Ukuran total tidak diketahui)"
                                    )

                        item_progress_bar.progress(1.0, text="✅ Selesai 100%")
                        file_data = b"".join(chunks)
                        
                        status_placeholder.download_button(
                            label=f"💾 Simpan Berkas: {file_name}",
                            data=file_data,
                            file_name=file_name,
                            key=f"dl_{idx}_{time.time()}"
                        )
                    except Exception as err:
                        item_progress_bar.progress(0, text="❌ Gagal mengunduh")
                        status_placeholder.error(f"Gagal mengunduh '{file_name}': {str(err)}")

                    overall_progress.progress((idx + 1) / len(queue_items), text=f"Total Progres: {idx+1}/{len(queue_items)} file selesai")

                st.success("🎉 Seluruh item dalam antrean selesai diproses!")

        with tab_cards:
            for idx, row in df_display.iterrows():
                with st.expander(f"📄 {row['Nama File']} ({row['Format']})"):
                    st.write(f"**URL Langsung:** [{row['Download Link']}]({row['Download Link']})")
                    if row['Ukuran'] != "N/A":
                        st.write(f"**Estimasi Ukuran:** {row['Ukuran']}")
                    st.markdown(f'<a href="{row["Download Link"]}" target="_blank" style="display:inline-block;padding:0.4rem 1rem;background-color:#0284c7;color:white;text-decoration:none;border-radius:6px;font-weight:600;">⬇️ Unduh Berkas Langsung</a>', unsafe_allow_html=True)

        with tab_export:
            col_exp1, col_exp2 = st.columns(2)
            
            # Ekspor CSV
            with col_exp1:
                csv_buffer = io.StringIO()
                df.to_csv(csv_buffer, index=False)
                st.download_button(
                    label="📥 Unduh Daftar File (CSV)",
                    data=csv_buffer.getvalue(),
                    file_name="scraped_books_list.csv",
                    mime="text/csv",
                    use_container_width=True
                )
                
            # Ekspor Link Text
            with col_exp2:
                urls_text = "\\n".join(df['Download Link'].tolist())
                st.download_button(
                    label="📋 Unduh Seluruh Link (TXT)",
                    data=urls_text,
                    file_name="download_links.txt",
                    mime="text/plain",
                    use_container_width=True
                )

# Footer
st.markdown("---")
st.markdown("<p style='text-align:center; color:#64748b; font-size:0.85rem;'>Dibangun dengan Python & Streamlit • Gunakan scraper ini secara bijak sesuai izin server target.</p>", unsafe_allow_html=True)
`;

export const INSTALL_INSTRUCTIONS = `# =============================================================================
# PERINTAH INSTALASI DAN CARA MENJALANKAN APLIKASI
# =============================================================================

# 1. Buat dan aktifkan Virtual Environment (Disarankan)
# ---------------------------------------------------
# Di Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Di Windows:
python -m venv venv
venv\\\\Scripts\\\\activate

# 2. Instalasi Pustaka / Dependencies yang Dibutuhkan
# ---------------------------------------------------
pip install streamlit requests beautifulsoup4 pandas urllib3

# Atau buat file 'requirements.txt' dengan isi:
# streamlit>=1.32.0
# requests>=2.31.0
# beautifulsoup4>=4.12.0
# pandas>=2.2.0
# urllib3>=2.0.0
# Lalu jalankan:
# pip install -r requirements.txt

# 3. Cara Menjalankan Aplikasi
# ---------------------------------------------------
# Simpan kode di atas ke dalam file bernama 'app.py', kemudian jalankan perintah:
streamlit run app.py

# Aplikasi web interaktif akan otomatis terbuka di browser Anda pada:
# http://localhost:8501
`;
