import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('[IG-EXT] Background worker started');
  // All main fetching logic and webRequest interception has been migrated to MAIN world and content script
});
