const fs = require("fs");
const fsAsync = require("fs").promises;
const divbloxRoot = "../../divblox_config";
const dataModelFileName = divbloxRoot+'/data-model.json';
const dxConfigFileName = divbloxRoot+'/dxconfig.json';
const dxSyncDbFileName = divbloxRoot+'/sync_db.js';
/**
 * @type {{environmentArray: {development: {modules: {main: {password: string, database: string, port: number,
 * host: string, user: string, ssl: boolean}}}, production: {modules: {main: {password: string, database: string, port: number, host: string, user: string, ssl: boolean}}}}}}
 */
const dxConfigDefault = {
        "environmentArray":{
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
 * @type {{modules: [{entities: {account: {relationships: {userRole: [string, string], passwordResetToken: [string]},
 * attributes: {surname: string, name: string, cell: string}}}, moduleName: string}]}}
 */
const dxDataModelDefault = {
        "modules": [
            {
                "moduleName": "main",
                "entities": {
                    "Account": {
                        "attributes": {
                            "firstName": "varchar(50)",
                            "lastName": "varchar(50)",
                            "cell": "varchar(50) unique"
                        },
                        "relationships": {
                            "userRole": ["mainRole","secondRole"],
                            "passwordResetToken":["token"]
                        }
                    }
                }
            }
        ]
    };
/**
 * @type {string} The default sync script content
 */
const dxSyncDbDefault = 'const DivbloxBase = require("divblox.js/divblox");\n' +
    'const dx = new DivbloxBase(\n' +
    '    {"configPath":"./divblox_config/dxconfig.json",\n' +
    '    "dataModelPath":"./divblox_config/data-model.json"\n' +
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
    if (!fs.existsSync(divbloxRoot)){
        console.log("Creating Divblox config directory...");
        fs.mkdirSync(divbloxRoot);
    }
    if (!fs.existsSync(dataModelFileName)) {
        console.log("Creating Divblox data model...");
        await fsAsync.writeFile(dataModelFileName, JSON.stringify(dxDataModelDefault,null,2));
    }
    if (!fs.existsSync(dxConfigFileName)) {
        console.log("Creating Divblox default config file...");
        await fsAsync.writeFile(dxConfigFileName, JSON.stringify(dxConfigDefault,null,2));
    }
    if (!fs.existsSync(dxSyncDbFileName)) {
        console.log("Creating Divblox syncDb script...");
        await fsAsync.writeFile(dxSyncDbFileName, dxSyncDbDefault);
    }
}
createDefaults();