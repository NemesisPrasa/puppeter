const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');

// MongoDB Atlas connection URI
const uri = 'mongodb+srv://Nemesis:Nemesis@kdrama.7pez0qj.mongodb.net/ItzyStats'; // Replace with your connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Base URL for Instagram posts
const baseUrl = 'https://www.instagram.com/p/';

async function scrapeInstagramLikes(postUrl) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Rotate User-Agent
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(userAgent);

    let retries = 3; // Number of retries
    let likes = 'Could not find likes.';
    while (retries > 0) {
        try {
            await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            await page.waitForSelector('span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs', { timeout: 60000 });

            likes = await page.evaluate(() => {
                const likeElement = document.querySelector('span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs');
                return likeElement ? likeElement.innerText : 'Could not find likes.';
            });

            console.log(`Number of likes for ${postUrl}: ${likes}`);
            break; // Exit retry loop if successful
        } catch (error) {
            console.error(`Error scraping likes for ${postUrl}: ${error}`);
            retries -= 1;
            if (retries === 0) {
                console.error(`Failed after multiple retries for ${postUrl}`);
            } else {
                console.log(`Retrying (${3 - retries} attempts left)...`);
            }
        }
    }

    await browser.close();

    return { postUrl, likes };
}

async function saveToMongoDB(data) {
    try {
        await client.connect();
        const database = client.db('ItzyStats'); // Replace with your database name
        const collection = database.collection('ryujins'); // Replace with your collection name

        const result = await collection.insertOne(data);
        console.log(`Data saved with id ${result.insertedId}`);
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
    } finally {
        await client.close();
    }
}

// Array of Instagram post shortcodes
const shortcodes = [
    'C-nLGeTPgRd','C-fzeFXSi1k', 'C-NlFcavok7', 'C-DFCyEPpJi', 'C9jbx8EPOWT', 'C9UgznrPraJ',
    'C9J8f90v_-Y', 'C8-wB3hyxF5', 'C81JzMcvglA', 'C8lpe88PvNG', 'C8LVYi0Pw_a', 'C7-bv6_vz4W',
    'C7boY8kv1xU', 'C7a7FvgP4Ju', 'C7Q0HWsvdhp', 'C6-fvubvuLY', 'C61TbPPPmTd', 'C6skhT-PCcH',
    'C6chjnYPGbh', 'C6V8LZUPvfi', 'C6Q5squPfOE', 'C6LyDnnP0bX', 'C6G01jxpVsS', 'C5_oyHTv-nD',
    'C52hP9QPrBQ', 'C5lMCxwPYpg', 'C5bK5rTvv1N', 'C5XxFLVvMR9', 'C5K_KqbvU72', 'C5Al_J_v7Sj',
    'C44WY7QvWtr', 'C4uh3S0PprP', 'C4lZG0BSgYM', 'C4hL99mP4VI', 'C4UuxxrPi-E', 'C4MuT27vQZw',
    'C3_ewcpPmBa', 'C38D3c7sv9r', 'C35oOPvPei5', 'C307k0gsCLb', 'C3yhaCkvRSg', 'C3mjXY3Pruc',
    'C3hNj8MP7Bk', 'C3cUEQFv5_i', 'C3Z48agvnoF', 'C3Ud1u7Pm66', 'C3RqlB3v4o4', 'C3NKgcuPJlF',

];
(async () => {
    for (const shortcode of shortcodes) {
        const postUrl = `${baseUrl}${shortcode}/`;
        const data = await scrapeInstagramLikes(postUrl);
        await saveToMongoDB(data);
    }
})();
