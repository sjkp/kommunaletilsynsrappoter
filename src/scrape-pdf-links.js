const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapePdfLinks() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load the URLs from data-urls.json
  const dataUrls = JSON.parse(fs.readFileSync('data-urls.json', 'utf-8'));
  console.log(`Found ${dataUrls.length} URLs to process`);

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
  console.log(`\nPDF links saved to: pdf-links.json`);

  await browser.close();
}

scrapePdfLinks().catch(console.error);
