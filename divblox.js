const fs = require("fs");
const dxUtils = require("dx-utils");
const divbloxObjectBase = require('./dx-core-modules/object-base');
const divbloxDatabaseConnector = require("dx-db-connector");
const divbloxDataLayerBase = require('./dx-core-modules/data-layer');
const divbloxWebServiceBase = require('./dx-core-modules/web-service');

/**
 * This class overrides the default divbloxDataLayerBase class to ensure that we can always just call DivbloxDataLayer,
 * meaning, the developer can create their own version of DivbloxDataLayer if they want to modify how it should work
 */
class DivbloxDataLayer extends divbloxDataLayerBase {}

/**
 * This class overrides the default divbloxWebServiceBase class to ensure that we can always just call DivbloxWebService,
 * meaning, the developer can create their own version of DivbloxWebService if they want to modify how it should work
 */
class DivbloxWebService extends divbloxWebServiceBase {}

/**
 * DivbloxBase serves as the base Divblox class that provides the relevant backend nodejs functionality for a Divblox
 * application
 */
class DivbloxBase extends divbloxObjectBase {
    /**
     * Constructs the Divblox instance with the options provided
     * @param options The configuration and data model options to initialize with
     * @param {string} options.configPath The path to the dxconfig.json file that defines the environment related variables
     * @param {string} options.dataModelPath The path to the data-model.json file that contains the project's data model
     * @param {*} options.dataLayerImplementationClass An optional class implementation for the Divblox Data Layer. This
     * is useful when you want to override the default Divblox data layer behaviour
     * @param {*} options.webServiceImplementationClass An optional class implementation for the Divblox Web Service. This
     * is useful when you want to override the default Divblox Web Service behaviour
     * @param {boolean} options.skipInit If set to true this forces the constructor to not call this.initDx()
     * automatically. Used when we want to call startDx() after init, meaning we have to await the initDx function
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

        const configDataStr = fs.readFileSync(this.configPath, "utf-8");
        this.configObj = JSON.parse(configDataStr);

        if ((typeof process.env.NODE_ENV === "undefined") && (typeof this.configObj.environment === "undefined")) {
            throw new Error("NODE_ENV has not been set. Divblox requires the environment to be specified. You can" +
                " try running your script with NODE_ENV=development node [your_script.js]\n");
        }
        if (typeof process.env.NODE_ENV === "undefined") {
            process.env.NODE_ENV = this.configObj.environment;
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

        if (typeof this.configObj["webServiceConfig"] === "undefined") {
            throw new Error("No web service configuration provided");
        }

        this.databaseConnector = new divbloxDatabaseConnector(this.configObj["environmentArray"][process.env.NODE_ENV]["modules"]);

        const dataModelDataStr = fs.readFileSync(this.dataModelPath, "utf-8");
        this.dataModelObj = JSON.parse(dataModelDataStr);

        this.packages = {};
        if (typeof this.configObj["divbloxPackagesRootLocal"] !== "undefined") {
            if (typeof this.configObj["divbloxPackages"] !== "undefined") {
                if ((typeof this.configObj["divbloxPackages"]["local"] !== "undefined") &&
                    (this.configObj["divbloxPackages"]["local"].length > 0)) {
                    for (const localPackage of this.configObj["divbloxPackages"]["local"]) {
                        this.packages[localPackage] = {
                            "packageRoot": this.configObj["divbloxPackagesRootLocal"]+"/"+localPackage};
                        const packageDataModelDataStr = fs.readFileSync(this.configObj["divbloxPackagesRootLocal"]+"/"+localPackage+"/data-model.json", "utf-8");
                        const packageDataModelObj = JSON.parse(packageDataModelDataStr);
                        for (const entityName of Object.keys(packageDataModelObj)) {
                            if (typeof this.dataModelObj[entityName] !== "undefined") {
                                throw new Error("Tried to define entity '"+entityName+"' multiple times in the data model");
                            }
                            this.dataModelObj[entityName] = packageDataModelObj[entityName];
                        }

                    }
                }
                if ((typeof this.configObj["divbloxPackages"]["npm"] !== "undefined") &&
                    (this.configObj["divbloxPackages"]["npm"].length > 0)) {
                    for (const npmPackage of this.configObj["divbloxPackages"]["npm"]) {
                        this.packages[npmPackage] = {"packageRoot": "node_modules/"+npmPackage};
                        const packageDataModelDataStr = fs.readFileSync("node_modules/"+npmPackage+"/data-model.json", "utf-8");
                        const packageDataModelObj = JSON.parse(packageDataModelDataStr);
                        for (const entityName of Object.keys(packageDataModelObj)) {
                            if (typeof this.dataModelObj[entityName] !== "undefined") {
                                throw new Error("Tried to define entity '"+entityName+"' multiple times in the data model");
                            }
                            this.dataModelObj[entityName] = packageDataModelObj[entityName];
                        }
                    }
                }
            }
        }

        this.dataLayer = new DivbloxDataLayer(this.databaseConnector, this.dataModelObj);
        const currentDataModelHash = this.dataLayer.getDataModelHash();
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"] === "undefined") {
            this.dataModelState = {
                "currentDataModelHash": currentDataModelHash,
                "lastDataModelChangeTimestamp": Date.now(),
                "lastDataModelSyncTimestamp": 0
            }
            this.updateDataModelState(this.dataModelState);
        } else {
            this.dataModelState = this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"];
        }

        this.isInitFinished = true;
    }
    
    /**
     * Starts the Divblox instance using the provided configuration and data model data. This validates the data model
     * and also start the Divblox web service
     * @param {boolean} mustSkipDatabaseSync If true, divbloxjs will not even check if it should synchronize the data
     * model with the database. This is useful when running divbloxjs with a process manager like pm2 to ensure
     * uninterrupted restarts of the divbloxjs process
     * @returns {Promise<void>}
     */
    async startDx(mustSkipDatabaseSync = false) {
        if (!mustSkipDatabaseSync) {
            await this.databaseConnector.init();

            if (!await this.dataLayer.validateDataModel(this.dataModelState)) {
                this.populateError(this.dataLayer.getError(), true);
                console.log("Error validating data model: "+
                    JSON.stringify(this.getError(),null,2));
                if (this.dataLayer.isRequiredEntitiesMissing) {
                    console.log("You can run the application generator again to generate the default model: npx github:divbloxjs/divbloxjs-application-generator");
                    return;
                }
                this.dataModelState.lastDataModelChangeTimestamp = Date.now();
                this.dataModelState.currentDataModelHash = this.dataLayer.getDataModelHash();
                this.updateDataModelState(this.dataModelState);

                await this.syncDatabase(false);
            } else if (this.dataModelState.lastDataModelSyncTimestamp < this.dataModelState.lastDataModelChangeTimestamp) {
                await this.syncDatabase(false);
            }
        }

        const webServerPort = typeof this.configObj["environmentArray"][process.env.NODE_ENV]["webServerPort"] === "undefined" ?
            3000 : this.configObj["environmentArray"][process.env.NODE_ENV]["webServerPort"];
        const webServerUseHttps = typeof this.configObj["environmentArray"][process.env.NODE_ENV]["useHttps"] === "undefined" ?
            false : this.configObj["environmentArray"][process.env.NODE_ENV]["useHttps"];
        const webServerHttpsConfig = this.configObj["environmentArray"][process.env.NODE_ENV]["serverHttps"];
        const webServiceConfig = {
            "webServerPort": webServerPort,
            "useHttps": webServerUseHttps,
            "serverHttps": webServerHttpsConfig,
            ...this.configObj["webServiceConfig"]};
        this.webService = new DivbloxWebService(webServiceConfig);

        //Since startup was successful, let's clean potential errors
        this.resetError();

        console.log("Divblox started with config:");
        console.dir(this.configObj["environmentArray"][process.env.NODE_ENV]);
    }

