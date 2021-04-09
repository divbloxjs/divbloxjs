const fs = require("fs");
const fs_async = require("fs").promises;
const dx_utils = require("dx-utils");
const DivbloxDatabaseConnector = require('./dx-core-modules/db-connector');
const DivbloxDataLayerBase = require('./dx-core-modules/data-layer');
class DivbloxDataLayer extends DivbloxDataLayerBase {

}

process.on('uncaughtException', function(error) {
    console.log("Unhandled exception caught: "+error);
    process.exit(1);
});
process.on('unhandledRejection', function(reason, p){
    console.log("Unhandled promise rejection caught: "+reason);
    process.exit(1);
});


class Divblox {
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
    getError() {
        return this.error_info;
    }
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
        if (typeof this.config_obj["environment_array"][process.env.NODE_ENV]["db_config"] === "undefined") {
            throw new Error("No databases configured for the environement: "+process.env.NODE_ENV);
        }
        this.database_connector = new DivbloxDatabaseConnector(this.config_obj["environment_array"][process.env.NODE_ENV]["db_config"])

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
    closeDx(error_message = null) {
        if (error_message === null){
            console.log("Divblox closed by user");
            process.exit(0);
        } else {
            console.log("Divblox closed with error: "+error_message);
            process.exit(1);
        }
    }
    //#region Data Layer
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
    async create(entity_name = '',data = {}) {
        const obj_id = await this.data_layer.create(entity_name,data);
        if (obj_id === -1) {
            this.error_info = this.data_layer.getError();
        }
        return obj_id;
    }
    async read(entity_name = '',id = -1) {
        const data_obj = await this.data_layer.read(entity_name,id);
        if (data_obj === null) {
            this.error_info = this.data_layer.getError();
        }
        return data_obj;
    }
    async update(entity_name = '',data = {}) {
        if (!await this.data_layer.update(entity_name,data)) {
            this.error_info = this.data_layer.getError();
            return false;
        }
        return true;
    }
    async delete(entity_name = '',id = -1) {
        if (!await this.data_layer.delete(entity_name,id)) {
            this.error_info = this.data_layer.getError();
            return false;
        }
        return true;
    }
    //#endregion
}

module.exports = Divblox;