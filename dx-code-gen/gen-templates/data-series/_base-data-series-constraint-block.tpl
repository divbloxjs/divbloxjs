        
        if (this.additionalParams.[RelatedEntityCamelCase]Id) {
            this.additionalWhereSql += `${[EntityNamePascalCase].[RelatedEntityCamelCase]} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[RelatedEntityCamelCase]Id);
        }
