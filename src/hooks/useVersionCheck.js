import { useState, useEffect, useCallback, useRef } from 'react';
import appVersion from '@/version.json';

const DEFAULT_INTERVAL = 60000;

const serializeEvent = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const resolveRealtimeUrl = (envKey, fallbackPath) => {
  if (typeof window === 'undefined') return '';
  const envValue = import.meta.env[envKey];
  if (envValue) return envValue;
  const origin = window.location.origin.replace(/\/+$/, '');
  if (!fallbackPath) return origin;
  return `${origin}${fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`}`;
};

const toWsProtocol = (url) => {
  if (!url) return '';
  if (url.startsWith('ws://') || url.startsWith('wss://')) return url;
  if (url.startsWith('http://')) return url.replace('http://', 'ws://');
  if (url.startsWith('https://')) return url.replace('https://', 'wss://');
  return url;
};

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

const isRealtimeUpdatesEnabled =
  import.meta.env.VITE_ENABLE_REALTIME_UPDATES === 'true';

export const useVersionCheck = ({ interval = DEFAULT_INTERVAL } = {}) => {
  const [latestVersion, setLatestVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const abortRef = useRef(false);

  const fetchVersion = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsChecking(true);
    try {
      const response = await window.fetch('/version.json', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (abortRef.current) return;
      setLatestVersion(data);
      if (compareVersions(data)) {
        setUpdateAvailable(true);
      }
    } catch (err) {
      console.error('Version check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    abortRef.current = false;
    fetchVersion();
    const timer = window.setInterval(fetchVersion, interval);
    return () => {
      abortRef.current = true;
      window.clearInterval(timer);
    };
  }, [fetchVersion, interval]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isRealtimeUpdatesEnabled
    ) {
      return undefined;
    }
    let cancelled = false;
    let socket;
    let eventSource;
    let reconnectTimer;

    const handleMessage = (payload) => {
      if (cancelled) return;
      const parsed = serializeEvent(payload);
      if (!parsed) return;
      setLatestVersion(parsed);
      if (compareVersions(parsed)) {
        setUpdateAvailable(true);
      }
    };

    const scheduleReconnect = () => {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        if (socket) {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          try {
            socket.close();
          } catch {
            /* noop */
          }
          socket = null;
        }
        if (eventSource) {
          try {
            eventSource.close();
          } catch {
            /* noop */
          }
          eventSource = null;
        }
        connect();
      }, 5000);
    };

    const connectWebSocket = () => {
      const wsUrl = toWsProtocol(
        resolveRealtimeUrl('VITE_UPDATES_WS_URL', '/ws/ui-updates'),
      );
      if (!wsUrl) return false;
      try {
        socket = new WebSocket(wsUrl);
      } catch (err) {
        console.warn('Failed to open updates WebSocket:', err);
        return false;
      }
      socket.onopen = () => {
        setChannelError('');
      };
      socket.onerror = () => {
        setChannelError('Нет связи с каналом обновлений');
      };
      socket.onmessage = (event) => {
        handleMessage(event.data);
      };
      socket.onclose = () => {
        if (!cancelled) {
          scheduleReconnect();
        }
      };
      return true;
    };

    const connectEventSource = () => {
      if (typeof window.EventSource === 'undefined') return false;
      const url = resolveRealtimeUrl('VITE_UPDATES_SSE_URL', '/events/ui-updates');
      try {
        eventSource = new EventSource(url);
      } catch (err) {
        console.warn('Failed to open updates EventSource:', err);
        return false;
      }
      eventSource.onmessage = (event) => {
        handleMessage(event.data);
      };
      eventSource.onerror = () => {
        setChannelError('Нет связи с каналом обновлений');
        if (eventSource.readyState === EventSource.CLOSED) {
          scheduleReconnect();
        }
      };
      setChannelError('');
      return true;
    };

    const connect = () => {
      if ('WebSocket' in window && connectWebSocket()) {
        return;
      }
      if (connectEventSource()) {
        return;
      }
      setChannelError('Канал обновлений недоступен в этом браузере');
    };

    connect();

    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const acknowledgeUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    latestVersion,
    updateAvailable,
    acknowledgeUpdate,
    channelError,
    isChecking,
    refetchVersion: fetchVersion,
  };
};

export default useVersionCheck;
