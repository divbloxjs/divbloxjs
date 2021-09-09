const dxUtils = require("dx-utils");
const DivbloxObjectBase = require('./object-base');

/**
 * The DivbloxDataLayer is responsible for managing the interaction of logic of your app with the database, honouring
 * the provided data model
 */
class DivbloxDataLayer extends DivbloxObjectBase {
    /**
     * Configures the various modules and entities that are available for database interaction
     * @param {*} databaseConnector An instance of DivbloxDatabaseConnector that facilitates communication with a database
     * @param {*} dataModel An object that represents the various entities and their attributes in the data structure
     */
    constructor(databaseConnector = null, dataModel = {}) {
        super();
        this.databaseConnector = databaseConnector;
        this.dataModel = dataModel;
        this.moduleArray = {};
        this.dataModelEntities = [];
        this.entityArray = {};

        for (const moduleObj of this.dataModel["modules"]) {
            this.moduleArray[moduleObj["moduleName"]] = moduleObj["entities"];
            for (const entityName of Object.keys(moduleObj["entities"])) {
                this.entityArray[this.getSqlReadyName(entityName)] = moduleObj["moduleName"];
                this.dataModelEntities.push(this.getSqlReadyName(entityName));
            }
        }
        //TODO: Complete this array
        this.requiredEntities = ["account"];
    }

    /**
     * Validates the data model against what Divblox expects should be present at a minimum and then calls the functions
     * that validates against what is actually in the database
     * @returns {Promise<boolean>}
     */
    async validateDataModel() {
        for (const entityName of this.requiredEntities) {
            if (this.dataModelEntities.indexOf(this.getSqlReadyName(entityName)) === -1) {
                this.populateError("Entity '"+entityName+"' not present")
            }
        }

        if (this.getError().length > 0) {
            this.populateError("Required entities are missing",true);
            return false;
        }

        return await this.validateDataModelAgainstDatabase();
    }

    /**
     * Validates the data model against what is in the database to determine whether or not a synchronisation is required
     * @returns {Promise<boolean>}
     */
    async validateDataModelAgainstDatabase() {
        return true;
        return false;//TODO: Implement this function. It should return false if sync failed
    }

    /**
     * Synchronises the database to be inline with the data model
     * @returns {Promise<boolean>}
     */
    async syncDatabase() {
        return true;
        return false;//TODO: Implement this function. It should return false if sync failed
    }

    /**
     * Determines the module in which the provided entity resides
     * @param {string} entityName The name of the entity to get the module for
     * @returns {null|*}
     */
    getModuleNameFromEntityName(entityName = '') {
        if (typeof this.entityArray[this.getSqlReadyName(entityName)] === "undefined") {
            return null;
        }

        return this.entityArray[this.getSqlReadyName(entityName)];
    }

    /**
     * Responsible for performing an insert query on the database for the relevant entity
     * @param {string} entityName The entity to create (Name of the row to perform an insert for)
     * @param {*} data An object who's properties determines the fields to set values for when inserting
     * @returns {Promise<number|*>} Returns the primary key id of the inserted item or -1
     */
    async create(entityName = '',data = {}) {
        if (!this.doPreDatabaseInteractionCheck(entityName)) {return -1;}

        const dataKeys = Object.keys(data);
        let sqlKeys = '';
        let sqlPlaceholders = '';
        let sqlValues = [];

        for (const key of dataKeys) {
            sqlKeys += ", `"+this.getSqlReadyName(key)+"`";
            sqlPlaceholders += ", ?";
            sqlValues.push(this.getSqlReadyValue(data[key]));
        }

        const query = "INSERT INTO `"+this.getSqlReadyName(entityName)+"` " +
            "(`id`"+sqlKeys+") VALUES (NULL"+sqlPlaceholders+");";

        const queryResult = await this.executeQuery(query,
            this.getModuleNameFromEntityName(entityName),
            sqlValues);

        if (queryResult === null) {
            return -1;
        }

        return queryResult["insertId"];
    }

    /**
     * Loads the data for a specific entity from the database
     * @param {string} entityName The entity type to load for (The table to perform a select query on)
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<null|*>} An object with the entity's data represented or NULL
     */
    async read(entityName = '',id = -1) {
        if (!this.doPreDatabaseInteractionCheck(entityName)) {return null;}

        const query = "SELECT * FROM `"+this.getSqlReadyName(entityName)+"` " +
            "WHERE `id` = ? LIMIT 1;";
        const sqlValues = [id];

        const queryResult = await this.executeQuery(query,
            this.getModuleNameFromEntityName(entityName),
            sqlValues);

        if (queryResult === null) {
            return null;
        }

        return this.transformSqlObjectToJs(queryResult[0]);
    }

