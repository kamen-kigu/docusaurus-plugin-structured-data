const path = require('path');
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

module.exports = function (context) {
    const {siteConfig} = context;
    const {themeConfig} = siteConfig;
    const {structuredData} = themeConfig || {};

    if (!structuredData) {
        throw new Error(
        `You need to specify the 'structuredData' object in 'themeConfig' to use docusaurus-plugin-structured-data`,
        );
    }

    // Initialize breadcrumbLabelMap if not provided
    structuredData.breadcrumbLabelMap = structuredData.breadcrumbLabelMap || {};

    const baseUrl = siteConfig.url;
    const orgName = siteConfig.title;
    const titleDelimiter = siteConfig.titleDelimiter;
    const verbose = structuredData.verbose || false;

    const orgData = {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: `${orgName}`,
        url: `${baseUrl}`,
        ...structuredData.organization,
    };

    const webSiteData = {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: `${orgName}`,
        url: `${baseUrl}`,
        description: `${siteConfig.tagline}`,
        publisher: {
            '@id': `${baseUrl}/#organization`,
        },
        ...structuredData.website,
    };

    const breadcrumbHomeData = {
        '@type': 'ListItem',
        position: 1,
        item: `${baseUrl}`,
        name: 'Home',
    };

    function getBreadcrumbLabel(token){
        if (structuredData.breadcrumbLabelMap && structuredData.breadcrumbLabelMap.hasOwnProperty(token)){
            return structuredData.breadcrumbLabelMap[token];
        } else {
            return token;
        }
    }

    return {
    name: 'docusaurus-plugin-structured-data',
    async postBuild({siteConfig = {}, routesPaths = [], outDir}) {
        routesPaths.map((route) => {
            if (!['/404.html'].includes(route)) {
                let filePath;
                
                if (fs.existsSync(path.join(outDir, route)) && fs.lstatSync(path.join(outDir, route)).isDirectory()) {
                    filePath = path.join(outDir, route, 'index.html');
                } else {
                    filePath = path.join(outDir, `${route}.html`);
                }

                if (!fs.existsSync(filePath)){
                    verbose ? console.log(`skipping filePath: ${filePath} (route: ${route})...`): null;
                    return;
                }

                JSDOM.fromFile(filePath).then(dom => {
                    verbose ? console.log(`processing route: ${route}...`): null;
                   
                    if (structuredData.excludedRoutes.includes(route)){
                        verbose ? console.log(`route: ${route} is excluded`): null;
                        return;
                    }
                    
                    const webPageUrl = `${baseUrl}${route}`;
                    verbose ? console.log(`webPageUrl: ${webPageUrl}`): null;
                    
                    // Add null check for title
                    const titleElement = dom.window.document.querySelector('title');
                    const webPageTitle = titleElement 
                        ? titleElement.text.replace(` ${titleDelimiter} ${orgName}`, '')
                        : 'Kig.Wiki';
                    verbose ? console.log(`webPageTitle: ${webPageTitle}`): null;
                    
                    // Add null check for description meta tag with default value
                    const descriptionMeta = dom.window.document.head.querySelector('[name~=description][content]');
                    const webPageDescription = descriptionMeta ? descriptionMeta.content : 'Kig.Wiki - Kigurumi Masking Guide';
                    verbose ? console.log(`webPageDescription: ${webPageDescription}`): null;
                    
                    // get page type and image...
                    let webPageType = 'website';
                    // Add default image value
                    let webPageImage = themeConfig.image || `${baseUrl}/icons/logo.png`;

                    const metaNodeList = dom.window.document.querySelectorAll('meta');

                    for (const value of metaNodeList.values()) {
                        // check property attribute
                        switch(value.getAttribute('property')){
                            case 'og:type':
                                webPageType = value.content;
                                break;
                            case 'og:image':
                                webPageImage = value.content;
                                break;
                            default:
                                break;
                        };
                    }

                    verbose ? console.log(`webPageType: ${webPageType}`): null;
                    verbose ? console.log(`webPageImage: ${webPageImage}`): null;
                    
                    //
                    // get WebPage data
                    //
                    
                    verbose ? console.log('processing web page data...'): null;

                    let webPageData = {
                        '@type': 'WebPage',
                        isPartOf: {
                            '@id': `${baseUrl}#website`
                        },
                        ...structuredData.webpage,
                    };

                    webPageData['@id'] = `${webPageUrl}#webpage`;
                    webPageData['url'] = `${webPageUrl}`;
                    webPageData['name'] = webPageTitle;
                    webPageData['description'] = webPageDescription;
                    webPageData['inLanguage'] = structuredData.webpage.inLanguage || 'en-US';
                    webPageData['datePublished'] = structuredData.webpage.datePublished || new Date().toISOString();
                    webPageData['dateModified'] = new Date().toISOString();
                    webPageData['breadcrumb'] = {
                        '@id': `${webPageUrl}#breadcrumb`
                    };
                    webPageData['potentialAction'] = [
                        {
                            '@type': 'ReadAction',
                            target: [
                                `${webPageUrl}`
                            ]
                        }
                    ];

                    //
                    // get Breadcrumb data
                    //

                    verbose ? console.log('processing breadcrumb data...'): null;
                    
                    let breadcrumbData = {
                        '@type': 'BreadcrumbList',
                        '@id': `${webPageUrl}#breadcrumb`,
                        itemListElement: [],
                    };

                    const routeArray = route.split('/')
                        .slice(1, -1)
                        .map((token) => getBreadcrumbLabel(token));

                    verbose ? console.log(`route: ${route}, routeArray: ${routeArray}`): null;
                    
                    let pageName;
                    let elementIndex = 1;

                    // add breadcrumb ancestors

                    switch (routeArray.length) {
                        case 0:
                            // its the home page or another root level page
                            pageName = `${webPageTitle}`;
                            if (pageName !== 'Home') {
                                breadcrumbData.itemListElement.push(breadcrumbHomeData);
                                elementIndex = 2;
                            }
                            break;
                        case 1:
                            // its a top level page
                            breadcrumbData.itemListElement.push(breadcrumbHomeData);
                            pageName = `${webPageTitle}`;
                            elementIndex = 2;
                            break;
                        default:
                            // its a nested page
                            breadcrumbData.itemListElement.push(breadcrumbHomeData);
                            
                            // Build nested breadcrumb path
                            routeArray.forEach((element, index) => {
                                if (index === routeArray.length - 1) {
                                    // Last element handled separately
                                    return;
                                }
                                
                                breadcrumbData.itemListElement.push({
                                    '@type': 'ListItem',
                                    position: index + 2, // +2 because home is position 1
                                    item: `${baseUrl}/${routeArray.slice(0, index + 1).join('/')}`,
                                    name: getBreadcrumbLabel(element)
                                });
                            });
                            
                            pageName = webPageTitle;
                            elementIndex = routeArray.length + 1;
                            break;
                    }

                    verbose ? console.log(`pageName: ${pageName}, elementIndex: ${elementIndex}`): null;

                    // push final element (the current page)
                    let leafPageElement = {
                        '@type': 'ListItem',
                        position: elementIndex,
                        name: `${pageName}`,
                    }
                    breadcrumbData.itemListElement.push(leafPageElement);

                    //
                    // add data to graph
                    //

                    verbose ? console.log('adding data to graph...'): null;

                    let data = {};
                    data['@context'] = 'https://schema.org';
                    data['@graph'] = [];

                    data['@graph'].push(webPageData);
                    data['@graph'].push(breadcrumbData);
                    data['@graph'].push(webSiteData);
                    data['@graph'].push(orgData);

                    let script = dom.window.document.createElement('script');
                    script.type = 'application/ld+json';
                    
                    script.innerHTML = JSON.stringify(data);
                    dom.window.document.head.appendChild(script);

                    // find and remove breadcrumb microdata
                    let breadcrumbMicrodata = dom.window.document.querySelector('ul[itemtype="https://schema.org/BreadcrumbList"]');
                    if(breadcrumbMicrodata){
                        // remove itemtype and itemscope property from node
                        breadcrumbMicrodata.removeAttribute('itemtype');
                        breadcrumbMicrodata.removeAttribute('itemscope');
                    }

                    let breadcrumbListItemMicrodata = dom.window.document.querySelector('li[itemtype="https://schema.org/ListItem"]');
                    if(breadcrumbListItemMicrodata){
                        // remove itemtype and itemscope property from node
                        breadcrumbListItemMicrodata.removeAttribute('itemtype');
                        breadcrumbListItemMicrodata.removeAttribute('itemscope');
                        breadcrumbListItemMicrodata.removeAttribute('itemprop');
                    }

                    // find and remove <meta itemprop="position" ..>, excess baggage with JSON-LD breadcrumb data
                    let breadcrumbPositionMeta = dom.window.document.querySelectorAll('meta[itemprop="position"]');
                    if(breadcrumbPositionMeta){
                        breadcrumbPositionMeta.forEach((element) => {
                            element.remove();
                        });
                    }

                    fs.writeFileSync(filePath, dom.serialize());
                });
            }
        });
      },
  };
};