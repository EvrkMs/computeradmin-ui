import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/errors/ErrorBoundary';
import { GlobalErrorProvider } from './contexts/GlobalErrorContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary onReset={() => window.location.reload()}>
      <GlobalErrorProvider>
        <App />
      </GlobalErrorProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