    /**
     * Performs an update query on the database for the relevant entity
     * @param {string} entityName The entity type to perform the update for (The table to perform a update query on)
     * @param {*} data The primary key id of the relevant row
     * @returns {Promise<boolean>} Returns true if the update was successful, false otherwise
     */
    async update(entityName = '',data = {}) {

        if (!this.doPreDatabaseInteractionCheck(entityName)) {return false;}

        if (typeof data["id"] === "undefined") {
            this.populateError("No id provided");
            return false;
        }

        const dataKeys = Object.keys(data);
        let sqlUpdateKeys = '';
        let sqlUpdateValues = [];

        for (const key of dataKeys) {
            if (key === 'id') {
                continue;
            }
            sqlUpdateKeys += ", `"+this.getSqlReadyName(key,"")+"` = ?";
            sqlUpdateValues.push(this.getSqlReadyValue(data[key]));
        }

        sqlUpdateValues.push(this.getSqlReadyValue(data["id"]));
        sqlUpdateKeys = sqlUpdateKeys.substring(1,sqlUpdateKeys.length);

        const query = "UPDATE `"+this.getSqlReadyName(entityName)+"` " +
            "SET "+sqlUpdateKeys+" WHERE " +
            "`"+this.getSqlReadyName(entityName)+"`.`id` = ?";

        const queryResult = await this.executeQuery(query,
            this.getModuleNameFromEntityName(entityName),
            sqlUpdateValues);

        return queryResult !== null;
    }

    /**
     * Removes a specific entity from the database
     * @param {string} entityName The entity type to remove (The table to perform a delete query on)
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<boolean>} Returns true if the delete was successful, false otherwise
     */
    async delete(entityName = '',id = -1) {
        if (!this.doPreDatabaseInteractionCheck(entityName)) {return false;}

        const query = "DELETE FROM `"+this.getSqlReadyName(entityName)+"` " +
            "WHERE `id` = ?;";

        const sqlValues = [id];

        const queryResult = await this.executeQuery(query,
            this.getModuleNameFromEntityName(entityName),
            sqlValues);

        return queryResult !== null;
    }

    /**
     * Performs a specified query on the relevant database, based on the provide module name
     * @param {string} query The query to be performed
     * @param {string} moduleName The name of the module that determines the database where the query needs to be performed
     * @param {[]} values Any values to insert into placeholders in sql. If not provided, it is assumed that the query
     * can execute as is
     * @returns {Promise<*|null>} Returns the database query result if successful, or NULL if not
     */
    async executeQuery(query, moduleName, values) {
        if (typeof query === undefined) {
            this.populateError("No query provided");
            return null;
        }

        const queryResult = await this.databaseConnector.queryDB(query, moduleName, values);

        if (queryResult === null) {
            this.populateError(this.databaseConnector.getError(), false, true);
            return null;
        }

        if (typeof queryResult["error"] !== "undefined") {
            this.populateError(queryResult["error"]);
            return null;
        }

        if ((typeof queryResult["affectedRows"] !== "undefined") &&
            (queryResult["affectedRows"] < 1)) {
            this.populateError("No rows were affected");
            return null;
        }

        return queryResult;
    }

    /**
     * Checks whether the given entityName exists in the data model and populates the errorInfo array if not.
     * @param {string} entityName The name of the entity to check for
     * @returns {boolean} Returns false if the entity is not defined in the data model
     */
    doPreDatabaseInteractionCheck(entityName = '') {
        if (!this.checkEntityExistsInDataModel(this.getSqlReadyName(entityName))) {
            this.populateError("Entity '"+entityName+"' does not exist");
            return false;
        }

        return true;
    }

    /**
     * Validates whether the provided entity is defined in the data model
     * @param {string} entityName The name of the entity to validate
     * @returns {boolean} true if the validation passed, false if not
     */
    checkEntityExistsInDataModel(entityName = '') {
        return this.dataModelEntities.indexOf(this.getSqlReadyName(entityName)) !== -1;
    }

    /**
     * Converts the given name, which can be either a class name or a variable or property name in either pascal or
     * camel case, to a lowercase string, separated by underscores
     * @param {string} name
     * @returns {string}
     */
    getSqlReadyName(name = '') {
        return dxUtils.getCamelCaseSplittedToLowerCase(name,"_");
    }

    /**
     * Escapes foreign characters as preparation to store them in a sql database
     * @param {string} value The string to prepare to store in a sql database
     * @returns {string} The sql-ready string
     */
    getSqlReadyValue(value = '') {
        //TODO: Implement this. For now, we simply return the given string
        return value;
    }

    /**
     * Sql column and table names should be lower case, separated with underscores. This function converts those table
     * and/or column names to either PascalCase or camelCase, depending on the value of isTableName. Table names get
     * converted to Pascal case, while column names get converted to camelCase
     * @param {string} name The name of the database table or column to convert
     * @param {boolean} isTableName Whether this name is a table name. If not, it is assumed to be a column name
     * @returns {string} The, either Pascal- or camelCase, string
     */
    convertSqlNameToProperty(name = '',isTableName = false) {
        return isTableName === true ?
        dxUtils.convertLowerCaseToPascalCase(name,"_") :
        dxUtils.convertLowerCaseToCamelCase(name,"_");
    }

    /**
     * Converts an object that is returned from a sql query to the correct case for the Divblox Data layer to understand
     * @param sqlObject The object to convert
     * @return {{}} The resulting object with the correct case for its properties
     */
    transformSqlObjectToJs(sqlObject = {}) {
        let returnObject = {};

        for (const key of Object.keys(sqlObject)) {
            returnObject[this.convertSqlNameToProperty(key,false)] = sqlObject[key];
        }

        return returnObject;
    }
}
module.exports = DivbloxDataLayer;