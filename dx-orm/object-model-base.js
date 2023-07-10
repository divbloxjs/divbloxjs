const DivbloxObjectBase = require("../dx-core-modules/object-base");
const DivbloxBase = require("../divblox");

/**
 * DivbloxObjectModelBase is the base object model class that can be used to interact with the database in an OOP manner.
 * Each entity in the data model can have its own specialization of this class to allow for specific functionality
 */
class DivbloxObjectModelBase extends DivbloxObjectBase {
    /**
     * Basic initialization for an object model class. Models for specific objects will override this class in
     * order to define their own properties and specializations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the data layer
     * @param {string} entityName Optional. The name of the entity to deal with. This will only be used if this base class is
     * used to instantiate an object. Otherwise, child classes will set their own entity name in their constructors
     * @param {string} globalIdentifier Optional. The uniqueIdentifier token for a globalIdentifier object.
     * Used to determine current user information if it is required for audit purposes
     */
    constructor(dxInstance = null, entityName = "base", globalIdentifier = "") {
        super();
        this.dxInstance = dxInstance;

        this.entityName = "base";
        if (typeof entityName !== "undefined" && entityName.length > 0) {
            this.entityName = entityName;
        }

        this.globalIdentifier = "";
        if (typeof globalIdentifier !== "undefined" && globalIdentifier.length > 0) {
            this.globalIdentifier = globalIdentifier;
        }

        this.modificationTypes = {
            create: "create",
            update: "update",
            delete: "delete",
        };

        this.entitySchema = {
            id: { type: "int" },
        };

        this.isSaving = false;
        this.reset();
    }

    /**
     * Called by the constructor to initialize the data for this object. Also called after the delete function succeeds
     */
    reset() {
        this.data = { id: -1 };
        this.lastLoadedData = {};
    }

    /**
     * Returns a schema for the current entity
     * @param {boolean} mustSimplify If true, returns a simplified version of the entity schema
     * @return {*|{}}
     */
    getEntitySchema(mustSimplify = false) {
        if (!mustSimplify) {
            return this.entitySchema;
        }

        const simplifiedSchema = {};
        for (const [key, value] of Object.entries(this.entitySchema)) {
            simplifiedSchema[key] = value.type;
        }

        return simplifiedSchema;
    }

    /**
     * Returns options configured for an enum attribute in the current entity's data model
     * @param {string} attributeName Attribute to check enum options for
     * @returns {[]|false} An array of options, or false if error occurred
     */
    getSelectableOptions(attributeName) {
        if (!attributeName) {
            this.populateError("No attribute provided");
            return false;
        }

        if (!this.entitySchema.hasOwnProperty(attributeName)) {
            this.populateError("Invalid attribute provided");
            return false;
        }

        if (!this.entitySchema[attributeName].hasOwnProperty("enum")) {
            this.populateError("Non-enum attribute provided");
            return false;
        }

        return this.entitySchema[attributeName].enum;
    }

    /**
     * Validates whether or not a proposed value is a valid option for given attribute enum
     * @param {string} attributeName Attribute name to look up enum configuration for
     * @param {*} proposedValue Value to check
     * @returns {boolean|null} True/false if validated correctly, null if error occurred
     */
    validateAgainstSelectableOptions(attributeName, proposedValue) {
        const selectableOptionsResult = this.getSelectableOptions(attributeName);
        if (!selectableOptionsResult) {
            return null;
        }

        const validProposedValue = selectableOptionsResult.includes(proposedValue);

        if (!validProposedValue) {
            this.populateError("Invalid proposed value provided from attribute '" + attributeName + "'");
        }

        return validProposedValue;
    }

