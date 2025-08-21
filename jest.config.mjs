/** @type {import('ts-jest').JestConfigWithTsJest} **/

export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
   setupFiles: ["<rootDir>/jest.setup.ts"], // 👈 load .env.test
};
