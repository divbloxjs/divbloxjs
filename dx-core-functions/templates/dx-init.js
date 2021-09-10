/**
 * This dx-init script allows us to setup some custom Divblox configuration and initializations that we will be able to
 * anywhere in our project. Rather than redefine these for every script where we want to use Divblox
 */

const DivbloxBase = require("divbloxjs/divblox");
const DivbloxDataLayerBase = require("divbloxjs/dx-core-modules/data-layer");
const DivbloxWebServiceBase = require("divbloxjs/dx-core-modules/web-service");

/**
 * This is an implementation of the DivbloxDataLayerBase class. We can use this class to override the core data layer
 * related functionality for Divblox. It is best practice to do this since the base classes can be updated via a
 * package manager.
 * We don't need to create this class if we don't want to and we are happy with the standard Divblox data layer.
 */
class DivbloxDataLayer extends DivbloxDataLayerBase {
    constructor(databaseConnector = null, dataModel = {}) {
        super(databaseConnector, dataModel);
        console.log("My own data layer");
    }
}

/**
 * This is an implementation of the DivbloxDataLayerBase class. We can use this class to override the core data layer
 * related functionality for Divblox. It is best practice to do this since the base classes can be updated via a
 * package manager.
 * We don't need to create this class if we don't want to and we are happy with the standard Divblox data layer.
 */
class DivbloxWebService extends DivbloxWebServiceBase {
    constructor(dataModel = {}, apiConfig = {}, apiEndPointRoot = '/dx-api-root') {
        super(dataModel, apiConfig, apiEndPointRoot);
        console.log("My own dx web service");
    }
}

/**
 * Again, we create an implementation of the DivbloxBase class here in order to modify any core functionality if
 * required. It is best practice to do this since the base classes can be updated via a package manager
 */
class Divblox extends DivbloxBase {

}

// Let's create an instance of Divblox. This requires a config path, a data model path and an optional datalayer
// implementation class
const dx = new Divblox(
    {"configPath":"./divblox-config/dxconfig.json",
        "dataModelPath":"./divblox-config/data-model.json",
        "dataLayerImplementationClass":DivbloxDataLayer/*Can also be null if you want to use the default data layer*/,
        "webServiceImplementationClass":DivbloxWebService/*Can also be null if you want to use the default web service*/});

module.exports = dx;