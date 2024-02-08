
    async setAdditionalWhereSql() {
        super.setAdditionalWhereSql();

        if (this.additionalParams.[EntityNameCamelCase]Id) {
            if (this.additionalWhereSql) this.additionalWhereSql += ` AND `;
            this.additionalWhereSql += `${[EntityNamePascalCase].id} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[EntityNameCamelCase]Id);
        }
[RelationshipBlocks]
	}