    /**
     * Selects a row from the database for the table matching this entity and id and
     * stores the data for this entity in the "this.data" object
     * @param {number} id The primary key id of the relevant row
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} additionalParams An optional object containing any additional parameters that you might want to access in an overriding function
     * @returns {Promise<boolean>} True if data was successfully stored, false otherwise
     */
    async load(id = -1, transaction = null, additionalParams = {}) {
        if (!(await this.onBeforeLoad(id, transaction))) {
            return false;
        }

        this.lastLoadedData = await this.dxInstance.read(this.entityName, id, transaction);
        if (this.lastLoadedData !== null) {
            this.data = JSON.parse(JSON.stringify(this.lastLoadedData));

            if (!(await this.onAfterLoad(true, transaction))) {
                return false;
            }

            return true;
        }

        await this.onAfterLoad(false, transaction);
        this.populateError("Object not found for id = " + id);
        this.reset();

        return false;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run before loading an entity model object
     * @param {number} id ID of entity you are trying to load
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue loading the data, false otherwise
     */
    async onBeforeLoad(id = -1, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after loading an entity model object
     * @param {boolean} success Whether or not the loading of the object was successful or not
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue loading the data, false otherwise
     */
    async onAfterLoad(success = true, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Selects a row from the database for the table matching this entity and the fieldValue
     * provided for the given fieldName and then stores the data for this entity in the
     * "this.data" object
     * @param {string} fieldName The name of the field or attribute to constrain on
     * @param {*} fieldValue The value to compare against
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} additionalParams An optional object containing any additional parameters that you might want to access in an overriding function
     * @returns {Promise<boolean>} True if data was successfully stored, false otherwise
     */
    async loadByField(fieldName = "id", fieldValue = -1, transaction = null, additionalParams = {}) {
        if (!(await this.onBeforeLoadByField(fieldName, fieldValue, transaction))) {
            return false;
        }

        this.lastLoadedData = await this.dxInstance.readByField(this.entityName, fieldName, fieldValue, transaction);
        if (this.lastLoadedData !== null) {
            this.data = JSON.parse(JSON.stringify(this.lastLoadedData));

            if (!(await this.onAfterLoadByField(true, transaction))) {
                return false;
            }

            return true;
        }

        await this.onAfterLoadByField(false, transaction);

        this.populateError("Object not found for " + fieldName + " = " + fieldValue);
        this.reset();

        return false;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run before loading an entity model object by field name
     * @param {number} id ID of entity you are trying to load
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue loading the data, false otherwise
     */
    async onBeforeLoadByField(fieldName = "id", fieldValue = -1, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after loading an entity model object by field name
     * @param {boolean} success Whether or not the loading of the object was successful or not
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue after loading the data, false otherwise
     */
    async onAfterLoadByField(success = true, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Saves the current entity instance to the database. If the object does not yet exist in the database, an insert is
     * performed. Otherwise an update is performed, whereby only the changed fields are updated.
     * @param {boolean} mustIgnoreLockingConstraints If set to true, we will not check whether a locking constraint is
     * in place (If this entity has locking constraint functionality enabled) and simply perform the update
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} additionalParams An optional object containing any additional parameters that you might want to access in an overriding function
     * @return {Promise<boolean>} True if successful, false if not. If false, an error can be retrieved from the dxInstance
     */
    async save(mustIgnoreLockingConstraints = false, transaction = null, additionalParams = {}) {
        if (!(await this.onBeforeSave(transaction))) {
            return false;
        }

        let saveResult = false;
        this.isSaving = true;

        if (Object.keys(this.lastLoadedData).length === 0 || this.lastLoadedData === null) {
            // Creating a new entry for this entity
            saveResult = await this.#doCreate(transaction);
        } else {
            // Updating an existing entry for this entity
            saveResult = await this.#doUpdate(mustIgnoreLockingConstraints, transaction);
        }

        saveResult &&= await this.onAfterSave(saveResult, transaction);

        this.isSaving = false;

        return saveResult;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after saving an entity model object
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue saving the data, false otherwise
     */
    async onBeforeSave(transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after saving an entity model object
     * @param {boolean} success Whether or not the loading of the object was successful or not
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue after saving the data, false otherwise
     */
    async onAfterSave(success = true, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Saves the current entity instance to the database. An insert is performed.
     * @param {{}|null}} transaction An optional transaction object that contains the database connection that must be used for the query
     * @return {Promise<boolean>} True if successful, false if not. If false, an error can be retrieved from the dxInstance
     */
    async #doCreate(transaction = null) {
        if (!this.isSaving) {
            this.populateError(
                "Called doCreate() outside of save() scope. Please use the save() function when creating or updating this entity."
            );
            return false;
        }

        for (const key of Object.keys(this.data)) {
            if (!this.entitySchema[key]) {
                this.populateError("Invalid attribute provided: '" + key + "': " + this.data[key]);
                return false;
            }

            if (["date", "date-time"].includes(this.entitySchema[key]?.["format"])) {
                this.data[key] = new Date(this.data[key]);
            }

            if (this.entitySchema[key].hasOwnProperty("enum")) {
                if (!this.entitySchema[key].enum.includes(this.data[key])) {
                    this.populateError("Invalid value provided from enum attribute '" + key + "': " + this.data[key]);
                    return false;
                }
            }
        }

        const createdObjectId = await this.dxInstance.create(this.entityName, this.data, transaction);
        if (createdObjectId === -1) {
            this.populateError("Could not create '" + this.entityName + "'", this.dxInstance.getLastError());
            return false;
        }

        await this.load(createdObjectId, transaction);
        await this.addAuditLogEntry(this.modificationTypes.create, this.data, transaction);

        return true;
    }

    /**
     * Saves the current entity instance to the database. An update is performed, whereby only the changed fields are updated.
     * @param {boolean} mustIgnoreLockingConstraints If set to true, we will not check whether a locking constraint is
     * in place (If this entity has locking constraint functionality enabled) and simply perform the update
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @return {Promise<boolean>} True if successful, false if not. If false, an error can be retrieved from the dxInstance
     */
    async #doUpdate(mustIgnoreLockingConstraints = false, transaction = null) {
        if (!this.isSaving) {
            this.populateError(
                "Called doUpdate() outside of save() scope. Please use the save() function when creating or updating this entity."
            );
            return false;
        }

        let dataToSave = { id: this.data.id };
        for (const attributeName of Object.keys(this.lastLoadedData)) {
            let inputDataAttributeValue = this.data[attributeName];
            let lastLoadedDataAttributeValue = this.lastLoadedData[attributeName];

            if (typeof inputDataAttributeValue === "undefined" || attributeName === "lastUpdated") {
                continue;
            }

            if (["date", "date-time"].includes(this.entitySchema[attributeName]?.["format"])) {
                inputDataAttributeValue = new Date(inputDataAttributeValue).getTime();
                lastLoadedDataAttributeValue =
                    lastLoadedDataAttributeValue !== null ? lastLoadedDataAttributeValue.getTime() : null;
            }

            if (inputDataAttributeValue === lastLoadedDataAttributeValue) {
                continue;
            }

            if (["date", "date-time"].includes(this.entitySchema[attributeName]?.["format"])) {
                inputDataAttributeValue = new Date(inputDataAttributeValue);
            }

            if (this.entitySchema[attributeName].hasOwnProperty("enum")) {
                if (!this.entitySchema[attributeName].enum.includes(inputDataAttributeValue)) {
                    this.populateError(
                        "Invalid value provided from enum attribute '" + attributeName + "': " + inputDataAttributeValue
                    );
                    return false;
                }
            }

            dataToSave[attributeName] = inputDataAttributeValue;
        }

        if (Object.keys(dataToSave).length === 1) {
            // Nothing to update
            return true;
        }

        if (typeof this.lastLoadedData["lastUpdated"] !== "undefined" && !mustIgnoreLockingConstraints) {
            const isLockingConstraintActive = await this.dxInstance.dataLayer.checkLockingConstraintActive(
                this.entityName,
                this.data.id,
                this.lastLoadedData["lastUpdated"].getTime(),
                transaction
            );

            if (isLockingConstraintActive) {
                this.populateError(
                    "A locking constraint is active for " + this.entityName + " with id: " + this.data.id
                );

                return false;
            }
        }

        const updateResult = await this.dxInstance.update(this.entityName, dataToSave, transaction);

        if (!updateResult) {
            this.populateError("Could not update '" + this.entityName + "'", this.dxInstance.getLastError());
            return false;
        }

        await this.addAuditLogEntry(this.modificationTypes.update, dataToSave, transaction);
        return true;
    }

    /**
     * Remove this entity's instance from the database
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} additionalParams An optional object containing any additional parameters that you might want to access in an overriding function
     * @return {Promise<boolean>} True if delete was successful
     */
    async delete(transaction = null, additionalParams = {}) {
        if (!(await this.onBeforeDelete(transaction))) {
            return false;
        }

        let deleteResult = await this.dxInstance.delete(this.entityName, this.data.id, transaction);

        if (deleteResult) {
            await this.addAuditLogEntry(this.modificationTypes.delete, this.data, transaction);
            this.reset();
        } else {
            this.populateError("Could not delete '" + this.entityName + "'", this.dxInstance.getLastError());
        }

        deleteResult &&= await this.onAfterDelete(deleteResult, transaction);

        return deleteResult;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after deleting an entity model object
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue deleting the data, false otherwise
     */
    async onBeforeDelete(transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * Partial function to be overwritten for custom logic that needs to run after deleting an entity model object
     * @param {boolean} success Whether or not the loading of the object was successful or not
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @returns {Promise<boolean>} True if you want to continue after deleting the data, false otherwise
     */
    async onAfterDelete(success = true, transaction = null) {
        // TODO overwrite as needed
        return true;
    }

    /**
     * A wrapper function that calls the "addAuditLogEntry" method on DivbloxBase to add an audit log entry
     * @param {string} modificationType "create"|"update"|"delete"
     * @param {{}} entryDetail An object containing the details that were modified
     * @param {{}|null} transaction An optional transaction object that contains the database connection that must be used for the query
     * @param {{}} additionalParams An optional object containing any additional parameters that you might want to access in an overriding function
     * @return {Promise<boolean>} True if audit log was successfully stored, false otherwise
     */
    async addAuditLogEntry(
        modificationType = this.modificationTypes.update,
        entryDetail = {},
        transaction = null,
        additionalParams = {}
    ) {
        const entry = {
            objectName: this.entityName,
            modificationType: modificationType,
            objectId: this.data.id,
            entryDetail: JSON.stringify(entryDetail),
            globalIdentifier: this.globalIdentifier,
        };
        const auditLogEntryResult = await this.dxInstance.addAuditLogEntry(entry, transaction);
        if (!auditLogEntryResult) {
            this.populateError("Could not add AuditLogEntry", this.dxInstance.getLastError());
        }
        return auditLogEntryResult;
    }
}

module.exports = DivbloxObjectModelBase;
