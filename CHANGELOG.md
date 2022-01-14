# [2.0.0](https://github.com/Alorel/memoise-decorator/compare/1.1.1...2.0.0) (2022-01-14)


### Features

* Allow direct access to the cache ([da5d21d](https://github.com/Alorel/memoise-decorator/commit/da5d21db927143c667eb9e2c2aa2d44f2fbcb30a))


### Maintenance

* **deps:** bump npm from 6.12.0 to 6.13.4 ([5b259f8](https://github.com/Alorel/memoise-decorator/commit/5b259f8bc4cd91f3cad2d934c60959270c2f4380))


### BREAKING CHANGES

* Maps now need to be polyfilled in ES5 environments. ArgSerialiserFn got renamed to SerialiserFn in the typings.

## [1.1.1](https://github.com/Alorel/memoise-decorator/compare/1.1.0...1.1.1) (2019-10-14)


### Bug Fixes

* no argument calls are now memoised properly ([](https://github.com/Alorel/memoise-decorator/commit/533cfcf))


### Maintenance

* **deps:** bump fstream from 1.0.11 to 1.0.12 ([](https://github.com/Alorel/memoise-decorator/commit/c23b354))

# [1.1.0](https://github.com/Alorel/memoise-decorator/compare/1.0.0...1.1.0) (2019-03-18)


### Documentation

* Fixed JSDoc ArgSerialiserFn typings ([1e65368](https://github.com/Alorel/memoise-decorator/commit/1e65368))
* Fixed JSDoc for the serialiser param ([98e9378](https://github.com/Alorel/memoise-decorator/commit/98e9378))


### Features

* Memoise.all() ([02ae821](https://github.com/Alorel/memoise-decorator/commit/02ae821))

# 1.0.0 (2019-03-12)


### Features

* Initial release ([990c154](https://github.com/Alorel/memoise-decorator/commit/990c154))
