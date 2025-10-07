import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
console.log('[next.config.mjs] turbopack.root =', __dirname);

const nextConfig = {
  turbopack: { root: __dirname },
};

export default nextConfig;
