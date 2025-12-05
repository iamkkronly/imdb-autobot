const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { query } = req;
  const { url, id } = query;

  let targetUrl = '';

  if (url) {
    targetUrl = url;
  } else if (id) {
    targetUrl = `https://www.imdb.com/title/${id}/`;
  } else {
    return res.status(400).json({ error: 'Please provide a "url" or "id" query parameter.' });
  }

  // Basic validation
  if (!targetUrl.includes('imdb.com/title/')) {
       return res.status(400).json({ error: 'Invalid IMDb URL. Must be a title URL.' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // We need to inspect the HTML to find the right selectors.
    // For now, I'll attempt some common JSON-LD extraction which is more robust than CSS selectors if available.

    let movieData = {};

    const jsonLdScript = $('script[type="application/ld+json"]');
    if (jsonLdScript.length) {
        try {
            const jsonLd = JSON.parse(jsonLdScript.html());
            movieData = {
                title: jsonLd.name,
                image: jsonLd.image,
                description: jsonLd.description,
                rating: jsonLd.aggregateRating ? jsonLd.aggregateRating.ratingValue : null,
                genre: jsonLd.genre,
                datePublished: jsonLd.datePublished,
                type: jsonLd['@type']
            };
        } catch (e) {
            console.error("Failed to parse JSON-LD", e);
        }
    }

    // Fallback or additional data via selectors if JSON-LD is missing or incomplete
    if (!movieData.title) {
        movieData.title = $('h1').text().trim();
    }

    res.status(200).json(movieData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
};
