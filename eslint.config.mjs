import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build.log"
    ]
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "react-hooks": {
        rules: {
          "exhaustive-deps": {
            create() { return {}; }
          }
        }
      }
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];

// sync
