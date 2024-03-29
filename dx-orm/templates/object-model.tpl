const DivbloxBase = require("divbloxjs/divblox");
const ModelBase = require('divbloxjs/dx-orm/object-model-base');
const entitySchema = require('divbloxjs/dx-orm/generated/schemas/[EntityNameLowerCaseSplitted].schema');
const dxQ = require("divbloxjs/dx-orm/query-model-base");
[linkedEntityRequires]
/**
 * An object model class used to describe the entity [EntityNameCamelCase] in an OOP manner
 */
class [EntityNamePascalCase]ModelBase extends ModelBase {

    // [EntityNamePascalCase] Model Specification
    [EntityModelSpec]
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
        this.entityName = entityName;
    }

    /**
     * Called by the constructor to initialize the data for this object. Also called after the delete function succeeds
     */
    reset() {
        super.reset();
        [EntityData]
    }

    [linkedEntityGetters]
    
    /**
     * Performs a SELECT query on the database with the provided clauses
     * @param {{fields: []|null, linkedEntities: [{entityName: string, relationshipName: string, fields: [], joinType: string}], transaction: {}|null, logQuery: boolean}} options The options parameter
     * @param {[]|null} options.fields The fields to be returned. If an array is provided, those fields will be returned, otherwise all fields will be returned
     * @param {[]} options.linkedEntities The fields to be returned for the specified linked entities via their relationshipNames. If an array is provided, those fields specified per entity will be returned,
     * otherwise all fields will be returned if an entity is provided
     * @param {boolean} options.returnCountOnly If set to true, this function will perform a COUNT rather than a SELECT query
     * @param {{}} options.transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} options.logQuery An optional parameter specifying whether to log the resulting SQL query and it's values
     * @param {...any} clauses Any clauses (conditions and order by or group by clauses) that must be added to the query, e.g equal, notEqual, like, etc
     * @returns {Promise<[]|number>} An array of [EntityNameCamelCase] objects or the result size if options.returnCountOnly was passed as true
     */
    async findArray(options = {}, ...clauses) {
        let finalOptions = {dxInstance: this.dxInstance,
                            entityName: this.entityName,
                            ...options}
        return await dxQ.findArray(finalOptions, clauses);
    }

    /**
     * Performs a SELECT query on the database with the provided clauses
     * @param {{fields: []|null, linkedEntities: [{entityName: string, relationshipName: string, fields: [], joinType: string}], transaction: {}|null, logQuery: boolean}} options The options parameter
     * @param {[]|null} options.fields The fields to be returned. If an array is provided, those fields will be returned, otherwise all fields will be returned
     * @param {[]} options.linkedEntities The fields to be returned for the specified linked entities via their relationshipNames. If an array is provided, those fields specified per entity will be returned,
     * otherwise all fields will be returned if an entity is provided
     * @param {{}} options.transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} options.logQuery An optional parameter specifying whether to log the resulting SQL query and it's values
     * @param {...any} clauses Any clauses (conditions and order by or group by clauses) that must be added to the query, e.g equal, notEqual, like, etc
     * @returns {Promise<{}>} A single [EntityNameCamelCase] object
     */
    async findSingle(options = {}, ...clauses) {
        let finalOptions = {dxInstance: this.dxInstance,
                            entityName: this.entityName,
                            ...options}
        return await dxQ.findSingle(finalOptions, clauses);
    }

    /**
     * Performs a COUNT() query on the database with the provided clauses and returns a number
     * @param {{linkedEntities: [{entityName: string, relationshipName: string,  joinType: string}], transaction: {}|null, logQuery: boolean}} options The options parameter
     * @param {[]} options.linkedEntities The fields to be returned for the specified linked entities via their relationshipNames. If an array is provided, those fields specified per entity will be returned,
     * otherwise all fields will be returned if an entity is provided
     * @param {{}} options.transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} options.logQuery An optional parameter specifying whether to log the resulting SQL query and it's values
     * @param {...any} clauses Any clauses (conditions and order by or group by clauses) that must be added to the query, e.g equal, notEqual, like, etc
     * @returns {Promise<number>} The result size
     */
    async findCount(options = {}, ...clauses) {
        let finalOptions = {dxInstance: this.dxInstance,
                            entityName: this.entityName,
                            returnCountOnly: true,
                            ...options}
        return await dxQ.findCount(finalOptions, clauses);
    }
}

module.exports = [EntityNamePascalCase]ModelBase;