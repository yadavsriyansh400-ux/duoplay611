
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from "../config";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('The verification link is invalid or incomplete.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams({ token, email });

        const response = await fetch(
          `${API_URL}/api/auth/verify-email?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Email verification failed.'
          );
        }

        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(
          error.message || 'Unable to verify your email. Please try again.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          DuoPlay<span>611</span>
        </Link>

        <p className="auth-kicker">ACCOUNT VERIFICATION</p>

        <h1>
          {status === 'loading'
            ? 'Verifying your email'
            : status === 'success'
              ? 'Email verified!'
              : 'Verification failed'}
        </h1>

        <div
          className={`auth-message ${
            status === 'success' ? 'success' : status === 'error' ? 'error' : ''
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>

        {status === 'success' && (
          <Link
            to="/login"
            className="btn btn-primary auth-submit"
          >
            Continue to login →
          </Link>
        )}

        {status === 'error' && (
          <Link to="/register" className="auth-back">
            Return to registration
          </Link>
        )}

        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

export default VerifyEmail;
