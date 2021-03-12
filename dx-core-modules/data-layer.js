class DivbloxDataLayer {
    constructor(database_connector = null,data_model = {}) {
        this.database_connector = database_connector;
        this.error_info = [];
        this.data_model = data_model;
        this.data_model_entities = Object.keys(this.data_model);
        this.required_entities = ["account"];
        if (!this.validateDataModel()) {
            throw new Error("Error validating data model: "+JSON.stringify(this.error_info));
        }
    }
    getError() {
        return this.error_info;
    }
    validateDataModel() {
        for (const entity of this.required_entities) {
            if (this.data_model_entities.indexOf(entity) === -1) {
                this.error_info.push("Entity '"+entity+"' not present");
            }
        }
        if (this.error_info.length > 0) {
            this.error_info.unshift("Required entities are missing");
            return false;
        }
        return true;
    }
    async create(entity_name = '',data = {}) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name)+" does not exist");
            return false;
        }
        const data_keys = Object.keys(data);
        let keys_str = '';
        let values_str = '';
        for (const key of data_keys) {
            keys_str += ", `"+this.getCamelCaseSplittedToLowerCase(key)+"`";
            values_str += ", '"+data[key]+"'";
        }
        const query_str = "INSERT INTO `"+this.getCamelCaseSplittedToLowerCase(entity_name)+"` " +
            "(`id`"+keys_str+") VALUES (NULL"+values_str+");";
        const query_result = await this.executeQuery(query_str);
        if (query_result === null) {
            return -1;
        }
        return query_result["insertId"];
    }
    async read(entity_name = '',id = -1) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name)+" does not exist");
            return null;
        }
        const query_str = "SELECT * FROM `"+this.getCamelCaseSplittedToLowerCase(entity_name)+"` " +
            "WHERE `id` = '"+id+"' LIMIT 1;";
        const query_result = await this.executeQuery(query_str);
        if (query_result === null) {
            return null;
        }
        return query_result[0];
    }
    async update(entity_name = '',data = {}) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name)+" does not exist");
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
        const query_str = "UPDATE `"+this.getCamelCaseSplittedToLowerCase(entity_name)+"` " +
            "SET "+update_str+" WHERE " +
            "`"+this.getCamelCaseSplittedToLowerCase(entity_name)+"`.`id` = "+data["id"];
        const query_result = await this.executeQuery(query_str);
        return query_result !== null;
    }
    async delete(entity_name = '',id = -1) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(this.getCamelCaseSplittedToLowerCase(entity_name))) {
            this.error_info.push("Entity "+this.getCamelCaseSplittedToLowerCase(entity_name)+" does not exist");
            return null;
        }
        const query_str = "DELETE FROM `"+this.getCamelCaseSplittedToLowerCase(entity_name)+"` " +
            "WHERE `id` = '"+id+"';";
        const query_result = await this.executeQuery(query_str);
        return query_result !== null;
    }
    async executeQuery(query_str = null) {
        if (query_str === null) {
            this.error_info.push("No query provided");
            return null;
        }
        const query_result = await this.database_connector.queryDB(query_str);
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
    checkEntityExistsInDataModel(entity_name = '') {
        return this.data_model_entities.indexOf(this.getCamelCaseSplittedToLowerCase(entity_name)) !== -1;
    }
    getCamelCaseSplittedToLowerCase(camel_case_str = '') {
        return camel_case_str.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();
    }
}
module.exports = DivbloxDataLayer;