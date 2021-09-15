const dxWebService = require('../web-service');

let a = new dxWebService(
    null,
    {webServerPort:3000,
        apiEndPointRoot:'test-api-route',
        wwwRoot:'test-www-route',
        staticRoot: 'public',
        viewsRoot: 'views'}
);