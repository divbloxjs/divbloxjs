const divbloxObjectBase = require('../dx-core-modules/object-base');

class DivbloxOrmBase extends divbloxObjectBase {
    constructor(dxInstance = null, entityName = null) {
        super();
        this.dxInstance = dxInstance;
        this.entityName = entityName;
        this.id = -1;
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
        entry["objectId"] = this.id;

        if (sessionId !== null) {
            //TODO: Implement the ability to retrieve the userIdentifier and/or apiKey from the session
        }

        return await this.dxInstance.addAuditLogEntry(entry);
    }
}
await this.addAuditLogEntry({
    "objectName": entityName,
    "modificationType":"create",
    "objectId":queryResult["insertId"],
    "entryDetail":JSON.stringify(data)});