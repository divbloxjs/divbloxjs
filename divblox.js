const fs = require("fs").promises;
const DivbloxDatabaseConnector = require('./dx-core-modules/db-connector');

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
        if ((typeof options["data_model_path"] === "undefined") || (options["data_model_path"] === null)) {
            throw new Error("No data model path provided");
        }
        this.data_model_path = options["data_model_path"];
        this.data_layer_implementation_class_path = './dx-core-modules/data-layer.js';
        if (typeof options["data_layer_implementation_class_path"] !== "undefined") {
            this.data_layer_implementation_class_path = options["data_layer_implementation_class_path"];
        }
    }
    getError() {
        return this.error_info;
    }
    async initDx() {
        const config_data_str = await fs.readFile(this.config_path, "utf-8");
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

        const data_model_data_str = await fs.readFile(this.data_model_path, "utf-8");
        this.data_model_obj = JSON.parse(data_model_data_str);
        const DataLayer = require(this.data_layer_implementation_class_path);
        this.data_layer = new DataLayer(this.database_connector,this.data_model_obj);

        console.log("Divblox loaded with config: "+JSON.stringify(this.config_obj["environment_array"][process.env.NODE_ENV]));
    }
    //#region Data Layer
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