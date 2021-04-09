const DivbloxBase = require("divblox.js/divblox");
const dx = new DivbloxBase(
    {"config_path":"./dxconfig.json",
    "data_model_path":"./data-model.json"
    });
async function runDx() {
    await dx.initDx();
    await dx.syncDatabase();
    dx.closeDx();
}
runDx();