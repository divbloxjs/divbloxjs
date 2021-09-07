const DivbloxBase = require("divblox.js/divblox");
const DivbloxDataLayerBase = require("divblox.js/dx_core_modules/data-layer");
class DivbloxDataLayer extends DivbloxDataLayerBase {
    constructor(databaseConnector = null,dataModel = {}) {
        super(databaseConnector,dataModel);
        console.log("My own data layer");
    }
}
class Divblox extends DivbloxBase {

}

const dx = new Divblox(
    {"configPath":"./divblox_config/dxconfig.json",
        "dataModelPath":"./divblox_config/data-model.json",
        "dataLayerImplementationClass":DivbloxDataLayer/*Can also be null if you want to use the default data layer*/});
async function dxDx() {
    await dx.initDx();
    const objId = await dx.create("account",{"firstName":"john","lastName":"Doe","idNumber":"123"});
    if (objId === -1) {
        console.log("Failed to create new account: "+JSON.stringify(dx.getError()));
    } else {
        console.log("New account created!");
        const obj = await dx.read("account",objId);
        if (obj !== null) {
            console.log("Found: "+JSON.stringify(obj,null,2));
        } else {
            console.log("Not found: "+JSON.stringify(dx.getError()));
        }
        if (!await dx.update("account",{"id":objId,"firstName":"UpdateName","idNumber":"888"})) {
            console.log("Error updating: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Updated!");
        }
        if (!await dx.delete("account",2)) {
            console.log("Error deleting: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Deleted!");
        }
    }

}
dxDx();