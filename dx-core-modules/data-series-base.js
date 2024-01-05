const DivbloxObjectBase = require("divbloxjs/dx-core-modules/object-base");
const dxQ = require("divbloxjs/dx-orm/query-model-base");
const dxUtils = require("dx-utilities");

/**
 * @typedef dataSeriesConfig
 * @property {string} [searchValue] Additional classes ot add to the action button
 * @property {number} [offset] Display label to be shown next to the action button
 * @property {number} [limit] Display label to be shown next to the action button
 * @property {Object.<string, clauseConstraint>} columns Display label to be shown next to the action button
 */

/**
 * @typedef clauseConstraint
 * @type {Object}
 * @property {boolean} isSortAscending
 * @property {boolean} sortBy
 * @property {filterConstraint} filterBy
 */

/**
 * @typedef filterConstraint
 * @type {Object}
 * @property {string} [filterText]
 * @property {number} [filterNumber]
 * @property {string} [filterDropdown]
 * @property {string} [fromDate]
 * @property {string} [toDate]
 */

/**
 * @typedef queryBuilderConfig
 * @property {Array} fields Array of fields from the base table to select
 * @property {Array} linkedEntities Array of config objects to build JOINS with
 * @property {DivbloxBase} dxInstance
 * @property {{}} baseEntityObject The instance of the base entity ORM class
 */

/**
 * Base DxDataSeries class that handles building queries and handling results for
 * orderable, filterable, searchable and paginatable data series
 */
class DxBaseDataSeries extends DivbloxObjectBase {
    #DEFAULT_LIMIT = 10;
    #MAX_LIMIT = 100;
    #RELATIONSHIP_TREE_LIMIT = 3;
    #DEFAULT_JOIN_TYPE = "LEFT";

    #offset = -1;
    #limit = this.#DEFAULT_LIMIT;
    #searchValue = "";

    /**
     * @param {DivbloxBase} dxInstance
     * @param {dataSeriesConfig} dataSeriesConfig Standardised configuration object for building specific clauses
     * @param {queryBuilderConfig} additionalParams Standardised configuration object to create
     * the dx ORM select statement for your query
     */
    constructor(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        super();

        this.#setClassVars(dxInstance, dataSeriesConfig, additionalParams);

        if (!this.doValidation()) return undefined;

        this.#setDefaultSql();
    }

    #setClassVars(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        this.dxInstance = dxInstance ?? null;
        this.moduleName = dataSeriesConfig?.moduleName ?? undefined;
        this.entityName = dataSeriesConfig?.entityName ?? undefined;

        this.includedAttributes = dataSeriesConfig?.includedAttributes ?? [];
        this.includedAttributes.forEach((includedAttribute) => {
            return dxQ.getSqlReadyName(includedAttribute);
        });
        this.searchAttributes = dataSeriesConfig?.searchAttributes ?? [];
        this.searchAttributes.forEach((searchAttribute) => {
            return dxQ.getSqlReadyName(searchAttribute);
        });

        // Used for any additional values needed in the query
        this.additionalParams = additionalParams;

        console.log("dataSeriesConfig", dataSeriesConfig);
        console.log("additionalParams", additionalParams);
        if (dataSeriesConfig.hasOwnProperty("RELATIONSHIP_TREE_LIMIT")) {
            this.#RELATIONSHIP_TREE_LIMIT = dataSeriesConfig?.RELATIONSHIP_TREE_LIMIT;
        }

        if (dataSeriesConfig.hasOwnProperty("DEFAULT_JOIN_TYPE")) {
            this.#DEFAULT_JOIN_TYPE = dataSeriesConfig.DEFAULT_JOIN_TYPE;
        }

        this.#searchValue = dataSeriesConfig.searchValue ?? "";
        this.#offset = dataSeriesConfig.offset ?? -1;

        this.#limit = this.#DEFAULT_LIMIT;
        if (dataSeriesConfig.limit) {
            this.#limit = dataSeriesConfig.limit < this.#MAX_LIMIT ? dataSeriesConfig.limit : this.#MAX_LIMIT;
        }

