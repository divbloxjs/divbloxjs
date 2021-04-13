/**
 * The DivbloxDataLayer is responsible for managing the interaction of logic of your app with the database, honouring
 * the provided data model
 */
class DivbloxDataLayer {
    /**
     * Configures the various modules and entities that are available for database interaction
     * @param database_connector An instance of DivbloxDatabaseConnector that facilitates communication with a database
     * @param data_model An object that represents the various entities and their attributes in the data structure
     */
    constructor(database_connector = null,data_model = {}) {
        this.database_connector = database_connector;
        this.error_info = [];
        this.data_model = data_model;
        this.module_array = {};
        this.data_model_entities = [];
        this.entity_array = {};
        for (const module_obj of this.data_model["modules"]) {
            this.module_array[module_obj["module_name"]] = module_obj["entities"];
            for (const entity_name_str of Object.keys(module_obj["entities"])) {
                this.entity_array[this.getCamelCaseSplittedToLowerCase(entity_name_str)] = module_obj["module_name"];
                this.data_model_entities.push(this.getCamelCaseSplittedToLowerCase(entity_name_str));
            }
        }
        this.required_entities = ["account"];
    }

    /**
     * Whenever Divblox encounters an error, the error_info array is populated with details about the error. This
     * function simply returns that error_info array for debugging purposes
     * @returns {[]}
     */
    getError() {
        return this.error_info;
    }

    /**
     * Validates the data model against what Divblox expects should be present at a minimum and then calls the functions
     * that validates against what is actually in the database
     * @returns {Promise<boolean>}
     */
    async validateDataModel() {
        for (const entity_name_str of this.required_entities) {
            if (this.data_model_entities.indexOf(entity_name_str) === -1) {
                this.error_info.push("Entity '"+entity_name_str+"' not present");
            }
        }
        if (this.error_info.length > 0) {
            this.error_info.unshift("Required entities are missing");
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
     * @param entity_name_str The name of the entity to get the module for
     * @returns {null|*}
     */
    getModuleNameFromEntityName(entity_name_str = '') {
        if (typeof this.entity_array[this.getCamelCaseSplittedToLowerCase(entity_name_str)] === "undefined") {
            return null;
        }
        return this.entity_array[this.getCamelCaseSplittedToLowerCase(entity_name_str)];
    }

    /**
     * Responsible for performing an insert query on the database for the relevant entity
     * @param entity_name_str The entity to create (Name of the row to perform an insert for)
     * @param data An object who's properties deterimines the fields to set values for when inserting
     * @returns {Promise<number|*>} Returns the primary key id of the inserted item or -1
     */
    async create(entity_name_str = '',data = {}) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name_str))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name_str)+" does not exist");
            return -1;
        }
        const data_keys = Object.keys(data);
        let keys_str = '';
        let values_str = '';
        for (const key of data_keys) {
            keys_str += ", `"+this.getCamelCaseSplittedToLowerCase(key)+"`";
            values_str += ", '"+data[key]+"'";
        }
        const query_str = "INSERT INTO `"+this.getCamelCaseSplittedToLowerCase(entity_name_str)+"` " +
            "(`id`"+keys_str+") VALUES (NULL"+values_str+");";
        const query_result = await this.executeQuery(query_str, this.getModuleNameFromEntityName(entity_name_str));
        if (query_result === null) {
            return -1;
        }
        return query_result["insertId"];
    }

    /**
     * Loads the data for a specific entity from the database
     * @param entity_name_str The entity type to load for (The table to perform a select query on)
     * @param id The primary key id of the relevant row
     * @returns {Promise<null|*>} An object with the entity's data represented or NULL
     */
    async read(entity_name_str = '',id = -1) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name_str))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name_str)+" does not exist");
            return null;
        }
        const query_str = "SELECT * FROM `"+this.getCamelCaseSplittedToLowerCase(entity_name_str)+"` " +
            "WHERE `id` = '"+id+"' LIMIT 1;";
        const query_result = await this.executeQuery(query_str, this.getModuleNameFromEntityName(entity_name_str));
        if (query_result === null) {
            return null;
        }
        return query_result[0];
    }

    /**
     * Performs an update query on the database for the relevant entity
     * @param entity_name_str The entity type to perform the update for (The table to perform a update query on)
     * @param data The primary key id of the relevant row
     * @returns {Promise<boolean>} Returns true if the update was successful, false otherwise
     */
    async update(entity_name_str = '',data = {}) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name_str))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name_str)+" does not exist");
            return false;
        }
        if (typeof data["id"] === "undefined") {
            this.error_info.push("No id provided");
            return false;
        }
        const data_keys = Object.keys(data);
        let update_str = '';
        for (const key of data_keys) {
            if (key === 'id') {
                continue;
            }
            update_str += ", `"+this.getCamelCaseSplittedToLowerCase(key)+"` = '"+data[key]+"'";
        }
        update_str = update_str.substring(1,update_str.length);
        const query_str = "UPDATE `"+this.getCamelCaseSplittedToLowerCase(entity_name_str)+"` " +
            "SET "+update_str+" WHERE " +
            "`"+this.getCamelCaseSplittedToLowerCase(entity_name_str)+"`.`id` = "+data["id"];
        const query_result = await this.executeQuery(query_str, this.getModuleNameFromEntityName(entity_name_str));
        return query_result !== null;
    }

    /**
     * Removes a specific entity from the database
     * @param entity_name_str The entity type to remove (The table to perform a delete query on)
     * @param id The primary key id of the relevant row
     * @returns {Promise<boolean>} Returns true if the delete was successful, false otherwise
     */
    async delete(entity_name_str = '',id = -1) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name_str))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name_str)+" does not exist");
            return false;
        }
        const query_str = "DELETE FROM `"+this.getCamelCaseSplittedToLowerCase(entity_name_str)+"` " +
            "WHERE `id` = '"+id+"';";
        const query_result = await this.executeQuery(query_str, this.getModuleNameFromEntityName(entity_name_str));
        return query_result !== null;
    }

    /**
     * Performs a specified query on the relevant database, based on the provide module name
     * @param query_str The query to be performed
     * @param module_name_str The name of the module that determines the database where the query needs to be performed
     * @returns {Promise<*|null>} Returns the database query result if successful, or NULL if not
     */
    async executeQuery(query_str = null, module_name_str = null) {
        if (query_str === null) {
            this.error_info.push("No query provided");
            return null;
        }
        const query_result = await this.database_connector.queryDB(query_str,module_name_str);
        if (query_result === null) {
            this.error_info = this.database_connector.getError();
            return null;
        }
        if (typeof query_result["error"] !== "undefined") {
            this.error_info.push(query_result["error"]);
            return null;
        }
        if ((typeof query_result["affectedRows"] !== "undefined") &&
            (query_result["affectedRows"] < 1)) {
            this.error_info.push("No rows were affected");
            return null;
        }
        return query_result;
    }

    /**
     * Validates whether the provided entity is defined in the data model
     * @param entity_name_str The name of the entity to validate
     * @returns {boolean} true if the validation passed, false if not
     */
    checkEntityExistsInDataModel(entity_name_str = '') {
        return this.data_model_entities.indexOf(this.getCamelCaseSplittedToLowerCase(entity_name_str)) !== -1;
    }

    /**
     * Splits a camel case string into a lower case string, separated with underscores "_"
     * @param camel_case_str The string to split
     * @returns {string} The splitted string in lower case
     */
    getCamelCaseSplittedToLowerCase(camel_case_str = '') {
        return camel_case_str.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();
    }
}
module.exports = DivbloxDataLayer;