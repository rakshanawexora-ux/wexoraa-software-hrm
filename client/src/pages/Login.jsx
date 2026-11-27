import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import API from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-layout">
      <section className="login-brand" aria-label="Wexoraa Infotech">
        <img src="/logo.png" alt="Wexoraa Infotech" />
        <h1>Your employee workspace</h1>
        <p>Manage attendance, tasks, and daily reports.</p>
      </section>
      <section className="login-panel">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Sign in</h2>
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" autoComplete="username" value={email}
            onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p role="alert" className="login-error">{error}</p>}
          <button className="login-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
};

export default Login;
