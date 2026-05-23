const KEY = 'crm-notification-prefs';

const DEFAULTS = {
  soundEnabled: true,
  desktopEnabled: true,
  toastEnabled: true,
  pollIntervalSec: 10,
};

export function getNotificationPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveNotificationPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify({ ...getNotificationPrefs(), ...prefs }));
}

export function requestDesktopPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}
