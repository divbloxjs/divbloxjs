const fs = require("fs");
const fs_async = require("fs").promises;
const divblox_root = "../../divblox_config";
const data_model_file_name = divblox_root+'/data-model.json';
const dx_config_file_name = divblox_root+'/dxconfig.json';
const dx_config_default = {
    "environment_array":{
        "development":{
            "db_config": {
                "host": "localhost",
                "user": "dbuser",
                "password": "123",
                "database": "local_dx_db",
                "port": 3306,
                "ssl": false
            }
        },
        "production":{
            "db_config": {
                "host": "localhost",
                "user": "dbuser",
                "password": "123",
                "database": "local_dx_db",
                "port": 3306,
                "ssl": false
            }
        }}
};
const dx_data_model_default = {};

createDefaults();
async function createDefaults() {
    console.log("Initializing Divblox...");
    if (!fs.existsSync(divblox_root)){
        console.log("Creating Divblox config directory...");
        fs.mkdirSync(divblox_root);
    }
    if (!fs.existsSync(data_model_file_name)) {
        console.log("Creating Divblox data model...");
        await fs_async.writeFile(data_model_file_name, JSON.stringify(dx_data_model_default,null,2));
    }
    if (!fs.existsSync(dx_config_file_name)) {
        console.log("Creating Divblox default config file...");
        await fs_async.writeFile(dx_config_file_name, JSON.stringify(dx_config_default,null,2));
    }
}
