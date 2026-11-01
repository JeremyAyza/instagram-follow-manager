import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/constants', () => ({
  APP_CONFIG: {
    API_LIMITS: { FOLLOWING_PAGE_SIZE: 200, FOLLOWERS_PAGE_SIZE: 25 },
    DELAYS: {
      SCAN_STANDARD_MIN_MS: 0,
      SCAN_STANDARD_MAX_MS: 0,
      SCAN_LONG_MIN_MS: 0,
      SCAN_LONG_MAX_MS: 0,
      SCAN_PAGES_BEFORE_LONG_DELAY: 10,
    },
  },
}));

import { fetchUsersList } from '../utils/instagram-api';
import type { IGSessionConfig } from '../types/instagram';

const session: IGSessionConfig = {
  userId: '42',
  headers: { 'X-CSRFToken': 'token' },
  lastCapturedAt: 0,
};

const page = (users: object[], nextMaxId?: string) =>
  new Response(JSON.stringify({ users, has_more: Boolean(nextMaxId), next_max_id: nextMaxId, status: 'ok' }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.spyOn(console, 'error').mockRestore();
});

describe('fetchUsersList', () => {
  it('follows next_max_id until has_more is false and maps each user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page([{ pk: 1, username: 'ana', is_verified: true }], 'cursor-1'))
      .mockResolvedValueOnce(page([{ pk: 2, username: 'beto', account_badges: [{ type: 'creator' }] }]));
    vi.stubGlobal('fetch', fetchMock);

    const users = await fetchUsersList(session, 'followers');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('https://www.instagram.com/api/v1/friendships/42/followers/?count=25');
    expect(fetchMock.mock.calls[1][0]).toContain('&max_id=cursor-1');
    expect(fetchMock.mock.calls[0][1].headers['x-csrftoken']).toBe('token');
    expect(users).toEqual([
      expect.objectContaining({ id: '1', username: 'ana', is_verified: true, is_creator: false, profile_url: 'https://www.instagram.com/ana/' }),
      expect.objectContaining({ id: '2', username: 'beto', is_verified: false, is_creator: true }),
    ]);
  });

  it('rejects instead of returning a partial list when a page fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(page([{ pk: 1, username: 'ana' }], 'cursor-1'))
        .mockResolvedValueOnce(new Response('', { status: 429 })),
    );

    await expect(fetchUsersList(session, 'followers')).rejects.toThrow('429');
  });

  it('rejects when the response has no users array', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'fail' }))));

    await expect(fetchUsersList(session, 'following')).rejects.toThrow();
  });

  it('stops before the next page when asked to', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page([{ pk: 1, username: 'ana' }], 'cursor-1'));
    vi.stubGlobal('fetch', fetchMock);
    let calls = 0;

    const users = await fetchUsersList(session, 'following', undefined, () => calls++ > 0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(users).toHaveLength(1);
  });
});
