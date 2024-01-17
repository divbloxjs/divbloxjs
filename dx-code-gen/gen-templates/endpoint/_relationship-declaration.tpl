        this.get[EntityNamePascalCasePlural]By[RelatedEntityNamePascalCase]Operation = {
            operationName: "[EntityNameCamelCasePlural]/[RelatedEntityNameCamelCasePlural]/:id",
            allowedAccess: [AllowedAccess], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Lists a subset of [EntityNameCamelCasePlural]",
            operationDescription: "Lists all [EntityNameCamelCasePlural] constrained by a given [RelatedEntityNameCamelCase] ID",
            parameters: [], // An array of this.getInputParameter()
            requestType: "GET", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
            requestSchema: {},
            responseSchema: this.getSchema({ 
                data: this.getArraySchema(this.dxInstance.getEntitySchema("[EntityNameCamelCase]")), 
                count: "integer" 
            }),
            disableSwaggerDoc: this.hiddenOperations.includes("get[EntityNamePascalCasePlural]By[RelatedEntityNamePascalCase]Operation"),
            f: async (req, res) => {
                await this.get[EntityNamePascalCasePlural]By[RelatedEntityNamePascalCase](req, res);
            },
        };
