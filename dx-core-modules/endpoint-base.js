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
        this.endpointName = null;
        this.endpointDescription = "";
        this.result = {"success":false,"message":"none"};
        this.declaredOperations = [];
        const echoOperation = this.getOperationDefinition(
            {
                "operationName": "echo",
                "allowedAccess": ["anonymous"]
            }
        );

        this.declareOperations([echoOperation]);
        this.currentRequest = {};
        this.dxInstance = null;
        this.currentGlobalIdentifier = -1;
        this.currentGlobalIdentifierGroupings = [];
    }

    /**
     * Returns an operation definition that contains the information need to form a swagger documentation
     * @param {string} definition.operationName Required. The name of the operation
     * @param {[]} definition.allowedAccess Required. An array of Global Identifier Groupings that are allowed
     * to access this operation
     * @param {string} definition.operationDescription Optional. A description of what the operation does
     * @param {string} definition.requestType Optional. Either GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE. Will
     * default to POST if not supplied
     * @param {*} definition.parameters Optional. Follows the openapi spec for the parameter object: https://swagger.io/specification/
     * @param {*} definition.requestSchema Optional. A schema for what should be sent via the request body
     * @param {*} definition.responseSchema Optional. A schema for what will be sent via the response
     * @return {
     * {allowedAccess: ([string]|*),
     * responseSchema: {},
     * requestSchema: {},
     * operationDescription: (string|*),
     * requestType: string,
     * operationName: (string|*),
     * requiresAuthentication: boolean,
     * parameters: null}}
     */
    getOperationDefinition(definition) {
        const requiredProperties = [
            "operationName",
            "allowedAccess",
        ];
        for (const requiredProperty of requiredProperties) {
            if (typeof definition[requiredProperty] === "undefined") {
                throw new Error(requiredProperty+" is a required property for DivbloxApiOperation");
            }
        }
        let operationDefinition = {
            "operationName": definition.operationName,
            "operationDescription": definition.operationName,
            "allowedAccess": definition.allowedAccess,
            "requestType": "GET",
            "requiresAuthentication": true,
            "parameters": [],
            "requestSchema": {},
            "responseSchema": {}
        }

        for (const property of Object.keys(operationDefinition)) {
            if (typeof definition[property] !== "undefined") {
                operationDefinition[property] = definition[property];
            }
        }

        if (definition.allowedAccess.includes("anonymous")) {
            operationDefinition.requiresAuthentication = false;
        }

        return operationDefinition;
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
     * @param {[{operationDefinition}]} operations An array of operation definitions as provided by getOperationDefinition()
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

        if (globalIdentifierGroupings.includes("super user")) {
            return true;
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

        if (this.dxInstance === null) {
            // IMPORTANT: We only ever return false if authorization failed. This ensures that child functions can rely
            // on a true response to know whether they can proceed.
            // Since we do not have an instance of dx, we cannot decode the provided JWT, meaning auth failed
            return false;
        }

        if (typeof request["headers"] !== "undefined") {
            if (typeof request["headers"]["authorization"] !== "undefined") {
                const jwtToken = request["headers"]["authorization"].replace("Bearer ","");
                this.currentGlobalIdentifier = this.dxInstance.jwtWrapper.getJwtGlobalIdentifier(jwtToken);
                this.currentGlobalIdentifierGroupings = this.dxInstance.jwtWrapper.getJwtGlobalIdentifierGroupings(jwtToken);
                for (const grouping of this.currentGlobalIdentifierGroupings) {
                    providedIdentifierGroupings.push(grouping.toLowerCase());
                }
                if (this.dxInstance.jwtWrapper.isSuperUser(jwtToken)) {
                    providedIdentifierGroupings.push("super user");
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