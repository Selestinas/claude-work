import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <button className="lang-switcher" onClick={toggle}>
      {i18n.language === 'en' ? 'RU' : 'EN'}
    </button>
  );
}

export default LanguageSwitcher;
