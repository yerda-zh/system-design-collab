export default {
  // For all TypeScript files in the server
  'server/src/**/*.ts': [
    'prettier --write',
    'eslint --fix',
    () => 'npm run typecheck --prefix server',
  ],

  // For all TypeScript/TSX files in the client (when we build it)
  'client/src/**/*.{ts,tsx}': [
    'prettier --write',
    'eslint --fix',
  ],
};
