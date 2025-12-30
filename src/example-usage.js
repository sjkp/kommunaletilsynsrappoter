const { inspectPDF } = require('./pdf-inspector');
const path = require('path');
const fs = require('fs');

// Recursively find all PDF files in a directory
function findPDFs(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findPDFs(filePath, fileList);
    } else if (path.extname(file).toLowerCase() === '.pdf') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Process all PDFs in the downloads folder
async function processAllPDFs() {
  const downloadsDir = path.join(__dirname, '..', 'downloads');

  // Check if downloads directory exists
  if (!fs.existsSync(downloadsDir)) {
    console.log('Downloads directory not found. Run the download script first.');
    return;
  }

  console.log('Scanning for PDFs in downloads folder...\n');

  // Find all PDF files recursively
  const pdfFiles = findPDFs(downloadsDir);

  console.log(`Found ${pdfFiles.length} PDF files\n`);
  console.log('='.repeat(60));

  const results = [];
  let processed = 0;
  let failed = 0;

  for (const pdfPath of pdfFiles) {
    try {
      const info = await inspectPDF(pdfPath);
      const relativePath = path.relative(downloadsDir, pdfPath);

      console.log(`\n[${processed + failed + 1}/${pdfFiles.length}] 📄 ${relativePath}`);

      // Extract key information from first page
      const preview = info.pageInfo.firstPagePreview;
      let cvrInfo = null;
      let inspectionDate = null;
      let extractedTitle = null;

      if (preview) {
        const lines = preview.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Extract title from first two lines
        if (lines.length >= 2) {
          extractedTitle = `${lines[0]} ${lines[1]}`.trim();
        } else if (lines.length === 1) {
          extractedTitle = lines[0];
        }

        // Extract CVR line and parse it
        const cvrLine = lines.find(line => line.includes('CVR-') || line.includes('CVR '));
        if (cvrLine) {
          console.log(`   CVR Line: ${cvrLine}`);

          // Parse CVR line - format: "CVR-nummer: XXXXXXXX P-nummer: XXXXXXXXXX SOR-ID: XXXXXXXXXXXXXXX"
          const cvrMatch = cvrLine.match(/CVR-?\s*nummer:\s*(\d+)/i);
          const pNummerMatch = cvrLine.match(/P-?\s*nummer:\s*(\d+)/i);
          const sorIdMatch = cvrLine.match(/SOR-?\s*ID:\s*(\d+)/i);

          cvrInfo = {
            raw: cvrLine,
            cvrNummer: cvrMatch ? cvrMatch[1] : null,
            pNummer: pNummerMatch ? pNummerMatch[1] : null,
            sorId: sorIdMatch ? sorIdMatch[1] : null
          };

          if (cvrInfo.cvrNummer) console.log(`   CVR-nummer: ${cvrInfo.cvrNummer}`);
          if (cvrInfo.pNummer) console.log(`   P-nummer: ${cvrInfo.pNummer}`);
          if (cvrInfo.sorId) console.log(`   SOR-ID: ${cvrInfo.sorId}`);
        }

        // Extract inspection date - look for "Dato for tilsynsbesøget:"
        const dateLine = lines.find(line => line.includes('Dato for tilsynsbesøget:'));
        if (dateLine) {
          // Extract date in DD-MM-YYYY format
          const dateMatch = dateLine.match(/(\d{2}-\d{2}-\d{4})/);
          if (dateMatch) {
            inspectionDate = dateMatch[1];
            console.log(`   Inspection Date: ${inspectionDate}`);
          }
        }
      }

      // Log extracted information
      if (extractedTitle) console.log(`   Title: ${extractedTitle}`);
      console.log(`   Pages: ${info.pageInfo.totalPages}`);
      console.log(`   Size: ${info.fileSize}`);

      results.push({
        file: relativePath,
        title: extractedTitle || info.metadata.title || 'N/A',
        pages: info.pageInfo.totalPages,
        created: info.metadata.creationDate,
        size: info.fileSize,
        cvrInfo: cvrInfo,
        inspectionDate: inspectionDate
      });

      processed++;
    } catch (error) {
      console.error(`\n[${processed + failed + 1}/${pdfFiles.length}] ✗ ${path.relative(downloadsDir, pdfPath)}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nProcessing complete!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${pdfFiles.length}`);

  // Save results to JSON
  fs.writeFileSync('pdf-processing-results.json', JSON.stringify(results, null, 2));
  console.log(`\nResults saved to pdf-processing-results.json`);
}

// Run the example
processAllPDFs().catch(console.error);
