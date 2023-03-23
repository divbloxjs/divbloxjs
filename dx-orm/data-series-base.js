const DivbloxObjectBase = require("../dx-core-modules/object-base");
const dxQ = require("divbloxjs/dx-orm/query-model-base");

/**
 * @typedef dataSeriesConfig
 * @property {string} [searchValue] Additional classes ot add to the action button
 * @property {number} [offset] Display label to be shown next to the action button
 * @property {number} [limit] Display label to be shown next to the action button
 * @property {{string, columnConfig}} columns Display label to be shown next to the action button
 */

/**
 * @typedef columnConfig
 * @property {boolean} isSortAscending
 * @property {boolean} sortBy
 * @property {{filterText|filterNumber|filterDropdown|fromDate|toDate: string}} filterBy
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
    /**
     * @param {dataSeriesConfig} dataSeriesConfig Standardised configuration object for building specific clauses
     * @param {queryBuilderConfig} queryBuilderConfig Standardised configuration object to create
     * the dx ORM select statement for your query
     */
    constructor(dataSeriesConfig = {}, queryBuilderConfig = {}) {
        super();
        /**
         * @type {dataSeriesConfig}
         */
        this.dataSeriesConfig = dataSeriesConfig;
        /**
         * @type {queryBuilderConfig}
         */
        this.queryBuilderConfig = queryBuilderConfig;

        this.dxInstance = queryBuilderConfig.dxInstance ?? null;
        this.baseEntityObject = queryBuilderConfig.baseEntityObject ?? null;

        this.setFields(queryBuilderConfig.fields);
        this.setLinkedEntities(queryBuilderConfig.linkedEntities);

        delete queryBuilderConfig.fields;
        delete queryBuilderConfig.linkedEntities;
        delete queryBuilderConfig.baseEntityObject;

        this.additionalConfig = queryBuilderConfig;

        this.sqlReadyNameMap = {};
        this.setSqlReadyNameMap(dataSeriesConfig);

        this.DEFAULT_LIMIT_SIZE = 50;
    }

    /**
     * Sets the fields that will be queried by the findArray() ORM function
     * @param {[]} fields Array of attributes to select from the base entity
     */
    async setFields(fields) {
        this.fields = fields ?? [];
    }

    /**
     * Sets the array of configuration objects to build SQL JOINs with
     * @param {[]} linkedEntities Array of objects to build JOINs with
     */
    async setLinkedEntities(linkedEntities) {
        this.linkedEntities = linkedEntities ?? [];
    }

    /**
     * Validates whether all necessary inputs were provided to the data series class before executing the query
     * @returns {boolean}
     */
    doValidation() {
        if (!this.fields || !this.linkedEntities || !this.baseEntityObject) {
            this.populateError(
                "Required attributes not provided: Needed attributes on the 'queryBuilderConfig' object - fields, linkedEntities, baseEntityObject, dxInstance"
            );
            return false;
        }

        if (!this.dxInstance) {
            this.populateError(
                "Required attribute 'dxInstance' not provided: Needed attributes on the 'queryBuilderConfig' object - fields, linkedEntities, baseEntityObject, dxInstance"
            );
            return false;
        }

        return true;
        // TODO Further improve validation of the dataSeriesConfig
    }

    /**
     * Allows the dev to map frontend column names to valid DB references
     * e.g. myUniqueName -> table_name.attribute_name
     * @param {Promise<{}>} dataSeriesConfig Standardised configuration object for building specific clauses
     */
    async setSqlReadyNameMap(dataSeriesConfig) {
        Object.keys(dataSeriesConfig.columns).forEach((attributeName) => {
            this.sqlReadyNameMap[attributeName] = attributeName;
            // TODO Overwrite to map to correct SQL-ready name
            // databaseNameMap[attributeName] = EntityName.attributeName;
        });
    }

    async #appendGlobalSearchClause(whereClauses, dataSeriesConfig) {
        if (dataSeriesConfig.hasOwnProperty("searchValue") && dataSeriesConfig.searchValue !== "") {
            whereClauses = dxQ.andCondition(whereClauses, await this.getSearchClauses(dataSeriesConfig.searchValue));
        }

        return whereClauses;
    }

    async #getOrderByClauses(dataSeriesConfig) {
        // Defaults to the first provided attribute in descending order
        let orderByClause = { field: Object.keys(dataSeriesConfig.columns)[0], isDescending: true };

        if (dataSeriesConfig.hasOwnProperty("columns") && Object.keys(dataSeriesConfig.columns).length > 0) {
            for (const [attributeName, attributeSettings] of Object.entries(dataSeriesConfig.columns)) {
                if (attributeSettings.sortBy === true) {
                    orderByClause.field = this.sqlReadyNameMap[attributeName]
                        ? this.sqlReadyNameMap[attributeName]
                        : attributeName;
                    orderByClause.isDescending = !attributeSettings.isSortAscending;
                }
            }
        }

        return orderByClause;
    }

    async #appendFilterByClauses(whereClauses, dataSeriesConfig) {
        if (dataSeriesConfig.hasOwnProperty("columns") && Object.keys(dataSeriesConfig.columns).length > 0) {
            let filterByInfo = {};
            let hasFiltersDefined = false;
            for (const [attributeName, attributeSettings] of Object.entries(dataSeriesConfig.columns)) {
                if (Object.keys(attributeSettings.filterBy).length > 0) {
                    filterByInfo[attributeName] = {};

                    for (const [filterType, filterValue] of Object.entries(attributeSettings.filterBy)) {
                        if (filterValue.toString().length < 1) {
                            continue;
                        }

                        hasFiltersDefined = true;
                        filterByInfo[attributeName][filterType] = {
                            sqlReadyName: this.sqlReadyNameMap[attributeName],
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
     * @param {{}} dataSeriesConfig Standardised configuration object
     * @returns {Promise<{whereClauses: []|null, orderByClause: {}}>} the populated where and order by clauses
     */
    async getPrebuiltClauses(dataSeriesConfig) {
        let whereClauses = dxQ.all();

        whereClauses = await this.#appendGlobalSearchClause(whereClauses, dataSeriesConfig);
        whereClauses = await this.#appendFilterByClauses(whereClauses, dataSeriesConfig);

        let orderByClause = await this.#getOrderByClauses(dataSeriesConfig);

        return {
            whereClauses: whereClauses,
            orderByClause: orderByClause,
        };
    }

    /**
     * Allows the dev to configure which attributes the global search should look through and with what comparison
     * @param {string} searchValue The search value provided
     * @returns {Promise<{field: string, value: string}[]|null>} The dx clause object/s or null if none
     */
    async getSearchClauses(searchValue) {
        // TODO Overwrite to include whichever attributes are needed
        return dxQ.like(Object.keys(this.sqlReadyNameMap)[0], "%" + searchValue + "%");
    }

    /**
     * Extendable function to append additional order by clauses if needed above and beyond the dataSeriesConfig one.
     * @param {{}} orderByClause The order by clause object created by dataSeriesConfig specification
     * @returns {Promise<[]>} Array of order by clause objects
     */
    async getAllOrderByClauses(orderByClause) {
        let orderByClauses = [orderByClause];
        // TODO Add own or overwrite where clauses
        return orderByClauses;
    }

    /**
     * Adds additional where clauses that may be required
     * @returns {Promise<{}>} A dxQ clause object
     */
    async getAdditionalWhereClauses() {
        return null;
    }

    /**
     * Returns the final return array of the data series query
     * @param {{}} options findArray() options
     * @returns {Promise<[]|null>} The final return array, or null if error occurred
     */
    async getDataSeries(options = {}) {
        if (!this.doValidation()) {
            return null;
        }

        const { whereClauses, orderByClause } = await this.getPrebuiltClauses(this.dataSeriesConfig);
        const findArrayResult = await this.baseEntityObject.findArray(
            {
                fields: this.fields,
                linkedEntities: this.linkedEntities,
                ...options,
            },
            dxQ.andCondition(whereClauses, await this.getAdditionalWhereClauses()),
            dxQ.orderBy(await this.getAllOrderByClauses(orderByClause)),
            dxQ.limit(this.dataSeriesConfig.limit ?? this.DEFAULT_LIMIT_SIZE),
            dxQ.offset(this.dataSeriesConfig.offset ?? -1),
            await this.getGroupByClause()
        );

        if (findArrayResult === null) {
            this.baseEntityObject.printLastError();
            this.populateError(this.baseEntityObject.getLastError());
            return null;
        }

        return await this.getFinalResult(findArrayResult);
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
        if (!this.doValidation()) {
            return null;
        }

        const { whereClauses } = await this.getPrebuiltClauses(this.dataSeriesConfig);
        const findCountResult = await this.baseEntityObject.findCount(
            {
                fields: this.fields,
                linkedEntities: this.linkedEntities,
                ...options,
            },
            dxQ.andCondition(whereClauses, await this.getAdditionalWhereClauses())
        );

        if (findCountResult === null) {
            this.baseEntityObject.printLastError();
            this.populateError(this.baseEntityObject.getLastError());
            return null;
        }

        return findCountResult;
    }
}

module.exports = DxBaseDataSeries;
