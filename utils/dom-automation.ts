/**
 * Módulo de automatización DOM para el proceso de Unfollow en Instagram.
 * Sigue estrictamente la secuencia de interacción requerida.
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca un botón en el documento que contenga alguno de los textos indicados.
 */
function findButtonWithText(texts: string[], parent: ParentNode = document): HTMLButtonElement | null {
  const buttons = Array.from(parent.querySelectorAll('button, div[role="button"]')) as HTMLButtonElement[];
  const normalizedTexts = texts.map(t => t.toLowerCase());

  for (const btn of buttons) {
    const btnText = (btn.innerText || btn.textContent || '').trim().toLowerCase();
    if (normalizedTexts.some(t => btnText.includes(t))) {
      return btn;
    }
  }
  return null;
}

/**
 * Espera a que un elemento esté disponible en el DOM con timeout.
 */
async function waitForButton(
  texts: string[],
  timeoutMs: number = 8000,
  parent: ParentNode = document
): Promise<HTMLButtonElement | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const btn = findButtonWithText(texts, parent);
    if (btn && btn.offsetHeight > 0) return btn;
    await delay(300);
  }
  return null;
}

export interface UnfollowResult {
  success: boolean;
  message: string;
}

/**
 * Ejecuta los pasos de dejar de seguir en la página actual del perfil.
 * 1. Buscar botón "Siguiendo" / "Following" / "Solicitado"
 * 2. Clic -> Buscar en modal el botón "Dejar de seguir" / "Unfollow"
 * 3. Verificar si el botón cambió a "Seguir" / "Follow" dentro de los 15s de gracia.
 */
export async function executeProfileUnfollowDOM(): Promise<UnfollowResult> {
  try {
    // Paso 1: Buscar botón "Siguiendo" o "Following" o "Solicitado" / "Requested"
    const targetButtonTexts = [
      'siguiendo', 'following',
      'solicitado', 'requested', 'pendiente'
    ];

    const followingBtn = await waitForButton(targetButtonTexts, 7000);

    if (!followingBtn) {
      // Si ya dice "Seguir" o "Follow", ya no lo seguimos
      const alreadyFollowBtn = findButtonWithText(['seguir', 'follow']);
      if (alreadyFollowBtn) {
        return { success: true, message: 'El usuario ya no se estaba siguiendo.' };
      }
      return { success: false, message: 'No se encontró el botón "Siguiendo" en la página.' };
    }

    // Clic en "Siguiendo"
    followingBtn.click();
    await delay(800 + Math.random() * 400);

    // Paso 2: Aparece modal de opciones -> Buscar botón que contenga "Dejar de seguir" / "Unfollow"
    const modalConfirmTexts = ['dejar de seguir', 'unfollow'];
    
    // Buscar preferentemente dentro de modales o diálogos si existen
    const dialogs = document.querySelectorAll('div[role="dialog"]');
    let unfollowConfirmBtn: HTMLButtonElement | null = null;

    if (dialogs.length > 0) {
      const activeDialog = dialogs[dialogs.length - 1];
      unfollowConfirmBtn = await waitForButton(modalConfirmTexts, 5000, activeDialog);
    }

    if (!unfollowConfirmBtn) {
      unfollowConfirmBtn = await waitForButton(modalConfirmTexts, 5000);
    }

    if (!unfollowConfirmBtn) {
      return { success: false, message: 'No se desplegó el modal o no se halló la opción "Dejar de seguir".' };
    }

    // Clic en "Dejar de seguir"
    unfollowConfirmBtn.click();

    // Paso 3: Verificación de éxito: Esperar hasta 15s a que aparezca un botón que diga "Seguir" / "Follow"
    const startTime = Date.now();
    const successTexts = ['seguir', 'follow'];

    while (Date.now() - startTime < 15000) {
      await delay(500);
      const followBtn = findButtonWithText(successTexts);
      if (followBtn && followBtn.offsetHeight > 0) {
        return { success: true, message: 'Éxito: Cambió a "Seguir".' };
      }
    }

    return { success: false, message: 'Tiempo agotado (15s): No se confirmó el cambio a "Seguir".' };

  } catch (error: any) {
    return { success: false, message: `Error DOM: ${error?.message || error}` };
  }
}
