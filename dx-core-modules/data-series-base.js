const DivbloxObjectBase = require("divbloxjs/dx-core-modules/object-base");
const dxQ = require("divbloxjs/dx-orm/query-model-base");
const dxUtils = require("dx-utilities");

/**
 * @typedef dataSeriesConfig
 * @property {string} [searchValue] Additional classes ot add to the action button
 * @property {number} [offset] Display label to be shown next to the action button
 * @property {number} [limit] Display label to be shown next to the action button
 * @property {Object.<string, ('asc'|'desc')>} [sort] Display label to be shown next to the action button
 * @property {Object.<string, ('like'|'eq'|'ne'|'gt'|'gte'|'lt'|'lte')>} [filter] Object of attribute keys to filter by, and what filter type to use
 */

/**
 * Base DxDataSeries class that handles building queries and handling results for
 * orderable, filterable, searchable and paginatable data series
 */
class DxBaseDataSeries extends DivbloxObjectBase {
    #DEFAULT_LIMIT = 10;
    #MAX_LIMIT = 100;
    #relationshipDepth = 5;
    #jointType = "LEFT";
    #ALLOWED_FILTER_TYPES = ["like", "eq", "ne", "gt", "gte", "lt", "lte"];
    #offset = -1;
    #limit = this.#DEFAULT_LIMIT;
    #sort = {};
    #filter = {};
    #searchValue = "";
    #configSuccessful = false;

    /**
     * @param {DivbloxBase} dxInstance
     * @param {dataSeriesConfig} dataSeriesConfig Standardised configuration object for building specific clauses
     * @param {Object.<string, any>} additionalParams Standardised configuration object to create
     * the dx ORM select statement for your query
     */
    constructor(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        super();

        this.#setClassVars(dxInstance, dataSeriesConfig, additionalParams);

        this.#setDefaultSql();
    }

    #setClassVars(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        this.dxInstance = dxInstance ?? null;
        this.moduleName = dataSeriesConfig?.moduleName ?? undefined;
        this.entityName = dataSeriesConfig?.entityName ?? undefined;
        this.entityNameSqlCase = dxQ.getSqlReadyName(this.entityName);

        this.includedAttributes = dataSeriesConfig?.includedAttributes ?? [];
        this.includedAttributes.forEach(includedAttribute => {
            return dxQ.getSqlReadyName(includedAttribute);
        });

        this.searchAttributes = dataSeriesConfig?.searchAttributes ?? [];
        this.searchAttributes.forEach(searchAttribute => {
            return dxQ.getSqlReadyName(searchAttribute);
        });

        // Used for any additional values needed in the query
        this.additionalParams = additionalParams;

        this.#relationshipDepth = dataSeriesConfig?.relationshipDepth ?? 3;
        console.log("this.#relationshipDepth", this.#relationshipDepth);
        this.#jointType = dataSeriesConfig?.joinType ?? "LEFT";

        // console.log("dataSeriesConfig", dataSeriesConfig);
        this.#searchValue = dataSeriesConfig?.searchValue ?? "";
        // console.log("this.#searchValue", this.#searchValue);

        if (dataSeriesConfig.hasOwnProperty("limit")) {
            this.#limit = parseInt(dataSeriesConfig.limit) < this.#MAX_LIMIT ? parseInt(dataSeriesConfig.limit) : this.#MAX_LIMIT;
        }

        if (dataSeriesConfig.hasOwnProperty("offset")) {
            this.#offset = parseInt(dataSeriesConfig.offset) ?? undefined;
        }

        if (dataSeriesConfig.hasOwnProperty("sort")) {
            this.#sort = dataSeriesConfig.sort ?? {};
        }

        if (dataSeriesConfig.hasOwnProperty("filter")) {
            this.#filter = dataSeriesConfig.filter ?? {};
        }

    }

    #validateConfig() {
        if (typeof this.#searchValue !== "string") {
            this.populateError("'searchValue' property should be of type string");
            return false;
        }

