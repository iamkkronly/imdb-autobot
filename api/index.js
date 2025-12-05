const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { query } = req;
  const { url, id, title } = query;

  let targetUrl = '';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    if (url) {
      targetUrl = url;
    } else if (id) {
      targetUrl = `https://www.imdb.com/title/${id}/`;
    } else if (title) {
      const searchUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`;
      const searchResponse = await axios.get(searchUrl, { headers });
      const $search = cheerio.load(searchResponse.data);

      // Select the first result link
      const firstResult = $search('.ipc-metadata-list-summary-item .ipc-title-link-wrapper').first();
      const href = firstResult.attr('href');

      if (!href) {
        return res.status(404).json({ error: 'No results found for the given title.' });
      }

      // Ensure we have an absolute URL
      targetUrl = `https://www.imdb.com${href}`;
      // Clean up the URL (remove query params for cleaner internal handling if needed, but not strictly necessary)
      targetUrl = targetUrl.split('?')[0];

      if (!targetUrl.includes('/title/')) {
          // Sometimes the first result might be a name (actor) if the title matches their name exactly?
          // But usually IMDb prioritizes titles if it looks like a title.
          // Let's iterate to find the first '/title/' link if the first one isn't.
           let foundTitle = false;
           $search('.ipc-metadata-list-summary-item .ipc-title-link-wrapper').each((i, el) => {
               const link = $search(el).attr('href');
               if (link && link.includes('/title/')) {
                   targetUrl = `https://www.imdb.com${link.split('?')[0]}`;
                   foundTitle = true;
                   return false; // break loop
               }
           });

           if (!foundTitle) {
               return res.status(404).json({ error: 'No movie title found for the query.' });
           }
      }

    } else {
      return res.status(400).json({ error: 'Please provide a "url", "id", or "title" query parameter.' });
    }

    // Basic validation
    if (!targetUrl.includes('imdb.com/title/')) {
         return res.status(400).json({ error: 'Invalid IMDb URL resolved. Must be a title URL.' });
    }

    const response = await axios.get(targetUrl, { headers });

    const html = response.data;
    const $ = cheerio.load(html);

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

    if (!movieData.title) {
        movieData.title = $('h1').text().trim();
    }

    res.status(200).json(movieData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
};
