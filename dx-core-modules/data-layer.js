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
        const query_result = await this.database_connector.queryDB(query_str);
        console.dir(query_result);
        if (typeof query_result["error"] !== "undefined") {
            this.error_info.push(query_result["error"]);
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
        const query_result = await this.database_connector.queryDB(query_str);
        if (typeof query_result["error"] !== "undefined") {
            this.error_info.push(query_result["error"]);
            return null;
        }
        if (query_result.length === 0) {
            this.error_info.push("Object not found for id: "+id);
            return null;
        }
        return query_result[0];
    }
    checkEntityExistsInDataModel(entity_name = '') {
        return this.data_model_entities.indexOf(this.getCamelCaseSplittedToLowerCase(entity_name)) !== -1;
    }
    getCamelCaseSplittedToLowerCase(entity_name = '') {
        return entity_name.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();
    }
}
module.exports = DivbloxDataLayer;