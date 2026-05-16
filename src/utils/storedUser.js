const USER_KEY = 'fptp_user';

export function stripLargeProfilePayload(user) {
  if (!user?.settings?.freelancerProfile) return user;

  return {
    ...user,
    settings: {
      ...user.settings,
      freelancerProfile: {
        ...user.settings.freelancerProfile,
        cvDataUrl: '',
      },
    },
  };
}

export function parseStoredUser(rawUser) {
  if (!rawUser) return {};

  try {
    return JSON.parse(rawUser);
  } catch {
    const cleanedRawUser = rawUser.replace(/"cvDataUrl"\s*:\s*"[^"]*"/g, '"cvDataUrl":""');
    return JSON.parse(cleanedRawUser);
  }
}

export function readStoredUser(defaultValue = {}) {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    const parsedUser = parseStoredUser(rawUser);
    const safeUser = stripLargeProfilePayload(parsedUser);

    if (rawUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    }

    return safeUser || defaultValue;
  } catch {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore cleanup errors.
    }
    return defaultValue;
  }
}

export function persistStoredUser(user) {
  const safeUser = stripLargeProfilePayload(user);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
}
