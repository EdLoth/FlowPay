import base from "./packages/eslint-config/index.js";

export default [
  ...base,
  {
    ignores: ["apps/**", "packages/*/dist/**"],
  },
];
