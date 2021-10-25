const divbloxObjectBase = require('./object-base');
const jwt = require('jsonwebtoken');

/**
 * DivbloxJwtWrapperBase provides a base class that implements the bare essentials for JWT integration with divbloxjs.
 * This base class currently implements the jsonwebtoken library, but we can easily drop in another library if required
 */
class DivbloxJwtWrapperBase extends divbloxObjectBase {

    /**
     * Instantiates the object and sets the given secret for future use
     * @param {string} jwtSecret The secret that is used to signing and verifying the JWT token
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(jwtSecret = 'secret', dxInstance = null) {
        super();
        this.jwtSecret = jwtSecret;
        this.dxInstance = dxInstance;

        if (this.dxInstance === null) {
            throw new Error("No Divblox instance provided for jwt wrapper.");
        }
    }

    /**
     *
     * @param {string} globalIdentifier The unique identifier that is used to add globalIdentifierGroupings to the token
     * payload
     * @param {number|string|null} expiresIn Eg: 60, "2 days", "10h", "7d" expressed in seconds or a string describing a
     * time span: https://github.com/vercel/ms. If null is provided, the token will have no expiry.
     */
    async issueJwt(globalIdentifier, expiresIn = null) {
        const globalIdentifierObj = await this.dxInstance.getGlobalIdentifier(globalIdentifier);
        const isSuperUser = globalIdentifierObj === null ? false : globalIdentifierObj["isSuperUser"];

        let payload = {
            "globalIdentifier": globalIdentifier,
            "globalIdentifierGroupings": await this.dxInstance.getGlobalIdentifierGroupingsReadable(globalIdentifier),
            "isSuperUser": isSuperUser};

        const options = expiresIn === null ?
            {"issuer": this.dxInstance.appName} :
            {"issuer": this.dxInstance.appName,
            "expiresIn": expiresIn};

        return jwt.sign(payload, this.jwtSecret, options);
    }

    /**
     * Verifies the given token using the provided secret
     * @param {string} token The token to verify
     * @return {boolean} True if verification succeeds, false otherwise with an error added to the error arr
     */
    verifyJwt(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
        } catch(err) {
            // err
            this.populateError(err);
            return false;
        }

        return true;
    }

    /**
     * Returns the JWT payload after verifying the token
     * @param {string} token The token to decode
     * @return {{}|{payload: *, signature: *, header: *}|*}
     */
    getJwtPayload(token) {
        if (this.verifyJwt(token)) {
            return jwt.decode(token);
        }

        return {};
    }

    /**
     * Returns the globalIdentifier stored in the payload, if it exists
     * @param {string} token The token to decode
     * @return {null|*} The unique id of the globalIdentifier, or null if not found
     */
    getJwtGlobalIdentifier(token) {
        const payload = this.getJwtPayload(token);

        if (typeof payload["globalIdentifier"] !== "undefined") {
            return payload["globalIdentifier"];
        }

        return null;
    }

    /**
     * Simply checks for the isSuperUser
     * @param {string} token The token to decode
     * @return {boolean} True if isSuperUser is set to 1/true
     */
    isSuperUser(token) {
        const payload = this.getJwtPayload(token);

        if (typeof payload["isSuperUser"] !== "undefined") {
            return payload["isSuperUser"] === true || payload["isSuperUser"] === 1;
        }

        return false;
    }

    /**
     * Returns the globalIdentifierGroupings stored in the payload, if they exist
     * @param {string} token The token to decode
     * @return {*[]|*} An array of globalIdentifierGrouping id's, or an empty array
     */
    getJwtGlobalIdentifierGroupings(token) {
        const payload = this.getJwtPayload(token);

        if (typeof payload["globalIdentifierGroupings"] !== "undefined") {
            return payload["globalIdentifierGroupings"];
        }

        return [];
    }
}

module.exports = DivbloxJwtWrapperBase;