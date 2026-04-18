const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

// Fetch description from Open Library Works API
function cleanDescription(text) {
  if (!text) return null;
  // Remove markdown links, source references, and "Also contained in" sections
  let clean = text
    .replace(/\[source\].*$/s, '')
    .replace(/----------.*/s, '')
    .replace(/Also contained in:?.*/s, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  return clean || null;
}

async function fetchDescription(key) {
  try {
    const response = await fetch(`https://openlibrary.org${key}.json`);
    const data = await response.json();
    if (data.description) {
      const raw = typeof data.description === 'string'
        ? data.description
        : data.description.value || null;
      return cleanDescription(raw);
    }
    return null;
  } catch {
    return null;
  }
}

// Search books via Open Library
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `${OPEN_LIBRARY_SEARCH}?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;

    const response = await fetch(url);
    const data = await response.json();

    const books = (data.docs || []).map((doc) => ({
      openLibraryKey: doc.key,
      title: doc.title,
      author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
      coverId: doc.cover_i || null,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
      firstPublishYear: doc.first_publish_year || null,
    }));

    // Fetch descriptions in parallel
    const booksWithDescriptions = await Promise.all(
      books.map(async (book) => {
        const description = await fetchDescription(book.openLibraryKey);
        if (description) console.log(`Description found for: ${book.title}`);
        return { ...book, description };
      })
    );
    console.log(`Search: ${books.length} books, ${booksWithDescriptions.filter(b => b.description).length} with descriptions`);

    res.json({
      total: data.numFound || 0,
      page: Number(page),
      books: booksWithDescriptions,
    });
  } catch (error) {
    console.error('Book search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
