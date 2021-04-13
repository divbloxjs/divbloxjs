const fs = require("fs");
const fs_async = require("fs").promises;
const dx_utils = require("dx-utils");
const DivbloxDatabaseConnector = require("dx-db-connector");
const DivbloxDataLayerBase = require('./dx-core-modules/data-layer');
class DivbloxDataLayer extends DivbloxDataLayerBase {

}

//TODO: Decide if this is truly needed. If Divblox will only deal with data and logic, this might not be needed.
// If Divblox will provide the web server via express or something, then this might be needed but updated
process.on('uncaughtException', function(error) {
    console.trace("Unhandled exception caught: "+error);
    process.exit(1);
});
process.on('unhandledRejection', function(reason, p){
    console.trace("Unhandled promise rejection caught: "+reason);
    process.exit(1);
});

/**
 * DivbloxBase serves as the base Divblox class that provides the relevant backend nodejs functionality for a Divblox
 * application
 */
class DivbloxBase {
    /**
     * Constructs the Divblox instance with the options provided
     * @param options The configuration and data model options to initialize with
     * @param options.config_path The path to the dxconfig.json file that defines the environment related variables
     * @param options.data_model_path The path to the data-model.json file that contains the project's data model
     * @param options.data_layer_implementation_class An optional class implementation for the Divblox Data Layer. This
     * is useful when you want to override the default Divblox data layer behaviour
     */
    constructor(options = {}) {
        this.error_info = [];
        if ((typeof options["config_path"] === "undefined") || (options["config_path"] === null)) {
            throw new Error("No config path provided");
        }
        this.config_path = options["config_path"];
        if (!fs.existsSync(this.config_path)){
            throw new Error("Invalid config path ("+this.config_path+") provided");
        }
        if ((typeof options["data_model_path"] === "undefined") || (options["data_model_path"] === null)) {
            throw new Error("No data model path provided");
        }
        this.data_model_path = options["data_model_path"];
        if (!fs.existsSync(this.data_model_path)){
            throw new Error("Invalid data model path provided");
        }
        if ((typeof options["data_layer_implementation_class"] !== "undefined") &&
            (options["data_layer_implementation_class"] !== null)) {
            DivbloxDataLayer = options["data_layer_implementation_class"];
        }
    }

    /**
     * Whenever Divblox encounters an error, the error_info array is populated with details about the error. This
     * function simply returns that error_info array for debugging purposes
     * @returns {[]}
     */
    getError() {
        return this.error_info;
    }

    /**
     * Sets up the Divblox instance using the provided configuration and data model data.
     * @returns {Promise<void>}
     */
    async initDx() {
        if (typeof process.env.NODE_ENV === "undefined") {
            throw new Error("NODE_ENV has not been set. Divblox requires the environment to be specified.");
        }
        const config_data_str = await fs_async.readFile(this.config_path, "utf-8");
        this.config_obj = JSON.parse(config_data_str);
        if (typeof this.config_obj["environment_array"] === "undefined") {
            throw new Error("No environments configured");
        }
        if (typeof this.config_obj["environment_array"][process.env.NODE_ENV] === "undefined") {
            throw new Error("No environments configured for NODE_ENV: "+process.env.NODE_ENV);
        }
        if (typeof this.config_obj["environment_array"][process.env.NODE_ENV]["modules"] === "undefined") {
            throw new Error("No databases configured for the environment: "+process.env.NODE_ENV);
        }
        this.database_connector = new DivbloxDatabaseConnector(this.config_obj["environment_array"][process.env.NODE_ENV]["modules"])
        await this.database_connector.init();
        const data_model_data_str = await fs_async.readFile(this.data_model_path, "utf-8");
        this.data_model_obj = JSON.parse(data_model_data_str);

        this.data_layer = new DivbloxDataLayer(this.database_connector,this.data_model_obj);
        if (!await this.data_layer.validateDataModel()) {
            this.error_info = this.data_layer.getError();
            throw new Error("Error validating data model: "+
                JSON.stringify(this.error_info,null,2)+
                "\nPlease ensure that the data model is correct and then try re-synchronizing by running the following from your project root:\n" +
                "$ NODE_ENV="+process.env.NODE_ENV+" node ./divblox_config/sync_db.js");
        }
        console.log("Divblox loaded with config: "+JSON.stringify(this.config_obj["environment_array"][process.env.NODE_ENV]));
    }

    /**
     * Closes the Divblox instance
     * @param error_message An optional message to provide when closing
     */
    closeDx(error_message = null) {
        if (error_message === null){
            console.log("Divblox closed by user");
            process.exit(0);
        } else {
            console.log("Divblox closed with error: "+error_message);
            process.exit(1);
        }
    }

    //#region Data Layer - Functions relating to the interaction with the database are grouped here
    /**
     * Performs a synchronization of the provided data model with the configured database(s) to ensure that the actual
     * underlying database(s) reflect(s) what is defined in the data model
     * @returns {Promise<void>}
     */
    async syncDatabase() {
        const sync_str = await dx_utils.getCommandLineInput(
            "Synchronize data model with database now? [y/n]");
        if (sync_str.toLowerCase() === "y") {
            if (!await this.data_layer.syncDatabase()) {
                throw new Error("Error synchronizing data model: "+JSON.stringify(this.error_info,null,2));
            }
            return;
        }
        console.log("Synchronization cancelled");
    }

    /**
     * Attempts to insert a new row in the data base for the table matching the entity_name
     * @param entity_name The name of the table to insert a row for
     * @param data The relevant key/value data pairs for this entry
     * @returns {Promise<number|*>}
     */
    async create(entity_name = '',data = {}) {
        const obj_id = await this.data_layer.create(entity_name,data);
        if (obj_id === -1) {
            this.error_info = this.data_layer.getError();
        }
        return obj_id;
    }

    /**
     * Selects a row from the database for the table matching entity_name and id
     * @param entity_name The name of the table to select from
     * @param id The primary key id of the relevant row
     * @returns {Promise<*>}
     */
    async read(entity_name = '',id = -1) {
        const data_obj = await this.data_layer.read(entity_name,id);
        if (data_obj === null) {
            this.error_info = this.data_layer.getError();
        }
        return data_obj;
    }

    /**
     * Attempts to modify a row in the database for the table matching the entity_name
     * @param entity_name The name of the table to update a row for
     * @param data The relevant key/value data pairs for this entry. Only the provided keys will be updated
     * @returns {Promise<number|*>}
     */
    async update(entity_name = '',data = {}) {
        if (!await this.data_layer.update(entity_name,data)) {
            this.error_info = this.data_layer.getError();
            return false;
        }
        return true;
    }

    /**
     * Attempts to delete a row in the database for the table matching the entity_name
     * @param entity_name The name of the table to delete a row for
     * @param id The primary key id of the relevant row
     * @returns {Promise<boolean>}
     */
    async delete(entity_name = '',id = -1) {
        if (!await this.data_layer.delete(entity_name,id)) {
            this.error_info = this.data_layer.getError();
            return false;
        }
        return true;
    }
    //#endregion
}

module.exports = DivbloxBase;