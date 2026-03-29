import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

function LoginPage({ onLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendCode(email);
      setCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyCode(email, code);
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>{t('app.title')}</h1>
          <LanguageSwitcher />
        </div>
        <h2>{t('auth.title')}</h2>

        {error && <div className="error-message">{error}</div>}

        {!codeSent ? (
          <form onSubmit={handleSendCode}>
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? '...' : t('auth.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="code-sent-msg">{t('auth.codeSent')}</p>
            <label>{t('auth.code')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('auth.codePlaceholder')}
              maxLength={6}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? '...' : t('auth.verify')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
