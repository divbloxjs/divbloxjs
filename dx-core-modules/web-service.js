const dxUtils = require("dx-utils");

/**
 * The DivbloxWebService is used to expose your Divblox functionality to the web. It uses expressjs for all the
 * webserver-related functionality.
 */
class DivbloxWebService {
    constructor(dataModel = {}, apiEndPointRoot = '/dx-api-root', apiConfig = {}) {
        this.errorInfo = [];
        this.dataModel = dataModel;
        this.apiEndPointRoot = apiEndPointRoot;
        this.apiConfig = apiConfig;
        console.log("dx web service loaded");
    }
}

module.exports = DivbloxWebService;