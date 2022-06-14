const browserslist = require("browserslist");

module.exports = (api) => {
  const env = api.env("test") || api.caller((it) => it.env);

  return {
    sourceType: "unambiguous",
    presets: [
      [
        "@babel/env",
        {
          targets: env ? browserslist(null, { env }) : "current node",
        },
      ],
    ],
    plugins: [
      "@babel/plugin-transform-runtime",
      [
        "babel-plugin-root-import",
        {
          rootPathSuffix: "./src/",
          rootPathPrefix: "~/",
        },
      ],
    ],
  };
};
