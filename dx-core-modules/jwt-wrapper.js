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
        //TODO: Create a new jwt for the given identifier. The payload must contain the identifier, and a list of all
        // it's globalIdentifierGroupings
        let payload = {
            "globalIdentifier": globalIdentifier,
            "globalIdentifierGroupings": await this.dxInstance.getGlobalIdentifierGroupings(globalIdentifier)};

        const options = expiresIn === null ?
            {"issuer": this.dxInstance.appName} :
            {"issuer": this.dxInstance.appName,
            "expiresIn": expiresIn};

        const token = jwt.sign(payload, this.jwtSecret, options);
    }
    verifyJwt(token) {
        //TODO: return true or false for the given token. True if verified, false if not. If false, then populate error.
    }
    getJwtPayload(token) {
        //TODO: First we verify, then we decode and return the payload
    }
    getJwtGlobalIdentifier(token) {
        //TODO: Returns the globalIdentifier stored in the payload using this.getJwtPayload()
    }
    getJwtGlobalIdentifierGroupings(token) {
        //TODO: Returns the globalIdentifierGroupings [] stored in the payload using this.getJwtPayload()
    }
}

module.exports = DivbloxJwtWrapperBase;