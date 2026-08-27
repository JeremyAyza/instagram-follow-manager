import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    console.log('[IG-EXT] Injector running in MAIN world — installing fetch interceptor');

    let credentialsSent = false;

    const _originalFetch = window.fetch;
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      let url = '';
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].href;
      } else if (args[0] && typeof (args[0] as any).url === 'string') {
        url = (args[0] as any).url;
      }

      if (!credentialsSent && url.includes('/api/v1/') && args[1] && args[1].headers) {
        const headers: any = args[1].headers;
        const headersMap: Record<string, string> = {};
        
        if (headers instanceof Headers) {
          headers.forEach((value, key) => {
            headersMap[key.toLowerCase()] = value;
          });
        } else if (typeof headers === 'object') {
          Object.entries(headers).forEach(([key, value]) => {
            headersMap[key.toLowerCase()] = String(value);
          });
        }

        if (headersMap['x-ig-app-id'] || headersMap['x-csrftoken']) {
           const userIdMatch = document.cookie.match(/ds_user_id=([^;]+)/);
           const userId = userIdMatch ? userIdMatch[1] : 'self';
           
           if (!headersMap['x-csrftoken']) {
              const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
              if (csrfMatch) headersMap['x-csrftoken'] = csrfMatch[1];
           }

           console.log('[IG-EXT] Credenciales interceptadas exitosamente de:', url);
           
           window.postMessage({
             type: 'IG_CREDENTIALS',
             data: {
               userId,
               headers: headersMap
             }
           }, '*');
           
           credentialsSent = true;
        }
      }

      return _originalFetch.apply(window, args);
    };
  }
});
