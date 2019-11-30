# TODO

These things are things that should be tried out, thought about a bit more or
just implemented.

- Write documentation
- Accepts lists of assets in HTML-render
- switch to Webpack for building
  - faster reload
  - HMR is easier
  - css bundle splitting
  - loads urls from css etc.
  - wait for webpack 5?
  - better content-based hashing for long-term caching
- Improve type exports
- Set up tests
  - frame/validate
- Split up code more
  - frame/picture
  - frame/util
    - slug
  - frame/asset: Asset, YAMLAsset, ...
- Prevent/warn loading of heavy modules on the client
  - slug
  - frame/validate
  - ...?
