class DivbloxDataLayer {
    constructor(database_connector = null,data_model = {}) {
        this.error_info = [];
        this.data_model = data_model;
        this.required_entities = ["Account"];
        if (!this.validateDataModel()) {
            throw new Error("Error validating data model: "+JSON.stringify(this.error_info));
        }
    }
    validateDataModel() {
        const data_model_entities = Object.keys(this.data_model);
        for (const entity of this.required_entities) {
            if (data_model_entities.indexOf(entity) === -1) {
                this.error_info.push("Entity '"+entity+"' not present");
            }
        }
        if (this.error_info.length > 0) {
            this.error_info.unshift("Required entities are missing");
            return false;
        }
        return true;
    }
}
module.exports = DivbloxDataLayer;