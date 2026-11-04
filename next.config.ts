import type { NextConfig } from 'next';
const config: NextConfig = { serverExternalPackages: ['@openai/agents', 'node:sqlite'], poweredByHeader: false };
export default config;
