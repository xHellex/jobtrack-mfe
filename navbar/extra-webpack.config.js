const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);

  // Excluir módulos remotos de otros MFEs para que se carguen en runtime.
  // single-spa también: una sola instancia, la del import map que usa root-config
  singleSpaWebpackConfig.externals = [
    ...(singleSpaWebpackConfig.externals || []),
    /^@Felo\/.+/,
    'single-spa'
  ];

  // Desactivar UMD/SystemJS para usar ESM nativo al igual que en React
  delete singleSpaWebpackConfig.output.libraryTarget;
  delete singleSpaWebpackConfig.output.libraryName;
  singleSpaWebpackConfig.output.module = true;
  singleSpaWebpackConfig.output.library = { type: 'module' };
  singleSpaWebpackConfig.experiments = {
    ...(singleSpaWebpackConfig.experiments || {}),
    outputModule: true
  };

  // Feel free to modify this webpack config however you'd like to
  return singleSpaWebpackConfig;
};
