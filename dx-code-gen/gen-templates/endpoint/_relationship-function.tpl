    async get[EntityNamePascalCasePlural]By[RelatedEntityNamePascalCase](req, res) {
        const additionalParams = { [RelatedEntityNameCamelCase]Id : req?.params?.id };
        const { data, count } = await this.controller.get[EntityNamePascalCasePlural](req.query, additionalParams);

        if (data === null || count === null) {
            this.controller.printLastError();
            this.forceResult({ message: this.controller.getLastError()?.message }, 400);
            return;
        }

        this.forceResult({ data: data, count: count }, 200);
    }
