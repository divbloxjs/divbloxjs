const fs = require("fs");
const fsAsync = require("fs").promises;
const divbloxRoot = "../..";
const divbloxConfigRoot = divbloxRoot+"/divblox_config";
const dataModelFileName = divbloxConfigRoot+'/data-model.json';
const dxConfigFileName = divbloxConfigRoot+'/dxconfig.json';
const dxExampleScriptFileName = divbloxRoot+'/divblox_example.js';

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
                    "account": {
                        "attributes": {
                            "firstName": "varchar(50)",
                            "lastName": "varchar(50)",
                            "cell": "varchar(50) unique",
                            "idNumber": "varchar(25)"
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
 * @type {string} The example script content
 */
const dxExampleScript = 'const DivbloxBase = require("divblox.js/divblox");\n' +
    'const DivbloxDataLayerBase = require("divblox.js/dx_core_modules/data-layer");\n' +
    'class DivbloxDataLayer extends DivbloxDataLayerBase {\n' +
    '    constructor(databaseConnector = null,dataModel = {}) {\n' +
    '        super(databaseConnector,dataModel);\n' +
    '        console.log("My own data layer");\n' +
    '    }\n' +
    '}\n' +
    'class Divblox extends DivbloxBase {\n' +
    '\n' +
    '}\n' +
    '\n' +
    'const dx = new Divblox(\n' +
    '    {"configPath":"./divblox_config/dxconfig.json",\n' +
    '        "dataModelPath":"./divblox_config/data-model.json",\n' +
    '        "dataLayerImplementationClass":DivbloxDataLayer/*Can also be null if you want to use the default data layer*/});\n' +
    'async function dxDx() {\n' +
    '    await dx.initDx();\n' +
    '    const objId = await dx.create("account",{"firstName":"john","lastName":"Doe","idNumber":"123"});\n' +
    '    if (objId === -1) {\n' +
    '        console.log("Failed to create new account: "+JSON.stringify(dx.getError()));\n' +
    '    } else {\n' +
    '        console.log("New account created!");\n' +
    '        const obj = await dx.read("account",objId);\n' +
    '        if (obj !== null) {\n' +
    '            console.log("Found: "+JSON.stringify(obj,null,2));\n' +
    '        } else {\n' +
    '            console.log("Not found: "+JSON.stringify(dx.getError()));\n' +
    '        }\n' +
    '        if (!await dx.update("account",{"id":objId,"firstName":"UpdateName","idNumber":"888"})) {\n' +
    '            console.log("Error updating: "+JSON.stringify(dx.getError()));\n' +
    '        } else {\n' +
    '            console.log("Updated!");\n' +
    '        }\n' +
    '        if (!await dx.delete("account",2)) {\n' +
    '            console.log("Error deleting: "+JSON.stringify(dx.getError()));\n' +
    '        } else {\n' +
    '            console.log("Deleted!");\n' +
    '        }\n' +
    '    }\n' +
    '\n' +
    '}\n' +
    'dxDx();';

/**
 * Creates the minimum configuration files needed for Divblox to be initiated
 * @returns {Promise<void>}
 */
async function createDefaults() {
    console.log("Initializing Divblox...");
    if (!fs.existsSync(divbloxConfigRoot)){
        console.log("Creating Divblox config directory...");
        fs.mkdirSync(divbloxConfigRoot);
    }
    if (!fs.existsSync(dataModelFileName)) {
        console.log("Creating Divblox data model...");
        await fsAsync.writeFile(dataModelFileName, JSON.stringify(dxDataModelDefault,null,2));
    }
    if (!fs.existsSync(dxConfigFileName)) {
        console.log("Creating Divblox default config file...");
        await fsAsync.writeFile(dxConfigFileName, JSON.stringify(dxConfigDefault,null,2));
    }
    if (!fs.existsSync(dxExampleScriptFileName)) {
        console.log("Creating Divblox example script...");
        await fsAsync.writeFile(dxExampleScriptFileName, dxExampleScript);
    }
}
createDefaults();