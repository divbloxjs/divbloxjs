const DivbloxBase = require("divblox.js/divblox");
const DivbloxDataLayerBase = require("divblox.js/dx_core_modules/data-layer");

/**
 * This is an implementation of the DivbloxDataLayerBase class. We can use this class to override the core data layer
 * related functionality for Divblox. It is best practice to do this since the base classes can be updated via a
 * package manager.
 * We don't need to create this class if we don't want to and we are happy with the standard Divblox data layer.
 */
class DivbloxDataLayer extends DivbloxDataLayerBase {
    constructor(databaseConnector = null, dataModel = {}) {
        super(databaseConnector, dataModel);
        console.log("My own data layer");
    }
}

/**
 * Again, we create an implementation of the DivbloxBase class here in order to modify any core functionality if
 * required. It is best practice to do this since the base classes can be updated via a package manager
 */
class Divblox extends DivbloxBase {

}

// Let's create an instance of Divblox. This requires a config path, a data model path and an optional datalayer
// implementation class
const dx = new Divblox(
    {"configPath":"./divblox_config/dxconfig.json",
        "dataModelPath":"./divblox_config/data-model.json",
        "dataLayerImplementationClass":DivbloxDataLayer/*Can also be null if you want to use the default data layer*/});

/**
 * This function wraps some example functions to see how we can use Divblox
 * @return {Promise<void>}
 */
async function startDx() {
    // Before we can do anything we need to call initDx()
    await dx.initDx();

    // Let's create a new row for the object of type "Account" in the database with some parameters
    const objId = await dx.create("account", {"firstName":"john","lastName":"Doe","idNumber":"123"});
    if (objId === -1) {
        console.log("Failed to create new account: "+JSON.stringify(dx.getError()));
    } else {
        // Divblox will always return the database table id for the newly created entry
        console.log("New account created!");

        // Let's read the entry from the database. This basically performs a "SELECT from `account` WHERE `id` = objId"
        const obj = await dx.read("account", objId);
        if (obj !== null) {
            console.log("Found: "+JSON.stringify(obj, null, 2));
        } else {
            console.log("Not found: "+JSON.stringify(dx.getError()));
        }

        // Let's try and change something on this object using the "update" function
        if (!await dx.update("account", {"id":objId, "firstName":"UpdateName", "idNumber":"888"})) {
            console.log("Error updating: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Updated!");
        }

        //Let's try deleting an account using the "delete" function and specifying the account's id
        if (!await dx.delete("account", 2)) {
            console.log("Error deleting: "+JSON.stringify(dx.getError()));
        } else {
            console.log("Deleted!");
        }
    }

}
startDx();