    get[EntityNamePascalCasePlural]By[RelatedEntityNamePascalCase]OperationDeclaration = this.getOperationDefinition({
        operationName: "[EntityNameCamelCasePlural]/[RelatedEntityNameCamelCasePlural]/:id",
        allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
        operationSummary: "Lists a subset of [EntityNameCamelCasePlural]",
        operationDescription: "Lists all [EntityNameCamelCasePlural] constrained by a given [RelatedEntityNameCamelCase] ID",
        parameters: [], // An array of this.getInputParameter()
        requestType: "GET", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
        requestSchema: {},
        responseSchema: { organisationDataArray: [] }, // this.getSchema()
        f: async (req, res) => {
            const { params: routeParams, query: queryParams, body } = req;

            const [RelatedEntityNameCamelCase]Id = routeParams.id ?? null;

            const constraintData = queryParams.constraintData;
            const additionalParams = { [RelatedEntityNameCamelCase]Id : [RelatedEntityNameCamelCase]Id };

            await this.get[EntityNamePascalCasePlural](constraintData, additionalParams);
        },
    });
