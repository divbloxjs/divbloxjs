const dx = require('../web-service');
let a = new dx({},{webServerPort:3000,apiEndPointRoot:'./tests/test-route',staticRoot: 'tests/public', viewsRoot: 'tests/views'});