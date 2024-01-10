const DivbloxBase = require("divbloxjs/divblox");
const EndpointBase = require('divbloxjs/dx-core-modules/endpoint-base');
const [EntityNamePascalCase]Controller = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameKebabCase]/[EntityNameKebabCase].controller');

class [EntityNamePascalCasePlural]EndpointBase extends EndpointBase {

    //#region CRUD endpoint definitions
    get[EntityNamePascalCasePlural]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
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
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Gets the [EntityNameCamelCase] by ID",
        operationDescription: "Retrieves the [EntityNameCamelCase] details for given ID",
        parameters: [
            this.getInputParameter({
                name: "showRelationshipOptions",
                description: "Boolean value stating whether or not to return a list of options for every foreign key relationship",
                required: false,
                type: "query"
            })
        ], // An array of this.getInputParameter()
        requestType: "GET", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: {},
        responseSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true), // this.getSchema()
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;
            const showRelationshipOptions = queryParams.showRelationshipOptions ?? false;

            await this.get[EntityNamePascalCase]([EntityNameCamelCase]Id, showRelationshipOptions);
        }
    });

    create[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
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

            await this.create[EntityNamePascalCase](body);
        }
    });

    update[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Updates an [EntityNameCamelCase] by ID",
        operationDescription: "Updates the [EntityNameCamelCase] with details provided for given ID",
        parameters: [], // An array of this.getInputParameter()
        requestType: "PATCH",
        requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true), // this.getSchema()
        responseSchema: this.getSchema({ message: "string" }),
        disableSwaggerDoc: this.hiddenOperations.indexOf("update[EntityNamePascalCase]") !== -1,
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;
            console.log(body)
            await this.update[EntityNamePascalCase]([EntityNameCamelCase]Id, body);
        }
    });

    delete[EntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
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

        this.controller = new [EntityNamePascalCase]Controller(dxInstance);
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
            this.controller.printLastError();
            this.forceResult({message: this.controller.getLastError()?.message}, 400);
            return;
        }

        this.forceResult({ data: data, count: count }, 200);
    }

    async get[EntityNamePascalCase]([EntityNameCamelCase]Id = null, showRelationshipOptions = false) {
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }
        
        const [EntityNameCamelCase]Data = await this.controller.get[EntityNamePascalCase]([EntityNameCamelCase]Id, showRelationshipOptions);

        if ([EntityNameCamelCase]Data === null) {
            this.controller.printLastError();
            this.forceResult({message: this.controller.getLastError()?.message}, 400);
            return;
        }

        this.forceResult([EntityNameCamelCase]Data, 200);
    }

    async create[EntityNamePascalCase]([EntityNameCamelCase]Detail = {}) {
        const created[EntityNamePascalCase] = await this.controller.create[EntityNamePascalCase]([EntityNameCamelCase]Detail);

        if (!created[EntityNamePascalCase]) {
            this.controller.printLastError();
            this.forceResult({message: this.controller.getLastError()?.message}, 400);
            return;
        }

        this.forceResult(created[EntityNamePascalCase], 200);
    }

    async update[EntityNamePascalCase]([EntityNameCamelCase]Id = null, [EntityNameCamelCase]Detail = {}) {
        console.log([EntityNameCamelCase]Detail);
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }

        if (![EntityNameCamelCase]Detail || Object.keys([EntityNameCamelCase]Detail).length < 1) {
            this.forceResult({message: "No [EntityNameCamelCase] detail provided"}, 400);
            return;
        }

        const updateResult = await this.controller.update[EntityNamePascalCase](
            [EntityNameCamelCase]Id,
            [EntityNameCamelCase]Detail,
        );

        if (!updateResult) {
            this.forceResult({message: this.controller.getLastError()?.message}, 400);
            return;
        }

        this.forceResult({message: `Updated [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}`}, 200);
    }

    async delete[EntityNamePascalCase]([EntityNameCamelCase]Id = null) {
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }

        const deleteResult = await this.controller.delete[EntityNamePascalCase]([EntityNameCamelCase]Id);

        if (!deleteResult) {
            this.forceResult({message: this.controller.getLastError()?.message}, 400);
            return;
        } 

        this.forceResult({message: `Deleted [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}`}, 200);
    }
}

module.exports = [EntityNamePascalCasePlural]EndpointBase;