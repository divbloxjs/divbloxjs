// This file should be deleted
const Divblox = require('./divblox');
const DivbloxDataLayer = require('./dx-core-modules/data-layer');
class CustomDx extends Divblox {

}

const test = new CustomDx(
    {"config_path":"./dxconfig.json",
        "data_model_path":"./data-model.json",
        "data_layer_implementation_class_path":"./custom-data-layer"});