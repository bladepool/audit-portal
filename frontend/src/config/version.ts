/**
 * Application version and build information
 * Update this file when deploying new versions
 */

export const VERSION = '3.5.1';
export const BUILD_NUMBER = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
export const BUILD_DATE = new Date().toISOString().split('T')[0];

export const getVersionInfo = () => ({
  version: VERSION,
  build: BUILD_NUMBER,
  date: BUILD_DATE,
  fullVersion: `v${VERSION} (${BUILD_NUMBER})`,
});
