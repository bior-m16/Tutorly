module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 delegates to react-native-worklets/plugin
    plugins: ['react-native-reanimated/plugin'],
  };
};
