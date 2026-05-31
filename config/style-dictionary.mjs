import StyleDictionary from 'style-dictionary';

const spacingUtilities = {
  gap: 'gap',
  'gap-x': 'column-gap',
  'gap-y': 'row-gap',

  p: 'padding',
  px: 'padding-inline',
  py: 'padding-block',
  pl: 'padding-inline-start',
  pr: 'padding-inline-end',
  pt: 'padding-block-start',
  pb: 'padding-block-end',

  m: 'margin',
  mx: 'margin-inline',
  my: 'margin-block',
  ml: 'margin-inline-start',
  mr: 'margin-inline-end',
  mt: 'margin-block-start',
  mb: 'margin-block-end',
};

const negativeSpacingUtilities = new Set(['m', 'mx', 'my', 'ml', 'mr', 'mt', 'mb']);

StyleDictionary.registerFormat({
  name: 'custom/css/spacing-utilities',

  format: ({ dictionary }) => {
    const spacingTokens = dictionary.allTokens.filter((token) => token.path[0] === 'spacing');

    const classes = spacingTokens.flatMap((token) => {
      const semanticName = token.$extensions?.semantic;

      if (!semanticName) return [];

      const tokenKey = token.path.at(-1);
      const variableName = `--spacing-${tokenKey}`;

      return Object.entries(spacingUtilities).flatMap(([classPrefix, property]) => {
        const positiveClass = `@utility ${classPrefix}-${semanticName} {
  ${property}: var(${variableName});
}`;

        if (!negativeSpacingUtilities.has(classPrefix)) {
          return [positiveClass];
        }

        const negativeClass = `@utility -${classPrefix}-${semanticName} {
  ${property}: calc(var(${variableName}) * -1);
}`;

        return [positiveClass, negativeClass];
      });
    });

    return `${classes.join('\n\n')}\n`;
  },
});

const publicCssFontGroups = new Set(['title', 'body', 'button']);

function isPublicCssThemeToken(token) {
  if (token.path[0] !== 'font') {
    return true;
  }

  return publicCssFontGroups.has(token.path[1]);
}

const sd = new StyleDictionary({
  source: ['src/design-tokens/**/*.json'],

  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',

      files: [
        {
          destination: 'tokens.theme.css',
          format: 'css/variables',
          filter: isPublicCssThemeToken,
        },
        {
          destination: 'spacing.css',
          format: 'custom/css/spacing-utilities',
        },
      ],

      options: {
        usesDtcg: true,
        selector: '@theme',
      },
    },

    js: {
      transformGroup: 'js',
      buildPath: 'src/styles/',

      files: [
        {
          destination: 'tokens.theme.ts',
          format: 'javascript/es6',
        },
      ],
    },

    json: {
      transformGroup: 'js',
      buildPath: 'src/styles/',

      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/module',
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();

export default sd;
