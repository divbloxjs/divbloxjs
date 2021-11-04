const modelBase = require('divbloxjs/dx-orm/object-model-base');
const entitySchema = require('divbloxjs/dx-orm/generated/schemas/[EntityNameLowerCaseSplitted]-schema');

/**
 * An object model class used to describe the entity [EntityNameCamelCase] in an OOP manner
 */
class [EntityNamePascalCase] extends modelBase {

    /**
     * Basic initialization for the [EntityNameCamelCase] object model class.
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the data layer
     * @param {string} sessionId Optional. The id of the current session. Used to determine current user information if
     * it is required for audit purposes
     */
    constructor(dxInstance, sessionId) {
        super(dxInstance, "[EntityNameCamelCase]", sessionId);
        this.entitySchema = entitySchema;
    }

    /**
     * Called by the constructor to initialize the data for this object. Also called after the delete function succeeds
     */
    reset() {
        super.reset();
        [EntityData]
    }
}
module.exports = [EntityNamePascalCase];