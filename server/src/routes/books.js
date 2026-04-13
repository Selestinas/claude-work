const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

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

    const books = (data.docs || []).map((doc) => {
      let description = null;
      if (doc.first_sentence) {
        description = Array.isArray(doc.first_sentence)
          ? doc.first_sentence[0]
          : doc.first_sentence;
      }
      return {
        openLibraryKey: doc.key,
        title: doc.title,
        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
        coverId: doc.cover_i || null,
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
        firstPublishYear: doc.first_publish_year || null,
        description,
      };
    });

    res.json({
      total: data.numFound || 0,
      page: Number(page),
      books,
    });
  } catch (error) {
    console.error('Book search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
