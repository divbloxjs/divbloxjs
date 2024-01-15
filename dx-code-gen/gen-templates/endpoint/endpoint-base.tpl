const DivbloxBase = require("divbloxjs/divblox");
const EndpointBase = require('divbloxjs/dx-core-modules/endpoint-base');
const [EntityNamePascalCase]Controller = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameKebabCase]/[EntityNameKebabCase].controller');

class [EntityNamePascalCasePlural]EndpointBase extends EndpointBase {

    //#region CRUD endpoint definitions
    get[EntityNamePascalCasePlural]Operation = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Returns list of [EntityNameCamelCasePlural]",
        operationDescription: "Returns a subset of [EntityNameCamelCasePlural] based on the provided constraints, as well as a total of the non-limited dataset.",
        parameters: this.getDataSeriesQueryParamDefinitions(), // An array of this.getInputParameter()
        requestType: "GET",
        requestSchema: {},
        responseSchema: this.getSchema({ 
            data: this.getArraySchema(this.dxInstance.getEntitySchema("[EntityNameCamelCase]")), 
            count: "integer" 
        }),
        disableSwaggerDoc: this.hiddenOperations.indexOf("get[EntityNamePascalCasePlural]") !== -1,
        f: async (req, res) => {
            await this.get[EntityNamePascalCasePlural](req, res);
        },
    });

    get[EntityNamePascalCase]Operation = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Gets the [EntityNameCamelCase] by ID",
        operationDescription: "Retrieves the [EntityNameCamelCase] data for given ID",
        parameters: [
            this.getInputParameter({
                name: "showRelationshipOptions",
                description: "Boolean value stating whether or not to return a list of options for every foreign key relationship",
                required: false,
                type: "query"
            })
        ], // An array of this.getInputParameter()
        requestType: "GET",
        requestSchema: {},
        responseSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]"),
        disableSwaggerDoc: this.hiddenOperations.indexOf("get[EntityNamePascalCase]") !== -1,
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;
            const showRelationshipOptions = queryParams.showRelationshipOptions ?? false;

            await this.get[EntityNamePascalCase]([EntityNameCamelCase]Id, showRelationshipOptions);
        }
    });

    create[EntityNamePascalCase]Operation = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Creates a new [EntityNameCamelCase]",
        operationDescription: "Creates a new [EntityNameCamelCase] for the given data",
        parameters: [], // An array of this.getInputParameter()
        requestType: "POST",
        requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true),
        responseSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]"),
        disableSwaggerDoc: this.hiddenOperations.indexOf("create[EntityNamePascalCase]") !== -1,
        successStatusCode: 201,
        successMessage: "Created",
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;

            await this.create[EntityNamePascalCase](body);
        }
    });

    update[EntityNamePascalCase]Operation = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/:id",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Updates [EntityNameCamelCase] by ID",
        operationDescription: "Updates the [EntityNameCamelCase] with data provided for a given ID",
        parameters: [], // An array of this.getInputParameter()
        requestType: "PATCH",
        requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true),
        responseSchema: this.getSchema({ message: "string" }),
        disableSwaggerDoc: this.hiddenOperations.indexOf("update[EntityNamePascalCase]") !== -1,
        successStatusCode: 204,
        successMessage: "No Content",
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;
            const [EntityNameCamelCase]Id = routeParams.id ?? undefined;
            console.log(body)
            await this.update[EntityNamePascalCase]([EntityNameCamelCase]Id, body);
        }
    });

    delete[EntityNamePascalCase]Operation = this.getOperationDefinition({
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
        successStatusCode: 204,
        successMessage: "No Content",
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

        this.declareEntitySchemas(["[EntityNameCamelCase]"]);

        this.declareOperations([
            this.get[EntityNamePascalCasePlural]Operation,
            this.get[EntityNamePascalCase]Operation,
            this.create[EntityNamePascalCase]Operation,
            this.update[EntityNamePascalCase]Operation,
            this.delete[EntityNamePascalCase]Operation,
[RelationshipDeclaredOperationList]
        ]);
    }

    async get[EntityNamePascalCasePlural](req, res) {
        const { data, count } = await this.controller.get[EntityNamePascalCasePlural](req.query);

        if (data === null || count === null) {
            this.controller.printLastError();
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
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
            if (this.controller.getLastError()?.message === "404") {
                this.forceResult(undefined, 404);
                return;
            }

            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        }

        this.forceResult([EntityNameCamelCase]Data, 200);
    }

    async create[EntityNamePascalCase]([EntityNameCamelCase]Detail = {}) {
        const created[EntityNamePascalCase] = await this.controller.create[EntityNamePascalCase]([EntityNameCamelCase]Detail);

        if (!created[EntityNamePascalCase]) {
            this.controller.printLastError();
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
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
            this.controller.printLastError();
            if (this.controller.getLastError()?.message === "404") {
                this.forceResult(undefined, 404);
                return;
            }
            
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        }

        this.forceResult({ message: `Updated [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}` }, 200);
    }

    async delete[EntityNamePascalCase]([EntityNameCamelCase]Id = null) {
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }

        const deleteResult = await this.controller.delete[EntityNamePascalCase]([EntityNameCamelCase]Id);

        if (!deleteResult) {
            this.controller.printLastError();
            if (this.controller.getLastError()?.message === "404") {
                this.forceResult(undefined, 404);
                return;
            }

            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        } 

        this.forceResult({ message: `Deleted [EntityNameCamelCase] with ID: ${[EntityNameCamelCase]Id}` }, 200);
    }
}

module.exports = [EntityNamePascalCasePlural]EndpointBase;