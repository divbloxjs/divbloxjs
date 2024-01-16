        
        const [EntityNameCamelCase]DataSeries = new [EntityNamePascalCase]DataSeries(this.dxInstance, relationshipDataSeriesConfig);
        const [EntityNameCamelCase]DataArr = await [EntityNameCamelCase]DataSeries.getDataSeries();
        if ([EntityNameCamelCase]DataArr === null) {
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return null;
        }