        if (!dxUtils.isNumeric(this.#limit)) {
            this.populateError("'limit' property should be numeric");
            return false;
        }

        if (!dxUtils.isNumeric(this.#offset)) {
            this.populateError("'offset' property should be numeric");
            return false;
        }

        if (!dxUtils.isValidObject(this.#sort)) {
            this.populateError("'sort' property provided is not a valid object");
            return false;
        }

        const allowedSortOptions = ["asc", "desc"];
        for (const sortAttributeName of Object.keys(this.#sort)) {
            if (!allowedSortOptions.includes(this.#sort[sortAttributeName])) {
                this.populateError(`Invalid 'sort' type provided for ${sortAttributeName}: ${this.#sort[sortAttributeName]}. Allowed options: ${allowedSortOptions.join(", ")}`);
                return false;
            }
        }

        if (!dxUtils.isValidObject(this.#filter)) {
            this.populateError("'filter' property provided is not a valid object");
            return false;
        } 

        for (const filterAttributeName of Object.keys(this.#filter)) {
            const filterTypeKeys = Object.keys(this.#filter[filterAttributeName]);
            const filterValues = Object.values(this.#filter[filterAttributeName]);
            for (const filterTypeKey of filterTypeKeys) {
                if (!this.#ALLOWED_FILTER_TYPES.includes(filterTypeKey)) {
                    this.populateError(`Invalid 'filter' type provided for ${filterAttributeName}: '${filterTypeKey}'. Allowed options: ${this.#ALLOWED_FILTER_TYPES.join(", ")}`);
                    return false;
                }
            }
            
            for (const filterValue of filterValues) {
                if (typeof filterValue !== "string") {
                    this.populateError(`Invalid 'filter' value provided for ${filterAttributeName}: ${filterValue}. Should be of type string`);
                    return false;
                }
            }
        }

        return true;
    }

    #setDefaultSql() {
        this.dataSeriesSelectSql = `SELECT *`;
        this.countSelectSql = `SELECT COUNT(*) AS COUNT`;
        if (this.includedAttributes.length > 0) {
            this.dataSeriesSelectSql = `SELECT ${this.includedAttributes.join(",")}`;
        }

        this.dataSeriesValues = [];
        this.countValues = [];

        //#region JOINs
        let defaultJoinSql = "";
        let relationshipDepthCount = {};

        const recursivelyAddRelationships = (entityName, recursionDepth = this.#relationshipDepth) => {
            const relationships = this.dxInstance.dataModelObj[entityName].relationships;

            if (Object.keys(relationships).length < 1) {
                return;
            }

            Object.keys(relationships).forEach((relatedEntityName, idx) => {
                const relationshipName = `${relatedEntityName}_${relationships[relatedEntityName][0]}`;
                if (typeof relationshipDepthCount[idx] === 'undefined') {
                    relationshipDepthCount[idx] = 1;
                }

                defaultJoinSql += `${this.#jointType} JOIN ${dxQ.getSqlReadyName(relatedEntityName)} ON ${dxQ.getSqlReadyName(entityName)}.${dxQ.getSqlReadyName(`${relationshipName}`)} = ${dxQ.getSqlReadyName(`${relatedEntityName}.id`)}\n`;
                if (Object.keys(this.dxInstance.dataModelObj[relatedEntityName].relationships).length > 0 &&
                    relationshipDepthCount[idx] < recursionDepth) {
                    relationshipDepthCount[idx]++;
                    recursivelyAddRelationships(relatedEntityName);
                }
            });
        };

        if (this.#relationshipDepth > 0) {
            recursivelyAddRelationships(this.entityName);
        }

        this.joinSql = defaultJoinSql;
        this.joinValues = [];
        //#endregion

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
        this.resetOffset(this.#offset);
        this.limitSql = `LIMIT ?`;
        this.limitValue = this.#limit;
    }

    //#region resetXyzSql() 
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
        this.limitValue = this.#limit;
    }

    /**
     *  Sets the offset value on the query
     * @param {number} offset Default value of -1 does not set an offset.
     */
    resetOffset(offset = -1) {
        this.offsetSql = ``;
        this.offsetValue = undefined;

        if (offset && offset > 0) {
            this.offsetSql = `OFFSET ?`;
            this.offsetValue = offset;
        }
    }
    //#endregion

    /**
     * Validates whether all necessary inputs were provided to the data series class before executing the query
     * @returns {boolean}
     */
    async #doValidation() {
        let isValid = true;
        if (!this.dxInstance) {
            this.populateError("Required attribute: 'dxInstance'");
            isValid &&= false;
        }

        if (!this.entityName) {
            this.populateError("Required attribute: 'entityName'");
            isValid &&= false;
        }

        if (!this.moduleName) {
            this.populateError("Required attribute: 'moduleName'");
            isValid &&= false;
        }

        isValid &&= this.#validateConfig();
        isValid &&= await this.doCustomValidation();

        return isValid;
    }

    async doCustomValidation() {
        // TODO Add custom-required validation
        return true;
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
        const orderColumnName = Object.keys(this.#sort)[0] ?? `${this.entityNameSqlCase}.id`;
        if (!orderColumnName) {
            return {};
        }

        let orderByClause = { field: orderColumnName, isDescending: false };

        // console.log("this.#sort", this.#sort);
        if (Object.keys(this.#sort).length > 0) {
            for (const [attributeToSortName, sortDirection] of Object.entries(this.#sort)) {
                orderByClause.field = dxQ.getSqlReadyName(attributeToSortName);
                orderByClause.isDescending = sortDirection === "desc";
            }
        }

        // console.log("orderByClause", orderByClause);
        return orderByClause;
    }

    async #appendFilterByClauses(whereClauses) {
        if (Object.keys(this.#filter).length < 1) {
            return whereClauses;
        }

        let filterByInfo = {};
        let hasFiltersDefined = false;
        for (const [attributeToFilterName, filterConfig] of Object.entries(this.#filter)) {
            if (Object.keys(filterConfig).length < 1) {
                continue;
            }
            
            filterByInfo[attributeToFilterName] = {};

            for (const [filterType, filterValue] of Object.entries(filterConfig)) {
                if (!this.#ALLOWED_FILTER_TYPES.includes(filterType.toString())) {
                    continue;
                }

                hasFiltersDefined = true;
                filterByInfo[attributeToFilterName][filterType] = {
                    sqlReadyName: dxQ.getSqlReadyName(attributeToFilterName),
                    value: filterValue,
                };
            }
        }

        if (hasFiltersDefined) {
            for (const [attributeToFilterName, filterOptions] of Object.entries(filterByInfo)) {
                for (const [filterType, { sqlReadyName, value }] of Object.entries(filterOptions)) {
                    let filterClause = null;
                    switch (filterType) {
                        case "like":
                            filterClause = dxQ.like(sqlReadyName, "%" + value + "%");
                            break;
                        case "eq":
                            filterClause = dxQ.equal(sqlReadyName, value);
                            break;
                        case "ne":
                            filterClause = dxQ.notEqual(sqlReadyName, value);
                            break;
                        case "gte":
                            filterClause = dxQ.greaterOrEqual(sqlReadyName, value);
                            break;
                        case "gt":
                            filterClause = dxQ.greaterThan(sqlReadyName, value);
                            break;
                        case "lte":
                            filterClause = dxQ.lessThanOrEqual(sqlReadyName, value);
                            break;
                        case "lt":
                            filterClause = dxQ.lessThan(sqlReadyName, value);
                            break;
                        default:
                            filterClause = this.checkCustomFilterCases(filterType, sqlReadyName, value);
                    }

                    whereClauses = dxQ.andCondition(whereClauses, filterClause);
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
        let whereClauses = {preparedStatement: "", values: []};

        if (!this.searchWhereSql) {
            // No search clause manually overridden - generate default one
            whereClauses = await this.#appendGlobalSearchClause(whereClauses);
        }

        if (!this.filterWhereSql) {
            // No filter clause manually overridden - generate default one
            whereClauses = await this.#appendFilterByClauses(whereClauses);
        }

        let orderByClause = { field: `${this.entityNameSqlCase}.id`, isDescending: false };
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
            this.searchAttributes.forEach(searchAttribute => {
                searchClauses.push(dxQ.like(`${searchAttribute}`, "%" + searchValue + "%"));
            });
            return dxQ.orCondition(...searchClauses);
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
        if (!await this.#doValidation()) return null;

        const { whereClauses } = await this.#getPrebuiltClauses();

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

        const result = await this.dxInstance.getDataLayer().executeQuery(
            { sql: this.fullCountSql, nestTables: false },
            this.moduleName, this.countValues, options?.transaction ?? null,
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
        if (!(await this.#doValidation())) return null;

        const { whereClauses, orderByClause } = await this.#getPrebuiltClauses();

        if (this.searchAndFilterWhereSql) {
            // Overloaded search and filter clauses provided
            this.whereSql = ` ${this.whereSql ? 'AND' : 'WHERE'} ${this.searchAndFilterWhereSql}`;
            this.whereValues = this.searchAndFilterWhereValues;
        } else if (whereClauses.preparedStatement) {
            // Default-built clauses used
            this.whereSql =  ` ${this.whereSql ? 'AND' : 'WHERE'} ${whereClauses.preparedStatement}`;
            this.whereValues = whereClauses.values;
        }

        this.setAdditionalWhereSql();
        if (this.additionalWhereSql) {
            // Use any further provided where clauses
            this.whereSql = ` ${this.whereSql ? 'AND' : 'WHERE'} ${this.additionalWhereSql}`;
            this.whereValues = [...this.whereValues, ...this.additionalWhereValues];
        }

        if (!this.orderBySql) {
            // No overwritten order by clause = use default one
            this.orderBySql = ` ORDER BY ${orderByClause.field} ${orderByClause.isDescending ? 'DESC' : 'ASC'}`;
        }

        if (!this.dataSeriesFullSql) {
            // No custom full SQL override provided - build it up
            this.buildFinalDataSeriesSql();
        }

        const result = await this.dxInstance.getDataLayer().getArrayFromDatabase(
            { sql: this.dataSeriesFullSql, nestTables: true },
            this.moduleName, this.dataSeriesValues, options?.transaction ?? null,
        );


        if (this.enableDebugMode || options.logQuery) {
            dxUtils.printSubHeadingMessage(`\n Debug output:`);
            dxUtils.printWarningMessage(`SQL prepared statement:`);
            dxUtils.printInfoMessage(`${this.dataSeriesFullSql}`);
            dxUtils.printWarningMessage(`SQL query values:`);
            dxUtils.printInfoMessage(`${JSON.stringify(this.dataSeriesValues)}`);

            // if (result === null) {
            //     this.dxInstance.getDataLayer().printLastError();
            // }
        }

        if (result === null) {
            this.populateError(this.dxInstance.getDataLayer().getLastError());
            return null;
        }

        // Replaces objects for undefined FK relationships with 'null'
        result.forEach(dataRow => {
            Object.keys(dataRow).forEach(entityName => {
                let areAllAttributesNull = true;
                Object.values(dataRow[entityName]).forEach(attributeValue => {
                    areAllAttributesNull &&= attributeValue ? false : true; 
                })

                dataRow[entityName] = areAllAttributesNull ? null : dataRow[entityName];
            });
        });

        let counter = 0;
        let finalResult = {};
        console.log("Start");

        let relationshipDepthCount = {};

        let initialResult = JSON.parse(JSON.stringify(result[0]));

        let ha = {
            id: 1,
            organisationName: "OrgName",
            parentOrganisation: {
                id: 1,
                grandParentOrganisation: {
                    id: 1,
                    grandGpo: { id: 1 }
                }
            },
            place : {
                id: 1,
                parentPlace: { id: 1 }
            }
        }

        // console.log("initialResult", initialResult);

        const recursivelyAddRelationships = (entityName, initialResult = {}, finalResult = {}, relationshipStack = [], recursionDepth = this.#relationshipDepth) => {
            console.log("---------------------------------------------");
            console.log("---------------------------------------------");
            const relationships = this.dxInstance.dataModelObj[entityName].relationships;
            
            console.log("relationships", Object.keys(relationships));
            if (Object.keys(relationships).length > 0) {
                Object.keys(relationships).forEach((relatedEntityName, idx) => {
                    console.log("BEGIN LOOP: ", relatedEntityName);
                    const relationshipName = `${relatedEntityName}${dxUtils.convertCamelCaseToPascalCase(relationships[relatedEntityName][0])}`;
                    if (typeof relationshipDepthCount[idx] === 'undefined') {
                        relationshipDepthCount[idx] = 1;
                        relationshipStack = [];

                        // finalResult[relatedEntityName] = initialResult[relatedEntityName];
                        // delete initialResult[relatedEntityName];
                    }

                    console.log("relationshipStack", relationshipStack);
                    console.log("relationshipName", relationshipName);
                    switch (relationshipStack.length) {
                        case 0:
                            // Base entity
                            console.log("case0: ", relationshipStack);
                            if (initialResult[entityName]) {
                                Object.keys(initialResult[entityName]).forEach(attributeName => {
                                    finalResult[attributeName] = initialResult[entityName][attributeName];
                                })
                                delete finalResult[relationshipName];
                                delete initialResult[entityName];
                            }
                            break;
                        case 1: 
                            // Direct foreign key relationships
                            console.log("case1: ", relationshipStack[0]);
                            delete initialResult[relationshipStack[0]][relationshipName];
                            finalResult[relationshipStack[0]] = initialResult[relationshipStack[0]];
                            delete initialResult[relationshipStack[0]];
                            break;
                        case 2: 
                            console.log("case2: ", relationshipStack[0], relationshipStack[1]);
                            delete initialResult[relationshipStack[1]][relationshipName];
                            finalResult[relationshipStack[0]][relationshipStack[1]] = initialResult[relationshipStack[1]];
                            delete initialResult[relationshipStack[1]];
                            break;
                        case 3: 
                            console.log("case3: ", relationshipStack[0], relationshipStack[1], relationshipStack[2]);
                            delete initialResult[relationshipStack[2]][relationshipName];
                            finalResult[relationshipStack[0]][relationshipStack[1]][relationshipStack[2]] = initialResult[relationshipStack[2]];
                            delete initialResult[relationshipStack[2]];
                            break;
                        case 4: 
                            console.log("case4: ", relationshipStack[0], relationshipStack[1], relationshipStack[2], relationshipStack[3]);
                            delete initialResult[relationshipStack[3]][relationshipName];
                            finalResult[relationshipStack[0]][relationshipStack[1]][relationshipStack[2]][relationshipStack[3]] = initialResult[relationshipStack[3]];
                            delete initialResult[relationshipStack[3]];
                            break;
                    }
                    console.log("Finalised initial: ", initialResult);
                    console.log("Finalised final: ", finalResult);
    
                    console.log("NEW relationships", Object.keys(this.dxInstance.dataModelObj[relatedEntityName].relationships));
                    console.log("relationshipDepthCount[idx]", relationshipDepthCount[idx]);
                    if (Object.keys(this.dxInstance.dataModelObj[relatedEntityName].relationships).length > 0 &&
                        relationshipDepthCount[idx] < recursionDepth) {
                        relationshipStack.push(relatedEntityName);
                        relationshipDepthCount[idx]++;
                        console.log("recursing: ", relationshipStack);
                        recursivelyAddRelationships(relatedEntityName, initialResult, finalResult, relationshipStack);
                    } else {
                        console.log("END OF THE ROAD");
                    }

                });
            }
        };

        const getNestedValue = (obj, keys = []) => {
            let value = obj;
            for (let i = 0; i < keys.length; i++) {
                value = value[keys[i]];
                if (!value) {
                    break;
                }
            }

            return value;
        };

        recursivelyAddRelationships(this.entityName, initialResult, finalResult)
 
        console.log("finalResult", finalResult);
        // console.log("finalResult", finalResult);
        console.log("End");

        return await this.getFinalResult([finalResult]);
    }


    recursivelyAppendRelationshipsAsObjects(data, baseName = "", result = {}, counter) {
        console.log("counter-------------------------", counter);
        if (counter > 3) {
            return;
        }

        counter++;
        Object.keys(data).forEach(entityName => {

            // console.log("entityName", entityName);
            if (entityName === baseName) {
                console.log("MATCHED BASE", entityName);
                Object.keys(data[baseName]).forEach(attributeName => {
                    result[attributeName] = data[baseName][attributeName];
                })

                delete data[baseName];
                console.log("result", result);
                console.log("data", data);
                console.log("-------------");
                console.log("-------------");
                console.log("-------------");
                console.log("-------------");
                console.log("-------------");
                console.log("-------------");
                return;
            }
            
            Object.keys(result).forEach(attributeName => {
                // console.log("attributeName", attributeName);
                // console.log("entityName", entityName);
                if (attributeName.includes(entityName)) {
                    console.log("MATCHED OTHER ROOT", entityName);
                    result[entityName] = data[entityName];
                    result[attributeName] = data[entityName]?.id;
    
                    delete data[entityName];
                    console.log("result", result);
                    console.log("data", data);
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                }
            })

            if (dxUtils.isValidObject(data[entityName])) {
                this.recursivelyAppendRelationshipsAsObjects(data[entityName], baseName, result, counter)
                return;
            }
        })

        if (Object.keys(data).length > 0) {
            console.log("Recursively called", Object.keys(data));
            console.log("RESULT", result);
            this.recursivelyAppendRelationshipsAsObjects(data, baseName, result, counter);
        }
    }

    buildFinalDataSeriesSql() {
        this.dataSeriesFullSql = ``;
        this.dataSeriesFullSql += this.dataSeriesSelectSql;
        this.dataSeriesFullSql += `\nFROM ${this.entityNameSqlCase}`;
        this.dataSeriesFullSql += this.joinSql ? `\n${this.joinSql}` : ``;
        this.dataSeriesFullSql += this.whereSql ? `\n${this.whereSql}` : ``;
        this.dataSeriesFullSql += this.groupBySql ? `\n${this.groupBySql}` : ``;
        this.dataSeriesFullSql += this.havingSql ? `\n${this.havingSql}` : ``;
        this.dataSeriesFullSql += this.orderBySql ? `\n${this.orderBySql}` : ``;
        this.dataSeriesFullSql += this.limitSql ? `\n${this.limitSql}` : ``;
        this.dataSeriesFullSql += this.offsetSql ? `\n${this.offsetSql}` : ``;

        this.dataSeriesValues = this.joinValues
        .concat(this.whereValues)
        .concat(this.groupByValues)
        .concat(this.havingValues)
        .concat(this.orderByValues);

        if (this.limitValue) {
            this.dataSeriesValues.push(this.limitValue);
        }

        if (this.offsetValue) {
            this.dataSeriesValues.push(this.offsetValue);
        }
    }

    buildFinalCountSql() {
        this.fullCountSql = ``;
        this.fullCountSql += this.countSelectSql;
        this.fullCountSql += `\nFROM ${this.entityNameSqlCase}`;
        this.fullCountSql += this.joinSql ? `\n${this.joinSql}` : ``;
        this.fullCountSql += this.whereSql ? `\n${this.whereSql}` : ``;
        this.fullCountSql += this.groupBySql ? `\n${this.groupBySql}` : ``;
        this.fullCountSql += this.havingSql ? `\n${this.havingSql}` : ``;

        this.countValues = this.joinValues
        .concat(this.whereValues)
        .concat(this.groupByValues)
        .concat(this.havingValues);
    }
}

module.exports = DxBaseDataSeries;
