const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Ensure Metro can resolve packages hoisted to the monorepo root.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Apply NativeWind FIRST — it overwrites resolveRequest.
const nwConfig = withNativeWind(config, { input: './global.css' });

// Wrap NativeWind's resolver with our custom resolver.
const nativeWindResolver = nwConfig.resolver.resolveRequest;

nwConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix pnpm entry resolution: expo/AppEntry.js imports ../../App which
  // resolves inside .pnpm store, not project root.
  if (moduleName === '../../App' || moduleName === '../../../App') {
    const appPath = path.resolve(projectRoot, 'App');
    return (nativeWindResolver ?? context.resolveRequest)(context, appPath, platform);
  }

  // Block native-only modules on web
  if (
    platform === 'web' &&
    (moduleName.startsWith('@react-native-firebase/') ||
      moduleName === 'react-native-mmkv')
  ) {
    return { type: 'empty' };
  }

  // Force zustand to CJS on web to avoid import.meta.env in ESM build.
  if (platform === 'web' && moduleName === 'zustand/middleware') {
    const cjsPath = path.resolve(monorepoRoot, 'node_modules/zustand/middleware.js');
    if (fs.existsSync(cjsPath)) {
      return { type: 'sourceFile', filePath: fs.realpathSync(cjsPath) };
    }
  }

  // Fall through to NativeWind's resolver (or default)
  return nativeWindResolver
    ? nativeWindResolver(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = nwConfig;
