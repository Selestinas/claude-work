const express = require('express');
const authMiddleware = require('../middleware/auth');
const { Book, UserBook } = require('../models');

const router = express.Router();
router.use(authMiddleware);

// Get user's books
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = { UserId: req.userId };
    if (status) where.status = status;

    const userBooks = await UserBook.findAll({
      where,
      include: [{ model: Book }],
      order: [['createdAt', 'DESC']],
    });

    res.json(userBooks);
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

function cleanDescription(text) {
  if (!text) return null;
  let clean = text
    .replace(/\[source\].*$/s, '')
    .replace(/----------.*/s, '')
    .replace(/Also contained in:?.*/s, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  return clean || null;
}

// Fetch description from Open Library Works API
async function fetchDescription(openLibraryKey) {
  try {
    const url = `https://openlibrary.org${openLibraryKey}.json`;
    const response = await fetch(url);
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

// Add book to user's library
router.post('/', async (req, res) => {
  try {
    const { openLibraryKey, title, author, coverId, firstPublishYear, status } = req.body;

    let book = await Book.findOne({ where: { openLibraryKey } });
    if (!book) {
      console.log('Fetching description for:', openLibraryKey);
      const description = await fetchDescription(openLibraryKey);
      console.log('Description result:', description ? description.substring(0, 100) : 'null');
      book = await Book.create({ openLibraryKey, title, author, coverId, firstPublishYear, description });
    }

    const existing = await UserBook.findOne({
      where: { UserId: req.userId, BookId: book.id },
    });
    if (existing) {
      return res.status(400).json({ error: 'Book already in your library' });
    }

    const userBook = await UserBook.create({
      UserId: req.userId,
      BookId: book.id,
      status: status || 'want-to-read',
    });

    res.status(201).json(userBook);
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// Get statuses of books by openLibraryKeys
router.post('/statuses', async (req, res) => {
  try {
    const { keys } = req.body;
    if (!keys || !keys.length) return res.json({});

    const books = await Book.findAll({
      where: { openLibraryKey: keys },
    });

    const bookIds = books.map((b) => b.id);
    const userBooks = await UserBook.findAll({
      where: { UserId: req.userId, BookId: bookIds },
      include: [{ model: Book, attributes: ['openLibraryKey'] }],
    });

    const statuses = {};
    userBooks.forEach((ub) => {
      statuses[ub.Book.openLibraryKey] = { id: ub.id, status: ub.status };
    });

    res.json(statuses);
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({ error: 'Failed to get statuses' });
  }
});

// Update book status or rating
router.put('/:id', async (req, res) => {
  try {
    const { status, rating } = req.body;
    const userBook = await UserBook.findOne({
      where: { id: req.params.id, UserId: req.userId },
    });

    if (!userBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (rating !== undefined) updates.rating = rating;
    await userBook.update(updates);
    res.json(userBook);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Remove book from library
router.delete('/:id', async (req, res) => {
  try {
    const userBook = await UserBook.findOne({
      where: { id: req.params.id, UserId: req.userId },
    });

    if (!userBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    await userBook.destroy();
    res.json({ message: 'Book removed' });
  } catch (error) {
    console.error('Remove book error:', error);
    res.status(500).json({ error: 'Failed to remove book' });
  }
});

module.exports = router;
