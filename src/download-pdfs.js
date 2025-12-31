const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadPdfs() {
  // Load the PDF links from pdf-links.json
  if (!fs.existsSync('pdf-links.json')) {
    console.error('Error: pdf-links.json not found. Please run scrape-pdf-links.js first.');
    process.exit(1);
  }

  const pdfLinks = JSON.parse(fs.readFileSync('pdf-links.json', 'utf-8'));
  console.log(`Found ${pdfLinks.length} PDF links to download`);

  // Create downloads directory if it doesn't exist
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  if (pdfLinks.length === 0) {
    console.log('No PDF links to download.');
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting PDF downloads...`);

  for (let i = 0; i < pdfLinks.length; i++) {
    const { pdfUrl, pageUrl } = pdfLinks[i];

    // Extract year and month from page URL
    // e.g., https://stps.dk/tilsynsrapporter/2025/dec/...
    const urlMatch = pageUrl.match(/\/tilsynsrapporter\/(\d{4})\/([\w]+)\//);
    const year = urlMatch ? urlMatch[1] : 'unknown';
    const month = urlMatch ? urlMatch[2] : 'unknown';

    // Create year/month subdirectories
    const yearMonthDir = path.join(downloadsDir, year, month);
    if (!fs.existsSync(yearMonthDir)) {
      fs.mkdirSync(yearMonthDir, { recursive: true });
    }

    const filename = path.basename(new URL(pdfUrl).pathname);
    const filepath = path.join(yearMonthDir, filename);

    console.log(`\n[${i + 1}/${pdfLinks.length}] ${year}/${month}/${filename}`);

    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`  ⊙ Already exists, skipping`);
      continue;
    }

    try {
      await downloadFile(pdfUrl, filepath);
      console.log(`  ✓ Downloaded and saved`);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Downloads complete! PDFs saved to: ${downloadsDir}`);
}

// Helper function to download files
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if download failed
      reject(err);
    });
  });
}

downloadPdfs().catch(console.error);
