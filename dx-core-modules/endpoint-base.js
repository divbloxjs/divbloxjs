const divbloxObjectBase = require('./object-base');

/**
 * DivbloxEndpointBase provides a blueprint for how api endpoints should be implemented
 * for divbloxjs projects
 */
class DivbloxEndpointBase extends divbloxObjectBase {

    /**
     * Initializes the result and declares the available operations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(dxInstance = null) {
        super();
        this.endpointName = null;
        this.endpointDescription = "";
        this.result = {"success":false,"message":"none"};
        this.declaredOperations = [];
        this.declaredSchemas = [];
        const echoOperation = this.getOperationDefinition(
            {
                "operationName": "echo",
                "allowedAccess": ["anonymous"]
            }
        );

        this.declareOperations([echoOperation]);
        this.currentRequest = {};
        this.dxInstance = dxInstance;
        this.currentGlobalIdentifier = -1;
        this.currentGlobalIdentifierGroupings = [];
        this.disableSwaggerDocs = false;

        if ((typeof this.dxInstance === "undefined") || (this.dxInstance === null)) {
            throw new Error("Divblox instance was not provided");
        }
    }

    /**
     * Returns an operation definition that contains the information need to form a swagger documentation
     * @param {string} definition.operationName Required. The name of the operation
     * @param {[]} definition.allowedAccess Required. An array of Global Identifier Groupings that are allowed
     * to access this operation
     * @param {string} definition.operationDescription Optional. A description of what the operation does
     * @param {string} definition.requestType Optional. Either GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE. Will
     * default to GET if not supplied
     * @param {*} definition.parameters Optional. Follows the openapi spec for the parameter object: https://swagger.io/specification/
     * @param {*} definition.requestSchema Optional. A schema for what should be sent via the request body.
     * Use this.getSchema() to provide a properly formatted schema
     * @param {*} definition.additionalRequestSchemas Optional. Any additional request schemas that you want to specify that
     * are not of media type "application/json". Specified as {"[mediaType]": {[schema]}}
     * @param {*} definition.responseSchema Optional. A schema for what will be sent via the response.
     * Use this.getSchema() to provide a properly formatted schema
     * @return {
     * {allowedAccess: ([string]|*),
     * responseSchema: {},
     * requestSchema: {},
     * operationDescription: (string|*),
     * requestType: string,
     * operationName: (string|*),
     * requiresAuthentication: boolean,
     * parameters: []}}
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
            "operationSummary": "",
            "operationDescription": "",
            "allowedAccess": definition.allowedAccess,
            "requestType": "GET",
            "requiresAuthentication": true,
            "parameters": [],
            "requestSchema": {},
            "responseSchema": this.getSchema({"message":"string"}),
            "additionalRequestSchemas": {},
            "additionalResponseSchemas": {}
        }

        for (const property of Object.keys(operationDefinition)) {
            if (typeof definition[property] === "undefined") {
                continue;
            }

            if (property === "responseSchema") {
                if (typeof definition[property]["properties"] === "undefined") {
                    continue;
                }

                operationDefinition[property] = definition[property];

                continue;
            }

            operationDefinition[property] = definition[property];
        }

        if (definition.allowedAccess.includes("anonymous")) {
            operationDefinition.requiresAuthentication = false;
        }

        return operationDefinition;
    }

    /**
     * Formats the properties provided into a schema that is acceptable for openapi 3
     * @param {{}} properties An array of keys and values where the keys represent the property and the values represent
     * the type of the property, e.g {"firstName":"string","age":"integer"}. For file names, use the type "file"
     * @return {{properties: {}}}
     */
    getSchema(properties) {
        let schema = {
            "type": "object",
            "properties": {}
        };

        for (const key of Object.keys(properties)) {
            let type = "string";
            let format = "";

            switch (properties[key]) {
                case "date":
                    format = "date";
                    break;
                case "datetime":
                case "date-time":
                    format = "date-time";
                    break;
                case "int":
                case "integer":
                    type = "number";
                    format = "integer";
                    break;
                case "float":
                    type = "number";
                    format = "float";
                    break;
                case "double":
                    type = "number";
                    format = "double";
                    break;
                case "file":
                    type = "string";
                    format = "binary";
                    break;
            }

            schema.properties[key] = {
                "type": type,
                "format": format
            };
        }
        return schema;
    }

