import { describe, it, expect } from "vitest";

// Utility function to test
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return { valid: errors.length === 0, errors };
}

describe("Email Validation", () => {
  it("should return true for valid email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.org")).toBe(true);
  });

  it("should return false for invalid email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Password Validation", () => {
  it("should validate a strong password", () => {
    const result = validatePassword("SecurePass123");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject short passwords", () => {
    const result = validatePassword("Abc1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters");
  });

  it("should reject passwords without uppercase", () => {
    const result = validatePassword("lowercase123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one uppercase letter"
    );
  });

  it("should reject passwords without numbers", () => {
    const result = validatePassword("NoNumbersHere");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one number"
    );
  });
});
