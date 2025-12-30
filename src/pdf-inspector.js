const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Extract metadata and first page content from a PDF file
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Object>} Object containing metadata and first page info
 */
async function inspectPDF(pdfPath) {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse the PDF - parse all pages to get text, but we'll only show first page
    const data = await pdf(dataBuffer);

    // Extract metadata
    const metadata = data.info || {};

    // Get first page content
    // Split by page breaks or take first portion of text
    const fullText = data.text || '';
    const lines = fullText.split('\n');
    const firstPageLines = lines.slice(0, 50); // First 50 lines as approximation
    const firstPageText = firstPageLines.join('\n');

    // Build result object
    const result = {
      fileName: path.basename(pdfPath),
      fileSize: `${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`,
      metadata: {
        title: metadata.Title || 'N/A',
        author: metadata.Author || 'N/A',
        subject: metadata.Subject || 'N/A',
        creator: metadata.Creator || 'N/A',
        producer: metadata.Producer || 'N/A',
        creationDate: metadata.CreationDate || 'N/A',
        modificationDate: metadata.ModDate || 'N/A',
        keywords: metadata.Keywords || 'N/A',
      },
      pageInfo: {
        totalPages: data.numpages,
        firstPagePreview: firstPageText,
        firstPageLength: firstPageText.length,
      },
      rawMetadata: metadata, // Include all raw metadata
    };

    return result;
  } catch (error) {
    throw new Error(`Failed to inspect PDF: ${error.message}`);
  }
}

/**
 * Pretty print the PDF inspection results
 * @param {Object} info - PDF information object
 */
function printPDFInfo(info) {
  console.log('\n=== PDF INSPECTION RESULTS ===\n');
  console.log(`File: ${info.fileName}`);
  console.log(`Size: ${info.fileSize}`);
  console.log(`Total Pages: ${info.pageInfo.totalPages}`);

  console.log('\n--- METADATA ---');
  Object.entries(info.metadata).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n--- FIRST PAGE PREVIEW ---');
  if (info.pageInfo.firstPagePreview) {
    console.log(info.pageInfo.firstPagePreview);
    console.log(`\n(Showing first ${info.pageInfo.firstPageLength} characters)`);
  } else {
    console.log('No text content extracted (may be an image-based PDF)');
  }
  console.log('\n=== END OF INSPECTION ===\n');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node pdf-inspector.js <path-to-pdf>');
    console.error('Example: node pdf-inspector.js ../kastanjehaven-plejeboliger.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found: ${pdfPath}`);
    process.exit(1);
  }

  inspectPDF(pdfPath)
    .then(info => {
      printPDFInfo(info);

      // Optionally save to JSON file
      if (args.includes('--json')) {
        const jsonPath = pdfPath.replace('.pdf', '-info.json');
        fs.writeFileSync(jsonPath, JSON.stringify(info, null, 2));
        console.log(`JSON output saved to: ${jsonPath}`);
      }
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

// Export for use as a module
module.exports = { inspectPDF, printPDFInfo };
