
    async setAdditionalWhereSql() {
        super.setAdditionalWhereSql();

        if (this.additionalParams.[EntityNameCamelCase]Id) {
            this.additionalWhereSql += `${[EntityNamePascalCase].id} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[EntityNameCamelCase]Id);
        }
[RelationshipBlocks]
	}