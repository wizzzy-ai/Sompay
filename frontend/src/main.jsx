import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Load non-critical CSS asynchronously after initial render
const loadNonCriticalCSS = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/index.css';
  link.onload = () => {
    // CSS loaded, can add any post-load logic here
  };
  document.head.appendChild(link);
};

// Load CSS after initial paint
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNonCriticalCSS);
} else {
  loadNonCriticalCSS();
}

// Handle bfcache restoration
const handlePageShow = (event) => {
  if (event.persisted) {
    // Page was restored from bfcache
    console.log('Page restored from bfcache');
    // Re-initialize any necessary state or connections
    window.location.reload();
  }
};

const handlePageHide = () => {
  // Clean up before page is cached
  console.log('Page being cached');
};

window.addEventListener('pageshow', handlePageShow);
window.addEventListener('pagehide', handlePageHide);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
