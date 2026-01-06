import StyleDictionary from "style-dictionary";

const sd = new StyleDictionary({
  source: ["src/design-tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/styles/",
      files: [
        {
          destination: "tokens.theme.css",
          format: "css/variables",
        },
      ],
      options: {
        usesDtcg: true,
        selector: "@theme",
      },
    },
    js: {
      transformGroup: "js",
      buildPath: "src/styles/",
      files: [
        {
          destination: "tokens.theme.ts",
          format: "javascript/es6",
        },
      ],
    },
    json: {
      transformGroup: "js",
      buildPath: "src/styles/",
      files: [
        {
          destination: "tokens.ts",
          format: "javascript/module",
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();

export default sd;
