const divbloxObjectBase = require('./object-base');
//TODO: Add a /doc operation that displays the api documentation
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
        this.currentRequest = {};
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
        for (const operation of operations) {
            this.declaredOperations.push(operation);
        }
    }

    //#region Operations implemented.

    /**
     * A wrapper function that executes the given operation
     * @param {string} operation The operation to execute
     * @param {*} request The received request object
     * @return {Promise<*|{success: boolean, message: string}>}
     */
    async executeOperation(operation, request) {
        this.currentRequest = request;
        switch(operation) {
            case 'echo': await this.echo();
                break;
            default : this.setResult(false, "Invalid operation provided");
        }
        return this.result;
    }

    /**
     * A default operation that simply returns the current timestamp. Although this
     * operation does not specifically need to be async, it is good practice to ensure
     * all defined operations are async
     * @return {Promise<*|{success: boolean, message: string}>}
     */
    async echo() {
        this.result["currentTimestamp"] = Date.now();
        this.result["request"] = this.currentRequest;
        this.setResult(true, "Current timestamp populated");
    }
    //#endregion
}

module.exports = DivbloxEndpointBase;