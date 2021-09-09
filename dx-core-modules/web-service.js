const dxUtils = require("dx-utils");
const DivbloxObjectBase = require('./object-base');
/**
 * The DivbloxWebService is used to expose your Divblox functionality to the web. It uses expressjs for all the
 * webserver-related functionality.
 */
class DivbloxWebService extends DivbloxObjectBase {
    constructor(dataModel = {}, apiConfig = {}, apiEndPointRoot = '/dx-api-root') {
        super();
        this.errorInfo = [];
        this.dataModel = dataModel;
        this.apiEndPointRoot = apiEndPointRoot;
        this.apiConfig = apiConfig;
        console.log("dx web service loaded");
    }
}

module.exports = DivbloxWebService;