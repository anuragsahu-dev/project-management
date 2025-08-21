import { hashedPassword, isPasswordValid } from "../../src/utils/password";

describe("Password Utilities", () => {
  const userPassword = "Password1234";

  let hashedValue: string;

  it("should hash a password", async () => {
    hashedValue = await hashedPassword(userPassword);

    expect(typeof hashedValue).toBe("string");
    expect(hashedValue).not.toBe(userPassword); // hashed value should differ from original userpassword
  });

  it("should validate a correct password", async () => {
    const checkPassword = await isPasswordValid(userPassword, hashedValue);
    expect(checkPassword).toBe(true);
  });

  it("should invalidate an incorrect password", async () => {
    const isValid = await isPasswordValid("WrongPassword", hashedValue);
    expect(isValid).toBe(false);
  });

  it("should handle errors gracefully in isPasswordValid", async () => {
    // Passing invalid hash to simulate error
    const isValid = await isPasswordValid(userPassword, "invalid-hash");
    expect(isValid).toBe(false);
  });
});
