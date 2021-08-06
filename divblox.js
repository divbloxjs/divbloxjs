const fs = require("fs");
const fsAsync = require("fs").promises;
const dxUtils = require("dx-utils");
const DivbloxDatabaseConnector = require("dx-db-connector");
const DivbloxDataLayerBase = require('./dx_core_modules/data-layer');

/**
 * This class overrides the default DivbloxDataLayerBase class to ensure that we can always just call DivbloxDataLayer,
 * meaning, the developer can create their own version of DivbloxDataLayer if they want to modify how it should work
 */
class DivbloxDataLayer extends DivbloxDataLayerBase {}

/**
 * DivbloxBase serves as the base Divblox class that provides the relevant backend nodejs functionality for a Divblox
 * application
 */
class DivbloxBase {
    /**
     * Constructs the Divblox instance with the options provided
     * @param options The configuration and data model options to initialize with
     * @param options.configPath The path to the dxconfig.json file that defines the environment related variables
     * @param options.dataModelPath The path to the data-model.json file that contains the project's data model
     * @param options.dataLayerImplementationClass An optional class implementation for the Divblox Data Layer. This
     * is useful when you want to override the default Divblox data layer behaviour
     */
    constructor(options = {}) {
        this.errorInfo = [];

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
    }

    /**
     * Whenever Divblox encounters an error, the errorInfo array is populated with details about the error. This
     * function simply returns that errorInfo array for debugging purposes
     * @returns {[]}
     */
    getError() {
        return this.errorInfo;
    }

    /**
     * Sets up the Divblox instance using the provided configuration and data model data.
     * @returns {Promise<void>}
     */
    async initDx() {
        if (typeof process.env.NODE_ENV === "undefined") {
            throw new Error("NODE_ENV has not been set. Divblox requires the environment to be specified. You can" +
                " try running your script with NODE_ENV=development node [your_script.js]\n");
        }

        const configDataStr = await fsAsync.readFile(this.configPath, "utf-8");
        this.configObj = JSON.parse(configDataStr);
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

        this.dataLayer = new DivbloxDataLayer(this.databaseConnector,this.dataModelObj);
        if (!await this.dataLayer.validateDataModel()) {
            this.errorInfo = this.dataLayer.getError();
            throw new Error("Error validating data model: "+
                JSON.stringify(this.errorInfo,null,2)+
                "\nPlease ensure that the data model is correct and then try re-synchronizing by running the following from your project root:\n" +
                "$ NODE_ENV="+process.env.NODE_ENV+" node ./divbloxConfig/sync_db.js");
        }
        console.log("Divblox loaded with config: "+JSON.stringify(this.configObj["environmentArray"][process.env.NODE_ENV]));
    }

    //#region Data Layer - Functions relating to the interaction with the database are grouped here
    /**
     * Performs a synchronization of the provided data model with the configured database(s) to ensure that the actual
     * underlying database(s) reflect(s) what is defined in the data model
     * @returns {Promise<void>}
     */
    async syncDatabase() {
        const syncStr = await dxUtils.getCommandLineInput(
            "Synchronize data model with database now? [y/n]");

        if (syncStr.toLowerCase() === "y") {
            if (!await this.dataLayer.syncDatabase()) {
                throw new Error("Error synchronizing data model: "+JSON.stringify(this.errorInfo,null,2));
            }
            return;
        }

        console.log("Synchronization cancelled");
    }

    /**
     * Attempts to insert a new row in the data base for the table matching the entityName
     * @param {string} entityName The name of the table to insert a row for
     * @param {*} data The relevant key/value data pairs for this entry
     * @returns {Promise<number|*>}
     */
    async create(entityName = '',data = {}) {
        const objId = await this.dataLayer.create(entityName,data);
        if (objId === -1) {
            this.errorInfo = this.dataLayer.getError();
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
        const dataObj = await this.dataLayer.read(entityName,id);
        if (dataObj === null) {
            this.errorInfo = this.dataLayer.getError();
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
        if (!await this.dataLayer.update(entityName,data)) {
            this.errorInfo = this.dataLayer.getError();
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
        if (!await this.dataLayer.delete(entityName,id)) {
            this.errorInfo = this.dataLayer.getError();
            return false;
        }
        
        return true;
    }
    //#endregion
}

module.exports = DivbloxBase;