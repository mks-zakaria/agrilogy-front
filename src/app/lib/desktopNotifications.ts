/**
 * Browser/desktop notifications via the Web Notifications API.
 *
 * Pure, dependency-free (no next-intl) so it stays unit-testable — see the
 * jest/next-intl gotcha. UI strings are passed in by the caller.
 *
 * Persists an opt-in flag in localStorage; firing also requires the OS-level
 * Notification permission to be "granted".
 */

const ENABLED_KEY = 'agrilogy_desktop_notifications_enabled_v1';

export type DesktopPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permission(): DesktopPermission {
  if (!isSupported()) return 'unsupported';
  return Notification.permission as DesktopPermission;
}

export function isEnabledPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setEnabledPref(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    /* private mode / quota — ignore */
  }
}

/** True when notifications are both opted-in and OS-permitted. */
export function isActive(): boolean {
  return isEnabledPref() && permission() === 'granted';
}

/**
 * Ask the OS for permission. Returns the resulting permission. On grant,
 * also flips the opt-in pref on so {@link isActive} is true immediately.
 */
export async function requestPermission(): Promise<DesktopPermission> {
  if (!isSupported()) return 'unsupported';
  try {
    const result = (await Notification.requestPermission()) as DesktopPermission;
    if (result === 'granted') setEnabledPref(true);
    return result;
  } catch {
    return permission();
  }
}

/** Show one desktop notification. No-ops unless {@link isActive}. */
export function showDesktopNotification(
  title: string,
  options?: { body?: string; tag?: string }
): void {
  if (!isActive()) return;
  try {
    const n = new Notification(title, {
      body: options?.body,
      tag: options?.tag,
    });
    // Surface the app when the user clicks the notification.
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      n.close();
    };
  } catch {
    /* construction can throw in some browsers — ignore */
  }
}
