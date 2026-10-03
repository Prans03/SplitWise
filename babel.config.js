module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Use the new JSX transform — no need to import React in every file
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      // react-native-reanimated plugin MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
