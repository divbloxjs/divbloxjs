/**
     * If the [EntityNameCamelCase] has a linked [RelationshipNameCamelCase], this returns an instance of 
     * the [RelationshipNamePascalCase]Model with the relevant [RelationshipNameCamelCase] loaded
     * @param {*} [RelationshipNameCamelCase]ModelOverride An optional specialization of the [RelationshipNamePascalCase] model class
     * @param {{}} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {[RelationshipNamePascalCase]|null} Returns null of no [RelationshipNameCamelCase] is linked
     */
    async get[RelationshipNamePascalCase]([RelationshipNameCamelCase]ModelOverride = null, transaction) {
        const [RelationshipNameCamelCase]Model = [RelationshipNameCamelCase]ModelOverride === null ? 
            [RelationshipNamePascalCase] : [RelationshipNameCamelCase]ModelOverride;

        if ((this.data["[FinalRelationshipName]"] !== null) && (this.data["[FinalRelationshipName]"] > 0)) {
            const [RelationshipNameCamelCase] = new [RelationshipNameCamelCase]Model(this.dxInstance, "[RelationshipNameCamelCase]", this.globalIdentifier);
            await [RelationshipNameCamelCase].load(this.data["[FinalRelationshipName]"], transaction);
            return [RelationshipNameCamelCase];
        }

        this.populateError("No [RelationshipNameCamelCase] is linked to this [EntityNameCamelCase]", true, true);
        return null;
    }