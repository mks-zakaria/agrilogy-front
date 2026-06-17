import {
  isSupported,
  isEnabledPref,
  setEnabledPref,
  isActive,
  permission,
  showDesktopNotification,
} from './desktopNotifications';

describe('desktopNotifications', () => {
  const orig = (global as Record<string, unknown>).Notification;

  afterEach(() => {
    (global as Record<string, unknown>).Notification = orig;
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  function mockNotification(perm: string) {
    const ctor = jest.fn();
    (ctor as unknown as { permission: string }).permission = perm;
    (global as Record<string, unknown>).Notification = ctor;
    return ctor;
  }

  it('reports support based on the Notification global', () => {
    mockNotification('default');
    expect(isSupported()).toBe(true);
    delete (global as Record<string, unknown>).Notification;
    expect(isSupported()).toBe(false);
    expect(permission()).toBe('unsupported');
  });

  it('persists the opt-in pref', () => {
    expect(isEnabledPref()).toBe(false);
    setEnabledPref(true);
    expect(isEnabledPref()).toBe(true);
    setEnabledPref(false);
    expect(isEnabledPref()).toBe(false);
  });

  it('isActive requires both opt-in and granted permission', () => {
    mockNotification('granted');
    setEnabledPref(true);
    expect(isActive()).toBe(true);

    setEnabledPref(false);
    expect(isActive()).toBe(false);

    mockNotification('denied');
    setEnabledPref(true);
    expect(isActive()).toBe(false);
  });

  it('showDesktopNotification only constructs when active', () => {
    const ctor = mockNotification('granted');
    setEnabledPref(false);
    showDesktopNotification('hi');
    expect(ctor).not.toHaveBeenCalled();

    setEnabledPref(true);
    showDesktopNotification('hi', { body: 'there', tag: 't' });
    expect(ctor).toHaveBeenCalledWith('hi', { body: 'there', tag: 't' });
  });
});
