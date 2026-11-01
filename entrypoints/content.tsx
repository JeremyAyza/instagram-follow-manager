import { defineContentScript } from 'wxt/sandbox';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { SidebarDrawer } from '../components/SidebarDrawer';
import { FloatingWidget } from '../components/FloatingWidget';
import '../assets/content.css';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingWidget isOpen={isOpen} onToggle={() => setIsOpen(prev => !prev)} />
      <SidebarDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 1. Intentar obtener credenciales de las cookies inmediatamente
    const extractFromCookies = () => {
      const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
      const userIdMatch = document.cookie.match(/ds_user_id=([^;]+)/);
      
      if (csrfMatch && userIdMatch) {
        chrome.storage.local.set({
          igSession: {
            userId: userIdMatch[1],
            headers: {
              'x-csrftoken': csrfMatch[1],
              'x-ig-app-id': '936619743392459' // IG Web App ID estándar
            }
          }
        });
        console.log('[IG-EXT] Credenciales obtenidas nativamente desde cookies.');
      }
    };
    
    // Ejecutar inmediatamente
    extractFromCookies();
    // Y también cuando la ventana carga por si acaso
    window.addEventListener('load', extractFromCookies);

    const ui = await createShadowRootUi(ctx, {
      name: 'instagram-follow-manager-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        // Crear un div interno para que React no se queje del contenedor raíz
        const innerContainer = document.createElement('div');
        container.appendChild(innerContainer);
        const root = ReactDOM.createRoot(innerContainer);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
