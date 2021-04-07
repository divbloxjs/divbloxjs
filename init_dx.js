const fs = require("fs");
const fs_async = require("fs").promises;
const divblox_root = "./divblox_config";
const data_model_file_name = divblox_root+'/data-model.json';
const dx_config_file_name = divblox_root+'/dxconfig.json';
if (!fs.existsSync(divblox_root)){
    fs.mkdirSync(divblox_root);
}
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
    if (!fs.existsSync(data_model_file_name)) {
        await fs_async.writeFile(data_model_file_name, JSON.stringify(dx_data_model_default,null,2));
    }
    if (!fs.existsSync(dx_config_file_name)) {
        await fs_async.writeFile(dx_config_file_name, JSON.stringify(dx_config_file_name,null,2));
    }
}
