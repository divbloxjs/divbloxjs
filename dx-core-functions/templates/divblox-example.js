const dx = require('./divblox-config/dx-init');
/**
 * This function wraps some example functions to see how we can use Divblox in a specific script
 * @return {Promise<void>}
 */
doExampleContent = async () =>{
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
doExampleContent();