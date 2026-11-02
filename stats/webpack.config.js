const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "Felo",
    projectName: "stats",
    webpackConfigEnv,
    argv,
    outputSystemJS: false,
  });
  // Inject postcss-loader for Tailwind CSS
  const cssRule = defaultConfig.module.rules.find((r) => r.test && r.test.toString().includes('css'));
  if (cssRule && Array.isArray(cssRule.use)) {
    cssRule.use.push({
      loader: "postcss-loader",
      options: { postcssOptions: { plugins: ["tailwindcss", "autoprefixer"] } }
    });
  }

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
  });
};
