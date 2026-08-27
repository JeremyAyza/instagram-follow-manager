import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Instagram Follow Manager PRO',
    description: 'Gestión avanzada de seguidores para Instagram. Escanea, compara y deja de seguir automáticamente.',
    version: '2.0.0',
    permissions: [
      'storage',
      'unlimitedStorage',
      'scripting'
    ],
    host_permissions: [
      '*://*.instagram.com/*'
    ],
    action: {
      default_title: 'Instagram Follow Manager'
    }
  }
});
