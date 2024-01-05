const DivbloxBase = require("divbloxjs/divblox");
const EndpointBase = require('divbloxjs/dx-core-modules/endpoint-base');
const [EntityNamePascalCasePlural]Controller = require('../../../../../divblox-packages-local/test-package/controllers/[EntityNameLowerCaseSplitted].controller');

class [EntityNamePascalCasePlural]EndpointBase extends EndpointBase {

    //#region CRUD endpoint definitions
    get[EntityNamePascalCasePlural]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Lists all possible [EntityNameCamelCasePlural]",
        operationDescription: "Returns an array of all possible [EntityNameCamelCasePlural]",
        parameters: [this.getConstraintDataInputParameter()], // An array of this.getInputParameter()
        requestType: "GET", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: {},
        responseSchema: this.getSchema({ data: "array", count: "integer" }), // this.getSchema()
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;

            const constraintData = queryParams.constraintData;
            const additionalParams = {};

            await this.get[EntityNamePascalCasePlural](constraintData, additionalParams);
        },
    });

    get[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Gets the [EntityNameCamelCase] by ID",
        operationDescription: "Retrieves the [EntityNameCamelCase] details for given ID",
        parameters: [], // An array of this.getInputParameter()
        requestType: "GET", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: {},
        responseSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true), // this.getSchema()
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;

            await this.get[EntityNamePascalCase]([EntityNameCamelCase]Id);
        }
    });

    create[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Creates a new [EntityNameCamelCase] for the current user",
        operationDescription:
            "A new [EntityNameCamelCase] is created and liked to the current user. " +
            "The current user is set as the owner. Default [EntityNameCamelCase] roles are automatically generated",
        parameters: [], // An array of this.getInputParameter()
        requestType: "POST", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true), // this.getSchema()
        responseSchema: this.getSchema({ id: "integer" }),
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;

            await this.create[EntityNamePascalCase]([EntityNameCamelCase]Id);
        }
    });

    update[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Updates an [EntityNameCamelCase] by ID",
        operationDescription: "Updates the [EntityNameCamelCase] with details provided for given ID",
        parameters: [this.getInputParameter({ name: "id", type: "query" })], // An array of this.getInputParameter()
        requestType: "PATCH",
        requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true), // this.getSchema()
        responseSchema: this.getSchema({ message: "string" }),
        disableSwaggerDoc: this.hiddenOperations.indexOf("update[EntityNamePascalCase]") !== -1,
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;

            await this.update[EntityNamePascalCase]([EntityNameCamelCase]Id);
        }
    });

    delete[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Deletes a [EntityNameCamelCase]",
        operationDescription:
            "Deletes a [EntityNameCamelCase] matching the provided ID.",
        parameters: [], // An array of this.getInputParameter()
        requestType: "DELETE", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: {},
        responseSchema: this.getSchema({ message: "string" }),
        disableSwaggerDoc: this.hiddenOperations.indexOf("delete[EntityNamePascalCasePlural]") !== -1,
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;

            await this.delete[EntityNamePascalCase]([EntityNameCamelCase]Id);
        }
    });
    //#endregion

[AllRelationshipConstraintsStr]

    /**
     * Initializes the result and declares the available operations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(dxInstance = null) {
        super(dxInstance);

        this.controller = new [EntityNamePascalCasePlural]Controller(dxInstance);
        this.endpointName = "[EntityNameCamelCasePlural]";

        if (this.controller?.packageOptions?.["hiddenOperations"]) {
            this.hiddenOperations = this.controller.packageOptions["hiddenOperations"];
        }

        if (this.controller?.packageOptions?.["operationAccess"]) {
            this.operationAccess = this.controller.packageOptions["operationAccess"];
        }

        this.declareOperations([
            this.get[EntityNamePascalCasePlural]OperationDeclaration,
            this.get[EntityNamePascalCase]OperationDeclaration,
            this.create[EntityNamePascalCase]OperationDeclaration,
            this.update[EntityNamePascalCase]OperationDeclaration,
            this.delete[EntityNamePascalCase]OperationDeclaration,
[RelationshipDeclaredOperationList]
        ]);
    }

    async get[EntityNamePascalCasePlural](constraintData = {}, additionalParams = {}) {
        const { data, count } = await this.controller.get[EntityNamePascalCasePlural](constraintData, additionalParams);

        if (data === null || count === null) {
            this.setResult(false, this.controller.getLastError()?.message);
            return;
        }

        this.forceResult({ data: data, count: count }, 200);
    }

    async get[EntityNamePascalCase]([EntityNameCamelCase]Id = null) {
        if (![EntityNameCamelCase]Id) {
            this.setResult(false, "Invalid [EntityNameCamelCase] ID provided");
            return;
        }
        
        const [EntityNameCamelCase]Data = await this.controller.get[EntityNamePascalCase]([EntityNameCamelCase]Id);

        if ([EntityNameCamelCase]Data === null) {
            this.setResult(false, this.controller.getLastError()?.message);
            return;
        }
        this.forceResult([EntityNameCamelCase]Data, 200);
    }

    async create[EntityNamePascalCase]([EntityNameCamelCase]Detail = {}) {
        const created[EntityNamePascalCase] = await this.controller.create[EntityNamePascalCase]([EntityNameCamelCase]Detail);

        if (!created[EntityNamePascalCase]) {
            this.controller.printLastError();
            this.setResult(false, this.controller.getLastError()?.message);
            return;
        }

        this.forceResult(created[EntityNamePascalCase], 200);
    }

    async update[EntityNamePascalCase]([EntityNameCamelCase]Id = null, [EntityNameCamelCase]Detail = {}) {
        if (![EntityNameCamelCase]Id) {
            this.setResult(false, "Invalid [EntityNameCamelCase] ID provided");
            return;
        }

        if (![EntityNameCamelCase]Detail || Object.keys([EntityNameCamelCase]Detail)) {
            this.setResult(false, "No [EntityNameCamelCase] detail provided to update");
            return;
        }

        const updateResult = await this.controller.update[EntityNamePascalCase](
            [EntityNameCamelCase]Id,
            [EntityNameCamelCase]Detail,
        );

        if (!updateResult) {
            this.setResult(false, this.controller.getLastError()?.message);
            return;
        }

        this.setResult(true, `Updated [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}`);
    }

    async delete[EntityNamePascalCasePlural]([EntityNameCamelCase]Id = null) {
        if (![EntityNameCamelCase]Id) {
            this.setResult(false, "Invalid [EntityNameCamelCase] ID provided");
            return;
        }

        const deleteResult = await this.controller.delete[EntityNamePascalCasePlural]([EntityNameCamelCase]Id);

        if (!deleteResult) {
            this.setResult(false, this.controller.getLastError()?.message);
            return;
        } 

        this.setResult(true, `Deleted [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}`);
    }
}

module.exports = [EntityNamePascalCasePlural]EndpointBase;