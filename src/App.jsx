import React, { useState, useEffect } from 'react';
import Auth from './Components/Auth';
import Dashboard from './Components/Dashboard';
import LandingPage from './Components/LandingPage';

function App() {
  // Shuruat me hum check karenge ki token hai ya nahi
  const [page, setPage] = useState('login');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setPage('dashboard'); // Agar token hai toh seedha dashboard bhejo
    } else {
      setPage('home'); // Nahi hai toh landing page par rakho
    }
    setCheckingAuth(false); // Check poora ho gaya
  }, []);

  // Jab tak check chal raha hai, tab tak ek blank ya loading screen dikhao
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-sans">
        <div className="animate-pulse tracking-widest text-sm uppercase">Loading Session...</div>
      </div>
    );
  }

  return (
    <>
      {page === 'home' && <LandingPage setPage={setPage} />}
      {(page === 'login' || page === 'register') && <Auth page={page} setPage={setPage} />}
      {page === 'dashboard' && <Dashboard setPage={setPage} />}
    </>
  );
}

export default App;