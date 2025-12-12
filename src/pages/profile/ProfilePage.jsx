import React, { useEffect, useState, useEffectEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserInfoCard from './components/UserInfoCard';
import TelegramCard from './components/TelegramCard';
import SessionsCard from './components/SessionsCard';

const ProfilePage = () => {
  const { authService } = useAuth();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');

  const [telegram, setTelegram] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramError, setTelegramError] = useState('');

  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');

  const loadUserInfo = useEffectEvent(async () => {
    try {
      setUserLoading(true);
      setUserError('');
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
    } catch (err) {
      setUserError('Не удалось загрузить данные пользователя');
      console.error('User info load failed:', err);
    } finally {
      setUserLoading(false);
    }
  });

  const loadTelegramInfo = useEffectEvent(async () => {
    try {
      setTelegramLoading(true);
      setTelegramError('');
      const telegramInfo = await authService.getTelegramInfo().catch(() => null);
      setTelegram(telegramInfo);
    } catch (err) {
      setTelegramError('Не удалось загрузить данные Telegram');
      console.error('Telegram info load failed:', err);
    } finally {
      setTelegramLoading(false);
    }
  });

  const loadSessions = useEffectEvent(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError('');
      const [sessionsData, currentSessionData] = await Promise.all([
        authService.getSessions(true),
        authService.getCurrentSession().catch(() => null),
      ]);
      setSessions(sessionsData || []);
      setCurrentSession(currentSessionData);
    } catch (err) {
      setSessionsError('Не удалось загрузить сессии');
      console.error('Sessions load failed:', err);
    } finally {
      setSessionsLoading(false);
    }
  });

  useEffect(() => {
    loadUserInfo();
    loadTelegramInfo();
    loadSessions();
  }, [authService]);

  const handleUnbindTelegram = () => {
    const target = authService.getTelegramFlowUrl('/Account/Telegram/Unbind');
    window.location.href = target;
  };

  const handleRevokeSession = async (id) => {
    try {
      await authService.revokeSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
      await loadSessions();
    } catch (err) {
      setSessionsError('Ошибка отзыва сессии');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await authService.revokeAllSessions();
      setSessions((prev) => prev.filter((session) => session.id === currentSession?.id));
      await loadSessions();
    } catch (err) {
      setSessionsError('Ошибка отзыва сессий');
    }
  };

  return (
    <div className="space-y-6">
      <UserInfoCard user={user} loading={userLoading} error={userError} onReload={loadUserInfo} />

      <TelegramCard
        telegram={telegram}
        loading={telegramLoading}
        error={telegramError}
        onReload={loadTelegramInfo}
        onBind={() => {
          const target = authService.getTelegramFlowUrl('/Account/Telegram/Bind');
          window.location.href = target;
        }}
        onUnbind={handleUnbindTelegram}
      />

      <SessionsCard
        sessions={sessions}
        currentSession={currentSession}
        loading={sessionsLoading}
        error={sessionsError}
        onReload={loadSessions}
        onRevoke={handleRevokeSession}
        onRevokeAll={handleRevokeAll}
      />
    </div>
  );
};

export default ProfilePage;
