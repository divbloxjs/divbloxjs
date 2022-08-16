/**
     * If the [EntityNameCamelCase] has a linked [RelationshipNameCamelCase], this returns an instance of 
     * the [RelationshipNamePascalCase]Controller with the relevant [RelationshipNameCamelCase] loaded
     * @param {*} [RelationshipNameCamelCase]ControllerOverride An optional specialization of the [RelationshipNamePascalCase] controller class
     * @returns {[RelationshipNamePascalCase]Controller|null} Returns null of no [RelationshipNameCamelCase] is linked
     */
    async get[RelationshipNamePascalCase]([RelationshipNameCamelCase]ControllerOverride = null) {
        const [RelationshipNameCamelCase]Controller = [RelationshipNameCamelCase]ControllerOverride === null ? 
            [RelationshipNamePascalCase]Controller : [RelationshipNameCamelCase]ControllerOverride;

        if ((this.data["[FinalRelationshipName]"] !== null) && (this.data["[FinalRelationshipName]"] > 0)) {
            const [RelationshipNameCamelCase] = new [RelationshipNameCamelCase]Controller(this.dxInstance, "[RelationshipNameCamelCase]", this.globalIdentifier);
            await [RelationshipNameCamelCase].load(this.data["[FinalRelationshipName]"]);
            return [RelationshipNameCamelCase];
        }

        this.populateError("No [RelationshipNameCamelCase] is linked to this [EntityNameCamelCase]", true, true);
        return null;
    }