    /**
     *
     * @param options The options to use to format this input parameter
     * @param {string} options.name The name of the input parameter
     * @param {string} options.description The description of the input parameter
     * @param {boolean} options.required Is the input parameter required
     * @param {"header|path|query"} options.type "header|path|query"
     * @param {*} options.schema The schema for the input parameter.
     * Use this.getSchema() to provide a properly formatted schema
     * @return {{schema: *, in: (string|string), name: (string|string), description: (string|string), required: (boolean|boolean)}}
     */
    getInputParameter(options = {}) {
        return {
            "in": typeof options["type"] !== "undefined" ? options["type"] : "query",
            "name": typeof options["name"] !== "undefined" ? options["name"] : "param",
            "required": typeof options["required"] !== "undefined" ? options["required"] : false,
            "description": typeof options["description"] !== "undefined" ? options["description"] : "",
            "schema": typeof options["schema"] !== "undefined" ? options["schema"] : {},
        }
    }

    /**
     * Sets the current result with a message
     * @param {boolean} isSuccess
     * @param {string} message A message to return
     */
    setResult(isSuccess = false, message) {
        this.result["success"] = isSuccess;

        delete this.result["message"];
        if (typeof message !== "undefined") {
            this.result["message"] = message;
        }
    }

    /**
     * Appends the provided resultDetail to the result object
     * @param {*} resultDetail An object containing additional result details
     */
    addResultDetail(resultDetail = {}) {
        if (Object.keys(resultDetail).length > 0) {
            for (const key of Object.keys(resultDetail)) {
                this.result[key] = resultDetail[key];
            }
        }
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
            this.declaredOperations.push(operation);
        }
    }

    /**
     * Removes the given operation with the specified type from the declared operations array
     * @param {string} operationName The name of the operation to remove
     * @param {string} requestType The request type to check on for operation uniqueness
     */
    hideOperation(operationName = null, requestType = 'get') {
        this.declaredOperations = this.declaredOperations.filter(
            function(element) {

                if (element.operationName.toLowerCase() === operationName.toLowerCase()) {
                    return element.requestType.toLowerCase() !== requestType.toLowerCase();
                }

                return true;
            }
        );
    }

    /**
     * Returns the operation definition of the declared operation matching the name provided
     * @param {string} operationName The name of the operation to find
     * @return {null|*} Null if not found, operation definition if found
     */
    getDeclaredOperation(operationName) {
        for (const operation of this.declaredOperations) {
            if (operation.operationName === operationName) {
                return operation;
            }
        }
        return null;
    }

    /**
     * Declares the entities that should be provided as schemas to the api endpoint
     * @param {[string]} entities A list of entity names to declare
     */
    declareEntitySchemas(entities = []) {
        if (entities.length === 0) {return;}
        for (const entity of entities) {
            this.declaredSchemas.push(entity);
        }
    }

    /**
     * Checks whether the provided groupings have access to the provided operation, as defined in the constructor
     * @param {string} operationName The name of the operation to check
     * @param {string} requestType The request method
     * @param {[]} globalIdentifierGroupings An array of groupings as received by the request
     * @return {boolean} True if access is allowed, false otherwise
     */
    isAccessAllowed(operationName = '', requestType = 'get', globalIdentifierGroupings = []) {
        if (globalIdentifierGroupings.includes("super user")) {
            return true;
        }

        let allowedAccess = [];
        for (const operation of this.declaredOperations) {
            if ((typeof operation.allowedAccess === "undefined") ||
                (operation.allowedAccess.length === 0) ||
                (operation.operationName !== operationName)) {
                continue;
            }
            if ((operation.operationName === operationName) &&
                (operation.requestType.toLowerCase() === requestType.toLowerCase())) {
                allowedAccess = operation.allowedAccess;
            }
        }

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
     * @return {Promise<*>}
     */
    async executeOperation(operation, request) {
        this.result = {"success":false,"message":"none"};
        this.currentRequest = request;

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

        if (!this.isAccessAllowed(operation, request.method, providedIdentifierGroupings)) {
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