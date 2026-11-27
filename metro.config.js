// Metro config. Package exports are needed by the ElevenLabs voice SDK, which ships
// separate React Native and browser entry points.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
