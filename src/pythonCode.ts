export const PYTHON_STREAMLIT_CODE = `"""
=============================================================================
Aplikasi Web Scraping & Downloader Dokumen / Buku (Production-Ready)
Dibangun dengan Python, Streamlit, BeautifulSoup, dan Requests
=============================================================================
Fitur   :
  1. Input URL direktori web target
  2. Pemindaian otomatis file buku/dokumen (.pdf, .epub, .mobi, .cbz, dll.)
  3. Menyimpan langsung ke penyimpanan lokal (sangat cocok untuk unduhan besar)
  4. Unduh massal (Batch Download) menjadi file ZIP
  5. Fitur Jeda Waktu (Rate Limiting) agar IP tidak diblokir
  6. Penanganan error komprehensif (Invalid URL, Timeout, 403, 404, Empty)
=============================================================================
"""

import streamlit as st
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, unquote
import pandas as pd
import io
import time
import os
import zipfile

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
    .main .block-container { padding-top: 2rem; padding-bottom: 3rem; max-width: 1200px; }
    .app-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155; border-radius: 12px;
        padding: 1.5rem 2rem; margin-bottom: 1.5rem; color: #f8fafc;
    }
    .app-title { font-size: 1.8rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.75rem; }
    .app-subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.4rem; margin-bottom: 0; }
</style>
""", unsafe_allow_html=True)


# =============================================================================
# 2. FUNGSI UTAMA WEB SCRAPING & UTILITIES
# =============================================================================
def format_file_size(size_in_bytes: int) -> str:
    if size_in_bytes <= 0: return "N/A"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0: return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"

def validate_url(url: str) -> bool:
    if not url: return False
    parsed = urlparse(url.strip())
    return bool(parsed.scheme in ['http', 'https'] and parsed.netloc)

def scrape_directory_files(target_url: str, target_extensions: list, timeout_sec: int = 15, scan_subdirs: bool = True):
    files_found, visited, seen_file_urls = [], set(), set()
    stats = {"duration": 0.0, "total_links_checked": 0, "subdirs_scanned": 0}
    start_time = time.time()
    
    cleaned_exts = tuple(ext.lower().strip().lstrip('.') for ext in target_extensions)
    is_all_exts = "*" in cleaned_exts or "all" in cleaned_exts
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    queue = [(target_url if target_url.endswith('/') else target_url + '/', "Root", 0)]
    
    try:
        while queue and len(visited) < 500: # Limit to 500 subdirectories max
            current_url, folder_name, depth = queue.pop(0)
            if current_url in visited: continue
            visited.add(current_url)
            
            try:
                response = requests.get(current_url, headers=headers, timeout=min(timeout_sec, 15))
            except Exception: continue
                
            if response.status_code != 200: continue
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract links
            for a_tag in soup.find_all('a', href=True):
                stats["total_links_checked"] += 1
                href = a_tag['href'].strip()
                if href.startswith('?') or href.startswith('#') or 'parent directory' in a_tag.get_text().lower() or '../' in href:
                    continue
                
                file_url = urljoin(current_url, href)
                parsed = urlparse(file_url)
                segs = [s for s in parsed.path.split('/') if s]
                if not segs: continue
                raw_name = unquote(segs[-1])
                
                is_folder = href.endswith('/') or file_url.endswith('/')
                
                if is_folder and scan_subdirs and depth < 3: # Max depth 3
                    if file_url not in visited:
                        queue.append((file_url if file_url.endswith('/') else file_url + '/', raw_name, depth + 1))
                elif not is_folder and '.' in raw_name:
                    ext = raw_name.rsplit('.', 1)[-1].lower()
                    if ext not in ['php', 'cgi', 'asp', 'jsp', 'html', 'htm'] and (is_all_exts or ext in cleaned_exts):
                        if file_url not in seen_file_urls:
                            seen_file_urls.add(file_url)
                            files_found.append({
                                "Nama File": raw_name,
                                "Folder": folder_name,
                                "Format": f".{ext.upper()}",
                                "Download Link": file_url
                            })

        stats["subdirs_scanned"] = len(visited)
        stats["duration"] = round(time.time() - start_time, 2)
        if not files_found:
            return [], "Tidak ditemukan file dengan ekstensi target.", stats
        return files_found, None, stats

    except Exception as e:
        stats["duration"] = round(time.time() - start_time, 2)
        return [], f"Kesalahan koneksi/scraping: {str(e)}", stats


# =============================================================================
# 3. ANTARMUKA PENGGUNA (SIDEBAR & KONTROL INPUT)
# =============================================================================
st.markdown('<div class="app-header"><h1 class="app-title">📚 DocScout (Python Edition)</h1><p class="app-subtitle">Scraper & Batch Downloader Tangguh Tanpa Batas Timeout</p></div>', unsafe_allow_html=True)

with st.sidebar:
    st.header("⚙️ Pengaturan Mesin")
    selected_exts = st.multiselect("Ekstensi Target:", ["pdf", "epub", "mobi", "cbz", "zip", "txt", "docx"], default=["pdf", "epub", "mobi", "cbz"])
    timeout = st.slider("Timeout Akses Web (detik):", min_value=5, max_value=60, value=30, step=5)
    rate_limit = st.slider("Jeda Antar Unduhan (detik):", min_value=0.0, max_value=5.0, value=0.5, step=0.5, help="Mencegah IP Anda diblokir oleh server.")
    
target_url_input = st.text_input("Masukkan URL Direktori Terbuka:", placeholder="https://example.com/books/")
start_scrape_btn = st.button("🚀 Mulai Pindai Direktori", type="primary")

if start_scrape_btn:
    if not validate_url(target_url_input):
        st.error("❌ Format URL tidak valid (harus berawalan http:// atau https://).")
    else:
        with st.spinner("⏳ Sedang memindai subdirektori (bebas timeout)..."):
            files, error, stats = scrape_directory_files(target_url_input.strip(), selected_exts, timeout)
            st.session_state["scraped_files"], st.session_state["scrape_error"], st.session_state["scrape_stats"] = files, error, stats

# =============================================================================
# 4. EKSEKUSI SCRAPING & PENAMPILAN HASIL
# =============================================================================
if "scraped_files" in st.session_state:
    files = st.session_state["scraped_files"]
    if st.session_state["scrape_error"]: st.error(f"❌ {st.session_state['scrape_error']}")
    elif files:
        df = pd.DataFrame(files)
        st.success(f"✅ Ditemukan {len(files)} file dalam {st.session_state['scrape_stats']['duration']} detik. ({st.session_state['scrape_stats']['subdirs_scanned']} folder dipindai)")
        
        tab_table, tab_download = st.tabs(["📊 Daftar File Ditemukan", "⚡ Eksekusi Unduhan (Batch & ZIP)"])
        
        with tab_table:
            st.dataframe(df, use_container_width=True, hide_index=True)
            
        with tab_download:
            st.markdown("### 📥 Engine Unduhan Berkas Massal")
            st.info("Script Streamlit dapat menyimpan langsung ke harddisk lokal Anda (ke folder \`downloads/\`) atau membuat arsip ZIP untuk peramban Anda.")
            
            selected_filenames = st.multiselect("Pilih berkas yang akan diunduh:", options=df['Nama File'].tolist(), default=df['Nama File'].tolist())
            
            col_d1, col_d2 = st.columns(2)
            with col_d1:
                local_save_btn = st.button("💾 Unduh Langsung ke Folder Lokal (Sangat Disarankan)", use_container_width=True, type="primary")
            with col_d2:
                zip_save_btn = st.button("📦 Ekspor Semua Pilihan sebagai ZIP", use_container_width=True)

            if local_save_btn and selected_filenames:
                queue_items = [f for f in files if f['Nama File'] in selected_filenames]
                os.makedirs("downloads", exist_ok=True)
                
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                for idx, item in enumerate(queue_items):
                    file_url = item['Download Link']
                    file_name = item['Nama File']
                    status_text.text(f"Mengunduh [{idx+1}/{len(queue_items)}]: {file_name}")
                    
                    try:
                        resp = requests.get(file_url, stream=True, timeout=30)
                        resp.raise_for_status()
                        
                        save_path = os.path.join("downloads", file_name)
                        with open(save_path, "wb") as f:
                            for chunk in resp.iter_content(chunk_size=1024*1024):
                                if chunk: f.write(chunk)
                                
                        time.sleep(rate_limit) # Rate limit agar aman
                    except Exception as e:
                        st.error(f"Gagal mengunduh {file_name}: {e}")
                    
                    progress_bar.progress((idx + 1) / len(queue_items))
                    
                st.success(f"🎉 Selesai! Seluruh berkas telah disimpan di folder \`downloads/\` pada komputer Anda.")

            if zip_save_btn and selected_filenames:
                queue_items = [f for f in files if f['Nama File'] in selected_filenames]
                
                with st.spinner("Sedang mengunduh dan mengompres ke ZIP..."):
                    zip_buffer = io.BytesIO()
                    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
                        for item in queue_items:
                            try:
                                resp = requests.get(item['Download Link'], timeout=30)
                                if resp.status_code == 200:
                                    zip_file.writestr(item['Nama File'], resp.content)
                                time.sleep(rate_limit)
                            except:
                                continue
                    
                    st.download_button(
                        label="⬇️ Klik Untuk Mengunduh Arsip ZIP",
                        data=zip_buffer.getvalue(),
                        file_name="docscout_downloads.zip",
                        mime="application/zip",
                        type="primary"
                    )
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
