# docusaurus-plugin-structured-data
> Plugin to configure [__Structured Data__](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) for Docusaurus sites

## How it works

This plugin will generate [__Structured Data__](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) for your Docusaurus site, compliant with [__schema.org__](https://schema.org/).  

The plugin will generate the following types of structured data, and include them in the `<head>` of your site using the [__JSON-LD__](https://developers.google.com/search/docs/guides/intro-structured-data) format:  

- [__`Organization`__](https://schema.org/Organization) - *augmented using data from `themeConfig.structuredData.organization`*
- [__`WebSite`__](https://schema.org/WebSite) - *augmented using data from `themeConfig.structuredData.website`*
- [__`WebPage`__](https://schema.org/WebPage) - *dynamically generated for each page*
- [__`BreadcrumbList`__](https://schema.org/BreadcrumbList) - *dynamically generated for each page*

## Installation

```bash
npm i @stackql/docusaurus-plugin-structured-data
# or
yarn add @stackql/docusaurus-plugin-structured-data
```

## Setup

Add to `plugins` in `docusaurus.config.js`:

```js
{
  plugins: [
    '@stackql/docusaurus-plugin-structured-data',
    ...
  ]
}
```

Update `themeConfig` in the `docusaurus.config.js` file:

```js
{
  themeConfig: {
    structuredData: {
      excludedRoutes: [], // array of routes to exclude from structured data generation
      verbose: false, // print verbose output to console
      organization: {}, // Organization properties
      website: {}, // WebSite properties
      webpage: {
        datePublished: string, // default is the current date
        inLanguage: string, // default: en-US
      },
      breadcrumbLabelMap: {} // used to map breadcrumb labels to custom values
    },
  }
}
```

## Config Example

```js
structuredData: {
  excludedRoutes: [
    '/providers',
  ],  
  verbose: true,
  organization: {
    sameAs: [
      'https://github.com/yourusername',
    ],
    logo: {
      '@type': 'ImageObject',
      inLanguage: 'en-US',
      '@id': 'https://yoursite.com/#logo',
      url: 'https://yoursite.com/img/logo.png',
      contentUrl: 'https://yoursite.com/img/logo.png',
      width: 1440,
      height: 900,
    },
  },
  website: {
    inLanguage: 'en-US',
  },
  webpage: {
    inLanguage: 'en-US',
    datePublished: '2021-07-01',
  },
  breadcrumbLabelMap: {
    'docs': 'Documentation',
    'getting-started': 'Getting Started',
  }
}
```