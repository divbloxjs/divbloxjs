// This file should be deleted
const Divblox = require('./divblox');
const DivbloxDataLayer = require('./dx-core-modules/data-layer');
class CustomDx extends Divblox {

}

const test = new CustomDx(
    {"config_path":"./dxconfig.json",
        "data_model_path":"./data-model.json"/*,
        "data_layer_implementation_class_path":"./custom-data-layer"*/});
async function testDx() {
        await test.initDx();
        if (!await test.create("Account",{"name":"johan"})) {
             console.log("Failed to create new account: "+JSON.stringify(test.getError()));
        } else {
                console.log("New account created!");
        }
}

testDx();