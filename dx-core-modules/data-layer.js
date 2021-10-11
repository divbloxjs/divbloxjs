const dxUtils = require("dx-utils");
const divbloxObjectBase = require('./object-base');
const dxDbSync = require('dx-db-sync');

/**
 * The DivbloxDataLayer is responsible for managing the interaction of logic of your app with the database, honouring
 * the provided data model
 */
class DivbloxDataLayer extends divbloxObjectBase {
    /**
     * Configures the various modules and entities that are available for database interaction
     * @param {*} databaseConnector An instance of DivbloxDatabaseConnector that facilitates communication with a database
     * @param {*} dataModel An object that represents the various entities and their attributes in the data structure
     */
    constructor(databaseConnector = null, dataModel = {}) {
        super();
        this.databaseConnector = databaseConnector;
        this.dataModel = dataModel;
        this.dataModelNormalized = {};
        this.dataModelEntities = [];

        for (const entityName of Object.keys(this.dataModel)) {
            this.dataModelNormalized[this.getSqlReadyName(entityName)] = this.dataModel[entityName];
            this.dataModelEntities.push(this.getSqlReadyName(entityName));
        }

        this.requiredEntities = ["auditLogEntry"];
        this.isRequiredEntitiesMissing = false;
    }

    /**
     * Validates the data model against what Divblox expects should be present at a minimum and then calls the functions
     * @param {*} dataModelState The data model state as received from the dxconfig.json file
     * that validates against what is actually in the database
     * @returns {Promise<boolean>}
     */
    async validateDataModel(dataModelState) {
        for (const entityName of this.requiredEntities) {
            if (this.dataModelEntities.indexOf(this.getSqlReadyName(entityName)) === -1) {
                this.populateError("Entity '"+entityName+"' not present");
                this.isRequiredEntitiesMissing = true;
            }
        }

        if (this.getError().length > 0) {
            this.populateError("Required entities are missing from data model",true);
            return false;
        }

        return await this.validateDataModelAgainstDatabase(dataModelState);
    }

    /**
     * Validates the data model against what is in the database to determine whether or not a synchronisation is required
     * @param {*} dataModelState The data model state as received from the dxconfig.json file
     * @returns {Promise<boolean>} Returns true if the current data model matches the one stored, false otherwise
     */
    async validateDataModelAgainstDatabase(dataModelState) {
        if (this.getDataModelHash() !== dataModelState.currentDataModelHash) {
            this.populateError("Data model has changes")
            return false;
        }
        return true;
    }

    /**
     * Returns a hash of the current data model that can be used to detect changes
     * @returns {string} The md5 hashed data model
     */
    getDataModelHash() {
        return require('crypto').createHash('md5').update(JSON.stringify(this.dataModel)).digest("hex");
    }

    /**
     * Synchronises the database to be inline with the data model
     * @returns {Promise<boolean>} Return false if synchronization failed, true otherwise
     */
    async syncDatabase() {
        const dbSync = new dxDbSync(this.dataModel, null, this.databaseConnector,"lowercase");
        return await dbSync.syncDatabase();
    }

    /**
     * Determines the module in which the provided entity resides
     * @param {string} entityName The name of the entity to get the module for
     * @returns {null|*}
     */
    getModuleNameFromEntityName(entityName = '') {
        if (typeof this.dataModelNormalized[this.getSqlReadyName(entityName)] === "undefined") {
            return null;
        }

        return this.dataModelNormalized[this.getSqlReadyName(entityName)]["module"];
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

        await this.addAuditLogEntry({
            "objectName": entityName,
            "modificationType":"create",
            "objectId":queryResult["insertId"],
            "entryDetail":JSON.stringify(data)});
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
     * Inserts a new auditLogEntry into the database
     * @param {string} entry.objectName The name of the entity that was affected
     * @param {string} entry.modificationType create|update|delete
     * @param {int} entry.objectId The database primary key id of the entity that was affected
     * @param {string} entry.entryDetail The details of the entry (What was changed)
     * @return {Promise<void>}
     */
    async addAuditLogEntry(entry = {}) {
        //TODO: This method must determine whether it can be called for the relevant entity or not

        entry["entryTimeStamp"] = new Date();
        entry["userIdentifier"] = ""; //TODO: We need to determine the user id somehow
        entry["apiKey"] = ""; //TODO: We need to determine the api key somehow

        const entryKeys = Object.keys(entry);
        let sqlKeys = '';
        let sqlPlaceholders = '';
        let sqlValues = [];

        for (const key of entryKeys) {
            sqlKeys += ", `"+this.getSqlReadyName(key)+"`";
            sqlPlaceholders += ", ?";
            sqlValues.push(this.getSqlReadyValue(entry[key]));
        }
        const query = "INSERT INTO `"+this.getSqlReadyName('auditLogEntry')+"` " +
            "(`id`"+sqlKeys+") VALUES (NULL"+sqlPlaceholders+");";

        const queryResult = await this.executeQuery(query,
            this.getModuleNameFromEntityName('auditLogEntry'),
            sqlValues);
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