export const APP_CONFIG = {
  API_LIMITS: {
    // Límites permitidos por Instagram por petición
    FOLLOWING_PAGE_SIZE: 200,
    FOLLOWERS_PAGE_SIZE: 25,
  },
  DELAYS: {
    // Escaneo de usuarios (Fetch)
    SCAN_STANDARD_MIN_MS: 15000,
    SCAN_STANDARD_MAX_MS: 18000, // +3000 de varianza
    SCAN_LONG_MIN_MS: 40000,
    SCAN_LONG_MAX_MS: 50000,
    SCAN_PAGES_BEFORE_LONG_DELAY: 10,
    
    // Dejar de seguir (Unfollow)
    UNFOLLOW_STANDARD_MIN_MS: 5000,
    UNFOLLOW_STANDARD_MAX_MS: 10000,
    UNFOLLOW_LONG_MIN_MS: 45000,
    UNFOLLOW_LONG_MAX_MS: 60000,
    UNFOLLOW_BATCH_MIN_SIZE: 7,
    UNFOLLOW_BATCH_MAX_SIZE: 10,
  }
};
