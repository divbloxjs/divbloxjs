const fs = require("fs");
const fs_async = require("fs").promises;
const divblox_root = "../../divblox_config";
const data_model_file_name = divblox_root+'/data-model.json';
const dx_config_file_name = divblox_root+'/dxconfig.json';
const dx_sync_db_file_name = divblox_root+'/sync_db.js';
/**
 * @type {{environment_array: {development: {modules: {main: {password: string, database: string, port: number,
 * host: string, user: string, ssl: boolean}}}, production: {modules: {main: {password: string, database: string, port: number, host: string, user: string, ssl: boolean}}}}}}
 */
const dx_config_default = {
        "environment_array":{
            "development":{
                "modules": {
                    "main": {
                        "host": "localhost",
                        "user": "dbuser",
                        "password": "123",
                        "database": "local_dx_db",
                        "port": 3306,
                        "ssl": false
                    }
                }
            },
            "production":{
                "modules": {
                    "main": {
                        "host": "localhost",
                        "user": "dbuser",
                        "password": "123",
                        "database": "local_dx_db",
                        "port": 3306,
                        "ssl": false
                    }
                }
            }
        }
    };
/**
 * @type {{modules: [{entities: {account: {relationships: {user_role: [string, string], password_reset_token: [string]},
 * attributes: {surname: string, name: string, cell: string}}}, module_name: string}]}}
 */
const dx_data_model_default = {
        "modules": [
            {
                "module_name": "main",
                "entities": {
                    "account": {
                        "attributes": {
                            "name": "varchar(50)",
                            "surname": "varchar(50)",
                            "cell": "varchar(50) unique"
                        },
                        "relationships": {
                            "user_role": ["main_role","second_role"],
                            "password_reset_token":["token"]
                        }
                    }
                }
            }
        ]
    };
/**
 * @type {string} The default sync script content
 */
const dx_sync_db_default = 'const DivbloxBase = require("divblox.js/divblox");\n' +
    'const dx = new DivbloxBase(\n' +
    '    {"config_path":"./divblox_config/dxconfig.json",\n' +
    '    "data_model_path":"./divblox_config/data-model.json"\n' +
    '    });\n' +
    'async function runDx() {\n' +
    '    await dx.initDx();\n' +
    '    await dx.syncDatabase();\n' +
    '    dx.closeDx();\n' +
    '}\n' +
    'runDx();'

/**
 * Creates the minimum configuration files needed for Divblox to be initiated
 * @returns {Promise<void>}
 */
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
    if (!fs.existsSync(dx_sync_db_file_name)) {
        console.log("Creating Divblox sync_db script...");
        await fs_async.writeFile(dx_sync_db_file_name, dx_sync_db_default);
    }
}
createDefaults();