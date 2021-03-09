const fs = require("fs").promises;
const db = require('./dx_core_modules/db-connector');

process.on('uncaughtException', function(error) {
    console.log("Unhandled exception caught: "+error);
    process.exit(1);
});
process.on('unhandledRejection', function(reason, p){
    console.log("Unhandled promise rejection caught: "+reason);
    process.exit(1);
});

class Divblox {
    constructor(config_path = null,data_model_path = null) {
        if (config_path === null) {
            throw new Error("No config path provided");
        }
        if (data_model_path === null) {
            throw new Error("No data model path provided");
        }
        this.initDx(config_path,data_model_path);
    }
    async initDx(config_path = null,data_model_path = null) {
        const config_data_str = await fs.readFile(config_path, "utf-8");
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
        this.database_connector = new db(this.config_obj["environment_array"][process.env.NODE_ENV]["db_config"])
        const data_model_data_str = await fs.readFile(data_model_path, "utf-8");
        this.data_model_obj = JSON.parse(data_model_data_str);
        console.log("Divblox loaded with config: "+JSON.stringify(this.config_obj["environment_array"][process.env.NODE_ENV]));
        await this.runDx();
    }
    async runDx() {

    }
}

module.exports = Divblox;