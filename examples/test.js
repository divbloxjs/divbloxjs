// This file should be deleted
const Divblox = require('../divblox');
class CustomDx extends Divblox {

}

const test = new CustomDx(
    {"config_path":"./examples/divblox_config/dxconfig.json",
        "data_model_path":"./examples/divblox_config/data-model.json"/*,
        "data_layer_implementation_class_path":"./divblox_config/custom-data-layer.js"*/});
async function testDx() {
        await test.initDx();
        const obj_id = await test.create("Account",{"name":"john doe","id_number":"123"});
        if (obj_id === -1) {
            console.log("Failed to create new account: "+JSON.stringify(test.getError()));
        } else {
            console.log("New account created!");
                const obj = await test.read("Account",obj_id);
                if (obj !== null) {
                        console.log("Found: "+obj["name"]);
                } else {
                        console.log("Not found: "+JSON.stringify(test.getError()));
                }
                if (!await test.update("Account",{"id":obj_id,"name":"UpdateName","id_number":"888"})) {
                        console.log("Error updating: "+JSON.stringify(test.getError()));
                } else {
                        console.log("Updated!");
                }
                if (!await test.delete("Account",2)) {
                        console.log("Error deleting: "+JSON.stringify(test.getError()));
                } else {
                        console.log("Deleted!");
                }
        }

}

testDx();