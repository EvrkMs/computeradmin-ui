export const extractErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail && typeof data.detail === 'string') return data.detail;
  if (data.error_description && typeof data.error_description === 'string') {
    return data.error_description;
  }
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.title && typeof data.title === 'string') return data.title;
  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors)
      .flat()
      .filter((item) => typeof item === 'string');
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }
  return fallback;
};

export const ensureOk = async (response, fallbackMessage = 'Request failed') => {
  if (response.ok) return;

  let message = fallbackMessage;
  try {
    const cloned = response.clone();
    const contentType = cloned.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await cloned.json();
      message = extractErrorMessage(data, fallbackMessage);
    } else {
      const text = await cloned.text();
      if (text) {
        message = text;
      }
    }
  } catch {
    // Ignore parse errors and use fallback
  }

  const error = new Error(message);
  error.status = response.status;
  throw error;
};
