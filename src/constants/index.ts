export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE = {
  PROJECT_LIST_TTL: 120, 
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, 
  GLOBAL_MAX: 100,
  AUTH_MAX: 5,
} as const;