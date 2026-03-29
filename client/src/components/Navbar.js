import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar({ onLogout }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/search" className="navbar-brand">{t('app.title')}</Link>
      <div className="navbar-links">
        <Link
          to="/search"
          className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}
        >
          {t('nav.search')}
        </Link>
        <Link
          to="/library"
          className={`nav-link ${location.pathname === '/library' ? 'active' : ''}`}
        >
          {t('nav.library')}
        </Link>
        <LanguageSwitcher />
        <button className="btn-logout" onClick={onLogout}>
          {t('app.logout')}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
