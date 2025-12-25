import { describe, it, expect } from "vitest";

// Token expiry validation (from config)
type TokenExpiry = `${number}${"s" | "m" | "h" | "d"}`;

const tokenExpiryRegex = /^\d+[smhd]$/;

function validateTokenExpiry(value: string): TokenExpiry | null {
  if (tokenExpiryRegex.test(value)) return value as TokenExpiry;
  return null;
}

// Pagination helpers
function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    skip,
    totalPages,
    hasNextPage,
    hasPrevPage,
    currentPage: page,
  };
}

describe("Token Expiry Validation", () => {
  it("should validate correct expiry formats", () => {
    expect(validateTokenExpiry("15m")).toBe("15m");
    expect(validateTokenExpiry("7d")).toBe("7d");
    expect(validateTokenExpiry("3600s")).toBe("3600s");
    expect(validateTokenExpiry("24h")).toBe("24h");
  });

  it("should reject invalid expiry formats", () => {
    expect(validateTokenExpiry("15")).toBeNull();
    expect(validateTokenExpiry("m15")).toBeNull();
    expect(validateTokenExpiry("15x")).toBeNull();
    expect(validateTokenExpiry("")).toBeNull();
  });
});

describe("Pagination Helpers", () => {
  it("should calculate pagination correctly for first page", () => {
    const result = calculatePagination(1, 10, 100);

    expect(result.skip).toBe(0);
    expect(result.totalPages).toBe(10);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(false);
    expect(result.currentPage).toBe(1);
  });

  it("should calculate pagination for middle page", () => {
    const result = calculatePagination(5, 10, 100);

    expect(result.skip).toBe(40);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(true);
  });

  it("should calculate pagination for last page", () => {
    const result = calculatePagination(10, 10, 100);

    expect(result.skip).toBe(90);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(true);
  });

  it("should handle single page results", () => {
    const result = calculatePagination(1, 10, 5);

    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(false);
  });
});
