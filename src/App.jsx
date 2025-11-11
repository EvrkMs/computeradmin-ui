import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  useRef,
} from 'react';
import AuthContext from './contexts/AuthContext';
import AuthService from './services/AuthService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { usePersistedPage } from './hooks/usePersistedPage';
import { useVersionCheck } from './hooks/useVersionCheck';
import { usePrefetchPages } from './hooks/usePrefetchPages';
import { useGlobalErrors } from './contexts/GlobalErrorContext';
import AppShell from './components/layout/AppShell';
import HeaderBar from './components/layout/HeaderBar';
import SidebarNav from './components/layout/SidebarNav';
import VersionUpdates from './components/version/VersionUpdates';
import MetricsPanel from './components/metrics/MetricsPanel';
import { recordSectionLoadMetric } from './services/metrics/PerformanceMetricsService';
import {
  DEFAULT_PAGE,
  SAFE_PAGE,
  EMPLOYEES_PAGE,
} from './constants/navigation';

const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SafePage = React.lazy(() => import('./pages/safe/SafePage'));
const EmployeesPage = React.lazy(() => import('./pages/employees/EmployeesPage'));

const SectionLoadTracker = ({ page, loadStartsRef, children }) => {
  useEffect(() => {
    if (typeof performance === 'undefined') {
      recordSectionLoadMetric(page, null, { note: 'performance-unavailable' });
      return;
    }
    const started = loadStartsRef.current?.[page];
    if (typeof started === 'number') {
      const duration = performance.now() - started;
      recordSectionLoadMetric(page, duration);
      delete loadStartsRef.current[page];
    } else {
      recordSectionLoadMetric(page, null, { note: 'start-missing' });
    }
  }, [page, loadStartsRef]);

  return children;
};

