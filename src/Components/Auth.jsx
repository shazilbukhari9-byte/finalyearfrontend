import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Code, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import Loader from './Loader';
import { useToast } from '../lib/useToast';
import './Auth.css';

const EMPTY_LOGIN = { username: '', password: '' };
const EMPTY_REGISTER = { username: '', email: '', password: '' };

const NEW_USER_BENEFITS = [
  'Instant AI root-cause analysis',
  'Working fixes you can copy',
  'Every session saved to history',
];

const RETURNING_USER_BENEFITS = [
  'Your scan history is waiting',
  'Works with any language',
  'Light and dark themes',
];

const BenefitList = ({ items }) => (
  <ul className="auth-features">
    {items.map((item) => (
      <li key={item}>
        <Check size={15} strokeWidth={3} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const BackToHome = ({ onClick }) => (
  <button type="button" className="auth-back" onClick={onClick}>
    <ArrowLeft size={14} />
    Back to home
  </button>
);

const Field = ({ icon, type = 'text', value, onChange, placeholder, autoComplete, minLength, name }) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="auth-field">
      {icon}
      <input
        name={name}
        type={isPassword && visible ? 'text' : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        aria-label={placeholder}
      />
      {isPassword && (
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </label>
  );
};

const Brand = ({ onClick, className = '' }) => (
  <button type="button" onClick={onClick} className={`auth-brand ${className}`} aria-label="Back to home">
    <span className="auth-brand-mark">
      <Code size={16} />
    </span>
    <span>ShazDebug</span>
  </button>
);

/**
 * Sign in + sign up in one sliding layout. `page` is 'login' or 'register';
 * the component stays mounted when it changes so the panel can animate.
 */
const Auth = ({ page, setPage }) => {
  const isRegister = page === 'register';

  const [showLoader, setShowLoader] = useState(true);
  const [loginData, setLoginData] = useState(EMPTY_LOGIN);
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const redirectTimer = useRef(null);
  const toast = useToast();

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const goTo = (target) => setPage(target);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/login', {
        username: loginData.username.trim(),
        password: loginData.password,
      });
      localStorage.setItem('token', res.data.access_token);
      toast.success('Signed in', 'Welcome back to ShazDebug.');
      setPage('dashboard');
    } catch (err) {
      toast.error('Sign in failed', getErrorMessage(err, 'Invalid credentials'));
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/register', {
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
      });
      toast.success('Account created', 'You can sign in now.');
      setLoginData({ username: registerData.username.trim(), password: '' });
      setRegisterData(EMPTY_REGISTER);
      setRedirecting(true);
      redirectTimer.current = setTimeout(() => {
        setRedirecting(false);
        setPage('login');
      }, 1200);
    } catch (err) {
      toast.error('Sign up failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}

      <div className={`auth-container font-sans ${isRegister ? 'sign-up-mode' : ''}`}>
        <Brand onClick={() => setPage('home')} />
        <Brand onClick={() => setPage('home')} className="auth-brand-alt" />

        <div className="auth-forms">
          <div className="auth-forms-inner">
            {/* SIGN IN */}
            <form className="auth-form sign-in-form" onSubmit={handleLogin} inert={isRegister}>
              <h2 className="auth-title">Sign in</h2>
              <p className="auth-subtitle">Welcome back. Enter your details to continue.</p>
              <Field
                name="username"
                icon={<User size={16} />}
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Username"
                autoComplete="username"
              />
              <Field
                name="password"
                type="password"
                icon={<Lock size={16} />}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Password"
                autoComplete="current-password"
              />
              <button type="submit" className="auth-btn" disabled={submitting}>
                {submitting && !isRegister ? 'Please wait' : 'Login'}
              </button>
              <p className="auth-switch">
                New here? <button type="button" onClick={() => goTo('register')}>Sign up</button>
              </p>
              <BackToHome onClick={() => setPage('home')} />
            </form>

            {/* SIGN UP */}
            <form className="auth-form sign-up-form" onSubmit={handleRegister} inert={!isRegister}>
              <h2 className="auth-title">Sign up</h2>
              <p className="auth-subtitle">Create your account and start fixing bugs in minutes.</p>
              <Field
                name="username"
                icon={<User size={16} />}
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                placeholder="Username"
                autoComplete="username"
              />
              <Field
                name="email"
                type="email"
                icon={<Mail size={16} />}
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="Email"
                autoComplete="email"
              />
              <Field
                name="password"
                type="password"
                icon={<Lock size={16} />}
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="Password (min 6 characters)"
                autoComplete="new-password"
                minLength={6}
              />
              <button type="submit" className="auth-btn" disabled={submitting || redirecting}>
                {submitting && isRegister ? 'Please wait' : 'Sign up'}
              </button>
              <p className="auth-switch">
                One of us? <button type="button" onClick={() => goTo('login')}>Sign in</button>
              </p>
              <BackToHome onClick={() => setPage('home')} />
            </form>
          </div>
        </div>

        <div className="auth-panels">
          <div className="auth-panel left-panel">
            <div className="auth-panel-content">
              <h3>New here?</h3>
              <p>Join ShazDebug and fix your first bug in seconds.</p>
              <BenefitList items={NEW_USER_BENEFITS} />
              <button type="button" className="auth-ghost-btn" onClick={() => goTo('register')}>
                Sign up
              </button>
            </div>
          </div>
          <div className="auth-panel right-panel">
            <div className="auth-panel-content">
              <h3>One of us?</h3>
              <p>Welcome back! Sign in to continue debugging.</p>
              <BenefitList items={RETURNING_USER_BENEFITS} />
              <button type="button" className="auth-ghost-btn" onClick={() => goTo('login')}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
