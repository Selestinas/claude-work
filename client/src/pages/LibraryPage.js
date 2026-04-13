import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userBooksApi } from '../services/api';

function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating || 0) ? 'star-filled' : 'star-empty'}`}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function LibraryPage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const { data } = await userBooksApi.getAll(status);
      setBooks(data);
    } catch (err) {
      console.error('Fetch books failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleStatusChange = async (id, status) => {
    try {
      await userBooksApi.updateStatus(id, status);
      fetchBooks();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleRating = async (id, rating) => {
    try {
      await userBooksApi.updateRating(id, rating);
      fetchBooks();
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await userBooksApi.remove(id);
      fetchBooks();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const filters = [
    { key: 'all', label: t('library.all') },
    { key: 'read', label: t('library.read') },
    { key: 'want-to-read', label: t('library.wantToRead') },
    { key: 'favorite', label: t('library.favorite') },
  ];

  return (
    <div className="library-page">
      <h2>{t('library.title')}</h2>

      <div className="filter-tabs">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading">{t('search.loading')}</div>}

      {!loading && books.length === 0 && (
        <p className="empty-library">{t('library.empty')}</p>
      )}

      <div className="book-grid">
        {books.map((ub) => (
          <div key={ub.id} className="book-card">
            {ub.Book?.coverId ? (
              <img
                src={`https://covers.openlibrary.org/b/id/${ub.Book.coverId}-M.jpg`}
                alt={ub.Book.title}
                className="book-cover"
              />
            ) : (
              <div className="book-cover-placeholder">{t('search.noCover')}</div>
            )}
            {ub.Book?.description && (
              <p className="book-description">{ub.Book.description}</p>
            )}
            <div className="book-info">
              <h3 className="book-title">{ub.Book?.title}</h3>
              <p className="book-author">{ub.Book?.author}</p>
              <StarRating
                rating={ub.rating}
                onRate={(rating) => handleRating(ub.id, rating)}
              />
              <span className={`status-badge status-${ub.status}`}>
                {t(`library.${ub.status === 'want-to-read' ? 'wantToRead' : ub.status}`)}
              </span>
              <div className="book-actions">
                {ub.status !== 'read' && (
                  <button onClick={() => handleStatusChange(ub.id, 'read')}>
                    {t('library.markRead')}
                  </button>
                )}
                {ub.status !== 'favorite' && (
                  <button onClick={() => handleStatusChange(ub.id, 'favorite')}>
                    {t('library.markFavorite')}
                  </button>
                )}
                {ub.status !== 'want-to-read' && (
                  <button onClick={() => handleStatusChange(ub.id, 'want-to-read')}>
                    {t('library.markWantToRead')}
                  </button>
                )}
                <button className="btn-danger" onClick={() => handleRemove(ub.id)}>
                  {t('library.remove')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LibraryPage;
