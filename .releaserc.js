const NPM = '@semantic-release/npm';
const GH = '@semantic-release/github';

function exec(cmd) {
  return {
    cmd,
    path: '@semantic-release/exec'
  }
}

module.exports = {
  generateNotes: {
    config: '@alorel-personal/conventional-changelog-alorel'
  },
  prepare: [
    '@semantic-release/changelog',
    NPM,
    exec('npm run doctoc'),
    {
      assets: [
        'CHANGELOG.md',
        'README.md',
        'package.json',
        'package-lock.json'
      ],
      message: 'chore(release): ${nextRelease.version}',
      path: '@semantic-release/git'
    },
    exec('npm run rollup')
  ],
  publish: [
    exec('bash -c "cd dist && npm publish"'),
    GH
  ],
  tagFormat: '${version}',
  verifyConditions: [
    {path: NPM, pkgRoot: '.'},
    GH
  ]
};
