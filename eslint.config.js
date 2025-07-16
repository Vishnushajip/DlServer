export default [
    {
      ignores: ["node_modules/**", "public/**"],
    },
    {
      files: ["**/*.js"],
      languageOptions: {
        ecmaVersion: 2021,
      },
      rules: {
        "no-unused-vars": "warn",
        "max-len": ["warn", { "code": 800 }],
      },
    },
  ];
  