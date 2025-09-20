const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root
config.watchFolders = [workspaceRoot];

// Resolve modules from the app and the repo root
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Recommended for some packages using .cjs
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;