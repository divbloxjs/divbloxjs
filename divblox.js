const fs = require("fs");
const fsAsync = require("fs").promises;
const dxUtils = require("dx-utils");
const DivbloxObjectBase = require('./dx-core-modules/object-base');
const DivbloxDatabaseConnector = require("dx-db-connector");
const DivbloxDataLayerBase = require('./dx-core-modules/data-layer');
const DivbloxWebServiceBase = require('./dx-core-modules/web-service');

/**
 * This class overrides the default DivbloxDataLayerBase class to ensure that we can always just call DivbloxDataLayer,
 * meaning, the developer can create their own version of DivbloxDataLayer if they want to modify how it should work
 */
class DivbloxDataLayer extends DivbloxDataLayerBase {}

/**
 * This class overrides the default DivbloxWebServiceBase class to ensure that we can always just call DivbloxWebService,
 * meaning, the developer can create their own version of DivbloxWebService if they want to modify how it should work
 */
class DivbloxWebService extends DivbloxWebServiceBase {}

/**
 * DivbloxBase serves as the base Divblox class that provides the relevant backend nodejs functionality for a Divblox
 * application
 */
class DivbloxBase extends DivbloxObjectBase {
    /**
     * Constructs the Divblox instance with the options provided
     * @param options The configuration and data model options to initialize with
     * @param options.configPath The path to the dxconfig.json file that defines the environment related variables
     * @param options.dataModelPath The path to the data-model.json file that contains the project's data model
     * @param options.dataLayerImplementationClass An optional class implementation for the Divblox Data Layer. This
     * is useful when you want to override the default Divblox data layer behaviour
     * @param options.webServiceImplementationClass An optional class implementation for the Divblox Web Service. This
     * is useful when you want to override the default Divblox Web Service behaviour
     */
    constructor(options = {}) {
        super();

        this.isInitFinished = false;

        if ((typeof options["configPath"] === "undefined") || (options["configPath"] === null)) {
            throw new Error("No config path provided");
        }
        this.configPath = options["configPath"];
        if (!fs.existsSync(this.configPath)) {
            throw new Error("Invalid config path ("+this.configPath+") provided");
        }

        if ((typeof options["dataModelPath"] === "undefined") || (options["dataModelPath"] === null)) {
            throw new Error("No data model path provided");
        }
        this.dataModelPath = options["dataModelPath"];
        if (!fs.existsSync(this.dataModelPath)) {
            throw new Error("Invalid data model path provided");
        }

        if ((typeof options["dataLayerImplementationClass"] !== "undefined") &&
            (options["dataLayerImplementationClass"] !== null)) {
            DivbloxDataLayer = options["dataLayerImplementationClass"];
        }
    
        if ((typeof options["webServiceImplementationClass"] !== "undefined") &&
            (options["webServiceImplementationClass"] !== null)) {
            DivbloxWebService = options["webServiceImplementationClass"];
        }
    }
    
