# PDF Inspector

A JavaScript program to extract metadata and content from PDF files.

## Features

- Extract PDF metadata (title, author, creator, dates, etc.)
- Extract text content from the first page
- Display total page count and file size
- Export results to JSON format
- Use as a CLI tool or import as a module

## Installation

```bash
npm install
```

## Usage

### Command Line

**Basic usage:**
```bash
node src/pdf-inspector.js <path-to-pdf>
```

**Example:**
```bash
node src/pdf-inspector.js kastanjehaven-plejeboliger.pdf
```

**With JSON output:**
```bash
node src/pdf-inspector.js kastanjehaven-plejeboliger.pdf --json
```

This will create a JSON file with the same name as the PDF (e.g., `kastanjehaven-plejeboliger-info.json`).

### As a Module

```javascript
const { inspectPDF } = require('./src/pdf-inspector');

async function example() {
  const info = await inspectPDF('path/to/file.pdf');

  console.log(info.metadata.title);
  console.log(info.pageInfo.totalPages);
  console.log(info.pageInfo.firstPagePreview);
}

example();
```

See [src/example-usage.js](src/example-usage.js) for a complete example of processing multiple PDFs.

## Output Format

The program extracts the following information:

### Metadata
- **title**: Document title
- **author**: Document author
- **subject**: Document subject
- **creator**: Software that created the document
- **producer**: Software that produced the PDF
- **creationDate**: When the document was created
- **modificationDate**: Last modification date
- **keywords**: Document keywords

### Page Info
- **totalPages**: Number of pages in the PDF
- **firstPagePreview**: Text content from the first page (approximately first 50 lines)
- **firstPageLength**: Character count of the preview

### File Info
- **fileName**: Name of the PDF file
- **fileSize**: File size in KB

## Example Output

```
=== PDF INSPECTION RESULTS ===

File: kastanjehaven-plejeboliger.pdf
Size: 207.48 KB
Total Pages: 9

--- METADATA ---
title: Tilsynsrapport
author: N/A
subject: N/A
creator: Aspose Pty Ltd.
producer: Aspose.PDF for .NET 24.10.0
creationDate: D:20251217082637Z
modificationDate: D:20251219101031+01'00'
keywords: N/A

--- FIRST PAGE PREVIEW ---
Tilsynsrapport
Kastanjehaven Plejeboliger
...
```

## Dependencies

- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF parsing library

## License

ISC
