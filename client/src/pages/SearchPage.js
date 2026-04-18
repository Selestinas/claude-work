import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { booksApi, userBooksApi } from '../services/api';

function BookDescription({ text }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div className="book-description-wrap">
      <p ref={textRef} className={`book-description ${expanded ? 'expanded' : ''}`}>
        {text}
      </p>
      {isOverflowing && (
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('search.showLess') : t('search.showMore')}
        </button>
      )}
    </div>
  );
}

function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookStatuses, setBookStatuses] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const statuses = [
    { key: 'read', label: t('search.read') },
    { key: 'want-to-read', label: t('search.wantToRead') },
    { key: 'favorite', label: t('search.favorite') },
  ];

  const fetchStatuses = async (booksList) => {
    try {
      const keys = booksList.map((b) => b.openLibraryKey);
      const { data } = await userBooksApi.getStatuses(keys);
      setBookStatuses(data);
    } catch (err) {
      console.error('Fetch statuses failed:', err);
    }
  };

  const handleSearch = async (e, searchPage = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await booksApi.search(query, searchPage);
      setBooks(data.books);
      setTotal(data.total);
      setPage(searchPage);
      await fetchStatuses(data.books);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (book, status) => {
    const existing = bookStatuses[book.openLibraryKey];

    if (existing && existing.status === status) {
      // Remove from library
      try {
        await userBooksApi.remove(existing.id);
        setBookStatuses((prev) => {
          const updated = { ...prev };
          delete updated[book.openLibraryKey];
          return updated;
        });
        showToast(t('search.removedFromLibrary'));
      } catch (err) {
        console.error('Remove failed:', err);
      }
    } else if (existing) {
      // Change status
      try {
        await userBooksApi.updateStatus(existing.id, status);
        setBookStatuses((prev) => ({
          ...prev,
          [book.openLibraryKey]: { ...existing, status },
        }));
        showToast(t('search.addedToLibrary'));
      } catch (err) {
        console.error('Update failed:', err);
      }
    } else {
      // Add to library
      try {
        const { data } = await userBooksApi.add({ ...book, status });
        setBookStatuses((prev) => ({
          ...prev,
          [book.openLibraryKey]: { id: data.id, status },
        }));
        showToast(t('search.addedToLibrary'));
      } catch (err) {
        console.error('Add failed:', err);
      }
    }
  };

  return (
    <div className="search-page">
      {toast && <div className="toast">{toast}</div>}
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

      {loading && <div className="loading">{t('search.loading')}</div>}

      {!loading && books.length === 0 && query && (
        <p className="no-results">{t('search.noResults')}</p>
      )}

      <div className="book-grid">
        {books.map((book) => {
          const existing = bookStatuses[book.openLibraryKey];
          return (
            <div key={book.openLibraryKey} className="book-card">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="book-cover" />
              ) : (
                <div className="book-cover-placeholder">{t('search.noCover')}</div>
              )}
              <BookDescription text={book.description} />
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{t('search.by')} {book.author}</p>
                {book.firstPublishYear && (
                  <p className="book-year">{book.firstPublishYear}</p>
                )}
                <div className="book-actions">
                  {statuses.map((s) => (
                    <button
                      key={s.key}
                      className={`btn-status ${existing?.status === s.key ? 'btn-status-active' : ''}`}
                      onClick={() => handleToggle(book, s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total > 20 && (
        <div className="pagination">
          {page > 1 && (
            <button onClick={() => handleSearch(null, page - 1)}>
              {t('search.prev')}
            </button>
          )}
          <span>{t('search.page')} {page}</span>
          <button onClick={() => handleSearch(null, page + 1)}>
            {t('search.next')}
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
