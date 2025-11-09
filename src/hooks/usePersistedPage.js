import { useState, useEffect } from 'react';
import {
  CURRENT_PAGE_STORAGE_KEY,
  DEFAULT_PAGE,
  EMPLOYEES_PAGE,
  NAV_PAGES,
} from '@/constants/navigation';

const getStoredPage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGE;
  }
  try {
    const stored = window.sessionStorage.getItem(CURRENT_PAGE_STORAGE_KEY);
    if (typeof stored === 'string' && NAV_PAGES.includes(stored)) {
      return stored;
    }
  } catch {
    // ignore storage access errors
  }
  return DEFAULT_PAGE;
};

export const usePersistedPage = ({ canViewEmployees }) => {
  const [currentPage, setCurrentPage] = useState(getStoredPage);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(CURRENT_PAGE_STORAGE_KEY, currentPage);
    } catch {
      // ignore storage write errors
    }
  }, [currentPage]);

  useEffect(() => {
    if (!NAV_PAGES.includes(currentPage)) {
      setCurrentPage(DEFAULT_PAGE);
      return;
    }
    if (!canViewEmployees && currentPage === EMPLOYEES_PAGE) {
      setCurrentPage(DEFAULT_PAGE);
    }
  }, [canViewEmployees, currentPage]);

  return { currentPage, setCurrentPage };
};

export default usePersistedPage;
