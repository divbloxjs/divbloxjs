class DivbloxDataLayer {
    constructor(database_connector = null,data_model = {}) {
        this.error_info = [];
        this.data_model = data_model;
        this.data_model_entities = Object.keys(this.data_model);
        this.required_entities = ["Account"];
        if (!this.validateDataModel()) {
            throw new Error("Error validating data model: "+JSON.stringify(this.error_info));
        }
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
    create(entity_name = '',data = {}) {
        this.error_info = [];
        if (!this.checkEntityExistsInDataModel(entity_name)) {
            this.error_info.push("Entity "+entity_name+" does not exist");
            return false;
        }
        
        const query_str = "INSERT INTO `"+entity_name+"`"
    }
    checkEntityExistsInDataModel(entity_name = '') {
        return this.data_model_entities.indexOf(entity_name.toLowerCase()) !== -1;
    }
}
module.exports = DivbloxDataLayer;