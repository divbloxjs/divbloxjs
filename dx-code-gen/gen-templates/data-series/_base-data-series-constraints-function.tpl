
    async setAdditionalWhereSql() { 
        super.setAdditionalWhereSql();

        if (this.additionalParams.[EntityNamePascalCase]Id) {
            this.additionalWhereSql += `${[EntityNamePascalCase].id} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[EntityNamePascalCase]Id);
        }
[constraintBlocks]
	}