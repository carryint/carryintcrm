import { User } from './types';

// In-memory fallback map when Web Storage is unavailable or quota is exceeded
const memoryStore = new Map<string, string>();

/**
 * Helper to safely write a cookie
 */
const setCookie = (name: string, value: string, days = 30) => {
  try {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // ignore cookie errors
  }
};

/**
 * Helper to safely read a cookie
 */
const getCookie = (name: string): string | null => {
  try {
    if (typeof document === 'undefined') return null;
    const target = `${encodeURIComponent(name)}=`;
    const parts = document.cookie.split(';');
    for (let part of parts) {
      part = part.trim();
      if (part.indexOf(target) === 0) {
        return decodeURIComponent(part.substring(target.length));
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Helper to delete a cookie
 */
const deleteCookie = (name: string) => {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (e) {
    // ignore
  }
};

export const safeStorage = {
  /**
   * Safely get an item from localStorage, with fallback to sessionStorage, cookie, and in-memory
   */
  getItem: (key: string): string | null => {
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) return item;
      }
    } catch (e) {
      // localStorage may throw SecurityError in private mode
    }

    // 2. Try sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const item = window.sessionStorage.getItem(key);
        if (item !== null) return item;
      }
    } catch (e) {
      // ignore
    }

    // 3. Try cookie for user session key
    if (key === 'carryint_current_user') {
      const cookieVal = getCookie('carryint_current_user');
      if (cookieVal) return cookieVal;
    }

    // 4. Fallback to in-memory store
    return memoryStore.get(key) || null;
  },

  /**
   * Safely set an item with automatic quota management and multi-tier persistence
   */
  setItem: (key: string, value: string): void => {
    // Always keep in memory store
    memoryStore.set(key, value);

    // If setting current user, mirror to cookie as well
    if (key === 'carryint_current_user') {
      setCookie('carryint_current_user', value, 30);
    }

    // Always mirror to sessionStorage if available
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      // ignore sessionStorage errors
    }

    // Attempt localStorage write with automatic quota recovery
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (err: any) {
      console.warn(`[safeStorage] localStorage quota reached or write error for "${key}":`, err?.message || err);

      // Quota recovery strategy: Remove duplicate bulky seal / non-critical caches
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          // Remove duplicate standalone seal cache (seal is already in Supabase & memory)
          window.localStorage.removeItem('carryint_company_seal');

          // If storing company_info and it's huge, strip large base64 seal from the local cache
          if (key === 'carryint_company_info') {
            try {
              const parsed = JSON.parse(value);
              if (parsed.sealUrl && parsed.sealUrl.length > 5000) {
                parsed.sealUrl = ''; // strip large base64 only from local storage cache
                if (parsed.bank) parsed.bank.sealUrl = '';
                window.localStorage.setItem(key, JSON.stringify(parsed));
                return;
              }
            } catch (pErr) {
              // ignore
            }
          }

          // Retry setItem once after pruning
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (retryErr) {
        console.warn(`[safeStorage] Retry after quota pruning also failed for "${key}". Data safely preserved in sessionStorage & memory.`);
      }
    }
  },

  /**
   * Safely remove an item across all storage tiers
   */
  removeItem: (key: string): void => {
    memoryStore.delete(key);

    if (key === 'carryint_current_user') {
      deleteCookie('carryint_current_user');
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Safely retrieve and parse JSON data
   */
  getJSON: <T>(key: string, fallback: T | null = null): T | null => {
    const raw = safeStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[safeStorage] JSON parse error for key "${key}":`, e);
      return fallback;
    }
  },

  /**
   * Safely serialize and store JSON data
   */
  setJSON: (key: string, data: any): void => {
    try {
      const serialized = JSON.stringify(data);
      safeStorage.setItem(key, serialized);
    } catch (e) {
      console.warn(`[safeStorage] JSON stringify error for key "${key}":`, e);
    }
  },

  /**
   * Dedicated helper for user session retrieval
   */
  getUser: (): User | null => {
    return safeStorage.getJSON<User>('carryint_current_user', null);
  },

  /**
   * Dedicated helper to persist user session across all tiers
   */
  setUser: (user: User): void => {
    safeStorage.setJSON('carryint_current_user', user);
  },

  /**
   * Dedicated helper to clear user session
   */
  clearUser: (): void => {
    safeStorage.removeItem('carryint_current_user');
  }
};
