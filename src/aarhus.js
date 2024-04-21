const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function scrapeData(plejehjem, url) {
    try {
      // Fetch HTML content of the page
  
      const { data } = await axios.get(url);
      // Load the HTML content that we previously fetched
      const $ = cheerio.load(data);
  
      // Select all of the list items in the 'plainlist' class
      const listItems = $('.accordion__item');
  
   
  
      // Use the .each method to iterate through the 'li' elements
      listItems.each((idx, el) => {
              
        const name = $('h2', el).text();
          
        plejehjem.push({        
          name: name,
          links: $('.list__link', el).map((idx, el) => {
                return {url: 'https://aarhus.dk' + el.attribs.href,
                        name: $('.list__content > span', el).text()}
          }).toArray()
        } );
      });
  
      // Display countries array to the console
      console.dir(plejehjem);

  
      // Save the data in the 'countries' array to a file 'countries.json'
      
    } catch (err) {
      console.error(err);
    }
  }
var urls = [
    'https://aarhus.dk/om-kommunen/sundhed-og-omsorg/tryghed-og-tilfredshed/tilsyn-paa-plejehjem-og-i-hjemmepleje/distrikt-midtvest',
    'https://aarhus.dk/om-kommunen/sundhed-og-omsorg/tryghed-og-tilfredshed/tilsyn-paa-plejehjem-og-i-hjemmepleje/distrikt-midtoest',
    'https://aarhus.dk/om-kommunen/sundhed-og-omsorg/tryghed-og-tilfredshed/tilsyn-paa-plejehjem-og-i-hjemmepleje/distrikt-nord',
    'https://aarhus.dk/om-kommunen/sundhed-og-omsorg/tryghed-og-tilfredshed/tilsyn-paa-plejehjem-og-i-hjemmepleje/distrikt-syd',
    'https://aarhus.dk/om-kommunen/sundhed-og-omsorg/tryghed-og-tilfredshed/tilsyn-paa-plejehjem-og-i-hjemmepleje/hjemmepleje-akuttilbud-og-rehabiliteringstilbud'
];
const plejehjem = [];
async function processUrls(plejehjem, urls) {
for (const url of urls) {
   
   // Create an array to store the final result

    console.log(url)
    await scrapeData(plejehjem, url);

 
}
}
processUrls(plejehjem, urls).then(() => {
fs.writeFile("aa.json", JSON.stringify(plejehjem, null, 2), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Successfully data written to the file!");
  });  
});