const divbloxObjectBase = require('./object-base');

/**
 * DivbloxEndpointBase provides a blueprint for how api endpoints should be implemented
 * for divbloxjs projects
 */
class DivbloxEndpointBase extends divbloxObjectBase {
    /**
     * Initializes the result and declares the available operations
     */
    constructor() {
        super();
        this.result = {"success":false,"message":"none"};
        this.declaredOperations = [];
        this.addOperations(['echo']);
    }

    /**
     * Sets the current result with a message
     * @param {boolean} isSuccess
     * @param {string} message A message to return
     */
    setResult(isSuccess = false, message = 'none') {
        this.result["success"] = isSuccess;
        this.result["message"] = message;
    }

    /**
     * Declares the operations provided as available to the api endpoint
     * @param {[string]} operations The operations to declare
     */
    addOperations(operations = []) {
        if (operations.length === 0) {return;}
        this.declaredOperations.push(operations);
    }

    //#region Operations implemented.
    
    /**
     * A default operation that simply returns the current timestamp. Although this
     * operation does not specifically need to be async, it is good practice to ensure
     * all defined operations are async
     * @return {Promise<*|{success: boolean, message: string}>}
     */
    async echo() {
        this.setResult(true, "Current timestamp: "+Date.now());
        return this.result;
    }
    //#endregion
}

module.exports = DivbloxEndpointBase;