const {join} = require('path');
const {_buildLazyReq} = require('./build/rollup/_lazyReq');

// ########## BEGIN SETUP

const CONFIG = {
  get cjsPluginSettings() {
    /*
     *   return {
     *   extensions: CONFIG.extensions,
     *   include: null,
     *   sourceMap: CONFIG.sourcemap
     * }
     */

    return null;
  },
  extensions: [
    '.js',
    '.ts'
  ],
  mainFields: [
    'fesm5',
    'esm5',
    'module',
    'browser',
    'main'
  ],
  umd: {
    globals: {},
    name: 'Memoise'
  }
};

// ########## END SETUP

module.exports = function ({watch}) {
  const tsconfig = 'tsconfig.json';

  const distDir = join(__dirname, 'dist');
  const bundleDir = join(distDir, '_bundle');
  const projectDir = join(__dirname, 'src');

  const baseSettings = {
    input: join(projectDir, 'index.ts'),
    watch: {
      exclude: 'node_modules/**/*'
    }
  };

  const baseOutput = {
    assetFileNames: CONFIG.assetFileNames,
    banner: _buildLazyReq.bannerFn,
    dir: bundleDir,
    preferConst: false,
    sourcemap: false,
  };

  function getBasePlugins(typescriptConfig = {}) {
    const cjsSettings = CONFIG.cjsPluginSettings;

    return [
      _buildLazyReq.nodeResolve(CONFIG),
      cjsSettings && require('@rollup/plugin-commonjs').default(cjsSettings),
      require('rollup-plugin-typescript2')({
        tsconfig,
        ...typescriptConfig
      })
    ].filter(Boolean);
  }

  return [
    // cjs + dts
    {
      ...baseSettings,
      output: {
        ...baseOutput,
        entryFileNames: 'index.js',
        preferConst: true,
        dir: distDir,
        format: 'cjs',
      },
      plugins: [
        ...getBasePlugins({
          tsconfigOverride: {
            compilerOptions: {
              declaration: true,
            }
          }
        }),
        require('@alorel/rollup-plugin-copy').copyPlugin({
          copy: [{
            from: [
              'LICENSE',
              'README.md',
              'CHANGELOG.md'
            ]
          }],
          defaultOpts: {
            emitNameKind: 'fileName',
            glob: {
              cwd: __dirname,
            }
          },
          watch
        }),
        require('@alorel/rollup-plugin-copy-pkg-json').copyPkgJsonPlugin({
          pkgJsonPath: join(__dirname, 'package.json')
        }),
      ]
    },
    // es2015
    {
      ...baseSettings,
      output: {
        ...baseOutput,
        preferConst: true,
        entryFileNames: 'fesm2015.js',
        format: 'es',
      },
      plugins: getBasePlugins()
    },
    // ES5 + UMD
    ...(() => {
      const umdBaseOutput = {
        ...baseOutput,
        format: 'umd',
        globals: CONFIG.umd.globals,
        name: CONFIG.umd.name,
      };

      return [{
        ...baseSettings,
        output: [
          {
            ...baseOutput,
            entryFileNames: 'fesm5.js',
            format: 'es'
          },
          {
            ...umdBaseOutput,
            entryFileNames: 'umd.js'
          },
          {
            ...umdBaseOutput,
            entryFileNames: 'umd.min.js',
            plugins: [
              _buildLazyReq.threadedTerser({
                terserOpts: {
                  compress: {
                    drop_console: true,
                    ecma: 5,
                    keep_infinity: true,
                    typeofs: false
                  },
                  ecma: 5,
                  ie8: true,
                  mangle: {
                    safari10: true
                  },
                  output: {
                    comments: false,
                    ie8: true,
                    safari10: true
                  },
                  safari10: true,
                  sourceMap: false
                }
              })
            ]
          }
        ],
        plugins: getBasePlugins({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es5'
            }
          }
        })
      }];
    })()
  ];
};

Object.defineProperty(module.exports, '__esModule', {value: true});
module.exports.default = module.exports;
