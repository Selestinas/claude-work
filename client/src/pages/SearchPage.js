import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { booksApi, userBooksApi } from '../services/api';

function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedBooks, setAddedBooks] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const handleSearch = async (e, searchPage = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await booksApi.search(query, searchPage);
      setBooks(data.books);
      setTotal(data.total);
      setPage(searchPage);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (book, status) => {
    try {
      await userBooksApi.add({ ...book, status });
      setAddedBooks((prev) => new Set([...prev, book.openLibraryKey]));
    } catch (err) {
      console.error('Add failed:', err);
    }
  };

  return (
    <div className="search-page">
      <h2>{t('search.title')}</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
        />
        <button type="submit" disabled={loading}>
          {t('search.button')}
        </button>
      </form>

      {loading && <div className="loading">Loading...</div>}

      {!loading && books.length === 0 && query && (
        <p className="no-results">{t('search.noResults')}</p>
      )}

      <div className="book-grid">
        {books.map((book) => (
          <div key={book.openLibraryKey} className="book-card">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="book-cover" />
            ) : (
              <div className="book-cover-placeholder">No Cover</div>
            )}
            <div className="book-info">
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">{t('search.by')} {book.author}</p>
              {book.firstPublishYear && (
                <p className="book-year">{book.firstPublishYear}</p>
              )}
              {addedBooks.has(book.openLibraryKey) ? (
                <span className="added-badge">{t('search.added')}</span>
              ) : (
                <div className="book-actions">
                  <button onClick={() => handleAdd(book, 'want-to-read')}>
                    {t('search.addToLibrary')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {total > 20 && (
        <div className="pagination">
          {page > 1 && (
            <button onClick={() => handleSearch(null, page - 1)}>Prev</button>
          )}
          <span>Page {page}</span>
          <button onClick={() => handleSearch(null, page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
