// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 'react-native-reanimated/plugin'이 항상 마지막에 있어야 합니다!
      'react-native-reanimated/plugin',
    ],
  };
};