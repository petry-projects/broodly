const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Ensure Metro can resolve packages hoisted to the monorepo root.
// pnpm's strict node_modules layout prevents nested deps (e.g.,
// @expo/log-box) from finding peer deps like react-native-css-interop.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Custom resolver for web platform compatibility.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block native-only modules on web
  if (
    platform === 'web' &&
    (moduleName.startsWith('@react-native-firebase/') ||
      moduleName === 'react-native-mmkv')
  ) {
    return { type: 'empty' };
  }

  // Force zustand to CJS on web to avoid import.meta.env in ESM build.
  // Zustand's ESM middleware uses import.meta.env?.MODE for devtools
  // detection, which crashes in Hermes's non-module IIFE wrapper.
  if (platform === 'web' && moduleName === 'zustand/middleware') {
    const cjsPath = path.resolve(monorepoRoot, 'node_modules/zustand/middleware.js');
    if (fs.existsSync(cjsPath)) {
      return { type: 'sourceFile', filePath: fs.realpathSync(cjsPath) };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
