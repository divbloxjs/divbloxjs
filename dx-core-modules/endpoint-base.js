const divbloxObjectBase = require("./object-base");
const DivbloxBase = require("../divblox");
const dxUtils = require("dx-utilities");

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
        this.DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again";
        this.DEFAULT_SUCCESS_MESSAGE = "Successfully completed operation";
        this.result = {
            success: false,
            message: "none",
            unauthorized: false,
        };
        this.cookie = null;
        this.statusCode = null;
        this.declaredOperations = [];
        this.declaredSchemas = [];
        this.currentRequest = {};
        this.dxInstance = dxInstance;
        this.currentGlobalIdentifier = -1;
        this.currentGlobalIdentifierGroupings = [];
        this.disableSwaggerDocs = false;
        this.hiddenOperations = [];
        this.operationAccess = {};

        if (typeof this.dxInstance === "undefined" || this.dxInstance === null) {
            throw new Error("Divblox instance was not provided");
        }
    }

    /**
     * @returns {[]} An array of operation definitions to be passed to this.declareOperations()
     */
    handleOperationDeclarations() {
        const echoOperation = this.getOperationDefinition({
            operationName: "echo",
            allowedAccess: ["anonymous"],
            responseSchema: this.getSchema({ timestamp: "int" }),
            f: async (req, res) => {
                await this.echo();
            },
        });
        return [echoOperation];
    }

    /**
     * Returns an operation definition that contains the information need to form a swagger documentation
     * @param {string} definition.operationName Required. The name of the operation and the route that will be used. Express.js route syntax can be used
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
     * @param {*} definition.additionalResponseSchemas Optional. Any additional response schemas that you want to specify that
     * are not of media type "application/json". Specified as {"[mediaType]": {[schema]}}
     * @param {*} definition.f Optional. Can be used to provide a custom async function to handle the operation. Will get passed a req and res object from Express.  If this is not provided,
     * the default operation handler "executeOperation" will be used. Specified as (req, res) => { ... }
     * @param {boolean} definition.disableSwaggerDoc If set to true, this operation will not be included in swagger UI
     * @return {
     * {allowedAccess: ([string]|*),
     * responseSchema: {properties: {}},
     * requestSchema: {},
     * operationDescription: string,
     * requestType: string,
     * operationName: (string|*),
     * additionalResponseSchemas: {},
     * operationSummary: string,
     * requiresAuthentication: boolean,
     * parameters: *[],
     * disableSwaggerDoc: boolean,
     * additionalRequestSchemas: {}}}
     */
    getOperationDefinition(definition) {
        const requiredProperties = ["operationName", "allowedAccess"];
        for (const requiredProperty of requiredProperties) {
            if (typeof definition[requiredProperty] === "undefined") {
                throw new Error(requiredProperty + " is a required property for DivbloxApiOperation");
            }
        }
        let operationDefinition = {
            operationName: definition.operationName,
            operationSummary: "",
            operationDescription: "",
            allowedAccess: definition.allowedAccess,
            requestType: "GET",
            requiresAuthentication: true,
            parameters: [],
            requestSchema: {},
            responseSchema: this.getSchema({ message: "string" }),
            additionalRequestSchemas: {},
            additionalResponseSchemas: {},
            responses: {},
            f: null,
            disableSwaggerDoc: false,
            successStatusCode: 200,
            successMessage: "OK",
        };

        for (const property of Object.keys(operationDefinition)) {
            if (typeof definition[property] === "undefined") {
                continue;
            }

            if (property === "responseSchema") {
                if (
                    typeof definition[property]["properties"] === "undefined" &&
                    definition[property]["type"] !== "array"
                ) {
                    continue;
                }

                operationDefinition[property] = definition[property];

                continue;
            }

            operationDefinition[property] = definition[property];
        }

        if (definition.allowedAccess.includes("anonymous")) {
            operationDefinition.requiresAuthentication = false;
        } else {
            operationDefinition.operationDescription += "<br><br>Allowed access:<br>";
            operationDefinition.operationDescription +=
                "<strong>[" + definition.allowedAccess.join(", ") + "]</strong>";
        }

        return operationDefinition;
    }

    getEnumSchema(options = []) {
        let schema = {
            type: "string",
            enum: options,
        };

        return schema;
    }
    /**
     * Formats the properties provided into a schema that is acceptable for openapi 3
     * @param {{}} properties An array of keys and values where the keys represent the property and the values represent
     * the type of the property, e.g {"firstName":"string","age":"integer", "someObject": this.getSchema("key":"value")}.
     * For file names, use the type "file". For objects, simply provide a result from this function
     * @return {{properties: {}}}
     */
    getSchema(properties) {
        let schema = {
            type: "object",
            properties: {},
        };

        for (const key of Object.keys(properties)) {
            let type = "string";
            let format = "";
            let example;
            const isObject = typeof properties[key] === "object" && properties[key] !== null;

            if (!isObject) {
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
                    case "boolean":
                        type = "boolean";
                        break;
                    case "array":
                        type = "array";
                        format = "array";
                        example = [];
                        break;
                    case "object":
                        type = "object";
                        format = "object";
                        example = {};
                        break;
                }

                schema.properties[key] = {
                    type: type,
                    format: format,
                };

                if (example) {
                    schema.properties[key].example = example;
                }
            } else {
                schema.properties[key] = properties[key];
            }
        }

        return schema;
    }

    /**
     * Formats the properties provided into a schema that is acceptable for openapi 3
     * @param {{}} itemSchema Use this.getSchema() to provide a properly formatted schema
     * @param {string} [wrapperKey] If provided, the schema is wrapped inside the key provided
     * @return {{type: "array", items: {}}|{properties:{"wrapperkey":{type: "array", items: {}}}}}
     */
    getArraySchema(itemSchema, wrapperKey) {
        if (typeof wrapperKey !== "undefined") {
            const returnSchema = { properties: {} };
            returnSchema.properties[wrapperKey] = {
                type: "array",
                items: itemSchema,
            };
            return returnSchema;
        }

        const returnObj = {
            type: "array",
            items: itemSchema,
        };

        if (!itemSchema) {
            returnObj.example = [];
        }

        return returnObj;
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
            in: typeof options["type"] !== "undefined" ? options["type"] : "query",
            name: typeof options["name"] !== "undefined" ? options["name"] : "param",
            required: typeof options["required"] !== "undefined" ? options["required"] : false,
            description: typeof options["description"] !== "undefined" ? options["description"] : "",
            schema: typeof options["schema"] !== "undefined" ? options["schema"] : {},
            example: typeof options["example"] !== "undefined" ? options["example"] : undefined,
        };
    }

    /**
     * Sets the current result with a message
     * @param {boolean} isSuccess
     * @param {string|undefined} message A message to return
     */
    setResult(isSuccess = false, message = undefined) {
        this.result["success"] = isSuccess;

        delete this.result["message"];

        if (typeof message !== undefined && message?.length > 0) {
            this.result["message"] = message;
            return;
        }

        if (isSuccess) {
            this.result["message"] = this.DEFAULT_SUCCESS_MESSAGE;
        } else {
            this.result["message"] = this.DEFAULT_ERROR_MESSAGE;
        }
    }

    setStatusCode(statusCode = 400) {
        this.statusCode = statusCode;
    }

    /**
     * Sets the current result to false and forces a 401 http error code
     * @param {string} message An optional message to return
     */
    setResultNotAuthorized(message = "Not authorized") {
        this.result["success"] = false;
        this.result["unauthorized"] = true;
        this.statusCode = 401;

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
     * Forces the result to the provided data
     * Bypasses the setResult() and addResultDetail() functions
     * @param {*} data The response data to return
     * @param {number|null} statusCode The http status code to return
     */
    forceResult(data, statusCode = null) {
        this.result = data;
        if (statusCode !== null) {
            this.statusCode = statusCode;
        }
    }

    /**
     * Sets the result back to its initial state
     */
    resetResultDetail() {
        this.result = {
            success: false,
            message: "none",
            unauthorized: false,
            cookie: null,
        };
        this.statusCode = null;
    }

    /**
     * Sets the cookie object to instruct the web service to send the cookie with the response
     * @param {string} name The name of the cookie
     * @param {string} data The data, in string format, that will be stored
     * @param {boolean} isSecure True or false
     * @param {boolean} isHttpOnly True or false
     * @param {number} expiryInDays How many days from now should it expire
     */
    setCookie(name = "cookie", data = "", isSecure = true, isHttpOnly = true, expiryInDays = 30) {
        this.cookie = {
            name: name,
            data: data,
            secure: isSecure,
            httpOnly: isHttpOnly,
            maxAge: expiryInDays * 24 * 60 * 60 * 1000,
        };
    }

    initEndpointOperations() {
        console.log("BASE?");
        // TODO Overwrite in base class
    }

    /**
     * Declares the operations provided as available to the api endpoint
     * @param {[{operationDefinition}]} newOperations An array of operation definitions as provided by getOperationDefinition()
     */
    declareOperations(newOperations = []) {
        if (newOperations.length === 0) {
            return;
        }

        for (let newOperation of newOperations) {
            if (
                typeof newOperation["operationName"] === "undefined" ||
                typeof newOperation["allowedAccess"] === "undefined"
            ) {
                continue;
            }

            const foundDeclaredOperationIndex = this.declaredOperations.findIndex(
                (declaredOperation) => declaredOperation.operationName === newOperation.operationName &&  declaredOperation.requestType === newOperation.requestType
            )
            
            newOperation = this.getOperationDefinition(newOperation);
            if (foundDeclaredOperationIndex !== -1) {
                this.declaredOperations[foundDeclaredOperationIndex] = newOperation;
            } else {
                this.declaredOperations.push(newOperation);
            }
        }
    }

    /**
     * Removes the given operation with the specified type from the declared operations array
     * @param {string} operationName The name of the operation to remove
     * @param {string} requestType The request type to check on for operation uniqueness
     */
    hideOperation(operationName = null, requestType = "get") {
        this.declaredOperations = this.declaredOperations.filter(function (element) {
            if (element.operationName.toLowerCase() === operationName.toLowerCase()) {
                return element.requestType.toLowerCase() !== requestType.toLowerCase();
            }

            return true;
        });
    }

    /**
     * Returns the operation definition of the declared operation matching the name provided
     * @param {string} operationName The name of the operation to find
     * @param {string} requestType The HTTP request type of the operation
     * @returns {*|null} The operation if found, null otherwise
     */
    getDeclaredOperation(operationName, requestType = "GET") {
        for (const operation of this.declaredOperations) {
            if (operation.operationName === operationName && operation.requestType === requestType) {
                return operation;
            }
        }
        return null;
    }

    /**
     * Declares the entities that should be provided as schemas to the api endpoint
     * @param {[string]} entityNames A list of entity names to declare
     */
    declareEntitySchemas(entityNames = []) {
        if (entityNames.length === 0) {
            return;
        }

        for (const entityName of entityNames) {
            if (!this.declaredSchemas.includes(entityName)) {
                this.declaredSchemas.push(entityName);
            }
        }
    }

    /**
     * Checks whether the provided groupings have access to the provided operation, as defined in the constructor
     * @param {string} operationName The name of the operation to check
     * @param {string} requestType The request method
     * @param {string[]} globalIdentifierGroupings An array of groupings as received by the request
     * @return {boolean} True if access is allowed, false otherwise
     */
    isAccessAllowed(operationName = "", requestType = "get", globalIdentifierGroupings = []) {
        if (globalIdentifierGroupings.includes("super user")) {
            return true;
        }

        let allowedAccess = [];
        for (const operation of this.declaredOperations) {
            if (
                typeof operation.allowedAccess === "undefined" ||
                operation.allowedAccess.length === 0 ||
                operation.operationName !== operationName
            ) {
                continue;
            }
            if (
                operation.operationName === operationName &&
                operation.requestType.toLowerCase() === requestType.toLowerCase()
            ) {
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

    getDataSeriesQueryParamDefinitions() {
        return [
            this.getInputParameter({
                name: "searchValue", 
                description: "String value that will be searched on",
            }),
            this.getInputParameter({
                name: "limit", 
                description: "Maximum entries to load for the given query",
                example: 10
            }),
            this.getInputParameter({
                name: "offset", 
                description: "Number of entries to skip before starting return result",
            }),
            this.getInputParameter({
                name: "sort", 
                description: "Defined attributes to sort by (including direction)\n```\n{\n  \"sort\": {\n    \"attributeName\": \"asc\",\n    \"attributeNameTwo\": \"asc\"\n  }\n}\n```\n", 
                schema: { "$ref": "#/components/schemas/dataSeriesSort"},
                example: ""
            }),
            this.getInputParameter({
                name: "filter", 
                "description": "Defined attributes to filter by (including type of filter)\n```\n{\n  \"filter\": {\n    \"attributeNameOne\": {\n      \"like\": \"string\",\n      \"eq\": \"string\",\n      \"ne\": \"string\"\n    },\n    \"attributeNameTwo\": {\n      \"lt\": \"string\",\n      \"lte\": \"string\"\n    },\n    \"attributeNameThree\": {\n      \"gt\": \"string\",\n      \"gte\": \"string\"\n    }\n  }\n}\n```\n",
                schema: { "$ref": "#/components/schemas/dataSeriesFilter"},
                example: ""
            }),
        ]
    }

    //#region Operations implemented.

    /**
     * Handles necessary preamble before executing the requested operation.
     * This includes:
     * - JWT handling
     * - Setting class variables from JWT for currentIdentifier
     * - Setting class variable this.currentRequest
     *
     * @param {string} operation The operation to execute
     * @param {import('express').Request} request The received request object
     * @param {import('express').Response} response The received response object
     * @returns {Promise<boolean>}
     */
    async onBeforeExecuteOperation(operation, request, response) {
        this.resetResultDetail();

        if (this.dxInstance === null) {
            // IMPORTANT: We only ever return false if authorization failed. This ensures that child functions can rely
            // on a true response to know whether they can proceed.
            // Since we do not have an instance of dx, we cannot decode the provided JWT, meaning auth failed
            return false;
        }

        this.currentRequest = request;

        this.getCurrentInformationFromJwt(response?.locals?.jwtToken);

        if (!this.isAccessAllowed(operation, request.method, this.providedIdentifierGroupings)) {
            // IMPORTANT: We only ever return false if authorization failed. This ensures that child functions can rely
            // on a true response to know whether they can proceed
            this.setResultNotAuthorized();
            return false;
        }

        return true;
    }

    /**
     * Gets and sets all relevant current user information from the JWT
     *
     * @param {string|null} jwtToken
     *
     * On success, the following class variables will be populated
     * - this.currentGlobalIdentifier
     * - this.currentGlobalIdentifierGroupings
     * - this.providedIdentifierGroupings
     */
    getCurrentInformationFromJwt(jwtToken) {
        this.currentGlobalIdentifier = -1;
        this.currentGlobalIdentifierGroupings = [];
        this.providedIdentifierGroupings = ["anonymous"];

        if (jwtToken === null) {
            return;
        }

        this.currentGlobalIdentifier = this.dxInstance.jwtWrapper.getJwtGlobalIdentifier(jwtToken);
        this.currentGlobalIdentifierGroupings = this.dxInstance.jwtWrapper.getJwtGlobalIdentifierGroupings(jwtToken);

        for (const grouping of this.currentGlobalIdentifierGroupings) {
            this.providedIdentifierGroupings.push(grouping.toLowerCase());
        }

        if (this.dxInstance.jwtWrapper.isSuperUser(jwtToken)) {
            this.providedIdentifierGroupings.push("super user");
        }
    }

    /**
     * A wrapper function that executes the given operation
     * @param {string} operationName The operation to execute
     * @param {import('express').Request} request The received request object
     * @param {import('express').Response} response The received response object
     * @return {Promise<boolean>}
     */
    async executeOperation(operationName, request, response) {
        const beforeSuccess = await this.onBeforeExecuteOperation(operationName, request, response);
        if (!beforeSuccess) {
            return false;
        }

        switch (operationName) {
            case "echo":
                await this.echo();
                break;
            default:
                this.setResult(false, "Invalid operation provided");
        }

        return true;
    }

    /**
     * Returns the html for the specific endpoint's documentation
     * @return {Promise<void>}
     */
    async presentDocumentation() {
        //TODO: Implement this
        this.result["doc"] = "TO BE COMPLETED";
        this.setResult(true, "Doc property populated");
    }

    /**
     * A default operation that simply returns the current timestamp. Although this
     * operation does not specifically need to be async, it is good practice to ensure
     * all defined operations are async
     * @return {Promise<*|{success: boolean, message: string}>}
     */
    async echo() {
        this.forceResult({ timestamp: Date.now() }, 200);
    }

    validateConfig(constraintData = {}) {
        if (constraintData.hasOwnProperty("searchValue") && 
            typeof constraintData.searchValue !== "string") {
                this.populateError("'searchValue' property should be of type string");
                return false;
        }

        if (constraintData.hasOwnProperty("limit") && 
            typeof constraintData.limit !== "string") {
                this.populateError("'limit' property should be of type string");
                return false;
        }   

        if (constraintData.hasOwnProperty("offset") && 
            typeof constraintData.offset !== "string") {
                this.populateError("'offset' property should be of type string");
                return false;
        }

        if (constraintData.sort) {
            if (!dxUtils.isValidObject(constraintData.sort)) {
                this.populateError("'sort' property provided is not a valid object");
                return false;
            }

            const allowedSortOptions = ["asc", "desc"];
            for (const sortAttributeName of Object.keys(constraintData.sort)) {
                if (!allowedSortOptions.includes(constraintData.sort[sortAttributeName])) {
                    this.populateError(`Invalid 'sort' type provided for ${sortAttributeName}: ${constraintData.sort[sortAttributeName]}. Allowed options: ${allowedSortOptions.join(", ")}`);
                    return false;
                }
            }
        }

        if (constraintData.filter) {
            if (!dxUtils.isValidObject(constraintData.filter)) {
                this.populateError("'filter' property provided is not a valid object");
                return false;
            } 

            if (!dxUtils.isValidObject(constraintData.filter)) {
                const allowedFilterTypes = ["like", "eq", "ne", "gt", "gte", "lt", "lte"];
                for (const filterAttributeName of Object.keys(constraintData.filter)) {
                    const { filterTypeKeys, filterValues } = Object.entries(constraintData.filter[filterAttributeName]);
                    if (!allowedFilterTypes.includes(filterTypeKeys)) {
                        this.populateError(`Invalid 'filter' type provided for ${filterAttributeName}: ${constraintData.filter[filterAttributeName]}. Allowed options: ${allowedFilterTypes.join(", ")}`);
                        return false;
                    }

                    for (const filterValue of filterValues) {
                        if (typeof filterValue !== "string") {
                            this.populateError(`Invalid 'filter' value provided for ${filterAttributeName}: ${filterValue}. Should be of type string`);
                            return false;
                        }
                    }
                }
            } 
        }

        return true;
    }

    //#endregion
}

module.exports = DivbloxEndpointBase;
