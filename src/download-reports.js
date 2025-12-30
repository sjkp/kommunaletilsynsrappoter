const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadReports() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load the URLs from data-urls.json
  const dataUrls = JSON.parse(fs.readFileSync('data-urls.json', 'utf-8'));
  console.log(`Found ${dataUrls.length} URLs to process`);

  // Create downloads directory if it doesn't exist
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  const pdfLinks = [];
  let successCount = 0;
  let failCount = 0;

  // Process each URL
  for (let i = 0; i < dataUrls.length; i++) {
    const url = dataUrls[i];
    console.log(`\n[${i + 1}/${dataUrls.length}] Processing: ${url}`);

    try {
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Find the PDF link in the publication-page div
      const pdfLink = await page.evaluate(() => {
        const publicationDiv = document.querySelector('.publication-page');
        if (publicationDiv) {
          const link = publicationDiv.querySelector('a.btn[href*=".pdf"]');
          if (link) {
            return {
              href: link.href,
              text: link.textContent.trim()
            };
          }
        }
        return null;
      });

      if (pdfLink) {
        console.log(`  ✓ Found PDF: ${pdfLink.href}`);
        pdfLinks.push({
          pageUrl: url,
          pdfUrl: pdfLink.href,
          linkText: pdfLink.text
        });
        successCount++;

        // Save to file after each successful find
        fs.writeFileSync('pdf-links.json', JSON.stringify(pdfLinks, null, 2));
        console.log(`  Updated pdf-links.json (${pdfLinks.length} total links)`);
      } else {
        console.log(`  ✗ No PDF link found`);
        failCount++;
      }

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`PDF link extraction complete!`);
  console.log(`  Found: ${pdfLinks.length} PDF links`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${dataUrls.length}`);

  // Download the PDFs
  if (pdfLinks.length > 0) {
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

  await browser.close();
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

downloadReports().catch(console.error);
