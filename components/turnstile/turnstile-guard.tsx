'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TurnstileWidget from './index'; // Assuming index.tsx is the TurnstileWidget

interface TurnstileGuardProps {
  children: React.ReactNode;
}

const CloudflareLogo = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.383 6.237C15.063 4.92 13.191 4 11.001 4C6.031 4 2.001 8.03 2.001 13C2.001 17.97 6.031 22 11.001 22C14.391 22 17.311 20.11 18.991 17.25C18.991 17.25 19.001 17.25 19.001 17.25L19.001 13H11.001V9H22.001C22.001 10.13 21.751 11.2 21.301 12.17L16.383 6.237Z" fill={color} />
    <path d="M19 2H5C3.34 2 2 3.34 2 5V19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19V5C22 3.34 20.66 2 19 2ZM11 19C7.13 19 4 15.87 4 12C4 8.13 7.13 5 11 5C12.76 5 14.37 5.65 15.62 6.75L17.25 5.12C15.63 3.81 13.48 3 11 3C6.03 3 2 7.03 2 12C2 16.97 6.03 21 11 21C13.48 21 15.63 20.19 17.25 18.88L15.62 17.25C14.37 18.35 12.76 19 11 19Z" fill="none" /> {/* Simplified for example, actual logo is more complex */}
  </svg>
);

const LoadingSpinner = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill={color}>
    <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
    <g className="spinner_V8m1">
      <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3"></circle>
    </g>
  </svg>
);

const TurnstileGuard: React.FC<TurnstileGuardProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedVerification = sessionStorage.getItem('turnstileVerified');
    if (storedVerification === 'true') {
      setIsVerified(true);
      setIsLoading(false);
    }

    // Detect system theme
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleVerify = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        sessionStorage.setItem('turnstileVerified', 'true');
      } else {
        setError(data.error || 'Turnstile verification failed.');
        sessionStorage.removeItem('turnstileVerified');
      }
    } catch (err) {
      console.error('Error verifying Turnstile:', err);
      setError('An error occurred during verification.');
      sessionStorage.removeItem('turnstileVerified');
    }
    setIsLoading(false);
  };

  const handleTurnstileError = () => {
    setError('Turnstile widget failed to load or encountered an error.');
    setIsLoading(false);
    sessionStorage.removeItem('turnstileVerified');
  };

  const handleTurnstileExpire = () => {
    setError('Turnstile challenge expired. Please verify again.');
    setIsVerified(false);
    setIsLoading(true);
    sessionStorage.removeItem('turnstileVerified');
  };

  const styles = useMemo(() => ({
    container: {
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(10, 10, 25, 0.95)' : 'rgba(245, 245, 250, 0.95)',
      color: theme === 'dark' ? '#E0E0E0' : '#333333',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      textAlign: 'center' as 'center',
      padding: '20px',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    title: {
      fontSize: '2.2rem',
      fontWeight: 600,
      marginBottom: '0.75rem',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontSize: '1.1rem',
      marginBottom: '2.5rem',
      color: theme === 'dark' ? '#A0A0A0' : '#555555',
    },
    turnstileWrapper: {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: theme === 'dark' ? 'rgba(40, 40, 60, 0.7)' : 'rgba(255, 255, 255, 0.8)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
    },
    statusText: {
      marginTop: '1.5rem',
      fontSize: '0.95rem',
    },
    errorText: {
      color: theme === 'dark' ? '#FF6B6B' : '#D32F2F',
      fontWeight: 500,
    },
    footerText: {
      marginTop: 'auto',
      fontSize: '0.8rem',
      color: theme === 'dark' ? '#707070' : '#888888',
      paddingTop: '2rem',
      display: 'flex',
      alignItems: 'center',
    },
    logoContainer: {
      marginRight: '8px',
    }
  }), [theme]);

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={styles.title}>正在验证您的连接</h1>
        <p style={styles.subtitle}>请稍候，这通常只需要几秒钟。</p>
      </div>

      <div style={styles.turnstileWrapper}>
        <TurnstileWidget
          onVerify={handleVerify}
          onError={handleTurnstileError}
          onExpire={handleTurnstileExpire}
          options={{ theme: theme }} // Pass theme to Turnstile widget
        />
      </div>

      {isLoading && !error && (
        <div style={{ ...styles.statusText, display: 'flex', alignItems: 'center' }}>
          <LoadingSpinner color={theme === 'dark' ? '#A0A0A0' : '#555555'} />
          <span style={{ marginLeft: '10px' }}>正在验证...</span>
        </div>
      )}
      {error && <p style={{ ...styles.statusText, ...styles.errorText }}>验证失败: {error}</p>}

      {!isVerified && !isLoading && !error && (
        <p style={{ ...styles.statusText, color: theme === 'dark' ? '#A0A0A0' : '#666666' }}>
          为了保护服务安全，我们需要确认您不是机器人。
        </p>
      )}
      <div style={styles.footerText}>
        <div style={styles.logoContainer}>
          <CloudflareLogo color={theme === 'dark' ? '#FFA500' : '#F38020'} /> 
        </div>
        由 Cloudflare Turnstile 提供安全支持
      </div>
    </div>
  );
};

export default TurnstileGuard;