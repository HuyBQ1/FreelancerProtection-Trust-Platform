import { useEffect, useState } from 'react';
import { persistStoredUser, readStoredUser } from './storedUser';

const LANGUAGE_KEY = 'fptp_language';
const USER_KEY = 'fptp_user';
const LANGUAGE_EVENT = 'fptp-language-change';

export function getStoredLanguage(defaultLanguage = 'en') {
  try {
    const directValue = localStorage.getItem(LANGUAGE_KEY);
    if (directValue === 'en' || directValue === 'vi') {
      return directValue;
    }

    const storedUser = readStoredUser({});
    const userLanguage = storedUser?.settings?.language;
    if (userLanguage === 'en' || userLanguage === 'vi') {
      return userLanguage;
    }
  } catch {
    // Fall back to the default language when stored values are unreadable.
  }

  return defaultLanguage;
}

export function persistLanguage(nextLanguage) {
  const language = nextLanguage === 'vi' ? 'vi' : 'en';

  try {
    localStorage.setItem(LANGUAGE_KEY, language);

    const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    if (storedUser && Object.keys(storedUser).length > 0) {
      const nextUser = {
        ...storedUser,
        settings: {
          ...storedUser.settings,
          language,
        },
      };

      persistStoredUser(nextUser);
    }
  } catch {
    // Ignore persistence errors and still notify the UI.
  }

  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: language }));
  return language;
}

export function useAppLanguage(defaultLanguage = 'en') {
  const [language, setLanguage] = useState(() => getStoredLanguage(defaultLanguage));

  useEffect(() => {
    const handleLanguageEvent = (event) => {
      const nextLanguage = event?.detail === 'vi' ? 'vi' : 'en';
      setLanguage(nextLanguage);
    };

    const handleStorage = (event) => {
      if (event.key === LANGUAGE_KEY || event.key === USER_KEY) {
        setLanguage(getStoredLanguage(defaultLanguage));
      }
    };

    window.addEventListener(LANGUAGE_EVENT, handleLanguageEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(LANGUAGE_EVENT, handleLanguageEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [defaultLanguage]);

  const updateLanguage = (nextLanguage) => {
    const normalizedLanguage = persistLanguage(nextLanguage);
    setLanguage(normalizedLanguage);
  };

  return [language, updateLanguage];
}
