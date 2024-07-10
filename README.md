# web-docs-backlog

A website to visualize the web platform reference pages that's maintained by Open Web Docs and partners.

## Architecture

### Data

The data that the website is based on comes from the [@mdn/browser-compat-data](https://www.npmjs.com/package/browser-compat-data) npm package

To ensure you have the latest data:

1. Run `npx npm-check-updates -u`

1. Run `npm updat e@mdn/browser-compat-data`

### Build

The website consists of static HTML pages and uses a build script to generate those HTML pages from the data.

The template files, from which the static HTML pages get generated, use the [11ty](https://www.11ty.dev/) static website generator. The template files are found in the `site` directory.

The result of the build script is found in the `docs` directory, which is the directory that GitHub Pages uses to serve the website (see [Deployement](#deployment)).

To re-generate the website, after updating the data:

1. Run `npm install`

1. Run `npm run build` to generate the site

   You can also run `npx eleventy --serve` to start a local server and watch for changes

### Deployment

The website is deployed to production using [GitHub Pages](https://pages.github.com/).

The static HTML pages are generated on the [gh-pages branch](https://github.com/web-platform-dx/web-docs-backlog/tree/gh-pages).

### Automatic updates

The website is automatically updated on every push to the main branch by using a GitHub Actions script found in `.github/workflows/generate-site.yaml`.

The dependencies are also automatically updated everyday by dependabot.
