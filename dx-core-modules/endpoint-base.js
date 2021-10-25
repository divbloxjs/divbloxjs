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
        const echoOperation = {
            "operationName": "echo",
            "allowedAccess": ["anonymous"]
        };
        this.declareOperations([echoOperation]);
        this.currentRequest = {};
        this.dxInstance = null;
        this.currentGlobalIdentifier = -1;
        this.currentGlobalIdentifierGroupings = [];
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
     * @param {[{}]} operations The operations to declare. Each operation must have the following properties:
     * - {string} operationName
     * - {[]} allowedAccess: An array of globalIdentifierGroupings that have access to this operation
     * TODO: Expand this to allow for swagger doc definition
     */
    declareOperations(operations = []) {
        if (operations.length === 0) {return;}
        for (const operation of operations) {
            if ((typeof operation["operationName"] === "undefined") ||
                (typeof operation["allowedAccess"] === "undefined")) {
                continue;
            }
            this.declaredOperations[operation.operationName] = operation;
        }
    }

    /**
     * Checks whether the provided groupings have access to the provided operation, as defined in the constructor
     * @param {string} operationName The name of the operation to check
     * @param {[]} globalIdentifierGroupings An array of groupings as received by the request
     * @return {boolean} True if access is allowed, false otherwise
     */
    isAccessAllowed(operationName = '', globalIdentifierGroupings = []) {
        if (typeof this.declaredOperations[operationName] === "undefined") {
            return false;
        }
        const allowedAccess = this.declaredOperations[operationName].allowedAccess;
        for (const allowedGrouping of globalIdentifierGroupings) {
            if (allowedAccess.includes(allowedGrouping)) {
                return true;
            }
        }
        return false;
    }

    //#region Operations implemented.

    /**
     * A wrapper function that executes the given operation
     * @param {string} operation The operation to execute
     * @param {*} request The received request object
     * @param {DivbloxBase} dxInstance An instance of divbloxjs that gives us access to core dx functions
     * @return {Promise<*>}
     */
    async executeOperation(operation, request, dxInstance = null) {
        this.result = {"success":false,"message":"none"};
        this.currentRequest = request;
        this.dxInstance = dxInstance;
        let providedIdentifierGroupings = ["anonymous"];

        if (typeof request["headers"] !== "undefined") {
            if (typeof request["headers"]["authorization"] !== "undefined") {
                const jwtToken = request["headers"]["authorization"].replace("Bearer ","");
                this.currentGlobalIdentifier = this.dxInstance.jwtWrapper.getJwtGlobalIdentifier(jwtToken);
                this.currentGlobalIdentifierGroupings = this.dxInstance.jwtWrapper.getJwtGlobalIdentifierGroupings(jwtToken);
                for (const grouping of this.currentGlobalIdentifierGroupings) {
                    providedIdentifierGroupings.push(grouping);
                }
            }
        }

        if (!this.isAccessAllowed(operation, providedIdentifierGroupings)) {
            this.setResult(false, "Not authorized");
            // IMPORTANT: We only ever return false if authorization failed. This ensures that child functions can rely
            // on a true response to know whether they can proceed
            return false;
        }

        switch(operation) {
            case 'doc': await this.presentDocumentation();
                break;
            case 'echo': await this.echo();
                break;
            default : this.setResult(false, "Invalid operation provided");
        }

        return true;
    }

    /**
     * Returns the html for the specific endpoint's documentation
     * @return {Promise<void>}
     */
    async presentDocumentation() {
        //TODO: Implement this
        this.result["doc"] = 'TO BE COMPLETED';
        this.setResult(true, "Doc property populated");
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