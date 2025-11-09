import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import ErrorCenter from '@/components/errors/ErrorCenter';

const GlobalErrorContext = createContext(null);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const GlobalErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const reportError = useCallback((error, meta = {}) => {
    const message =
      typeof error === 'string'
        ? error
        : error?.message || 'Произошла неизвестная ошибка';
    setErrors((prev) => [...prev, { id: generateId(), message, meta }]);
  }, []);

  const dismissError = useCallback((id) => {
    setErrors((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({
      reportError,
      dismissError,
    }),
    [reportError, dismissError],
  );

  return (
    <GlobalErrorContext.Provider value={contextValue}>
      {children}
      <ErrorCenter errors={errors} onDismiss={dismissError} />
    </GlobalErrorContext.Provider>
  );
};

export const useGlobalErrors = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalErrors must be used within GlobalErrorProvider');
  }
  return context;
};

export default GlobalErrorContext;
