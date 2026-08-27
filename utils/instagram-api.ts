import { InstagramUser, IGSessionConfig, InstagramAPIResponse, InstagramAPIUser } from '../types/instagram';
import { APP_CONFIG } from './constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeHeaders(baseHeaders: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  
  Object.keys(baseHeaders).forEach(key => {
    headers[key.toLowerCase()] = baseHeaders[key];
  });

  const defaults: Record<string, string> = {
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'XMLHttpRequest',
    'priority': 'u=1, i'
  };

  Object.keys(defaults).forEach(key => {
    if (key === 'sec-fetch-site') {
      headers[key] = 'same-origin';
    } else if (!headers[key]) {
      headers[key] = defaults[key];
    }
  });

  return headers;
}

export async function fetchUsersList(
  config: IGSessionConfig,
  type: 'following' | 'followers',
  onProgress?: (count: number, hasMore: boolean) => void,
  checkShouldStop?: () => boolean
): Promise<InstagramUser[]> {
  const results: InstagramUser[] = [];
  let nextMaxId: string | null = null;
  let hasMore: boolean = true;
  let pageRequestCount = 0;
  
  // Límites dinámicos según el endpoint y configuraciones globales
  const count = type === 'following' ? APP_CONFIG.API_LIMITS.FOLLOWING_PAGE_SIZE : APP_CONFIG.API_LIMITS.FOLLOWERS_PAGE_SIZE;
  const baseUrl = `https://www.instagram.com/api/v1/friendships/${config.userId}/${type}/?count=${count}`;
  const requestHeaders = normalizeHeaders(config.headers);

  do {
    if (checkShouldStop && checkShouldStop()) break;

    const url: string = nextMaxId ? `${baseUrl}&max_id=${nextMaxId}` : baseUrl;

    try {
      const response: Response = await fetch(url, {
        headers: requestHeaders,
        credentials: 'include',
        mode: 'cors',
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Error en respuesta HTTP: ${response.status}`);
      }

      const data = await response.json() as InstagramAPIResponse;

      if (!data.users || !Array.isArray(data.users)) {
        break;
      }

      const mappedUsers: InstagramUser[] = data.users.map((u: InstagramAPIUser) => {
        const isCreator = Array.isArray(u?.account_badges) && u.account_badges.some((b: any) => b.type === 'creator');
        return {
          id: String(u.pk || u.id),
          username: u.username,
          full_name: u.full_name || '',
          profile_pic_url: u.profile_pic_url || '',
          is_verified: Boolean(u.is_verified),
          is_creator: isCreator,
          is_private: Boolean(u.is_private),
          profile_url: `https://www.instagram.com/${u.username}/`
        };
      });

      results.push(...mappedUsers);
      
      hasMore = Boolean(data.has_more);
      nextMaxId = (hasMore && data.next_max_id) ? String(data.next_max_id) : null;

      if (onProgress) {
        onProgress(results.length, hasMore);
      }

      // Retardos humanos entre peticiones
      if (hasMore && nextMaxId) {
        pageRequestCount++;
        if (pageRequestCount % APP_CONFIG.DELAYS.SCAN_PAGES_BEFORE_LONG_DELAY === 0) {
          const longDelay = APP_CONFIG.DELAYS.SCAN_LONG_MIN_MS + Math.random() * (APP_CONFIG.DELAYS.SCAN_LONG_MAX_MS - APP_CONFIG.DELAYS.SCAN_LONG_MIN_MS);
          await delay(longDelay);
        } else {
          const standardDelay = APP_CONFIG.DELAYS.SCAN_STANDARD_MIN_MS + Math.random() * (APP_CONFIG.DELAYS.SCAN_STANDARD_MAX_MS - APP_CONFIG.DELAYS.SCAN_STANDARD_MIN_MS);
          await delay(standardDelay);
        }
      }
    } catch (err) {
      console.error(`Error obteniendo ${type}:`, err);
      await delay(5000);
      break;
    }
  } while (hasMore && nextMaxId);

  return results;
}
