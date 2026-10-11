import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('');

  // Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('kds_token');
    const role = localStorage.getItem('kds_role');
    if (token && role) {
      if (role === 'Chef') {
        navigate('/kitchen', { replace: true });
      } else if (role === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/waiter', { replace: true });
      }
    }
  }, [navigate]);

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.detail || 'Login failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Save auth tokens
      localStorage.setItem('kds_token', data.access_token);
      localStorage.setItem('kds_role', data.role);
      localStorage.setItem('kds_username', data.username);

      if (data.role === 'Chef') {
        navigate('/kitchen');
      } else if (data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/waiter');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (registerPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (!registerRole) {
      setErrorMsg('Please select a system role.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registerUsername.trim(),
          password: registerPassword,
          role: registerRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.detail || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSuccessMsg('Account created successfully! You can now sign in.');
      setLoginUsername(registerUsername.trim());
      setLoginPassword('');
      setRegisterPassword('');
      setRegisterRole('');
      setTab('login');
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ margin: '0 auto 15px auto', width: '48px', height: '48px', fontSize: '1.5rem' }}>
            <i className="fa-solid fa-utensils"></i>
          </div>
          <h1>Smart KDS</h1>
          <p id="auth-subtitle">Kitchen Display & POS Optimizer</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                type="text"
                id="login-username"
                className="form-control"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className="form-control"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="register-username">Username</label>
              <input
                type="text"
                id="register-username"
                className="form-control"
                placeholder="Create a username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input
                type="password"
                id="register-password"
                className="form-control"
                placeholder="Create a password (min 4 characters)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-role">System Role</label>
              <select
                id="register-role"
                className="form-control"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
                required
              >
                <option value="" disabled>Select your role</option>
                <option value="Waiter">Waiter (POS Terminal)</option>
                <option value="Chef">Chef (Kitchen Display)</option>
                <option value="Admin">Admin (All Access)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              <i className="fa-solid fa-user-plus"></i>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
