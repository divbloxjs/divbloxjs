// This file should be deleted
const DivbloxBase = require("divblox.js/divblox");
const DivbloxDataLayerBase = require("divblox.js/dx-core-modules/data-layer");
class DivbloxDataLayer extends DivbloxDataLayerBase {
    constructor(database_connector = null,data_model = {}) {
        super(database_connector,data_model);
        console.log("My own data layer");
    }
}
class Divblox extends DivbloxBase {

}

const dx = new Divblox(
    {"config_path":"./divblox_config/dxconfig.json",
        "data_model_path":"./divblox_config/data-model.json",
        "data_layer_implementation_class":null});
async function dxDx() {
    await dx.initDx();
    const obj_id = await dx.create("Account",{"name":"john doe","id_number":"123"});
    if (obj_id === -1) {
        console.log("Failed to create new account: "+JSON.stringify(dx.getError()));
    } else {
        console.log("New account created!");
        const obj = await dx.read("Account",obj_id);
        if (obj !== null) {
            console.log("Found: "+obj["name"]);
        } else {
            console.log("Not found: "+JSON.stringify(dx.getError()));
        }
        if (!await dx.update("Account",{"id":obj_id,"name":"UpdateName","id_number":"888"})) {
            console.log("Error updating: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Updated!");
        }
        if (!await dx.delete("Account",2)) {
            console.log("Error deleting: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Deleted!");
        }
    }

}
dxDx();