    /**
     * Updates the current data model state in the dxconfig.json file with the provided data
     * @param dataModelState The new data model state to store
     */
    updateDataModelState(dataModelState) {
        this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"] = dataModelState;
        fs.writeFileSync(this.configPath, JSON.stringify(this.configObj,null,2));
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
            } else {
                this.dataModelState.lastDataModelSyncTimestamp = Date.now();
                this.updateDataModelState(this.dataModelState);

                // Let's just wait 2s for the console to make sense
                await dxUtils.sleep(2000);
                console.log("Finishing divbloxjs startup...");
                await dxUtils.sleep(1000);
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
            this.populateError(this.dataLayer.getError(), true, true);
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
            this.populateError(this.dataLayer.getError(), true, true);
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
            this.populateError(this.dataLayer.getError(), true, true);
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
            this.populateError(this.dataLayer.getError(), true, true);
            return false;
        }
        
        return true;
    }

    /**
     * Inserts a new auditLogEntry into the database
     * @param {string} entry.objectName The name of the entity that was affected
     * @param {string} entry.modificationType create|update|delete
     * @param {int} entry.objectId The database primary key id of the entity that was affected
     * @param {string} entry.entryDetail The details of the entry (What was changed)
     * @param {string} entry.userIdentifier A unique identifier for the user that triggered the modification
     * @param {string} entry.apiKey A unique identifier for the user that triggered the modification if called via an
     * api that identifies with an api key
     * @return {Promise<boolean>}
     */
    async addAuditLogEntry(entry = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!await this.dataLayer.addAuditLogEntry(entry)) {
            this.populateError(this.dataLayer.getError());
            return false;
        }

        return true;
    }
    //#endregion

    //#region Session related functionality

    /**
     * Stores the value for the given key in the session that is identified by the given session Id
     * @param sessionId The id of the session that will be used to store the data
     * @param key The key for the data
     * @param value The data to store
     * @return {Promise<boolean>} True if store was successful
     */
    async storeSessionData(sessionId = '', key = '', value = null) {
        // TODO: Implement this functionality
        return true;
    }

    /**
     * Retrieves the value for the given key in the session that is identified by the given session Id
     * @param sessionId The id of the session that will be used to retrieve the data
     * @param key The key for the data
     * @return {Promise<string>}
     */
    async retrieveSessionData(sessionId = '', key = '') {
        // TODO: Implement this functionality
        return '';
    }
    //#endregion
}

module.exports = DivbloxBase;