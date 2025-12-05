# IMDb Data API

A simple Node.js API to scrape IMDb data, ready to verify and deploy on Vercel.

## Deployment

This project is set up to be deployed as a Vercel Serverless Function.

## Usage

### Endpoint

`GET /api`

### Query Parameters

- `id`: The IMDb ID (e.g., `tt0111161`).
- `url`: The full IMDb URL (e.g., `https://www.imdb.com/title/tt0111161/`).

You must provide either `id` or `url`.

### Example

`GET /api?id=tt0111161`

### Response

```json
{
  "title": "The Shawshank Redemption",
  "image": "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
  "description": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
  "rating": 9.3,
  "genre": [
    "Drama"
  ],
  "datePublished": "1994-10-14",
  "type": "Movie"
}
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. You can create a test script to import and call the handler in `api/index.js` or use `vercel dev` if you have the Vercel CLI installed.
