        
        if (this.additionalParams.[RelatedEntityCamelCase]Id) {
            this.additionalWhereSql += `${[EntityNamePascalCase].[RelatedEntityCamelCase][EntityNamePascalCase]} = ?`;
            this.additionalWhereValues.push(this.additionalParams.[RelatedEntityCamelCase]Id);
        }
