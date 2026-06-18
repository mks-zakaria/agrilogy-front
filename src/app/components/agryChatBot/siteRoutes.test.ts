import { pageKeyFromPath, SITEMAP_ROUTES } from './siteRoutes';

describe('pageKeyFromPath', () => {
  it('maps the dashboard root', () => {
    expect(pageKeyFromPath('/')).toBe('dashboard');
  });

  it.each([
    ['/soil', 'soil'],
    ['/station', 'station'],
    ['/vannes-pompes', 'vannesPompes'],
    ['/alerts', 'alerts'],
    ['/settings', 'settings'],
  ])('maps %s to %s', (path, key) => {
    expect(pageKeyFromPath(path)).toBe(key);
  });

  it('maps nested routes to their parent key', () => {
    expect(pageKeyFromPath('/alerts/wind-speed')).toBe('alerts');
    expect(pageKeyFromPath('/vannes-pompes/schema')).toBe('vannesPompes');
  });

  it('ignores a trailing slash', () => {
    expect(pageKeyFromPath('/soil/')).toBe('soil');
  });

  it('returns null for unknown or empty paths', () => {
    expect(pageKeyFromPath('/login')).toBeNull();
    expect(pageKeyFromPath('/nope')).toBeNull();
    expect(pageKeyFromPath(null)).toBeNull();
  });

  it('every sitemap route key has a path', () => {
    for (const r of SITEMAP_ROUTES) {
      expect(r.path.startsWith('/')).toBe(true);
      expect(r.key.length).toBeGreaterThan(0);
    }
  });
});
