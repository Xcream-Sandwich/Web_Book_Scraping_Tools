# Web Book Scraping Tools

Powerful web scraping and document/book downloader application. Discover and download books, PDFs, EPUBs, MOBIs, CBZs, and other digital documents from open web directories with an intuitive interface.

Homepage: https://web-book-craping-tools.vercel.app

## Features

- Scrape open web directories for books and documents
- Support for multiple file formats: PDF, EPUB, MOBI, CBZ, ZIP, and more
- Batch download multiple files simultaneously
- Export downloads as ZIP archive
- Rate limiting to prevent IP blocking
- Comprehensive error handling and timeouts
- Mock directories for testing without external network
- Recursive directory scanning (up to 3 levels deep)
- File metadata display (size, modification date, format)
- Web UI with real-time progress tracking
- Backend API with REST endpoints

## Supported File Formats

- PDF - Portable Document Format
- EPUB - Electronic Publication
- MOBI - Kindle Format
- CBZ - Comic Book Archive
- ZIP - Compressed Archive
- TXT - Plain Text
- DOCX - Microsoft Word

## Tech Stack

Frontend:
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion (animations)

Backend:
- Express.js
- TypeScript
- Cheerio (HTML parsing)
- Node.js

Deployment:
- Vercel (production)
- Streamlit (alternative Python version)

## Getting Started

### Prerequisites

- Node.js 18+ or Python 3.8+
- npm or yarn (for Node.js) or pip (for Python)

### Installation (TypeScript/Node.js Version)

```bash
# Clone repository
git clone https://github.com/Xcream-Sandwich/Web_Book_Scraping_Tools.git
cd Web_Book_Scraping_Tools

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Development
npm run dev

# Production build
npm run build
npm start
```

### Installation (Python/Streamlit Version)

```bash
# Clone repository
git clone https://github.com/Xcream-Sandwich/Web_Book_Scraping_Tools.git
cd Web_Book_Scraping_Tools

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Streamlit app
streamlit run app.py
```

## Usage

### Web Interface

1. Open the application in your browser (https://web-book-craping-tools.vercel.app or localhost:3000)
2. Enter the URL of an open web directory
3. Select desired file formats (PDF, EPUB, MOBI, CBZ, etc.)
4. Click "Start Scan" to discover files
5. Review found files in the results table
6. Select files to download
7. Choose download method:
   - Download to local folder (requires running locally)
   - Export as ZIP (browser download)

### API Endpoints

#### POST /api/scrape

Scrape a web directory for files.

Request:
```json
{
  "url": "https://example.com/books/",
  "extensions": ["pdf", "epub", "mobi", "cbz"],
  "timeoutSeconds": 15,
  "userAgent": "Mozilla/5.0..."
}
```

Response:
```json
{
  "success": true,
  "targetUrl": "https://example.com/books/",
  "pageTitle": "Books Directory",
  "totalFound": 42,
  "files": [
    {
      "name": "sample_book.pdf",
      "url": "https://example.com/books/sample_book.pdf",
      "ext": "pdf",
      "size": "2.4 MB",
      "rawSize": 2516582,
      "modified": "2024-01-15 10:30",
      "folder": "Root"
    }
  ],
  "scanDurationMs": 3500,
  "extensionsScanned": ["pdf", "epub", "mobi", "cbz"]
}
```

#### GET /api/proxy-download?url=...&filename=...

Download file through proxy (bypasses CORS).

Parameters:
- url: File URL to download
- filename: Custom filename for download

### Mock Directories for Testing

Try these URLs without external network:
- mock://gutenberg-classics
- mock://open-textbooks
- sample://gutenberg-classics

## Configuration

### Environment Variables (.env)

```
# Backend
PORT=3000
NODE_ENV=development
VERCEL=false

# Scraping
DEFAULT_TIMEOUT=15
MAX_DIRECTORIES=300
MAX_DEPTH=3
RATE_LIMIT=0.5
```

### Python Settings (app.py)

- Timeout: 5-60 seconds (default: 30)
- Rate limit: 0-5 seconds between downloads (default: 0.5)
- Max subdirectories scanned: 500
- Max depth: 3 levels

## Project Structure

```
Web_Book_Scraping_Tools/
├── server.ts              # Express backend with scraping logic
├── app.py                 # Streamlit alternative frontend
├── src/                   # Frontend React components
├── index.html             # Entry HTML
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment template
└── vercel.json            # Vercel deployment config
```

## Features Explained

### Web Directory Scanning

- Supports Apache FancyIndexing and Nginx Autoindex formats
- Fallback to anchor tag parsing for non-standard listings
- Breadth-first search (BFS) for efficient scanning
- URL validation and origin checking
- Duplicate file detection

### Download Management

- Progress tracking with real-time updates
- Batch ZIP export with compression
- Local file system storage (Node.js version)
- CORS proxy for cross-origin downloads
- Customizable rate limiting

### Error Handling

- Invalid URL detection
- Timeout protection
- 403 Forbidden detection
- 404 Not Found handling
- Connection failure recovery
- Network error messages

### Performance

- Configurable timeout (3-45 seconds)
- Parallel directory scanning (up to 15 concurrent)
- Efficient file deduplication
- Stream-based large file downloads
- Memory-efficient ZIP compression

## Limitations

- Maximum 300 directories per scan
- Maximum scan depth: 3 levels
- Timeout limits for Vercel deployment
- Respects robots.txt (recommended)
- Rate limiting to prevent server blocking

## Legal Notice

This tool is designed for downloading publicly available documents from open directories. Users are responsible for:
- Respecting copyright and intellectual property rights
- Following website Terms of Service
- Not overloading servers with requests
- Complying with local laws and regulations

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open Pull Request

## Roadmap

- Advanced filtering by file size or date
- Search within directory listings
- Download history tracking
- Browser extension version
- Mobile app (React Native)
- Database storage for metadata
- OCR integration for scanned documents
- Audio book support (MP3, M4B)

## Troubleshooting

**"Timeout Error"**
- Increase timeout in settings
- Check target server availability
- Try alternative directory URL

**"Access Denied (403)"**
- Server doesn't allow automated scraping
- Try different URL
- Some sites may block non-browser requests

**"No Files Found"**
- Directory may be empty
- File extensions not matching
- URL format incorrect (should end with /)

**"Download Failed"**
- File no longer available
- Network connection issue
- File too large (try smaller files)

## Support

For questions, issues, or suggestions:
- Open an Issue: https://github.com/Xcream-Sandwich/Web_Book_Scraping_Tools/issues
- Start a Discussion: https://github.com/Xcream-Sandwich/Web_Book_Scraping_Tools/discussions

## License

This project is open source and available under the MIT License.

## Author

Xcream-Sandwich
- GitHub: https://github.com/Xcream-Sandwich
- Website: https://web-book-craping-tools.vercel.app

## Acknowledgments

- Cheerio - jQuery for server-side HTML parsing
- Express - Node.js web framework
- React - UI library
- Vite - Next generation frontend build tool
- TailwindCSS - Utility-first CSS framework

---

Made for book lovers, researchers, and open access advocates