const divbloxObjectBase = require('../dx-core-modules/object-base');

/**
 * DivbloxObjectModelBase is the base object model class that can be used to interact with the database in an OOP manner.
 * Each entity in the data model can have its own specialization of this class to allow for specific functionality
 */
class DivbloxObjectModelBase extends divbloxObjectBase {

    /**
     * Basic initialization for an object model class. Models for specific objects will override this class in
     * order to define their own properties and specializations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the data layer
     * @param {string} entityName Optional. The name of the entity to deal with. This will only be used if this base class is
     * used to instantiate an object. Otherwise, child classes will set their own entity name in their constructors
     * @param {string} sessionId Optional. The id of the current session. Used to determine current user information if
     * it is required for audit purposes
     */
    constructor(dxInstance = null, entityName, sessionId) {
        super();
        this.dxInstance = dxInstance;

        this.entityName = 'base';
        if (typeof entityName !== "undefined") {
            this.entityName = entityName;
        }

        this.sessionId = null;
        if (typeof sessionId !== "undefined") {
            this.sessionId = sessionId;
        }

        this.modificationTypes = {
            "create":"create",
            "update":"update",
            "delete":"delete"
        }

        this.reset();
    }

    reset() {
        this.data = {"id":-1};
        this.lastLoadedData = {}
    }

    /**
     * Selects a row from the database for the table matching this entity and id and
     * stores the data for this entity in the "this.data" object
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<boolean>} True if data was successfully stored, false otherwise
     */
    async load(id = -1) {
        this.lastLoadedData = await this.dxInstance.read(this.entityName, id);
        if (this.lastLoadedData !== null) {
            this.data = JSON.parse(JSON.stringify(this.lastLoadedData));
            return true;
        }
        this.reset();
        return false
    }

    /**
     * Saves the current entity instance to the database. If the object does not yet exist in the database, an insert is
     * performed. Otherwise an update is performed, whereby only the changed fields are updated.
     * @return {Promise<boolean>} True if successful, false if not. If false, an error can be retrieved from the dxInstance
     */
    async save() {
        if (this.lastLoadedData === {}) {
            // This means we are creating a new entry for this entity
            const objId =  await this.dxInstance.create(this.entityName, this.data);
            this.data["id"] = objId;

            await this.addAuditLogEntry(this.modificationTypes.create, this.data);

            return objId !== -1;
        }

        let dataToSave = {"id":this.data.id};
        for (const key of Object.keys(this.lastLoadedData)) {
            if (typeof this.data[key] === "undefined") {
                continue;
            }

            if (this.data[key] !== this.lastLoadedData[key]) {
                dataToSave[key] = this.data[key];
            }
        }
        const updateResult = await this.dxInstance.update(this.entityName, dataToSave);
        if (updateResult) {
            await this.addAuditLogEntry(this.modificationTypes.update, dataToSave);
        }

        return updateResult;
    }

    /**
     * Remove this entity's instance from the database
     * @return {Promise<boolean>} True if delete was successful
     */
    async delete() {
        const deleteResult = await this.dxInstance.delete(this.entityName, this.data.id);

        if (deleteResult) {
            await this.addAuditLogEntry(this.modificationTypes.delete);
            this.reset();
        }

        return deleteResult;
    }

    /**
     * A wrapper function that calls the "addAuditLogEntry" method on DivbloxBase to add an audit log entry
     * @param {string} modificationType "create"|"update"|"delete"
     * @param {{}} entryDetail An object containing the details that were modified
     * @return {Promise<boolean>} True if audit log was successfully stored, false otherwise
     */
    async addAuditLogEntry(modificationType = this.modificationTypes.update, entryDetail = {}) {
        const entry = {
            "objectName": this.entityName,
            "modificationType": modificationType,
            "objectId": this.data.id,
            "entryDetail":JSON.stringify(entryDetail)
        };
        return await this.dxInstance.addAuditLogEntry(entry, this.sessionId);
    }
}

module.exports = DivbloxObjectModelBase;