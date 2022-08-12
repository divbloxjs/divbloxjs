const divbloxObjectBase = require("../dx-core-modules/object-base");
const dxUtils = require("dx-utilities");

/**
 * DivbloxQueryModelBase forms the base of divbloxjs' ORM query methodology.
 * It provides an easy way to perform SELECT statements for ORM entities with an intuitive query builder
 */
class DivbloxQueryModelBase extends divbloxObjectBase {
    static condition = {
        and: "AND",
        or: "OR",
    };

    /**
     * This class is static and cannot be instantiated
     */
    constructor() {
        if (this instanceof DivbloxQueryModelBase) {
            throw Error("Static class DivbloxQueryModelBase cannot be instantiated.");
        }
    }

    /**
     * Converts the given name, which can be either a class name or a variable or property name in either pascal or
     * camel case, to a lowercase string, separated by underscores
     * @param {string} name
     * @returns {string}
     */
    static getSqlReadyName(name = "") {
        return dxUtils.getCamelCaseSplittedToLowerCase(name, "_");
    }

    /**
     * Escapes foreign characters as preparation to store them in a sql database
     * @param {string} value The string to prepare to store in a sql database
     * @returns {string} The sql-ready string
     */
    static getSqlReadyValue(value = "") {
        //TODO: Implement this. For now, we simply return the given string
        return value;
    }

    /**
     * Provides the sql code for an EQUALS clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name = 'John'
     */
    static equal(field = null, value = null) {
        return this.getSqlReadyName(field) + " = '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a NOT EQUALS clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name != 'John'
     */
    static notEqual(field = null, value = null) {
        return this.getSqlReadyName(field) + " != '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a NULL check clause
     * @param {*} field The field to check on
     * @returns A sql valid string, e.g name IS NULL
     */
    static isNull(field = null) {
        return this.getSqlReadyName(field) + " IS NULL";
    }

    /**
     * Provides the sql code for a NOT NULL check clause
     * @param {*} field The field to check on
     * @returns A sql valid string, e.g name IS NOT NULL
     */
    static isNotNull(field = null) {
        return this.getSqlReadyName(field) + " IS NOT NULL";
    }

    /**
     * Provides the sql code for a LIKE clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name LIKE 'John'
     */
    static like(field = null, value = null) {
        return this.getSqlReadyName(field) + " LIKE '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a GREATER THAN clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name > 'John'
     */
    static greaterThan(field = null, value = null) {
        return this.getSqlReadyName(field) + " > '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a GREATER OR EQUAL clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name >= 'John'
     */
    static greaterOrEqual(field = null, value = null) {
        return this.getSqlReadyName(field) + " >= '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a LESS THAN clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name < 'John'
     */
    static lessThan(field = null, value = null) {
        return this.getSqlReadyName(field) + " < '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code for a LESS OR EQUAL clause
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name <= 'John'
     */
    static lessThanOrEqual(field = null, value = null) {
        return this.getSqlReadyName(field) + " <= '" + this.getSqlReadyName(value) + "'";
    }

    /**
     * Provides the sql code that wraps clauses into an AND condition
     * @param  {...any} clauses The clauses to wrap, e.g equal, notEqual, like, etc
     * @returns A sql valid string, e.g (name <= 'John' AND name != 'Doe')
     */
    static andCondition(...clauses) {
        return this.buildCondition(this.condition.and, clauses);
    }

    /**
     * Provides the sql code that wraps clauses into an OR condition
     * @param  {...any} clauses The clauses to wrap, e.g equal, notEqual, like, etc
     * @returns A sql valid string, e.g (name <= 'John' OR name != 'Doe')
     */
    static orCondition(...clauses) {
        return this.buildCondition(this.condition.or, clauses);
    }

    /**
     * Used by the andCondition and orCondition functions
     * @param {*} condition The type of condition (AND / OR)
     * @param {*} clauses The clauses to wrap
     * @returns A sql valid string, e.g (name <= 'John' OR name != 'Doe')
     */
    static buildCondition(condition = this.condition.and, clauses = []) {
        let queryComponent = "(";
        let hasStarted = false;
        for (const clause of clauses) {
            if (hasStarted) {
                queryComponent += " " + condition + " ";
            } else {
                hasStarted = true;
            }
            queryComponent += clause;
        }
        queryComponent += ")";
        return queryComponent;
    }

    /**
     * Provides the final sql query that will be executed
     * @param {*} clauses All the valid clauses that will form part of the query
     * @returns A sql valid query, e.g (name <= 'John' OR name != 'Doe')
     */
    static buildQueryConditions(clauses = []) {
        let queryComponent = "";

        for (const clause of clauses) {
            queryComponent += clause;
        }

        return queryComponent;
    }

    /**
     * Performs a SELECT query on the database with the provided clauses
     * @param {{dxInstance: DivbloxBase, entityName: string, fields: []|null}} options The options parameter
     * @param {DivbloxBase} options.dxInstance An instance of Divblox
     * @param {string} options.entityName The name of the entity
     * @param {[]|null} options.fields The fields to be returned for the current entity. If an array is provided, those fields will be returned, otherwise all fields will be returned
     * @param {...any} clauses Any clauses that must be added to the query, e.g equal, notEqual, like, etc
     * @returns
     */
    static async findArray(options = {}, ...clauses) {
        const dxInstance = options.dxInstance;
        const entityName = options.entityName;
        const fields = options.fields;

        if (typeof dxInstance === "undefined") {
            return null;
        }

        const dataLayer = dxInstance.dataLayer;

        let entity = "base";
        if (typeof entityName !== "undefined" && entityName.length > 0) {
            entity = entityName;
        }

        let query = "SELECT ";
        if (!Array.isArray(fields) || fields.length < 1) {
            query += "*";
        } else {
            for (const fieldName of fields) {
                query += this.getSqlReadyName(fieldName) + ", ";
            }
            query = query.substring(0, query.length - 2);
        }
        query += " FROM " + this.getSqlReadyName(entity) + " WHERE " + this.buildQueryConditions(clauses);

        // TODO: Debug purposes. Remove
        console.log(query);

        const queryResult = await dataLayer.getArrayFromDatabase(query, dataLayer.getModuleNameFromEntityName(entity));

        return queryResult;
    }
}

module.exports = DivbloxQueryModelBase;
