import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disable overly strict rules for development
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "jsdoc/require-jsdoc": "off",
      "n/no-missing-import": "off", // Next.js handles this
      "no-undef": "off", // TypeScript handles this
      "prefer-const": "warn",
    },
  },
]
