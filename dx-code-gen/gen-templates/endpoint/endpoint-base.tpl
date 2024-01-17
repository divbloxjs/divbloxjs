const DivbloxBase = require("divbloxjs/divblox");
const EndpointBase = require('divbloxjs/dx-core-modules/endpoint-base');
const [EntityNamePascalCase]Controller = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameKebabCase]/[EntityNameKebabCase].controller');

class [EntityNamePascalCasePlural]EndpointBase extends EndpointBase {
    /**
     * Initializes the result and declares the available operations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(dxInstance = null) {
        super(dxInstance);

        this.controller = new [EntityNamePascalCase]Controller(dxInstance);
        this.packageName = this.controller.packageName;
        this.endpointName = "[EntityNameCamelCasePlural]";
        this.packageOptions = this.dxInstance.getPackageOptions(this.packageName);

        if (this.packageOptions?.hiddenOperations) {
            this.hiddenOperations = this.packageOptions.hiddenOperations;
        }

        if (this.packageOptions?.operationAccess) {
            this.operationAccess = this.packageOptions.operationAccess;
        }

        if (this.packageOptions?.disableSwaggerDocs) {
            this.disableSwaggerDocs = this.packageOptions.disableSwaggerDocs;
        }

        //#region CRUD definitions
        this.get[EntityNamePascalCasePlural]Operation = {
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
            disableSwaggerDoc: this.checkIfHiddenOperation("get[EntityNamePascalCasePlural]Operation"),
            f: async (req, res) => {
                await this.get[EntityNamePascalCasePlural](req, res);
            },
        };

        this.get[EntityNamePascalCase]Operation = {
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
            disableSwaggerDoc: this.checkIfHiddenOperation("get[EntityNamePascalCase]Operation"),
            f: async (req, res) => {
                await this.get[EntityNamePascalCase](req, res);
            }
        };

        this.create[EntityNamePascalCase]Operation = {
            operationName: "[EntityNameCamelCasePlural]",
            allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Creates a new [EntityNameCamelCase]",
            operationDescription: "Creates a new [EntityNameCamelCase] for the given data",
            parameters: [], // An array of this.getInputParameter()
            requestType: "POST",
            requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true),
            responseSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]"),
            disableSwaggerDoc: this.checkIfHiddenOperation("create[EntityNamePascalCase]Operation"),
            successStatusCode: 201,
            successMessage: "Created",
            f: async (req, res) => {
                await this.create[EntityNamePascalCase](req, res);
            }
        };

        this.update[EntityNamePascalCase]Operation = {
            operationName: "[EntityNameCamelCasePlural]/:id",
            allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Updates [EntityNameCamelCase] by ID",
            operationDescription: "Updates the [EntityNameCamelCase] with data provided for a given ID",
            parameters: [], // An array of this.getInputParameter()
            requestType: "PATCH",
            requestSchema: this.dxInstance.getEntitySchema("[EntityNameCamelCase]", true),
            responseSchema: this.getSchema({ message: "string" }),
            disableSwaggerDoc: this.checkIfHiddenOperation("update[EntityNamePascalCase]Operation"),
            successStatusCode: 204,
            successMessage: "No Content",
            f: async (req, res) => {
                const { params: routeParams, query: queryParams, body } = req;
                const [EntityNameCamelCase]Id = routeParams.id;
                await this.update[EntityNamePascalCase](req, res);
            }
        };

        this.delete[EntityNamePascalCase]Operation = {
            operationName: "[EntityNameCamelCasePlural]/:id",
            allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Deletes a [EntityNameCamelCase]",
            operationDescription:
                "Deletes a [EntityNameCamelCase] matching the provided ID.",
            parameters: [], // An array of this.getInputParameter()
            requestType: "DELETE", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
            requestSchema: {},
            responseSchema: this.getSchema({ message: "string" }),
            disableSwaggerDoc: this.checkIfHiddenOperation("delete[EntityNamePascalCase]Operation"),
            successStatusCode: 204,
            successMessage: "No Content",
            f: async (req, res) => {
                await this.delete[EntityNamePascalCase](req, res);
            }
        };
        //#endregion
[AllRelationshipConstraintsStr]
    }

    async initEndpoint() {
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

    //#region Singular CRUD functions
    async get[EntityNamePascalCase](req, res) {
        const [EntityNameCamelCase]Id = req?.params?.id;
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }

        const showRelationshipOptions = req?.query?.showRelationshipOptions ?? false;
        
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

    async create[EntityNamePascalCase](req, res) {
        const created[EntityNamePascalCase] = await this.controller.create[EntityNamePascalCase](req.body);
        if (!created[EntityNamePascalCase]) {
            this.controller.printLastError();
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        }

        this.forceResult(created[EntityNamePascalCase], 200);
    }

    async update[EntityNamePascalCase](req, res) {
        const [EntityNameCamelCase]Id = req?.params?.id;
        if (![EntityNameCamelCase]Id) {
            this.forceResult({message: "Invalid [EntityNameCamelCase] ID provided"}, 400);
            return;
        }

        const [EntityNameCamelCase]Detail = req?.body;
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

        this.forceResult(undefined, 204);
    }

    async delete[EntityNamePascalCase](req, res) {
        const [EntityNameCamelCase]Id = req?.params?.id;

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

        this.forceResult(undefined, 204);
    }
    //#endregion

    async get[EntityNamePascalCasePlural](req, res) {
        const { data, count } = await this.controller.get[EntityNamePascalCasePlural](req.query);

        if (data === null || count === null) {
            this.controller.printLastError();
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        }

        this.forceResult({ data: data, count: count }, 200);
    }

[AllRelationshipFunctionsStr]
}

module.exports = [EntityNamePascalCasePlural]EndpointBase;