import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App'; // Changed from './App' to '@/App' and default to named
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Import NotificationProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NotificationProvider> {/* NotificationProvider wraps AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);