import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { executeProfileUnfollowDOM } from '../utils/dom-automation';

// happy-dom no calcula layout; el código solo acepta botones visibles.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 10 });
});

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
});

const addButton = (label: string, parent: HTMLElement = document.body) => {
  const btn = document.createElement('button');
  btn.textContent = label;
  parent.appendChild(btn);
  return btn;
};

// Perfil con el botón de seguimiento y el modal que abre al hacer clic.
// `applyUnfollow` decide si "Dejar de seguir" realmente cambia el botón.
const mountProfile = (followingLabel: string, unfollowLabel: string, followLabel: string, applyUnfollow: boolean) => {
  const followingBtn = addButton(followingLabel);
  followingBtn.addEventListener('click', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    addButton(unfollowLabel, dialog).addEventListener('click', () => {
      if (!applyUnfollow) return;
      dialog.remove();
      followingBtn.textContent = followLabel;
    });
  });
};

const run = async () => {
  const result = executeProfileUnfollowDOM();
  await vi.advanceTimersByTimeAsync(30_000);
  return result;
};

describe('executeProfileUnfollowDOM', () => {
  it('reports success once the button changes to "Seguir"', async () => {
    mountProfile('Siguiendo', 'Dejar de seguir', 'Seguir', true);

    await expect(run()).resolves.toEqual({ success: true, message: 'Éxito: Cambió a "Seguir".' });
  });

  it('accepts "Follow back" in English', async () => {
    mountProfile('Following', 'Unfollow', 'Follow back', true);

    await expect(run()).resolves.toMatchObject({ success: true });
  });

  it('does not count "Dejar de seguir" as the Follow button', async () => {
    mountProfile('Siguiendo', 'Dejar de seguir', 'Seguir', false);

    await expect(run()).resolves.toMatchObject({ success: false });
  });

  it('does not count "Following" as the Follow button', async () => {
    mountProfile('Following', 'Unfollow', 'Follow', false);

    await expect(run()).resolves.toMatchObject({ success: false });
  });

  it('treats a profile that already shows "Seguir" as done', async () => {
    addButton('Seguir');

    await expect(run()).resolves.toEqual({ success: true, message: 'El usuario ya no se estaba siguiendo.' });
  });
});
