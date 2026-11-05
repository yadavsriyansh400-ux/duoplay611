
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { API_URL } from "./config";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const controller = new AbortController();

    const verifySession = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setStatus('unauthenticated');
          return;
        }

        // Keep the latest user details returned by the backend.
        const user = data.user ?? data;

        sessionStorage.setItem('user', JSON.stringify(user));
        setStatus('authenticated');
      } catch (error) {
        if (error.name === 'AbortError') return;

        // A network failure is not proof that the token is invalid.
        // Show an error rather than incorrectly logging the user out.
        setStatus('error');
      }
    };

    verifySession();

    return () => controller.abort();
  }, []);

  if (status === 'checking') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p className="auth-description">Checking your session...</p>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'error') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Unable to connect</h1>
          <p className="auth-description">
            We couldn't verify your session. Check that the backend is running,
            then try again.
          </p>
          <button
            className="btn btn-primary auth-submit"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