        /**
         * @type {Object.<string, clauseConstraint>}
         */
        this.clauseConstraints = {};
        if (dataSeriesConfig.hasOwnProperty("columns") && dxUtils.isValidObject(dataSeriesConfig.columns)) {
            Object.keys(dataSeriesConfig.columns ?? []).forEach((attributeName) => {
                this.clauseConstraints[dxQ.getSqlReadyName(attributeName)] = dataSeriesConfig.columns[attributeName];
            });
        }
    }

    #setDefaultSql() {
        this.dataSeriesSelectSql = `SELECT *`;
        if (this.includedAttributes.length > 0) {
            this.dataSeriesSelectSql = `SELECT ${this.includedAttributes.join(",")}`;
        }
        this.dataSeriesValues = [];

        this.countSelectSql = `SELECT COUNT(*) AS COUNT`;
        this.countValues = [];

        //region JOINs
        let joinSql = "";
        let treeSplitCount = [];

        const recursivelyAddRelationships = (entityName, recursionDepth = this.#RELATIONSHIP_TREE_LIMIT) => {
            const relationships = this.dxInstance.dataModelObj[entityName].relationships;

            if (Object.keys(relationships).length > 0) {
                Object.keys(relationships).forEach((relatedEntityName, idx) => {
                    const relationshipName = `${relatedEntityName}_${relationships[relatedEntityName][0]}`;
                    if (typeof treeSplitCount[idx] === "undefined") {
                        treeSplitCount[idx] = 1;
                    }

                    joinSql += `${this.#DEFAULT_JOIN_TYPE} JOIN ${dxQ.getSqlReadyName(
                        relatedEntityName,
                    )} ON ${dxQ.getSqlReadyName(entityName)}.${dxQ.getSqlReadyName(
                        `${relationshipName}`,
                    )} = ${dxQ.getSqlReadyName(`${relatedEntityName}.id`)}\n`;
                    if (
                        Object.keys(this.dxInstance.dataModelObj[relatedEntityName].relationships).length > 0 &&
                        treeSplitCount[idx] < recursionDepth
                    ) {
                        treeSplitCount[idx]++;
                        recursivelyAddRelationships(relatedEntityName);
                    }
                });
            }
        };

        if (this.#RELATIONSHIP_TREE_LIMIT > 0) {
            recursivelyAddRelationships(this.entityName);
        }

        this.joinSql = joinSql;
        this.joinValues = [];
        //endregion

        this.whereSql = ``;
        this.whereValues = [];
        this.additionalWhereSql = ``;
        this.additionalWhereValues = [];
        this.orderBySql = ``;
        this.orderByValues = [];
        this.groupBySql = ``;
        this.groupByValues = [];
        this.havingSql = ``;
        this.havingValues = [];
        this.offsetSql = ``;
        this.offsetValue = undefined;
        this.limitSql = `LIMIT 10`;
        this.limitValue = undefined;
    }

    /**
     * Overwrites the select part of the query with any custom string
     * @param {string} sql
     */
    resetDataSeriesSelectSql(sql = ``) {
        this.dataSeriesSelectSql = sql;
    }

    /**
     * Overwrites the select part of the query with any custom string
     * @param {string} sql
     */
    resetCountSelectSql(sql = ``) {
        this.countSelectSql = sql;
    }

    /**
     * Sets the JOIN part of the query
     * @param {string} sql
     * @param {[]} values
     */
    resetJoinSql(sql = ``, values = []) {
        this.joinSql = sql;
        this.joinValues = values;
    }

    /**
     * Sets the where clause of the query
     * @param {string} sql
     * @param {[]} values
     */
    resetWhereSql(sql = ``, values = []) {
        this.whereSql = sql;
        this.whereValues = values;
    }

    /**
     * Used to append any additional needed where clauses on top of the search/filter default ones
     */
    setAdditionalWhereSql() {
        this.additionalWhereSql = ``;
        this.additionalWhereValues = [];
    }

    /**
     * Sets the groupBy clause of the query
     * @param {string} sql
     * @param {[]} values
     */
    resetOrderBySql(sql = ``, values = []) {
        this.orderBySql = sql;
        this.orderByValues = values;
    }

    /**
     * Sets the groupBy clause of the query
     * @param {string} sql
     * @param {[]} values
     */
    resetGroupBySql(sql = ``, values = []) {
        this.groupBySql = sql;
        this.groupByValues = values;
    }

    /**
     * Sets the groupBy clause of the query
     * @param {string} sql
     * @param {[]} values
     */
    resetHavingSql(sql = ``, values = []) {
        this.havingSql = sql;
        this.havingValues = values;
    }

    /**
     * Sets the limit value on the query
     * @param {number} limit Default value of this.#DEFAULT_LIMIT,
     * Max value of this.#MAX_LIMIT.
     */
    resetLimit(limit = this.#DEFAULT_LIMIT) {
        this.#limit = limit < this.#MAX_LIMIT ? limit : this.#MAX_LIMIT;

        this.limitSql = `LIMIT ?`;
        this.limitValue = limit;
    }

    /**
     *  Sets the offset value on the query
     * @param {number} offset Default value of -1 does not set an offset.
     */
    resetOffset(offset = -1) {
        if (offset > 0) {
            this.offsetSql = `OFFSET ?`;
            this.offsetValue = offset;
        }
    }

    /**
     * Validates whether all necessary inputs were provided to the data series class before executing the query
     * @returns {boolean}
     */
    doValidation() {
        if (!this.dxInstance) {
            this.populateError("Required attribute: dxInstance");
            return false;
        }

        if (!this.entityName) {
            this.populateError("Required attribute: entityName");
            return false;
        }

        if (!this.moduleName) {
            this.populateError("Required attribute: moduleName");
            return false;
        }

        return true;
        // TODO Further improve validation of the dataSeriesConfig
    }

    async #appendGlobalSearchClause(whereClauses) {
        if (this.#searchValue !== "") {
            whereClauses = dxQ.andCondition(whereClauses, await this.getSearchClauses(this.#searchValue));
        }
        return whereClauses;
    }

    async resetSearchAndFilterWhereSql(sql = ``, values = []) {
        this.searchAndFilterWhereSql = sql;
        this.searchAndFilterWhereValues = values;
    }

    /**
     *
     * @returns {Promise<{}|{isDescending: boolean, field: (string|string)}>}
     */
    async #getOrderByClauses() {
        // Defaults to the first provided attribute in descending order
        const orderColumnName = Object.keys(this.clauseConstraints)[0] ?? `${this.entityName}.id`;
        if (!orderColumnName) {
            return {};
        }

        let orderByClause = { field: orderColumnName, isDescending: false };

        if (Object.keys(this.clauseConstraints).length > 0) {
            for (const [attributeName, attributeSettings] of Object.entries(this.clauseConstraints)) {
                if (attributeSettings.sortBy === true) {
                    orderByClause.field = attributeName;
                    orderByClause.isDescending = !attributeSettings.isSortAscending;
                }
            }
        }

        return orderByClause;
    }

    async #appendFilterByClauses(whereClauses) {
        if (Object.keys(this.clauseConstraints).length > 0) {
            let filterByInfo = {};
            let hasFiltersDefined = false;
            for (const [attributeName, attributeSettings] of Object.entries(this.clauseConstraints)) {
                if (Object.keys(attributeSettings.filterBy).length > 0) {
                    filterByInfo[attributeName] = {};

                    for (const [filterType, filterValue] of Object.entries(attributeSettings.filterBy)) {
                        if (filterValue.toString().length < 1) {
                            continue;
                        }

                        hasFiltersDefined = true;
                        filterByInfo[attributeName][filterType] = {
                            sqlReadyName: attributeName,
                            value: filterValue,
                        };
                    }
                }
            }

            if (hasFiltersDefined) {
                for (const [filterName, filterOptions] of Object.entries(filterByInfo)) {
                    for (const [filterType, { sqlReadyName, value }] of Object.entries(filterOptions)) {
                        let filterClause = null;
                        switch (filterType) {
                            case "filterText":
                            case "filterNumber":
                                filterClause = dxQ.like(sqlReadyName, "%" + value + "%");
                                break;
                            case "fromDate":
                                filterClause = dxQ.greaterOrEqual(sqlReadyName, value);
                                break;
                            case "toDate":
                                filterClause = dxQ.lessThanOrEqual(sqlReadyName, value);
                                break;
                            case "filterDropdown":
                                filterClause = dxQ.equal(sqlReadyName, value);
                                break;
                            default:
                                filterClause = this.checkCustomFilterCases(filterType, sqlReadyName, value);
                        }

                        whereClauses = dxQ.andCondition(whereClauses, filterClause);
                    }
                }
            }
        }

        return whereClauses;
    }

    /**
     * Extendable function to allow the developer to implement custom filter expressions
     * @param {string} filterType THe name of the filter type to build a clause for
     * @param {*} sqlReadyName The prepared name of the attribute to filter by
     * @param {*} value The value to filter with
     * @returns {Promise<{field: string, value: string}|null>} The filter clause, or null if 'filterType' defined
     */
    async checkCustomFilterCases(filterType, sqlReadyName, value) {
        let filterClause = null;
        switch (filterType) {
            // case "someCustomFilterType":
            //     filterClause = dxQ.equal(sqlReadyName, value);
            //     break;
            default:
                this.populateError("Unhandled filter type provided: " + filterType);
        }

        return filterClause;
    }

    /**
     * Constructs the necessary ORM clauses for the provided data series query configuration
     *
     * @returns {Promise<{whereClauses: {preparedStatement: string, values:[]}, orderByClause: {field: string, isDescending: boolean }}>} the populated where and order by clauses
     */
    async #getPrebuiltClauses() {
        let whereClauses = { preparedStatement: "", values: [] };

        if (!this.searchWhereSql) {
            // No search clause manually overridden - generate default one
            whereClauses = await this.#appendGlobalSearchClause(whereClauses);
        }

        if (!this.filterWhereSql) {
            // No filter clause manually overridden - generate default one
            whereClauses = await this.#appendFilterByClauses(whereClauses);
        }

        let orderByClause = { field: `${this.entityName}.id`, isDescending: false };
        if (!this.orderBySql) {
            orderByClause = await this.#getOrderByClauses();
        }

        return {
            whereClauses: whereClauses,
            orderByClause: orderByClause,
        };
    }

    /**
     * Allows the dev to configure which attributes the global search should look through and with what comparison
     * @param {string} searchValue The search value provided
     * @returns {Promise<{preparedStatement: string, values: []}>} The dx clause object/s or null if none
     */
    async getSearchClauses(searchValue) {
        // TODO Overwrite to include whichever attributes are needed
        if (this.searchAttributes.length > 0) {
            const searchClauses = [];
            this.searchAttributes.forEach((searchAttribute) => {
                searchClauses.push(dxQ.like(`${this.entityName}.${searchAttribute}`, "%" + searchValue + "%"));
            });
            return dxQ.andCondition(...searchClauses);
        }

        return null;
    }

    /**
     * Extendable function to append additional order by clauses if needed above and beyond the dataSeriesConfig one.
     * @param {{}} defaultOrderByClause The order by clause object created by dataSeriesConfig specification
     * @returns {Promise<[]>} Array of order by clause objects
     */
    async getAllOrderByClauses(defaultOrderByClause) {
        let orderByClauses = [defaultOrderByClause];
        // TODO Add own or overwrite order by clauses
        return dxQ.orderBy(orderByClauses);
    }

    /**
     * Adds additional where clauses that may be required
     * @returns {Promise<{}>} A dxQ clause object
     */
    async getAdditionalWhereClauses() {
        return null;
    }

    /**
     * Builds the group by clause
     * @returns {string} GROUP BY clause
     */
    async getGroupByClause() {
        return null;
    }

    /**
     * Allows the developer to reformat, mutate, or update the result before returning it
     * @param {[]} initialResult Result that was received by DB connector
     * @returns {Promise<[]>} Finalised result output desired
     */
    async getFinalResult(initialResult) {
        // TODO finalise or mutate return object
        return initialResult;
    }

    /**
     * Returns the total count of the data series query without limit, offset or order by clauses
     * @param {{}} options findCount() options
     * @returns {Promise<number|null>} The total count, or null if error occurred
     */
    async getTotalCount(options = {}) {
        const { whereClauses } = await this.#getPrebuiltClauses();
        // console.log("where", whereClauses);
        // console.log("orderByClause", orderByClause);

        if (!this.whereSql) {
            //     this.whereSql = whereClauses.preparedStatement;
            this.countValues = whereClauses.values;
        } else {
            //     this.whereSql += ` AND ${whereClauses.preparedStatement}`;
            this.countValues.push(...whereClauses.values);
        }

        if (!this.fullCountSql) {
            this.buildFinalCountSql();
        }

        // console.log("this.fullCountSql", this.fullCountSql);
        const result = await this.dxInstance
            .getDataLayer()
            .executeQuery(
                { sql: this.fullCountSql, nestTables: false },
                this.moduleName,
                this.countValues,
                options?.transaction ?? null,
            );
        if (result === null) {
            this.populateError(this.dxInstance.getDataLayer().getLastError());
            return null;
        }

        const count = result[0]["COUNT"];

        return count;
    }

    resetDataSeriesSql(fullSql = ``, values = []) {
        this.dataSeriesFullSql = fullSql;
        this.dataSeriesValues = values;
    }

    resetCountSql(fullSql = ``, values = []) {
        this.fullCountSql = fullSql;
        this.countValues = values;
    }

    setCountSelectSql(countSelect = ``) {
        if (!countSelect) return;
        this.countSelect = countSelect;
    }

    async getDataSeries(options = {}) {
        const { whereClauses, orderByClause } = await this.#getPrebuiltClauses();

        this.setAdditionalWhereSql();
        if (this.searchAndFilterWhereSql) {
            // Overloaded search and filter clauses provided
            this.whereSql = ` ${this.whereSql ? "AND" : "WHERE"} ${this.searchAndFilterWhereSql}`;
            this.whereValues = this.searchAndFilterWhereValues;
        } else if (whereClauses.preparedStatement) {
            // Default clauses used
            this.whereSql = ` ${this.whereSql ? "AND" : "WHERE"} ${whereClauses.preparedStatement}`;
            this.whereValues = whereClauses.values;
        }

        if (this.additionalWhereSql) {
            // Use any further provided where clauses
            this.whereSql = ` ${this.whereSql ? "AND" : "WHERE"} ${this.additionalWhereSql}`;
            this.whereValues = [...this.whereValues, ...this.additionalWhereValues];
        }

        console.log("this.whereSql", this.whereSql);

        console.log("orderByClause", orderByClause);
        if (!this.orderBySql) {
            // No overwritten order by clause = use default one
            this.orderBySql = ` ORDER BY ${orderByClause.field} ${orderByClause.isDescending ? "DESC" : "ASC"}`;
        }

        if (!this.dataSeriesFullSql) {
            // No custom full SQL override provided - built it up
            this.buildFinalDataSeriesSql();
        }

        console.log("this.dataSeriesFullSql", this.dataSeriesFullSql);
        const result = await this.dxInstance
            .getDataLayer()
            .getArrayFromDatabase(
                { sql: this.dataSeriesFullSql, nestTables: true },
                this.moduleName,
                this.dataSeriesValues,
                options?.transaction ?? null,
            );

        if (result === null) {
            this.populateError(this.dxInstance.getDataLayer().getLastError());
            return null;
        }

        // Replaces objects for undefined FK relationships with 'null'
        result.forEach((dataRow) => {
            Object.keys(dataRow).forEach((entityName) => {
                let areAllAttributesNull = true;
                Object.values(dataRow[entityName]).forEach((attributeValue) => {
                    areAllAttributesNull &&= attributeValue ? false : true;
                });

                dataRow[entityName] = areAllAttributesNull ? null : dataRow[entityName];
            });
        });

        return await this.getFinalResult(result);
    }

    buildFinalDataSeriesSql() {
        this.dataSeriesFullSql = `${this.dataSeriesSelectSql}
            FROM ${dxQ.getSqlReadyName(this.entityName)}
            ${this.joinSql} 
            ${this.whereSql}
            ${this.groupBySql} 
            ${this.havingSql} 
            ${this.orderBySql} 
            ${this.limitSql} 
            ${this.offsetSql}`;

        console.log(this.joinValues);
        console.log(this.whereValues);
        console.log(this.groupByValues);
        console.log(this.havingValues);
        console.log(this.orderByValues);
        this.dataSeriesValues = this.joinValues
            .concat(this.whereValues)
            .concat(this.groupByValues)
            .concat(this.havingValues)
            .concat(this.orderByValues);

        if (this.limitValue) {
            this.dataSeriesValues = this.dataSeriesValues.push(this.limitValue);
        }

        if (this.offsetValue) {
            this.dataSeriesValues = this.dataSeriesValues.push(this.offsetValue);
        }
    }

    buildFinalCountSql() {
        this.fullCountSql = `
        ${this.countSelectSql}
        FROM ${dxQ.getSqlReadyName(this.entityName)}
        ${this.joinSql}
        ${this.whereSql}
        ${this.groupBySql}
        ${this.havingSql}`;

        // console.log("this.countFullSql", this.countFullSql);
        this.countValues = this.joinValues
            .concat(this.whereValues)
            .concat(this.groupByValues)
            .concat(this.havingValues);

        // console.log("this.countValues", this.countValues);
    }
}

module.exports = DxBaseDataSeries;
