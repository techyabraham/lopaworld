import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTypeScript,
  // Payload generates these files; review them as SQL, not against style rules.
  { ignores: ['src/migrations/**'] },
];
export default config;
