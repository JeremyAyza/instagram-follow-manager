import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('[IG-EXT] Background worker started');
  // Session capture and all requests run in the content script
});
