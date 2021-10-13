const divbloxObjectBase = require('../dx-core-modules/object-base');

class DivbloxOrmBase extends divbloxObjectBase {
    /**
     * Basic initialization for an ORM class. Models for specific objects will override this class in order to define
     * their own properties and specializations
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

        this.data = {"id":-1};
        this.lastLoadedData = {}
    }

    /**
     * Selects a row from the database for the table matching this entity and id
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<*>}
     */
    async load(id = -1) {
        this.lastLoadedData = await this.dxInstance.read(this.entityName, id);
        if (this.lastLoadedData !== null) {
            this.data = JSON.parse(JSON.stringify(this.lastLoadedData));
            return true;
        }
        this.lastLoadedData = {};
        return false
    }

    /**
     * Saves the current entity to the database
     * @return {Promise<boolean>} True if successful, false if not. If false, an error can be retrieved from the dxInstance
     */
    async save() {
        if (this.lastLoadedData === {}) {
            // This means we are creating a new entry for this entity
            const objId =  await this.dxInstance.create(this.entityName, this.data);
            this.data["id"] = objId;

            const entry = {
                "objectName": this.entityName,
                "modificationType": "create",
                "objectId": this.data.id,
                "entryDetail":JSON.stringify(this.data)};

            await this.dxInstance.addAuditLogEntry(entry, this.sessionId);

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

            const entry = {
                "objectName": this.entityName,
                "modificationType": "update",
                "objectId": this.data.id,
                "entryDetail":JSON.stringify(dataToSave)};

            await this.dxInstance.addAuditLogEntry(entry, this.sessionId);
        }
    }

    /**
     * Inserts a new auditLogEntry into the database
     * @param entry The information regarding the audit log entry
     * @param {string} entry.modificationType create|update|delete
     * @param {string} entry.entryDetail The details of the entry (What was changed)
     * api that identifies with an api key
     * @param {string} sessionId Optional. The id of the current session as received by the request that triggered this
     * action
     * @return {Promise<boolean>}
     */
    async addAuditLogEntry(entry = {}, sessionId = null) {
        entry["objectName"] = this.entityName;
        entry["objectId"] = this.data.id;

        if (sessionId !== null) {
            //TODO: Implement the ability to retrieve the userIdentifier and/or apiKey from the session
        }

        return await this.dxInstance.addAuditLogEntry(entry);
    }
}