        
        if (this.additionalParams.[RelatedEntityCamelCase]Id) {
            if (this.additionalWhereSql) this.additionalWhereSql += ` AND `;
            this.additionalWhereSql += `${[EntityNamePascalCase].[RelatedEntityCamelCase]} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[RelatedEntityCamelCase]Id);
        }
