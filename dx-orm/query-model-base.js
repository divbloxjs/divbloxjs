const divbloxObjectBase = require("../dx-core-modules/object-base");
const dxUtils = require("dx-utilities");

class DivbloxQueryModelBase extends divbloxObjectBase {
    /*static clause = {
            equal: "=",
            notEqual: "!=",
            like: "LIKE",
            greaterThan: ">",
            greaterOrEqual: ">=",
            lessThan: "<",
            lessThanOrEqual: "<="
        }*/
    static condition = {
        and: "AND",
        or: "OR",
    };

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

    static equal(field = null, value = null) {
        return (
            DivbloxQueryModelBase.getSqlReadyName(field) + " = '" + DivbloxQueryModelBase.getSqlReadyName(value) + "'"
        );
    }

    static andCondition(...clauses) {
        return this.buildCondition(this.condition.and, clauses);
    }

    static orCondition(...clauses) {
        return this.buildCondition(this.condition.or, clauses);
    }

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

    static buildQueryConditions(clauses = []) {
        let queryComponent = "";

        for (const clause of clauses) {
            queryComponent += clause;
        }

        return queryComponent;
    }

    static async findArray(dxInstance, entityName = "base", fields = [], ...clauses) {
        if (typeof dxInstance === "undefined") {
            return null;
        }

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

        console.log(query);

        const queryResult = await dxInstance.dataLayer.getArrayFromDatabase(
            query,
            dxInstance.dataLayer.getModuleNameFromEntityName(entity)
        );
        return queryResult;
    }
}

module.exports = DivbloxQueryModelBase;
