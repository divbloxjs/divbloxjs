const divbloxObjectBase = require("../dx-core-modules/object-base");
const dxUtils = require("dx-utilities");

/**
 * DivbloxQueryModelBase forms the base of divbloxjs' ORM query methodology.
 * It provides an easy way to perform SELECT statements for ORM entities with an intuitive query builder
 */
class DivbloxQueryModelBase extends divbloxObjectBase {
    /**
     * Debug mode prints out every query to the terminal
     */
    static enableDebugMode = false;

    static operators = {
        and: "AND",
        or: "OR",
    };

    static clauses = {
        orderBy: "ORDER BY",
        groupBy: "GROUP BY",
        limit: "LIMIT",
        offset: "OFFSET",
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
     * Provides the sql code for an EQUALS operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name = 'John'
     */
    static equal(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " = ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " = '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a NOT EQUALS operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name != 'John'
     */
    static notEqual(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " != ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " != '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a NULL check operator
     * @param {*} field The field to check on
     * @returns A sql valid string, e.g name IS NULL
     */
    static isNull(field = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " IS NULL",
        };
        //return this.getSqlReadyName(field) + " IS NULL";
    }

    /**
     * Provides the sql code for a NOT NULL check operator
     * @param {*} field The field to check on
     * @returns A sql valid string, e.g name IS NOT NULL
     */
    static isNotNull(field = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " IS NOT NULL",
        };
        //return this.getSqlReadyName(field) + " IS NOT NULL";
    }

    /**
     * Provides the sql code for a LIKE operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name LIKE 'John'
     */
    static like(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " LIKE ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " LIKE '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a NOT LIKE operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name LIKE 'John'
     */
    static notLike(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " NOT LIKE ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " NOT LIKE '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for an IN operator
     * @param {*} field The field to check on
     * @param {[]} values The value to check on
     * @returns A sql valid string, e.g name LIKE 'John'
     */
    static in(field = null, values = []) {
        let tokenStr = "";

        for (let i = 0; i < values.length; i++) {
            tokenStr += "?,";
        }

        tokenStr = tokenStr.substring(0, tokenStr.length - 1);

        return {
            preparedStatement: this.getSqlReadyName(field) + " IN (" + tokenStr + ")",
            values: values,
        };

        //return this.getSqlReadyName(field) + " IN (" + comparisonStr + ")";
    }

    /**
     * Provides the sql code for a NOT IN operator
     * @param {*} field The field to check on
     * @param {[]} values The value to check on
     * @returns A sql valid string, e.g name LIKE 'John'
     */
    static notIn(field = null, values = []) {
        let tokenStr = "";

        for (let i = 0; i < values.length; i++) {
            tokenStr += "?,";
        }

        tokenStr = tokenStr.substring(0, tokenStr.length - 1);

        return {
            preparedStatement: this.getSqlReadyName(field) + " NOT IN (" + tokenStr + ")",
            values: values,
        };

        //return this.getSqlReadyName(field) + " NOT IN (" + comparisonStr + ")";
    }

    /**
     * Provides the sql code for a GREATER THAN operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name > 'John'
     */
    static greaterThan(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " > ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " > '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a GREATER OR EQUAL operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name >= 'John'
     */
    static greaterOrEqual(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " >= ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " >= '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a LESS THAN operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name < 'John'
     */
    static lessThan(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " < ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " < '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code for a LESS OR EQUAL operator
     * @param {*} field The field to check on
     * @param {*} value The value to check on
     * @returns A sql valid string, e.g name <= 'John'
     */
    static lessThanOrEqual(field = null, value = null) {
        return {
            preparedStatement: this.getSqlReadyName(field) + " <= ?",
            values: [this.getSqlReadyValue(value)],
        };
        //return this.getSqlReadyName(field) + " <= '" + this.getSqlReadyValue(value) + "'";
    }

    /**
     * Provides the sql code that wraps conditions into an AND condition
     * @param  {...any} clauses The clauses to wrap, e.g equal, notEqual, like, etc
     * @returns A sql valid string, e.g (name <= 'John' AND name != 'Doe')
     */
    static andCondition(...clauses) {
        return this.buildCondition("AND", clauses);
    }

    /**
     * Provides the sql code that wraps condition into an OR condition
     * @param  {...any} clauses The clauses to wrap, e.g equal, notEqual, like, etc
     * @returns A sql valid string, e.g (name <= 'John' OR name != 'Doe')
     */
    static orCondition(...clauses) {
        return this.buildCondition("OR", clauses);
    }

    /**
     * Provides the sql code for an ORDER BY clause
     * @param {[{field: string, isDescending: boolean}]} fields The fields to order on
     * @returns A sql valid clause, e.g ORDER BY name DESC
     */
    static orderBy(fields = []) {
        let sqlStr = "";
        for (const field of fields) {
            if (field.isDescending === undefined) {
                field.isDescending = true;
            }

            sqlStr += this.getSqlReadyName(field.field);
            sqlStr += field.isDescending ? " DESC," : " ASC,";
        }

        if (sqlStr.length > 0) {
            sqlStr = sqlStr.substring(0, sqlStr.length - 1);
            return " ORDER BY " + sqlStr;
        }

        return "";
    }

    /**
     * Provides the sql code for a GROUP BY clause
     * @param {[string]} fields The fields to group on
     * @returns A sql valid clause, e.g ORDER BY name DESC
     */
    static groupBy(fields = []) {
        let sqlStr = "";
        for (const field of fields) {
            sqlStr += this.getSqlReadyName(field) + ",";
        }

        if (sqlStr.length > 0) {
            sqlStr = sqlStr.substring(0, sqlStr.length - 1);
            return " GROUP BY " + sqlStr;
        }

        return "";
    }

    /**
     * Provides the sql code for a LIMIT clause
     * @param {*} number The limit
     * @returns A sql valid clause, e.g LIMIT 10
     */
    static limit(number = -1) {
        if (number > 0) {
            return " LIMIT " + number;
        }

        return "";
    }

    /**
     * Provides the sql code for an OFFSET clause
     * @param {*} number The offset
     * @returns A sql valid clause, e.g OFFSET 10
     */
    static offset(number = -1) {
        if (number > 0) {
            return " OFFSET " + number;
        }

        return "";
    }

    /**
     * Used by the andCondition and orCondition functions
     * @param {*} operator The type of operator (AND / OR)
     * @param {*} clauses The clauses to wrap
     * @returns A sql valid string, e.g (name <= 'John' OR name != 'Doe')
     */
    static buildCondition(operator = "AND", clauses = []) {
        let queryComponent = "(";
        let hasStarted = false;
        let localValues = [];

        for (const clause of clauses) {
            if (clause === null) {
                continue;
            }

            if (hasStarted) {
                queryComponent += " " + operator + " ";
            } else {
                hasStarted = true;
            }

            queryComponent += clause.preparedStatement;
            localValues.push(...clause.values);
        }

        queryComponent += ")";

        return {
            preparedStatement: queryComponent,
            values: localValues,
        };
    }

    /**
     * Provides the final sql query conditions that will be used in the final sql query
     * @param {*} clauses All the valid condition clauses that will form part of the query
     * @returns A sql valid WHERE clause, e.g (name <= 'John' OR name != 'Doe')
     */
    static buildQueryConditions(clauses = []) {
        let queryComponent = {
            preparedStatement: "",
            values: [],
        };

        for (const clause of clauses) {
            let isAdditionalClause = false;
            let preparedStatement = "";

            if (typeof clause !== "object") {
                preparedStatement = clause;

                for (const additionalClause of Object.values(this.clauses)) {
                    if (clause.indexOf(additionalClause) !== -1) {
                        // This means that it should not for part of the WHERE clause
                        isAdditionalClause = true;
                        break;
                    }
                }
            } else {
                preparedStatement = clause.preparedStatement;
            }

            if (!isAdditionalClause) {
                queryComponent.preparedStatement += preparedStatement;
                if (typeof clause.values !== "undefined") {
                    queryComponent.values.push(...clause.values);
                }
            }
        }

        return queryComponent;
    }

    /**
     * Provides the final additional sql clauses that will be used in the final sql query
     * @param {*} clauses All the valid clauses that will form part of the query
     * @returns Valid additional sql clauses (e.g ORDER BY 'abc' DESC)
     */
    static buildQueryAdditionalClauses(clauses = []) {
        let queryComponent = "";

        let orderByClauses = [];
        let groupByClauses = [];
        let offset = null;
        let limit = null;

        for (const clause of clauses) {
            if (typeof clause === "object") {
                continue;
            }

            if (clause.indexOf(this.clauses.orderBy) !== -1) {
                orderByClauses.push(clause);
            }

            if (clause.indexOf(this.clauses.groupBy) !== -1) {
                groupByClauses.push(clause);
            }

            if (clause.indexOf(this.clauses.limit) !== -1) {
                limit = clause;
            }

            if (clause.indexOf(this.clauses.offset) !== -1) {
                offset = clause;
            }
        }

        for (const groupByClause of groupByClauses) {
            queryComponent += groupByClause;
        }

        for (const orderByClause of orderByClauses) {
            queryComponent += orderByClause;
        }

        if (limit !== null) {
            queryComponent += limit;
        }

        if (offset !== null) {
            queryComponent += offset;
        }

        return queryComponent;
    }

    /**
     * Performs a SELECT query on the database with the provided clauses
     * @param {{dxInstance: DivbloxBase, entityName: string, fields: [], linkedEntities: [{entityName: string, relationshipName: string, fields: []}], transaction: {}|null}} options The options parameter
     * @param {DivbloxBase} options.dxInstance An instance of Divblox
     * @param {string} options.entityName The name of the entity
     * @param {[]} options.fields The fields to be returned for the current entity. If an array is provided, those fields will be returned, otherwise all fields will be returned
     * @param {[]} options.linkedEntities The fields to be returned for the specified linked entities via their relationshipNames. If an array is provided, those fields specified per entity will be returned,
     * otherwise all fields will be returned if an entity is provided
     * @param {{}} options.transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {...any} clauses Any clauses (conditions and order by or group by clauses) that must be added to the query, e.g equal, notEqual, like, etc
     * @returns
     */
    static async findArray(options = {}, ...clauses) {
        const dxInstance = options.dxInstance;
        const entityName = options.entityName;
        const fields = options.fields;
        const transaction = options.transaction;

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

        let innerJoinSql = "";
        let linkedEntityNames = [];

        if (Array.isArray(options.linkedEntities) && options.linkedEntities.length > 0) {
            for (const linkedEntity of options.linkedEntities) {
                if (Array.isArray(linkedEntity.fields) && linkedEntity.fields.length > 0) {
                    if (linkedEntityNames.includes(linkedEntity.entityName)) {
                        dxUtils.printErrorMessage(
                            "findArray() does not support multiple INNER JOIN on the same foreign table.' " +
                                linkedEntity.entityName +
                                "' is defined more than once. To achieve this functionality, please create" +
                                " a custom query."
                        );
                        throw new Error("Fatal error in findArray()");
                    }

                    linkedEntityNames.push(linkedEntity.entityName);

                    innerJoinSql +=
                        " INNER JOIN " +
                        this.getSqlReadyName(linkedEntity.entityName) +
                        " ON " +
                        linkedEntity.relationshipName +
                        " = " +
                        this.getSqlReadyName(linkedEntity.entityName) +
                        ".id";

                    query += ", ";

                    for (const fieldName of linkedEntity.fields) {
                        query += this.getSqlReadyName(fieldName) + ", ";
                    }

                    query = query.substring(0, query.length - 2);
                }
            }
        }

        query += " FROM " + this.getSqlReadyName(entity);

        query += innerJoinSql;

        const { preparedStatement, values } = this.buildQueryConditions(clauses[0]);

        if (preparedStatement.length > 0) {
            query += " WHERE " + preparedStatement;
        }

        const queryAdditionalClauses = this.buildQueryAdditionalClauses(clauses[0]);

        query += queryAdditionalClauses;

        const queryResult = await dataLayer.getArrayFromDatabase(
            { sql: query, nestTables: true },
            dataLayer.getModuleNameFromEntityName(entity),
            values,
            transaction
        );

        if (this.enableDebugMode) {
            dxUtils.printSubHeadingMessage("\nDivbloxQueryModelBase debug output");
            dxUtils.printInfoMessage("SQL prepared statement: \n\n" + query);
            dxUtils.printInfoMessage("\nSQL query values: " + JSON.stringify(values));

            if (queryResult === null) {
                dxUtils.printErrorMessage(JSON.stringify(dataLayer.getError(), null, 2));
            }
        }

        return queryResult;
    }

    /**
     * Performs a SELECT query on the database with the provided clauses and returns a single entry
     * @param {{dxInstance: DivbloxBase, entityName: string, fields: [], linkedEntities: [{entityName: string, relationshipName: string, fields: []}], transaction: {}|null}} options The options parameter
     * @param {DivbloxBase} options.dxInstance An instance of Divblox
     * @param {string} options.entityName The name of the entity
     * @param {[]} options.fields The fields to be returned for the current entity. If an array is provided, those fields will be returned, otherwise all fields will be returned
     * @param {[]} options.linkedEntities The fields to be returned for the specified linked entities via their relationshipNames. If an array is provided, those fields specified per entity will be returned,
     * otherwise all fields will be returned if an entity is provided
     * @param {{}} options.transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {...any} clauses Any clauses (conditions and order by or group by clauses) that must be added to the query, e.g equal, notEqual, like, etc
     * @returns {{}} Single object of data based on specified query
     */
    static async findSingle(options = {}, ...clauses) {
        clauses[0].forEach((clause, index) => {
            if (typeof clause === "string" && clause.includes("LIMIT")) {
                clauses[0].splice(index, 1);
            }
        })

        clauses[0].push(this.limit(1));

        const resultArray = await this.findArray(options, ...clauses);

        if (resultArray === null) {
            return null;
        }

        if (resultArray.length > 0) {
            return resultArray[0];
        }

        return null;
    }
}

module.exports = DivbloxQueryModelBase;
