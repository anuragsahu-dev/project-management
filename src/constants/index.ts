export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE = {
  PROJECT_LIST_TTL: 120, // 2 minutes
} as const;

export const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;
