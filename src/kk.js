// Loading the dependencies, but we don't need 'pretty'
// since we won't be logging HTML to the terminal.
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// URL of the page we want to scrape
const url = "https://boligertilaeldre.kk.dk/plejehjem/tilsyn-og-rapporter";

const scrapePlejehjem = async (link) => {
    console.log(link);
    const { data } = await axios.get(link);

    // Load the HTML content that we previously fetched
    const $ = cheerio.load(data);

    const pdfs = $('.field--type-entity-reference-revisions .file--application-pdf a')
    
    const links = [];

    pdfs.each((idx, el) => {
      
        const link = $(el).attr('href');
        const name = $(el).text();
       
         links.push({
            url: `https://boligertilaeldre.kk.dk${link}`,
            name: name
         });
       });
    return links;
}

// Async function that performs the actual scraping
async function scrapeData() {
  try {
    // Fetch HTML content of the page

    const { data } = await axios.get(url);
    // Load the HTML content that we previously fetched
    const $ = cheerio.load(data);

    // Select all of the list items in the 'plainlist' class
    const listItems = $(".paragraph--type--link-box .link-animate-on-hover");

    // Create an array to store the final result
    const plejehjem = [];

    // Use the .each method to iterate through the 'li' elements
    listItems.each((idx, el) => {
      
     const link = $(el).attr('href');
    const name = $(el).text()
        
      plejehjem.push({
        url: `https://boligertilaeldre.kk.dk${link}`,
        name: name
      } );
    });

    // Display countries array to the console
    console.dir(plejehjem);

    for (const e of plejehjem)
    {
        console.log(e.name);
        e.links = await scrapePlejehjem(e.url);
    }

    // Save the data in the 'countries' array to a file 'countries.json'
    fs.writeFile("countries.json", JSON.stringify(plejehjem, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Successfully data written to the file!");
    });
  } catch (err) {
    console.error(err);
  }
}

scrapeData();
