/**
     * If the [EntityNameCamelCase] has a linked [RelationshipNameCamelCase], this returns an instance of 
     * the [RelationshipNamePascalCase]Controller with the relevant [RelationshipNameCamelCase] loaded
     * @returns {[RelationshipNamePascalCase]Controller|null} Returns null of no [RelationshipNameCamelCase] is linked
     */
    async get[RelationshipNamePascalCase]() {
        if ((this.data["[FinalRelationshipName]"] !== null) && (this.data["[FinalRelationshipName]"] > 0)) {
            const [RelationshipNameCamelCase] = new [RelationshipNamePascalCase]Controller(this.dxInstance, "[RelationshipNameCamelCase]", this.globalIdentifier);
            await [RelationshipNameCamelCase].load(this.data["[FinalRelationshipName]"]);
            return [RelationshipNameCamelCase];
        }

        this.populateError("No [RelationshipNameCamelCase] is linked to this [EntityNameCamelCase]", true, true);
        return null;
    }