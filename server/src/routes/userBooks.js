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

// Add book to user's library
router.post('/', async (req, res) => {
  try {
    const { openLibraryKey, title, author, coverId, firstPublishYear, status } = req.body;

    let book = await Book.findOne({ where: { openLibraryKey } });
    if (!book) {
      book = await Book.create({ openLibraryKey, title, author, coverId, firstPublishYear });
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

// Update book status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const userBook = await UserBook.findOne({
      where: { id: req.params.id, UserId: req.userId },
    });

    if (!userBook) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    await userBook.update({ status });
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
