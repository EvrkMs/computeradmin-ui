import React, { useState, useEffect, useCallback } from 'react';
import AuthContext from './contexts/AuthContext';
import AuthService from './services/AuthService';
import appVersion from './version.json';
import { primeAssetCache, clearAssetCaches } from './utils/cacheManager';
import ProfilePage from './pages/ProfilePage';
import EmployeesPage from './pages/employees/EmployeesPage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Users, LogOut, Moon, Sun, Loader2 } from 'lucide-react';

const THEME_STORAGE_KEY = 'computeradmin-ui-theme';

const App = () => {
  const [authService] = useState(() => new AuthService());
  const [currentPage, setCurrentPage] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [authRedirectStarted, setAuthRedirectStarted] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState('');
  const versionCheckInterval = 60000;
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const persisted = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (persisted === 'light' || persisted === 'dark') {
        return persisted;
      }
    } catch {
      // ignore storage access errors
    }
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore write errors
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadUser = useCallback(async () => {
    try {
      setGeneralError('');
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
      setAuthError(null);
      return userInfo;
    } catch (err) {
      console.error('Failed to load user:', err);
      if (err?.code === 'SESSION_EXPIRED' || err?.status === 401) {
        setAuthError('SESSION_EXPIRED');
      } else {
        setGeneralError('Не удалось загрузить данные пользователя');
      }
      setUser(null);
      return null;
    }
  }, [authService]);

  useEffect(() => {
    let cancelled = false;

    const sessionExpiredHandler = () => {
      setAuthError('SESSION_EXPIRED');
      setUser(null);
      setLoading(false);
    };

    authService.onSessionExpired(sessionExpiredHandler);

    const bootstrap = async () => {
      setLoading(true);
      try {
        if (authService.isSignInCallback()) {
          const redirectUrl = await authService.handleSignInCallback();
          if (!cancelled) {
            window.history.replaceState(
              {},
              document.title,
              redirectUrl || '/',
            );
          }
        } else if (authService.isLogoutCallback()) {
          const redirectUrl = await authService.handleLogoutCallback();
          if (!cancelled) {
            window.history.replaceState(
              {},
              document.title,
              redirectUrl || '/',
            );
          }
        } else {
          await authService.restoreSession();
        }

        if (!cancelled) {
          await Promise.all([
            loadUser(),
            primeAssetCache(),
          ]);
        }
      } catch (err) {
        console.error('Authentication bootstrap failed:', err);
        if (!cancelled) {
          if (err?.code === 'SESSION_EXPIRED' || err?.status === 401) {
            setAuthError('SESSION_EXPIRED');
            setUser(null);
          } else {
            setGeneralError('Не удалось загрузить данные пользователя');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      authService.onSessionExpired(null);
    };
  }, [authService, loadUser]);

  useEffect(() => {
    let cancelled = false;

    const compareVersions = (remote) => {
      if (!remote) return false;
      if (remote.version && remote.version !== appVersion.version) {
        return true;
      }
      if (remote.buildTime && remote.buildTime !== appVersion.buildTime) {
        return true;
      }
      return false;
    };

    const fetchVersion = async () => {
      try {
        const response = await window.fetch('/version.json', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setLatestVersion(data);
          if (compareVersions(data)) {
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.error('Version check failed:', err);
      }
    };

    fetchVersion();
    const timer = window.setInterval(fetchVersion, versionCheckInterval);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [versionCheckInterval]);

  useEffect(() => {
    if (authError === 'SESSION_EXPIRED') {
      if (!authRedirectStarted) {
        setAuthRedirectStarted(true);
        setAuthRedirectError('');
        void authService.login().catch((err) => {
          console.error('Failed to redirect to auth service:', err);
          setAuthRedirectError(
            'Не удалось автоматически перенаправить в систему авторизации. Обновите страницу или попробуйте позже.',
          );
        });
      }
    } else if (authRedirectStarted || authRedirectError) {
      setAuthRedirectStarted(false);
      setAuthRedirectError('');
    }
  }, [authError, authService, authRedirectError, authRedirectStarted]);

  const handleForceReload = async () => {
    try {
      await clearAssetCaches();
    } catch (err) {
      console.warn('Failed to clear caches before reload:', err);
    } finally {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <AuthContext.Provider value={{ authService, user, reloadUser: loadUser }}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
          <div className="text-gray-500 dark:text-slate-400">Загрузка...</div>
        </div>
      </AuthContext.Provider>
    );
  }

  if (authError === 'SESSION_EXPIRED') {
    return (
      <AuthContext.Provider value={{ authService, user, reloadUser: loadUser }}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Сессия истекла</CardTitle>
              <CardDescription>
                Для продолжения выполняется перенаправление в систему авторизации.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!authRedirectError ? (
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Переадресация...</span>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>{authRedirectError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ authService, user, reloadUser: loadUser }}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">ComputerAdminAuth</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {user?.full_name || user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-2"
                  aria-label="Переключить тему"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      <span className="hidden sm:inline">Светлая тема</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      <span className="hidden sm:inline">Тёмная тема</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void authService.logout();
                  }}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выход
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {updateAvailable && (
            <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 transition-colors">
              <AlertDescription className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-blue-900 dark:text-blue-100">
                <span className="text-sm sm:text-base">
                  Произошло обновление интерфейса. Сбросить кеш и загрузить новую версию?
                  {latestVersion?.version && (
                    <span className="ml-1 text-sm text-blue-700 dark:text-blue-200">
                      (доступна {latestVersion.version})
                    </span>
                  )}
                </span>
                <Button size="sm" onClick={handleForceReload}>
                  Обновить
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {generalError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-64 space-y-2">
              <Button
                variant={currentPage === 'profile' ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
                onClick={() => setCurrentPage('profile')}
              >
                <User className="h-4 w-4" />
                Профиль
              </Button>
              <Button
                variant={currentPage === 'employees' ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
                onClick={() => setCurrentPage('employees')}
              >
                <Users className="h-4 w-4" />
                Сотрудники
              </Button>
            </aside>

            {/* Page Content */}
            <main className="flex-1">
              {currentPage === 'profile' && <ProfilePage />}
              {currentPage === 'employees' && <EmployeesPage />}
            </main>
          </div>
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export default App;