const App = () => {
  const [authService] = useState(() => new AuthService());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const [authRedirectStarted, setAuthRedirectStarted] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState('');
  const [callbackError, setCallbackError] = useState('');
  const [metricsOpen, setMetricsOpen] = useState(false);
  const sectionLoadStarts = useRef({});
  const { theme, toggleTheme } = useTheme();
  const { reportError } = useGlobalErrors();
  const {
    latestVersion,
    updateAvailable,
    refetchVersion,
    channelError,
    isChecking,
  } = useVersionCheck({ interval: 60000 });

  usePrefetchPages();

  const loadUser = useCallback(async () => {
    try {
      setGeneralError('');
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
      setAuthError(null);
      return userInfo;
    } catch (err) {
      console.error('Failed to load user:', err);
      reportError(err, { hint: 'Не удалось загрузить данные пользователя' });
      if (err?.code === 'SESSION_EXPIRED' || err?.status === 401) {
        setAuthError('SESSION_EXPIRED');
      } else if (err?.code === 'NETWORK_ERROR') {
        setGeneralError(
          'Сервер аутентификации недоступен. Попробуйте позже или обратитесь к администратору.',
        );
      } else {
        setGeneralError('Не удалось загрузить данные пользователя');
      }
      setUser(null);
      return null;
    }
  }, [authService, reportError]);

  const replaceUrl = useCallback((target = '/') => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, document.title, target);
  }, []);

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
          try {
            const redirectUrl = await authService.handleSignInCallback();
            if (!cancelled) {
              replaceUrl(redirectUrl || '/');
              setCallbackError('');
            }
          } catch (err) {
            if (!cancelled) {
              replaceUrl('/');
              setCallbackError(
                'Не удалось завершить авторизацию. Попробуйте войти снова.',
              );
            }
            throw err;
          }
        } else if (authService.isLogoutCallback()) {
          try {
            const redirectUrl = await authService.handleLogoutCallback();
            if (!cancelled) {
              replaceUrl(redirectUrl || '/');
              setCallbackError('');
            }
          } catch (err) {
            if (!cancelled) {
              replaceUrl('/');
              setCallbackError(
                'Не удалось корректно завершить выход. Перезагрузите страницу.',
              );
            }
            throw err;
          }
        } else {
          await authService.restoreSession();
        }

        if (!cancelled) {
          await loadUser();
        }
      } catch (err) {
        console.error('Authentication bootstrap failed:', err);
        reportError(err, { hint: 'Проблема инициализации авторизации' });
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
  }, [authService, loadUser, reportError, replaceUrl]);

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
          reportError(err, { hint: 'Сбой автоматического входа' });
        });
      }
    } else if (authRedirectStarted || authRedirectError) {
      setAuthRedirectStarted(false);
      setAuthRedirectError('');
    }
  }, [authError, authService, authRedirectError, authRedirectStarted, reportError]);

  const handleForceReload = useCallback(() => {
    window.location.reload();
  }, []);

  const normalizedRoles = useMemo(() => {
    if (!user || !Array.isArray(user.roles)) return [];
    return user.roles
      .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
      .filter((role) => role.length > 0);
  }, [user]);

  const hasRole = useCallback(
    (role) => normalizedRoles.includes(role.trim().toLowerCase()),
    [normalizedRoles],
  );

  const permissions = useMemo(() => {
    const isRoot = hasRole('root');
    const hasRoleManager = hasRole('rolemanager');
    const hasSafeManager = hasRole('safemanager');
    return {
      isRoot,
      hasRoleManager,
      hasSafeManager,
      canViewEmployees: isRoot,
      canManageUsers: isRoot || hasRoleManager,
      canManageRoles: isRoot,
      canManageSafe: isRoot || hasSafeManager,
    };
  }, [hasRole]);

  const { currentPage, setCurrentPage } = usePersistedPage({
    canViewEmployees: permissions.canViewEmployees,
  });

  const navigateToPage = useCallback(
    (page) => {
      if (typeof performance !== 'undefined') {
        sectionLoadStarts.current[page] = performance.now();
      }
      setCurrentPage(page);
    },
    [setCurrentPage],
  );

  useEffect(() => {
    if (
      !loading &&
      typeof performance !== 'undefined' &&
      sectionLoadStarts.current[currentPage] == null
    ) {
      sectionLoadStarts.current[currentPage] = performance.now();
    }
  }, [loading, currentPage]);

  if (loading) {
    return (
      <AuthContext.Provider value={{ authService, user, reloadUser: loadUser }}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
          <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка...
          </div>
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
      <AppShell
        header={(
          <HeaderBar
            userName={user?.full_name || user?.name}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={() => {
              void authService.logout();
            }}
            channelError={channelError}
            onOpenMetrics={() => setMetricsOpen(true)}
          />
        )}
        banner={(
          <>
            {updateAvailable && (
              <VersionUpdates
                updateAvailable={updateAvailable}
                latestVersion={latestVersion}
                checking={isChecking}
                onReload={handleForceReload}
              />
            )}
            {callbackError && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{callbackError}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void authService.login();
                    }}
                    className="self-start sm:self-auto"
                  >
                    Повторить вход
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{generalError}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void loadUser().then(() => refetchVersion());
                    }}
                    className="self-start sm:self-auto"
                  >
                    Повторить запрос
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        sidebar={(
          <SidebarNav
            currentPage={currentPage}
            onNavigate={navigateToPage}
            canViewEmployees={permissions.canViewEmployees}
          />
        )}
      >
        <Suspense
          fallback={(
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Загрузка секции...
            </div>
          )}
        >
          {currentPage === DEFAULT_PAGE && (
            <SectionLoadTracker page={DEFAULT_PAGE} loadStartsRef={sectionLoadStarts}>
              <ProfilePage />
            </SectionLoadTracker>
          )}
          {currentPage === SAFE_PAGE && (
            <SectionLoadTracker page={SAFE_PAGE} loadStartsRef={sectionLoadStarts}>
              <SafePage canManageSafe={permissions.canManageSafe} />
            </SectionLoadTracker>
          )}
          {currentPage === EMPLOYEES_PAGE && (
            <SectionLoadTracker page={EMPLOYEES_PAGE} loadStartsRef={sectionLoadStarts}>
              <EmployeesPage
                canManageUsers={permissions.canManageUsers}
                canManageRoles={permissions.canManageRoles}
                hasRoleManager={permissions.hasRoleManager}
              />
            </SectionLoadTracker>
          )}
        </Suspense>
        <MetricsPanel open={metricsOpen} onOpenChange={setMetricsOpen} />
      </AppShell>
    </AuthContext.Provider>
  );
};

export default App;
