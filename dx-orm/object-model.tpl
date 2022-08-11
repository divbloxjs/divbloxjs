const modelBase = require('divbloxjs/dx-orm/object-model-base');
const entitySchema = require('divbloxjs/dx-orm/generated/schemas/[EntityNameLowerCaseSplitted]-schema');

const entityModel = {};
for (const attribute of Object.keys(entitySchema)) {
    entityModel[attribute] = attribute;
}

/**
 * An object model class used to describe the entity [EntityNameCamelCase] in an OOP manner
 */
class [EntityNamePascalCase] extends modelBase {

    /**
     * Basic initialization for the [EntityNameCamelCase] object model class.
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the data layer
     * @param {string} entityName Optional. The name of the entity to deal with. This will only be used if this base class is
     * used to instantiate an object. Otherwise, child classes will set their own entity name in their constructors
     * @param {string} globalIdentifier Optional. The uniqueIdentifier token for a globalIdentifier object.
     * Used to determine current user information if it is required for audit purposes
     */
    constructor(dxInstance, entityName = '[EntityNameCamelCase]', globalIdentifier = '') {
        super(dxInstance, entityName, globalIdentifier);
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
module.exports.model = entityModel;