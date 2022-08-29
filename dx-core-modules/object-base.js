/**
 * DivbloxGlobalBase is the lowest-level Divblox class that provides functionality that is reused in many Divblox
 * implementation classes.
 */
class DivbloxGlobalBase {
    /**
     * A default constructor that should be overridden by child classes
     */
    constructor() {
        this.errorInfo = [];
    }

    /**
     * Whenever Divblox encounters an error, the errorInfo array should be populated with details about the error. This
     * function simply returns that errorInfo array for debugging purposes
     * @returns {[]}
     */
    getError() {
        return this.errorInfo;
    }

    /**
     * Returns the latest error that was pushed, as an error object
     * @returns {error: {}|string} The latest error
     */
    getLastError() {
        const lastError = { error: null };

        if (this.errorInfo.length > 0) {
            const lastErrorDetail = this.errorInfo[this.errorInfo.length - 1];
            lastError.error = lastErrorDetail;

            if (typeof lastErrorDetail === "object" && lastErrorDetail.error !== undefined) {
                lastError.error = lastErrorDetail.error;
            }
        }

        return lastError;
    }

    /**
     * Pushes a new error object/array/string into the error array
     * @param {{}|[]|string} errorToPush An object, array or string containing error information
     * @param {boolean} addAtStart If true, adds the error to the top of the errorInfo array
     * @param {boolean} mustClean If true, the errorInfo array will first be emptied before adding the new error.
     */
    populateError(errorToPush = [], addAtStart = false, mustClean = false) {
        if (mustClean) {
            this.errorInfo = [];
        }

        if (!addAtStart) {
            if (Array.isArray(errorToPush)) {
                this.errorInfo.push(...errorToPush);
            } else {
                this.errorInfo.push(errorToPush);
            }
        } else {
            this.errorInfo.unshift(errorToPush);
        }
    }

    /**
     * Resets the error info array
     */
    resetError() {
        this.errorInfo = [];
    }
}
module.exports = DivbloxGlobalBase;
