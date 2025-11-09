import { useEffect } from 'react';

const PAGE_LOADERS = [
  () => import('@/pages/ProfilePage'),
  () => import('@/pages/safe/SafePage'),
  () => import('@/pages/employees/EmployeesPage'),
];

export const usePrefetchPages = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const preload = () => {
      PAGE_LOADERS.forEach((load) => {
        Promise.resolve()
          .then(load)
          .catch((err) => {
            console.warn('Prefetch page chunk failed:', err);
          });
      });
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(preload, 1000);
    return () => window.clearTimeout(timer);
  }, []);
};

export default usePrefetchPages;
