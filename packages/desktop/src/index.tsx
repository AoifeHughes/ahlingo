import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Electron-specific setup
if (window.electronAPI) {
  console.log('Running in Electron environment');
  
  // Handle window close
  window.addEventListener('beforeunload', () => {
    // Cleanup any resources if needed
    console.log('App is closing...');
  });
} else {
  console.log('Running in browser environment');
}