    /**
     * Sets up the Divblox instance using the provided configuration and data model data.
     * @returns {Promise<void>}
     */
    async initDx() {
        const configDataStr = await fsAsync.readFile(this.configPath, "utf-8");
        this.configObj = JSON.parse(configDataStr);
        if (typeof this.configObj.environment === "undefined") {
            throw new Error("NODE_ENV has not been set. Divblox requires the environment to be specified. You can" +
                " try running your script with NODE_ENV=development node [your_script.js]\n");
        }
        process.env.NODE_ENV = this.configObj.environment;

        if (typeof process.env.NODE_ENV === "undefined") {
            throw new Error("NODE_ENV has not been set. Divblox requires the environment to be specified. You can" +
                " try running your script with NODE_ENV=development node [your_script.js]\n");
        }

        if (typeof this.configObj["environmentArray"] === "undefined") {
            throw new Error("No environments configured");
        }
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV] === "undefined") {
            throw new Error("No environments configured for NODE_ENV: "+process.env.NODE_ENV);
        }
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["modules"] === "undefined") {
            throw new Error("No databases configured for the environment: "+process.env.NODE_ENV);
        }

        this.databaseConnector = new DivbloxDatabaseConnector(this.configObj["environmentArray"][process.env.NODE_ENV]["modules"])
        await this.databaseConnector.init();

        const dataModelDataStr = await fsAsync.readFile(this.dataModelPath, "utf-8");
        this.dataModelObj = JSON.parse(dataModelDataStr);

        this.dataLayer = new DivbloxDataLayer(this.databaseConnector, this.dataModelObj);
        if (!await this.dataLayer.validateDataModel()) {
            this.populateError(this.dataLayer.getError(), true);
            console.log("Error validating data model: "+
                JSON.stringify(this.getError(),null,2));
            await this.syncDatabase(false);
        }
        this.webService = new DivbloxWebService(this.dataModelObj);

        this.isInitFinished = true;
        console.log("Divblox loaded with config: "+JSON.stringify(this.configObj["environmentArray"][process.env.NODE_ENV]));
    }

    //#region Data Layer - Functions relating to the interaction with the database are grouped here
    /**
     * Performs a synchronization of the provided data model with the configured database(s) to ensure that the actual
     * underlying database(s) reflect(s) what is defined in the data model
     * @param {boolean} handleErrorSilently If set to true, the function will not throw an exception when it fails
     * to sync
     * @returns {Promise<void>}
     */
    async syncDatabase(handleErrorSilently = false) {
        const syncStr = await dxUtils.getCommandLineInput(
            "Synchronize data model with database now? [y/n]");

        if (syncStr.toLowerCase() === "y") {
            if (!await this.dataLayer.syncDatabase()) {
                if (handleErrorSilently) {
                    console.error("Error synchronizing data model: "+JSON.stringify(this.getError(),null,2));
                } else {
                    throw new Error("Error synchronizing data model: "+JSON.stringify(this.getError(),null,2));
                }
            }
            return;
        }
        if (handleErrorSilently) {
            console.log("Synchronization cancelled");
        } else {
            throw new Error("Synchronization cancelled. Cannot continue.");
        }
    }

    /**
     * Attempts to insert a new row in the data base for the table matching the entityName
     * @param {string} entityName The name of the table to insert a row for
     * @param {*} data The relevant key/value data pairs for this entry
     * @returns {Promise<number|*>}
     */
    async create(entityName = '',data = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return -1;
        }

        const objId = await this.dataLayer.create(entityName,data);
        if (objId === -1) {
            this.populateError(this.dataLayer.getError(), true);
        }

        return objId;
    }

    /**
     * Selects a row from the database for the table matching entityName and id
     * @param {string} entityName The name of the table to select from
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<*>}
     */
    async read(entityName = '',id = -1) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return null;
        }

        const dataObj = await this.dataLayer.read(entityName,id);
        if (dataObj === null) {
            this.populateError(this.dataLayer.getError(), true);
        }

        return dataObj;
    }

    /**
     * Attempts to modify a row in the database for the table matching the entityName
     * @param {string} entityName The name of the table to update a row for
     * @param {*} data The relevant key/value data pairs for this entry. Only the provided keys will be updated
     * @returns {Promise<number|*>}
     */
    async update(entityName = '',data = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!await this.dataLayer.update(entityName,data)) {
            this.populateError(this.dataLayer.getError(), true);
            return false;
        }

        return true;
    }

    /**
     * Attempts to delete a row in the database for the table matching the entityName
     * @param {string} entityName The name of the table to delete a row for
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<boolean>}
     */
    async delete(entityName = '',id = -1) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!await this.dataLayer.delete(entityName,id)) {
            this.populateError(this.dataLayer.getError(), true);
            return false;
        }
        
        return true;
    }
    //#endregion
}

module.exports = DivbloxBase;