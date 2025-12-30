const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeAllPages() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const baseUrl = 'https://stps.dk/tilsynsrapporter?data=W3sicXVlcnkiOiIiLCJtb250aHMiOltdLCJjYXRlZ29yaXphdGlvbnMiOlsiMTQ4Nzg4YzQtYmY3Ni00YmFkLWFiZTUtYTIyOTg0MWRlZjkxIl0sImFkZGl0aW9uYWxGaWx0ZXJzIjp7fSwidGVtcGxhdGUiOiJBbGwiLCJwYWdlIjoiMSIsIm1vZHVsZUlkIjoibmFfZGFlODI0M2MtOGQ5OC00ZjMxLWE3M2UtMjVlZjI0MDNlYmUwIn1d';

  await page.goto(baseUrl);
  await page.waitForTimeout(2000); // Wait for initial load
  await page.waitForSelector('.ajaxhost');

  const allDataUrls = [];
  let pageNum = 1;
  let hasNextPage = true;

  // Loop through pages until no next button exists
  while (hasNextPage) {
    console.log(`Scraping page ${pageNum}...`);

    // Extract data-url attributes from current page
    const dataUrls = await page.evaluate(() => {
      const ajaxHost = document.querySelector('.ajaxhost');
      const elementsWithDataUrl = ajaxHost ? ajaxHost.querySelectorAll('[data-url]') : [];
      return Array.from(elementsWithDataUrl).map(el => el.getAttribute('data-url'));
    });

    console.log(`  Found ${dataUrls.length} URLs on page ${pageNum}`);
    allDataUrls.push(...dataUrls);

    // Save to file after each page
    fs.writeFileSync('data-urls.json', JSON.stringify(allDataUrls, null, 2));
    console.log(`  Updated data-urls.json (${allDataUrls.length} total URLs)`);

    // Check if there's a next page button
    const nextPageButton = await page.$('.pagination a.pagination-page.next');

    if (nextPageButton) {
      await nextPageButton.click();
      await page.waitForTimeout(1500); // Wait for page to load
      await page.waitForSelector('.ajaxhost');
      pageNum++;
    } else {
      hasNextPage = false;
      console.log('  No more pages found');
    }
  }

  console.log(`\nScraping complete! Total URLs collected: ${allDataUrls.length}`);
  console.log(`Scraped ${pageNum} pages`);
  console.log('Final data saved to data-urls.json');

  await browser.close();
}

scrapeAllPages().catch(console.error);
