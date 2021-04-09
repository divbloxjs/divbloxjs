const DivbloxBase = require("divblox.js/divblox");
const dx = new DivbloxBase(
    {"config_path":"./divblox_config/dxconfig.json",
    "data_model_path":"./divblox_config/data-model.json"
    });
async function runDx() {
    await dx.initDx();
    await dx.syncDatabase();
    dx.closeDx();
}
runDx();