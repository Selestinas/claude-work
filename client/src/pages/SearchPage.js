import { useState, useRef, useEffect, useCallback } from 'react';
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

const RECENT_SEARCHES_KEY = 'bookshelf_recent_searches';

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)));
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

  // Suggestions & dropdown
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const statuses = [
    { key: 'read', label: t('search.read') },
    { key: 'want-to-read', label: t('search.wantToRead') },
    { key: 'favorite', label: t('search.favorite') },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced suggestions
  const fetchSuggestions = useCallback(async (value) => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await booksApi.suggest(value);
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    setRecentSearches(getRecentSearches());
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const fetchStatuses = async (booksList) => {
    try {
      const keys = booksList.map((b) => b.openLibraryKey);
      const { data } = await userBooksApi.getStatuses(keys);
      setBookStatuses(data);
    } catch (err) {
      console.error('Fetch statuses failed:', err);
    }
  };

  const handleSearch = async (e, searchPage = 1, searchQuery) => {
    if (e) e.preventDefault();
    const q = searchQuery || query;
    if (!q.trim()) return;
    setShowDropdown(false);
    setSuggestions([]);
    setLoading(true);
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    try {
      const { data } = await booksApi.search(q, searchPage);
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

  const handleSuggestionClick = (title) => {
    setQuery(title);
    setShowDropdown(false);
    setSuggestions([]);
    handleSearch(null, 1, title);
  };

  const handleRecentClick = (q) => {
    setQuery(q);
    setShowDropdown(false);
    handleSearch(null, 1, q);
  };

  const handleToggle = async (book, status) => {
    const existing = bookStatuses[book.openLibraryKey];

    if (existing && existing.status === status) {
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

  const showRecent = showDropdown && !query && recentSearches.length > 0;
  const showSuggestions = showDropdown && query && suggestions.length > 0;

  return (
    <div className="search-page">
      {toast && <div className="toast">{toast}</div>}
      <h2>{t('search.title')}</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={t('search.placeholder')}
          />
          {query && (
            <button type="button" className="btn-clear" onClick={handleClear}>
              &times;
            </button>
          )}

          {showRecent && (
            <div className="search-dropdown" ref={dropdownRef}>
              <div className="dropdown-header">{t('search.recentSearches')}</div>
              {recentSearches.map((q, i) => (
                <div
                  key={i}
                  className="dropdown-item dropdown-recent"
                  onClick={() => handleRecentClick(q)}
                >
                  <span className="dropdown-icon">&#128339;</span>
                  {q}
                </div>
              ))}
            </div>
          )}

          {showSuggestions && (
            <div className="search-dropdown" ref={dropdownRef}>
              {suggestions.map((s) => (
                <div
                  key={s.openLibraryKey}
                  className="dropdown-item dropdown-suggestion"
                  onClick={() => handleSuggestionClick(s.title)}
                >
                  {s.coverUrl && (
                    <img src={s.coverUrl} alt="" className="dropdown-cover" />
                  )}
                  <div className="dropdown-text">
                    <span className="dropdown-title">{s.title}</span>
                    <span className="dropdown-author">{s.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
