const DivbloxBase = require("divblox.js/divblox");
const dx = new DivbloxBase(
    {"configPath":"./divblox_config/dxconfig.json",
    "dataModelPath":"./divblox_config/data-model.json"
    });
async function runDx() {
    await dx.initDx();
    await dx.syncDatabase();
    dx.closeDx();
}
runDx();