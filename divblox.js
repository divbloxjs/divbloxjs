const fs = require("fs");
const path = require("path");
const dxUtils = require("dx-utilities");
const divbloxObjectBase = require("./dx-core-modules/object-base");
const divbloxDatabaseConnector = require("dx-db-connector");
const divbloxDataLayerBase = require("./dx-core-modules/data-layer");
const divbloxWebServiceBase = require("./dx-core-modules/web-service");
const divbloxJwtWrapperBase = require("./dx-core-modules/jwt-wrapper");
const DIVBLOX_ROOT_DIR = path.join(__dirname, "..", "divbloxjs");

/**
 * This class overrides the default divbloxDataLayerBase class to ensure that we can always just call DivbloxDataLayer,
 * meaning, the developer can create their own version of DivbloxDataLayer if they want to modify how it should work
 */
class DivbloxDataLayer extends divbloxDataLayerBase {}

/**
 * This class overrides the default divbloxWebServiceBase class to ensure that we can always just call DivbloxWebService,
 * meaning, the developer can create their own version of DivbloxWebService if they want to modify how it should work
 */
class DivbloxWebService extends divbloxWebServiceBase {}

/**
 * This class overrides the default divbloxJwtWrapperBase class to ensure that we can always just call DivbloxJwtWrapper,
 * meaning, the developer can create their own version of DivbloxJwtWrapper if they want to modify how it should work
 */
class DivbloxJwtWrapper extends divbloxJwtWrapperBase {}

/**
 * DivbloxBase serves as the base Divblox class that provides the relevant backend nodejs functionality for a Divblox
 * application
 */
class DivbloxBase extends divbloxObjectBase {
    //#region Initialization & Startup

    /**
     * Constructs the Divblox instance with the options provided
     * @param options The configuration and data model options to initialize with
     * @param {string} options.configPath The path to the dxconfig.json file that defines the environment related variables
     * @param {*} options.dataLayerImplementationClass An optional class implementation for the Divblox Data Layer. This
     * is useful when you want to override the default Divblox data layer behaviour
     * @param {*} options.webServiceImplementationClass An optional class implementation for the Divblox Web Service. This
     * is useful when you want to override the default Divblox Web Service behaviour
     * @param {*} options.jwtWrapperImplementationClass An optional class implementation for the Divblox JWT Wrapper. This
     * is useful when you want to override the default Divblox JWT Wrapper behaviour
     * @param {boolean} options.disableWebServer If set to true this skips any setup of a webserver to allow for using
     * divbloxjs simply as a console-driven tool. Note that if you instantiate with this all packages that provide web
     * server based functionality will not be able to provide that specific functionality
     */
    constructor(options = {}) {
        super();

        dxUtils.printHeadingMessage("Initializing divbloxjs");

        this.initOptions = options;
        this.isInitFinished = false;
        this.configRoot = "";

        this.initPrerequisites();

        this.initPackages();

        this.initDataLayer();

        this.initJwtWrapper();

        this.isInitFinished = true;
    }

    /**
     * Sets up the prerequisite variables that are required for divbloxjs
     */
    initPrerequisites() {
        dxUtils.printSubHeadingMessage("Handling prerequisites");

        this.disableWebServer = false;

        if (typeof this.initOptions["disableWebServer"] !== "undefined") {
            this.disableWebServer = this.initOptions["disableWebServer"];
        }

        if (typeof this.initOptions["configPath"] === "undefined" || this.initOptions["configPath"] === null) {
            throw new Error("No config path provided");
        }

        this.configPath = this.initOptions["configPath"];
        if (!fs.existsSync(this.configPath)) {
            throw new Error("Invalid config path (" + this.configPath + ") provided");
        }

        this.configRoot = this.configPath.substring(0, this.configPath.lastIndexOf("/"));

        const configDataStr = fs.readFileSync(this.configPath, "utf-8");
        this.configObj = JSON.parse(configDataStr);

        this.appName = typeof this.configObj["appName"] !== "undefined" ? this.configObj["appName"] : "Divblox";

        if (typeof process.env.NODE_ENV === "undefined" && typeof this.configObj.environment === "undefined") {
            throw new Error(
                "NODE_ENV has not been set. Divblox requires the environment to be specified. You can" +
                    " try running your script with NODE_ENV=development node [your_script.js]\n"
            );
        }

        if (typeof process.env.NODE_ENV === "undefined") {
            process.env.NODE_ENV = this.configObj.environment;
        }

        if (typeof this.configObj["environmentArray"] === "undefined") {
            throw new Error("No environments configured");
        }

        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV] === "undefined") {
            throw new Error("No environments configured for NODE_ENV: " + process.env.NODE_ENV);
        }

        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["modules"] === "undefined") {
            throw new Error("No databases configured for the environment: " + process.env.NODE_ENV);
        }

        process.env.TZ =
            typeof this.configObj["environmentArray"][process.env.NODE_ENV]["timeZone"] !== "undefined"
                ? this.configObj["environmentArray"][process.env.NODE_ENV]["timeZone"]
                : "Africa/Abidjan";

        if (typeof this.configObj["webServiceConfig"] === "undefined") {
            throw new Error("No web service configuration provided");
        }

        this.serverBaseUrl = "http://localhost";
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["serverBaseUrl"] !== "undefined") {
            this.serverBaseUrl = this.configObj["environmentArray"][process.env.NODE_ENV]["serverBaseUrl"];
        }

        this.uploadServePath = "/uploads";
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["uploadServePath"] !== "undefined") {
            this.uploadServePath = this.configObj["environmentArray"][process.env.NODE_ENV]["uploadServePath"];
        }

        this.databaseConnector = new divbloxDatabaseConnector(
            this.configObj["environmentArray"][process.env.NODE_ENV]["modules"]
        );

        this.dataModelPath = DIVBLOX_ROOT_DIR + "/dx-orm/data-model-base.json";
        const dataModelDataStr = fs.readFileSync(this.dataModelPath, "utf-8");
        this.dataModelObj = JSON.parse(dataModelDataStr);

        this.dataModelSchema = {};
    }

    /**
     * Loads the packages defined in dxconfig.json into this.packages and merges the data model to ensure all entities
     * defined across all packages are present.
     * Also loads any package options defined in the file package-options.json, located in the config folder
     */
    initPackages() {
        dxUtils.printSubHeadingMessage("Initializing packages");
        this.packages = {};
        this.packageOptions = {};
        this.packageOptions[process.env.NODE_ENV] = {};

        if (fs.existsSync(this.configRoot + "/package-options.json")) {
            const packageOptionsStr = fs.readFileSync(this.configRoot + "/package-options.json", "utf-8");
            this.packageOptions = JSON.parse(packageOptionsStr);
        }

        if (typeof this.configObj["divbloxPackagesRootLocal"] === "undefined") {
            dxUtils.printErrorMessage(
                "No path configured for 'divbloxPackagesRootLocal'! Update config file with a property called" +
                    +"'divbloxPackagesRootLocal' that defines where local divbloxjs packages are stored."
            );
            throw new Error("Configuration incomplete");
        }

        if (
            typeof this.configObj["divbloxPackages"] !== "undefined" &&
            this.configObj["divbloxPackages"] !== null &&
            Object.keys(this.configObj["divbloxPackages"]).length > 0
        ) {
            // Load remote packages before local ones to ensure proper inheritance
            this.loadPackages(true);
            this.loadPackages(false);
        }

        fs.writeFileSync(this.configRoot + "/package-options.json", JSON.stringify(this.packageOptions, null, 2));
    }

    /**
     * Loads the defined packages' data models and sets their relevant root paths for later use
     * @param {boolean} isRemote Whether to look for remote or local packges
     * @returns {boolean} True when packages were loaded, false otherwise
     */
    loadPackages(isRemote = false) {
        const packagesLocation = isRemote ? "remote" : "local";

        dxUtils.printSubHeadingMessage("Loading " + packagesLocation + " packages");

        if (
            typeof this.configObj["divbloxPackages"][packagesLocation] === "undefined" ||
            this.configObj["divbloxPackages"][packagesLocation].length < 1
        ) {
            dxUtils.printInfoMessage("No " + packagesLocation + " packages to load");
            return false;
        }

        const packagesToLoad = this.configObj["divbloxPackages"][packagesLocation];

        const duplicatePackages = packagesToLoad.filter((packageName, index) => {
            return packagesToLoad.indexOf(packageName) !== index;
        });

        if (duplicatePackages.length > 0) {
            dxUtils.printErrorMessage(
                "Duplicate packages are not allowed.\n" +
                    "The following packages have been defined multiple times: '" +
                    duplicatePackages.join(",") +
                    "'"
            );
            throw new Error("Configuration invalid");
        }

        for (const packageToLoad of packagesToLoad) {
            // If a package is already defined, it means we are specializing this package within a child package,
            // so its package root should not be redeclared.
            const packageRoot = isRemote
                ? "node_modules/" + packageToLoad
                : this.configObj["divbloxPackagesRootLocal"] + "/" + packageToLoad;

            if (typeof this.packages[packageToLoad] === "undefined") {
                this.packages[packageToLoad] = {
                    packageRoot: packageRoot,
                };
            } else if (!isRemote) {
                // This will ensure that the local package's root path is stored when it is intended as
                // a specialization of the remote package with the same name
                this.packages[packageToLoad] = {
                    packageRoot: packageRoot,
                };
            }

            if (typeof this.packageOptions[process.env.NODE_ENV][packageToLoad] === "undefined") {
                this.packageOptions[process.env.NODE_ENV][packageToLoad] = {};
            }

            const packageDataModelPath = isRemote
                ? "node_modules/" + packageToLoad + "/data-model.json"
                : this.configObj["divbloxPackagesRootLocal"] + "/" + packageToLoad + "/data-model.json";

            const packageDataModelDataStr = fs.readFileSync(packageDataModelPath, "utf-8");

            const packageDataModelObj = JSON.parse(packageDataModelDataStr);

            for (const entityName of Object.keys(packageDataModelObj)) {
                if (typeof this.dataModelObj[entityName] !== "undefined") {
                    if (isRemote) {
                        throw new Error(
                            "Entity " +
                                entityName +
                                " already exist in the data model. " +
                                "Tried to define entity '" +
                                entityName +
                                "' multiple times in the data model"
                        );
                    }

                    // The entity is already defined, let's add any relevant attributes/relationships from the base package
                    const entityObj = packageDataModelObj[entityName];

                    // Let's ensure that this entity is placed inside a module
                    if (typeof this.dataModelObj[entityName]["module"] === "undefined") {
                        this.dataModelObj[entityName]["module"] = entityObj["module"];
                    }

                    // Let's loop over the attributes and see if we need to add any that have not been defined by the child package
                    const existingDataModelAttributes = Object.keys(this.dataModelObj[entityName]["attributes"]);

                    const duplicateAttributes = Object.keys(entityObj["attributes"]).filter((x) =>
                        existingDataModelAttributes.includes(x)
                    );

                    if (duplicateAttributes.length > 0) {
                        dxUtils.printErrorMessage(
                            "Duplicate attributes for entities are not allowed.\n" +
                                "The following attributes have been defined multiple times for entity '" +
                                entityName +
                                "': '" +
                                duplicateAttributes.join(",") +
                                "'"
                        );
                        throw new Error("Data model invalid");
                    }

                    const attributesToAdd = Object.keys(entityObj["attributes"]).filter(
                        (x) => !existingDataModelAttributes.includes(x)
                    );

                    for (const attributeToAdd of attributesToAdd) {
                        this.dataModelObj[entityName]["attributes"][attributeToAdd] =
                            entityObj["attributes"][attributeToAdd];
                    }

                    // Let's add the local package's indexes to any existing ones
                    if (typeof this.dataModelObj[entityName]["indexes"] === "undefined") {
                        this.dataModelObj[entityName]["indexes"] = [];
                    }

                    for (const indexToAdd of entityObj["indexes"]) {
                        this.dataModelObj[entityName]["indexes"].push(indexToAdd);
                    }

                    // Let's loop over the relationships and see if we need to add any that have not been defined by the remote package
                    if (typeof this.dataModelObj[entityName]["relationships"] === "undefined") {
                        this.dataModelObj[entityName]["relationships"] = {};
                    }

                    const existingDataModelRelationships = Object.keys(this.dataModelObj[entityName]["relationships"]);

                    const relationshipsToAdd = Object.keys(entityObj["relationships"]).filter(
                        (x) => !existingDataModelRelationships.includes(x)
                    );

                    for (const relationshipToAdd of relationshipsToAdd) {
                        this.dataModelObj[entityName]["relationships"][relationshipToAdd] =
                            entityObj["relationships"][relationshipToAdd];
                    }

                    // Let's loop over the options and see if we need to add any that have not been defined by the remote package
                    if (typeof this.dataModelObj[entityName]["options"] === "undefined") {
                        this.dataModelObj[entityName]["options"] = {};
                    }

                    const existingDataModelOptions = Object.keys(this.dataModelObj[entityName]["options"]);

                    const optionsToAdd = Object.keys(entityObj["options"]).filter(
                        (x) => !existingDataModelOptions.includes(x)
                    );

                    for (const optionToAdd of optionsToAdd) {
                        this.dataModelObj[entityName]["options"][optionToAdd] = entityObj["options"][optionToAdd];
                    }
                } else {
                    this.dataModelObj[entityName] = packageDataModelObj[entityName];
                }
            }
        }
        return true;
    }

    /**
     * Initializes the data layer
     */
    initDataLayer() {
        dxUtils.printSubHeadingMessage("Initializing data layer");

        if (
            typeof this.initOptions["dataLayerImplementationClass"] !== "undefined" &&
            this.initOptions["dataLayerImplementationClass"] !== null
        ) {
            DivbloxDataLayer = this.initOptions["dataLayerImplementationClass"];
        }

        this.dataLayer = new DivbloxDataLayer(this.databaseConnector, this.dataModelObj);
        const currentDataModelHash = this.dataLayer.getDataModelHash();
        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"] === "undefined") {
            this.dataModelState = {
                currentDataModelHash: currentDataModelHash,
                lastDataModelChangeTimestamp: Date.now(),
                lastDataModelSyncTimestamp: 0,
            };
            this.updateDataModelState(this.dataModelState);
        } else {
            this.dataModelState = this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"];
        }
    }

    /**
     * Initializes the wrapper for our built-in JSON Web Token functionality
     */
    initJwtWrapper() {
        dxUtils.printSubHeadingMessage("Initializing JWT wrapper");

        if (
            typeof this.initOptions["jwtWrapperImplementationClass"] !== "undefined" &&
            this.initOptions["jwtWrapperImplementationClass"] !== null
        ) {
            DivbloxJwtWrapper = this.initOptions["jwtWrapperImplementationClass"];
        }

        if (typeof this.configObj["environmentArray"][process.env.NODE_ENV]["jwtSecret"] === "undefined") {
            throw new Error("No jwtSecret configured for the environment: " + process.env.NODE_ENV);
        }

        this.jwtWrapper = new DivbloxJwtWrapper(
            this.configObj["environmentArray"][process.env.NODE_ENV]["jwtSecret"],
            this
        );
    }

    /**
     * Starts the Divblox instance using the provided configuration and data model data. This validates the data model
     * and also starts the Divblox web service
     * @param {boolean} mustSkipDatabaseSync If true, divbloxjs will not even check if it should synchronize the data
     * model with the database. This is useful when running divbloxjs with a process manager like pm2 to ensure
     * uninterrupted restarts of the divbloxjs process
     * @returns {Promise<void>}
     */
    async startDx(mustSkipDatabaseSync = false) {
        if (!mustSkipDatabaseSync) {
            try {
                await this.databaseConnector.checkDBConnection();
            } catch (error) {
                this.populateError(error, true);

                this.populateError(
                    "Your database might not be configured properly. You can update your " +
                        "database connection information in dxconfig.json",
                    true
                );

                dxUtils.printErrorMessage(JSON.stringify(this.getError()));
                return;
            }

            dxUtils.printSubHeadingMessage("Checking for database & ORM synchronization");

            if (!(await this.dataLayer.validateDataModel(this.dataModelState))) {
                this.populateError(this.dataLayer.getError(), true);

                dxUtils.printWarningMessage("Error validating data model: " + JSON.stringify(this.getError(), null, 2));

                if (this.dataLayer.isRequiredEntitiesMissing) {
                    dxUtils.printErrorMessage(
                        "You can run the application generator again to generate the " + "default model:"
                    );
                    dxUtils.printTerminalMessage("npx github:divbloxjs/divbloxjs-application-generator");
                    return;
                }

                this.dataModelState.lastDataModelChangeTimestamp = Date.now();
                this.dataModelState.currentDataModelHash = this.dataLayer.getDataModelHash();
                this.updateDataModelState(this.dataModelState);

                await this.syncDatabase(false);

                // We always want to generate ORM classes here since there were probably changes to the data model.
                await this.generateOrmBaseClasses();
            } else if (
                this.dataModelState.lastDataModelSyncTimestamp < this.dataModelState.lastDataModelChangeTimestamp
            ) {
                await this.syncDatabase(false);

                // We always want to generate ORM classes here since there were probably changes to the data model.
                await this.generateOrmBaseClasses();
            }

            if (!(await this.checkOrmBaseClassesComplete())) {
                await this.generateOrmBaseClasses();
            }

            if (!(await this.ensureGlobalSuperUserPresent())) {
                dxUtils.printErrorMessage(this.getError());
                process.exit(1);
                return;
            }

            await this.createGlobalIdentifierGrouping(
                this.getDefaultGlobalIdentifierGrouping(),
                "The default globalIdentifierGrouping"
            );

            // Let's just wait 2s for the console to make sense
            await dxUtils.sleep(2000);

            dxUtils.printSubHeadingMessage("Finishing divbloxjs startup");

            await dxUtils.sleep(1000);
        }

        //It is important that this is called before starting the webserver, otherwise the schemas will not be available
        this.dataModelSchema = require("./dx-orm/generated/schemas/data-model-schema.js");

        if (!this.disableWebServer) {
            const webServerPort =
                typeof this.configObj["environmentArray"][process.env.NODE_ENV]["webServerPort"] === "undefined"
                    ? 3000
                    : this.configObj["environmentArray"][process.env.NODE_ENV]["webServerPort"];

            const webServerCorsAllowedList =
                typeof this.configObj["environmentArray"][process.env.NODE_ENV]["webServerCorsAllowedList"] ===
                "undefined"
                    ? []
                    : this.configObj["environmentArray"][process.env.NODE_ENV]["webServerCorsAllowedList"];

            const webServerCorsOptions =
                typeof this.configObj["environmentArray"][process.env.NODE_ENV]["webServerCorsOptions"] === "undefined"
                    ? {}
                    : this.configObj["environmentArray"][process.env.NODE_ENV]["webServerCorsOptions"];

            const webServerUseHttps =
                typeof this.configObj["environmentArray"][process.env.NODE_ENV]["useHttps"] === "undefined"
                    ? false
                    : this.configObj["environmentArray"][process.env.NODE_ENV]["useHttps"];

            const webServerHttpsConfig = this.configObj["environmentArray"][process.env.NODE_ENV]["serverHttps"];

            const webServiceConfig = {
                webServerPort: webServerPort,
                useHttps: webServerUseHttps,
                serverHttps: webServerHttpsConfig,
                webServerCorsAllowedList: webServerCorsAllowedList,
                webServerCorsOptions: webServerCorsOptions,
                ...this.configObj["webServiceConfig"],
            };

            if (
                typeof this.initOptions["webServiceImplementationClass"] !== "undefined" &&
                this.initOptions["webServiceImplementationClass"] !== null
            ) {
                DivbloxWebService = this.initOptions["webServiceImplementationClass"];
            }

            this.webService = new DivbloxWebService(webServiceConfig, this);
        }

        //Since startup was successful, let's clean potential errors
        this.resetError();

        dxUtils.printSuccessMessage("Divblox started!");

        if (this.disableWebServer) {
            dxUtils.printWarningMessage("Web server has been disabled");
        }

        if (Object.keys(this.packages).length === 0) {
            dxUtils.printWarningMessage("You currently have ZERO packages defined or installed.");
            dxUtils.printWarningMessage("To get started, either create your own package by running:");
            dxUtils.printTerminalMessage("npx divbloxjs-package-generator");
            dxUtils.printWarningMessage("Or install a remote package using:");
            dxUtils.printTerminalMessage("npm run register-package");
        }
    }

    //#endregion

    //#region Helper functions

    /**
     * Updates the current data model state in the dxconfig.json file with the provided data
     * @param dataModelState The new data model state to store
     */
    updateDataModelState(dataModelState) {
        this.configObj["environmentArray"][process.env.NODE_ENV]["dataModelState"] = dataModelState;
        fs.writeFileSync(this.configPath, JSON.stringify(this.configObj, null, 2));
    }

    /**
     * Registers the remote package name in the dxconfig.json file in order for it to be available at runtime
     * @param {string} remotePath The remote path of the package as it is defined in your project's package.json file
     */
    async registerRemotePackage(remotePath) {
        if (typeof remotePath === "undefined" || remotePath.length < 1) {
            remotePath = await dxUtils.getCommandLineInput("Please provide the package remote path: ");
        }

        if (remotePath.length < 1) {
            dxUtils.printErrorMessage("Cannot register dx package. Invalid remote path provided!");
        }

        const projectPackagesStr = fs.readFileSync("./package.json", "utf-8");
        const projectPackages = JSON.parse(projectPackagesStr);

        if (typeof projectPackages["dependencies"] === "undefined") {
            dxUtils.printErrorMessage("Cannot register dx package. Invalid package.json file found!");
            return;
        }

        let registerPackageName = this.getPackageNameFromConfig(remotePath);

        if (registerPackageName === null) {
            //This means we need to attempt to install the package first
            dxUtils.printInfoMessage("Installing " + remotePath + "...");

            const createResult = await dxUtils.executeCommand("npm install --save " + remotePath);
            if (typeof createResult === "undefined" || createResult === null) {
                dxUtils.printErrorMessage("Could not install " + remotePath + ". Please try again.");
                return;
            }

            if (createResult.stdout.length > 0) {
                dxUtils.printSuccessMessage(remotePath + " install result: " + createResult.stdout);
            } else {
                dxUtils.printErrorMessage(remotePath + " install failed: " + createResult.stderr);
            }
        }

        registerPackageName = this.getPackageNameFromConfig(remotePath);

        if (registerPackageName === null) {
            //This means something went wrong installing the package. We must stop
            dxUtils.printErrorMessage("Cannot register dx package. Installation failed!");
            return;
        }

        if (this.configObj["divbloxPackages"]["remote"].includes(registerPackageName)) {
            dxUtils.printErrorMessage("Remote package '" + registerPackageName + "' is already registered!");
            return;
        }

        this.configObj["divbloxPackages"]["remote"].push(registerPackageName);
        fs.writeFileSync(this.configPath, JSON.stringify(this.configObj, null, 2));

        dxUtils.printSuccessMessage(registerPackageName + " successfully registered!");
    }

    /**
     * Deregisters the provided package name in the dxconfig.json file in order for it to be excluded at runtime
     * @param {string} packageName The name of the package as it is defined in your project's dxconfig.json file
     */
    async deregisterPackage(packageName) {
        if (typeof packageName === "undefined" || packageName.length < 1) {
            packageName = await dxUtils.getCommandLineInput("Please provide the package name: ");
        }

        if (packageName.length < 1) {
            dxUtils.printErrorMessage("Cannot deregister dx package. Invalid remote path provided!");
            return;
        }

        if (this.configObj["divbloxPackages"]["remote"].includes(packageName)) {
            const projectPackagesStr = fs.readFileSync("./package.json", "utf-8");
            const projectPackages = JSON.parse(projectPackagesStr);

            if (typeof projectPackages["dependencies"] === "undefined") {
                dxUtils.printErrorMessage("Cannot register dx package. Invalid package.json file found!");
                return;
            }

            dxUtils.printInfoMessage("Removing " + packageName + "...");

            const removeResult = await dxUtils.executeCommand("npm remove " + packageName);
            if (typeof removeResult === "undefined" || removeResult === null) {
                dxUtils.printErrorMessage("Could not remove " + removeResult + ". Please try again.");
                return;
            }

            if (removeResult.stdout.length > 0) {
                dxUtils.printSuccessMessage(packageName + " remove result: " + removeResult.stdout);
            } else {
                dxUtils.printErrorMessage(packageName + " remove failed: " + removeResult.stderr);
            }

            this.configObj["divbloxPackages"]["remote"] = this.configObj["divbloxPackages"]["remote"].filter(function (
                element
            ) {
                return element !== packageName;
            });
        }

        if (this.configObj["divbloxPackages"]["local"].includes(packageName)) {
            this.configObj["divbloxPackages"]["local"] = this.configObj["divbloxPackages"]["local"].filter(function (
                element
            ) {
                return element !== packageName;
            });
        }

        fs.writeFileSync(this.configPath, JSON.stringify(this.configObj, null, 2));

        dxUtils.printSuccessMessage(packageName + " successfully deregistered!");
    }

    /**
     * Returns the package name from a remote path defined in the package.json file
     * @param {string} remotePath The remote path of the package as it is defined in your project's package.json file
     * @return {null|string} Null if not found, or if found the name of the package
     */
    getPackageNameFromConfig(remotePath) {
        const projectPackagesStr = fs.readFileSync("./package.json", "utf-8");
        const projectPackages = JSON.parse(projectPackagesStr);

        if (typeof projectPackages["dependencies"] === "undefined") {
            dxUtils.printErrorMessage("Cannot get package name. Invalid package.json file found!");
            return null;
        }

        let retrievedPackageName = null;

        for (const packageName of Object.keys(projectPackages["dependencies"])) {
            if (projectPackages["dependencies"][packageName] === remotePath || packageName === remotePath) {
                retrievedPackageName = packageName;
                break;
            }
        }

        return retrievedPackageName;
    }

    /**
     * Returns any options defined for the requested package
     * @param {string} packageName The name of the package to check on
     * @return {{}|*} An options object
     */
    getPackageOptions(packageName) {
        if (typeof this.packageOptions[process.env.NODE_ENV][packageName] !== "undefined") {
            return this.packageOptions[process.env.NODE_ENV][packageName];
        }
        return {};
    }

    //#endregion

    //#region Data Layer - Functions relating to the interaction with the database are grouped here
    /**
     * Performs a synchronization of the provided data model with the configured database(s) to ensure that the actual
     * underlying database(s) reflect(s) what is defined in the data model
     * @param {boolean} handleErrorSilently If set to true, the function will not throw an exception when it fails
     * to sync
     * @returns {Promise<void>}
     */
    async syncDatabase(handleErrorSilently = false) {
        const syncStr = await dxUtils.getCommandLineInput("Synchronize data model with database now? [y/n]");

        if (syncStr.toLowerCase() === "y") {
            if (!(await this.dataLayer.syncDatabase())) {
                if (handleErrorSilently) {
                    console.error("Error synchronizing data model: " + JSON.stringify(this.getError(), null, 2));
                } else {
                    throw new Error("Error synchronizing data model: " + JSON.stringify(this.getError(), null, 2));
                }
            } else {
                this.dataModelState.lastDataModelSyncTimestamp = Date.now();
                this.updateDataModelState(this.dataModelState);
            }
            return;
        }

        if (handleErrorSilently) {
            dxUtils.printWarningMessage("Synchronization cancelled");
        } else {
            throw new Error("Synchronization cancelled. Cannot continue.");
        }
    }

    /**
     * Checks whether the expected base object model classes exist
     * @return {Promise<boolean>} True if all expected classes exists, false otherwise
     */
    async checkOrmBaseClassesComplete() {
        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated")) {
            return false;
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated/schemas")) {
            return false;
        }

        for (const entityName of Object.keys(this.dataModelObj)) {
            if (
                !fs.existsSync(
                    DIVBLOX_ROOT_DIR +
                        "/dx-orm/generated/" +
                        dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                        ".js"
                )
            ) {
                return false;
            }
            if (
                !fs.existsSync(
                    DIVBLOX_ROOT_DIR +
                        "/dx-orm/generated/schemas/" +
                        dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                        "-schema.js"
                )
            ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Generates the base object model classes, based on the project's complete data model
     * @return {Promise<void>}
     */
    async generateOrmBaseClasses() {
        dxUtils.printSubHeadingMessage("Generating ORM base classes from data model specification");

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated")) {
            dxUtils.printInfoMessage("Creating /dx-orm/generated/ directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated/schemas")) {
            dxUtils.printInfoMessage("Creating /dx-orm/generated/schemas directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-orm/generated/schemas");
        }

        const schemaComplete = {};

        for (const entityName of Object.keys(this.dataModelObj)) {
            dxUtils.printInfoMessage("Generating base object model class for '" + entityName + "'...");

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_"
            );
            const entityNameCamelCase = entityName;
            let entityData = "";
            let entitySchemaData = {
                id: {
                    type: "integer",
                    format: "int32",
                },
            };

            const attributes = this.dataModelObj[entityName]["attributes"];
            const relationships = this.dataModelObj[entityName]["relationships"];

            const attributeTypeMapping = {
                char: "string",
                varchar: "string",
                tinytext: "string",
                text: "string",
                mediumtext: "string",
                longtext: "string",
                binary: "string",
                varbinary: "string",
                tinyblob: "string",
                mediumblob: "string",
                blob: "string",
                longblob: "string",
                enum: "string",
                json: "string",
                date: "string",
                datetime: "string",
                timestamp: "integer",
                year: "integer",
                tinyint: "integer",
                smallint: "integer",
                mediumint: "integer",
                int: "integer",
                bigint: "integer",
                decimal: "number",
                float: "number",
                double: "number",
                real: "number",
                bit: "integer",
                boolean: "boolean",
                serial: "integer",
            };

            for (const attributeName of Object.keys(attributes)) {
                if (entityData.length > 0) {
                    entityData += "\n        ";
                }

                entityData += 'this.data["' + attributeName + '"] = ';
                const entityAttributeType =
                    typeof attributeTypeMapping[attributes[attributeName]["type"]] === "undefined"
                        ? "string"
                        : attributeTypeMapping[attributes[attributeName]["type"]];

                entitySchemaData[attributeName] = {
                    type: entityAttributeType,
                };

                switch (attributes[attributeName]["type"]) {
                    case "date":
                        entitySchemaData[attributeName]["format"] = "date";
                        break;
                    case "datetime":
                        entitySchemaData[attributeName]["format"] = "date-time";
                        break;
                    case "float":
                        entitySchemaData[attributeName]["format"] = "float";
                        break;
                    case "double":
                        entitySchemaData[attributeName]["format"] = "double";
                        break;
                }

                if (typeof attributes[attributeName]["default"] === "undefined") {
                    entityData += "null;";
                    continue;
                }

                if (
                    attributes[attributeName]["default"] === null ||
                    attributes[attributeName]["default"] === "CURRENT_TIMESTAMP"
                ) {
                    entityData += "null;";
                    continue;
                }

                entityData +=
                    isNaN(attributes[attributeName]["default"]) || attributes[attributeName]["default"].length === 0
                        ? "'" + attributes[attributeName]["default"] + "';"
                        : attributes[attributeName]["default"].toString();
            }

            for (const relationshipName of Object.keys(relationships)) {
                for (const relationshipUniqueName of relationships[relationshipName]) {
                    const finalRelationshipName = relationshipName + "_" + relationshipUniqueName;

                    if (entityData.length > 0) {
                        entityData += "\n        ";
                    }

                    entityData += 'this.data["' + finalRelationshipName + '"] = null;';
                    entitySchemaData[finalRelationshipName] = {
                        type: "integer",
                        format: "int32",
                    };
                }
            }

            schemaComplete[entityName] = entitySchemaData;

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-"),
                EntityData: entityData,
                EntitySchemaData: JSON.stringify(entitySchemaData, null, 2),
            };

            let fileContentObjectModelStr = fs.readFileSync(DIVBLOX_ROOT_DIR + "/dx-orm/object-model.tpl", "utf-8");
            let fileContentObjectSchemaStr = fs.readFileSync(DIVBLOX_ROOT_DIR + "/dx-orm/object-schema.tpl", "utf-8");

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";

                let done = false;
                while (!done) {
                    done = fileContentObjectModelStr.indexOf(search) === -1;
                    //TODO: This should be done with the replaceAll function
                    fileContentObjectModelStr = fileContentObjectModelStr.replace(search, tokensToReplace[token]);
                }

                done = false;
                while (!done) {
                    done = fileContentObjectSchemaStr.indexOf(search) === -1;
                    //TODO: This should be done with the replaceAll function
                    fileContentObjectSchemaStr = fileContentObjectSchemaStr.replace(search, tokensToReplace[token]);
                }
            }

            fs.writeFileSync(
                DIVBLOX_ROOT_DIR +
                    "/dx-orm/generated/" +
                    dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                    ".js",
                fileContentObjectModelStr
            );

            fs.writeFileSync(
                DIVBLOX_ROOT_DIR +
                    "/dx-orm/generated/schemas/" +
                    dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                    "-schema.js",
                fileContentObjectSchemaStr
            );
        }

        let fileContentDataModelSchemaStr = fs.readFileSync(
            DIVBLOX_ROOT_DIR + "/dx-orm/data-model-schema.tpl",
            "utf-8"
        );

        const search = "[SchemaData]";
        const replace = JSON.stringify(schemaComplete, null, 2);

        let done = false;
        while (!done) {
            done = fileContentDataModelSchemaStr.indexOf(search) === -1;
            //TODO: This should be done with the replaceAll function
            fileContentDataModelSchemaStr = fileContentDataModelSchemaStr.replace(search, replace);
        }

        fs.writeFileSync(
            DIVBLOX_ROOT_DIR + "/dx-orm/generated/schemas/data-model-schema.js",
            fileContentDataModelSchemaStr
        );
    }

    /**
     * Ensures that the required globalIdentifierGrouping "Super User" exists and that there is at least 1 Super user.
     * Then, it creates a JWT and stores it in the divblox-config folder for debug purposes
     * @return {Promise<boolean>}
     */
    async ensureGlobalSuperUserPresent() {
        let superUserGroupId = -1;
        const superUserGrouping = await this.dataLayer.readByField("globalIdentifierGrouping", "name", "super user");

        if (superUserGrouping === null) {
            dxUtils.printSubHeadingMessage("Initializing super user");

            const createResult = await this.dataLayer.create("globalIdentifierGrouping", {
                name: "super user",
                description: "The highest level grouping that has access to EVERYTHING",
            });

            if (createResult === -1) {
                this.populateError("Could not create super user grouping.");
                this.populateError(this.dataLayer.getError());
                return false;
            }
            superUserGroupId = createResult;
        } else {
            superUserGroupId = superUserGrouping["id"];
        }

        const superUser = await this.dataLayer.readByField("globalIdentifier", "isSuperUser", 1);

        let uniqueIdentifier = "";

        if (superUser === null) {
            // If the super user does not exist, let's create its identifier and JWT for debug purposes
            uniqueIdentifier = await this.createGlobalIdentifier("", -1, [superUserGroupId], true);
        } else {
            uniqueIdentifier = superUser.uniqueIdentifier;
        }

        const jwtToken = await this.jwtWrapper.issueJwt(uniqueIdentifier);
        const jwtPath = this.configRoot + "/super-user.jwt";

        fs.writeFileSync(jwtPath, jwtToken);

        return true;
    }

    /**
     * Returns the schema for the given entity name
     * @param {string} entityName The entity for which to return a schema
     * @param {boolean} excludeId If set to true, the schema is returned without the primary key id field
     * @return {{}|*}
     */
    getEntitySchema(entityName, excludeId = false) {
        if (typeof this.dataModelSchema[entityName] !== "undefined") {
            const returnSchema = JSON.parse(JSON.stringify(this.dataModelSchema[entityName]));

            if (excludeId) {
                delete returnSchema["id"];
            }

            return { properties: returnSchema };
        }
        return {};
    }

    /**
     * Attempts to insert a new row in the data base for the table matching the entityName
     * @param {string} entityName The name of the table to insert a row for
     * @param {*} data The relevant key/value data pairs for this entry
     * @returns {Promise<number|*>}
     */
    async create(entityName = "", data = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return -1;
        }

        const objId = await this.dataLayer.create(entityName, data);
        if (objId === -1) {
            this.populateError(this.dataLayer.getError(), true, true);
        }

        return objId;
    }

    /**
     * Selects a row from the database for the table matching entityName and id
     * @param {string} entityName The name of the table to select from
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<*>}
     */
    async read(entityName = "", id = -1) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return null;
        }

        const dataObj = await this.dataLayer.read(entityName, id);
        if (dataObj === null) {
            this.populateError(this.dataLayer.getError(), true, true);
        }

        return dataObj;
    }

    /**
     * Loads the data for a specific entity from the database
     * @param {string} entityName The entity type to load for (The table to perform a select query on)
     * @param {string} fieldName The primary key id of the relevant row
     * @param {string|number} fieldValue The primary key id of the relevant row
     * @returns {Promise<null|*>} An object with the entity's data represented or NULL
     */
    async readByField(entityName = "", fieldName = "id", fieldValue = -1) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return null;
        }

        const dataObj = await this.dataLayer.readByField(entityName, fieldName, fieldValue);
        if (dataObj === null) {
            this.populateError(this.dataLayer.getError(), true, true);
        }

        return dataObj;
    }

    /**
     * Attempts to modify a row in the database for the table matching the entityName
     * @param {string} entityName The name of the table to update a row for
     * @param {*} data The relevant key/value data pairs for this entry. Only the provided keys will be updated
     * @returns {Promise<number|*>}
     */
    async update(entityName = "", data = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!(await this.dataLayer.update(entityName, data))) {
            this.populateError(this.dataLayer.getError(), true, true);
            return false;
        }

        return true;
    }

    /**
     * Attempts to delete a row in the database for the table matching the entityName
     * @param {string} entityName The name of the table to delete a row for
     * @param {number} id The primary key id of the relevant row
     * @returns {Promise<boolean>}
     */
    async delete(entityName = "", id = -1) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!(await this.dataLayer.delete(entityName, id))) {
            this.populateError(this.dataLayer.getError(), true, true);
            return false;
        }

        return true;
    }

    /**
     * Inserts a new auditLogEntry into the database
     * @param entry The information regarding the entry
     * @param {string} entry.objectName The name of the entity that was affected
     * @param {string} entry.modificationType create|update|delete
     * @param {number} entry.objectId The database primary key id of the entity that was affected
     * @param {string} entry.entryDetail The details of the entry (What was changed)
     * @param {string} entry.globalIdentifier Optional. The uniqueIdentifier for a globalIdentifier that can be used to trace
     * the user/process that triggered the modification
     * @return {Promise<boolean>}
     */
    async addAuditLogEntry(entry = {}) {
        if (!this.isInitFinished) {
            this.populateError("Divblox initialization not finished");
            return false;
        }

        if (!(await this.dataLayer.addAuditLogEntry(entry))) {
            this.populateError(this.dataLayer.getError());
            return false;
        }

        return true;
    }
    //#endregion

    //#region Session/Authentication related functionality

    /**
     * Creates a new global id in the database. This is used to identify any other types of entities where needed.
     * @param {string} linkedEntity Optional. The name of the entity linked to this identifier
     * @param {number} linkedEntityId Optional. The id of the entity linked to this identifier.
     * For example, if we have a 'user' entity which we want to identify using a globally unique token, we will pass
     * 'user' as the entity and the id of this user object.
     * @param {[number]} globalIdentifierGroupings An array of globalIdentifierGrouping id's to which this
     * globalIdentifier will be linked.
     * @param {boolean} isSuperUser A flag to indicate whether this is a super user
     * @return {Promise<string|null>} If created successfully, it returns the globally unique id. Null, otherwise with
     * an error populated in the error array.
     */
    async createGlobalIdentifier(
        linkedEntity = "",
        linkedEntityId = -1,
        globalIdentifierGroupings = [],
        isSuperUser = false
    ) {
        const uniqueIdentifierRaw = Date.now().toString() + Math.round(1000000 * Math.random()).toString();
        const uniqueIdentifier = require("crypto").createHash("md5").update(uniqueIdentifierRaw).digest("hex");

        const objectToSave = {
            uniqueIdentifier: uniqueIdentifier,
            linkedEntity: linkedEntity,
            linkedEntityId: linkedEntityId,
            globalIdentifierGroupings: JSON.stringify(globalIdentifierGroupings),
            isSuperUser: isSuperUser ? 1 : 0,
            configurationData: "{}",
            sessionData: "{}",
        };

        const objId = await this.dataLayer.create("globalIdentifier", objectToSave);

        if (objId !== -1) {
            return uniqueIdentifier;
        }

        this.populateError("Could not create globalIdentifier");
        this.populateError(this.dataLayer.getError());

        return null;
    }

    /**
     * Updates the globalIdentifierGroupings for the given globalIdentifier
     * @param {string} uniqueIdentifier The unique id that is used to retrieve the globalIdentifier
     * @param {[number]} globalIdentifierGroupings The new array of globalIdentifierGrouping id's to which this
     * globalIdentifier will be linked.
     * @return {Promise<boolean>} True if successfully updated, false otherwise with a reason populated in the error arr
     */
    async updateGlobalIdentifierGroupings(uniqueIdentifier, globalIdentifierGroupings = []) {
        const globalIdentifier = await this.getGlobalIdentifier(uniqueIdentifier);

        if (globalIdentifier === null) {
            this.populateError("Invalid globalIdentifier id provided");
            return false;
        }

        const objectToSave = {
            id: globalIdentifier["id"],
            globalIdentifierGroupings: JSON.stringify(globalIdentifierGroupings),
        };

        return await this.dataLayer.update("globalIdentifier", objectToSave);
    }

    /**
     * Returns the globalIdentifier object from the database for the given uniqueIdentifier token
     * @param {string} uniqueIdentifier The unique identifier token
     * @return {Promise<null|*>} A globalIdentifier object if found, null otherwise with an error possibly populated
     */
    async getGlobalIdentifier(uniqueIdentifier) {
        const globalIdentifier = await this.dataLayer.readByField(
            "globalIdentifier",
            "uniqueIdentifier",
            uniqueIdentifier
        );

        if (globalIdentifier === null) {
            this.populateError(this.dataLayer.getError());
        }

        return globalIdentifier;
    }

    /**
     * Returns the globalIdentifier object from the database for the given entity and id
     * @param {string} entityName The name of the entity to search on
     * @param {number} entityId The id of the row to search on
     * @return {Promise<{}|null>} A globalIdentifier object if found, null otherwise with an error possibly populated
     */
    async getGlobalIdentifierByLinkedEntity(entityName = "none", entityId = -1) {
        const query =
            "SELECT * FROM `" +
            this.dataLayer.getSqlReadyName("globalIdentifier") +
            "` WHERE " +
            "`" +
            this.dataLayer.getSqlReadyName("linkedEntity") +
            "` = '" +
            entityName +
            "' AND " +
            "`" +
            this.dataLayer.getSqlReadyName("linkedEntityId") +
            "` = '" +
            entityId +
            "';";

        const queryResult = await this.dataLayer.executeQuery(
            query,
            this.dataLayer.getModuleNameFromEntityName(entityName)
        );

        if (queryResult === null || queryResult.length === 0) {
            this.populateError(this.dataLayer.getError());
            return null;
        }

        return this.dataLayer.transformSqlObjectToJs(queryResult[0]);
    }

    /**
     * Returns an array containing the hierarchical list of globalIdentifierGroupings for the given
     * globalIdentifier
     * @param {string} uniqueIdentifier The unique identifier token
     * @return {Promise<*[]>} An array containing the hierarchical list of globalIdentifierGroupings for the given
     * globalIdentifier
     */
    async getGlobalIdentifierGroupings(uniqueIdentifier) {
        let globalIdentifierGroupings = [];
        const globalIdentifier = await this.getGlobalIdentifier(uniqueIdentifier);

        if (globalIdentifier === null) {
            return globalIdentifierGroupings;
        }

        if (
            typeof globalIdentifier["globalIdentifierGroupings"] === "undefined" ||
            globalIdentifier["globalIdentifierGroupings"] === null
        ) {
            return globalIdentifierGroupings;
        }

        if (globalIdentifier["globalIdentifierGroupings"].length > 0) {
            for (const groupingId of JSON.parse(globalIdentifier["globalIdentifierGroupings"])) {
                globalIdentifierGroupings.push(groupingId);
            }

            let childrenArray = [];
            for (const globalIdentifierGroupingId of globalIdentifierGroupings) {
                for (const childId of await this.getGlobalIdentifierGroupingChildrenRecursive(
                    globalIdentifierGroupingId
                )) {
                    childrenArray.push(childId);
                }
            }

            for (const childId of childrenArray) {
                globalIdentifierGroupings.push(childId);
            }
        }

        return globalIdentifierGroupings;
    }

    /**
     * Recursively builds up the list of globalIdentifierGrouping id's for the given parent id
     * @param {number} parentId The id of the parent for which to get the child id's
     * @return {Promise<*[]>} An array of child id's
     */
    async getGlobalIdentifierGroupingChildrenRecursive(parentId = -1) {
        let returnArray = [];

        const moduleName = this.dataLayer.getModuleNameFromEntityName("globalIdentifierGrouping");

        const childGroupings = await this.dataLayer.executeQuery(
            "SELECT id FROM `global_identifier_grouping` WHERE `parent_grouping_id` = '" + parentId + "'",
            moduleName
        );

        if (childGroupings === null) {
            return returnArray;
        }
        for (const childGrouping of childGroupings) {
            returnArray.push(childGrouping["id"]);
            for (const childId of await this.getGlobalIdentifierGroupingChildrenRecursive(childGrouping["id"])) {
                returnArray.push(childId);
            }
        }
        return returnArray;
    }

    /**
     * Returns an array containing the hierarchical list of globalIdentifierGroupings for the given
     * globalIdentifier in readable format. This is to be used specifically with JWTs
     * @param {string} uniqueIdentifier The unique identifier token
     * @return {Promise<*[]>} An array containing the hierarchical list of readable globalIdentifierGroupings for the
     * given globalIdentifier
     */
    async getGlobalIdentifierGroupingsReadable(uniqueIdentifier) {
        let returnArray = [];
        const globalIdentifierGroupings = await this.getGlobalIdentifierGroupings(uniqueIdentifier);

        if (globalIdentifierGroupings.length === 0) {
            return returnArray;
        }

        const globalIdentifierGroupingsStr = globalIdentifierGroupings.join(",");

        const moduleName = this.dataLayer.getModuleNameFromEntityName("globalIdentifierGrouping");

        const globalIdentifierGroupingsReadable = await this.dataLayer.executeQuery(
            "SELECT * FROM global_identifier_grouping WHERE id IN(" + globalIdentifierGroupingsStr + ")",
            moduleName
        );

        if (globalIdentifierGroupingsReadable === null) {
            return returnArray;
        }

        for (const globalIdentifierGroupingReadable of globalIdentifierGroupingsReadable) {
            returnArray.push(globalIdentifierGroupingReadable["name"].toLowerCase());
        }

        return returnArray;
    }

    /**
     * A wrapper function that can be used from the command line to manage Global Identifier Groupings
     * @param {string} operation show|create|modify|remove
     * @return {Promise<void>}
     */
    async manageGlobalIdentifierGroupings(operation = "show") {
        switch (operation) {
            case "create":
                dxUtils.printHeadingMessage("Create Global Identifier Grouping");

                const createName = await dxUtils.getCommandLineInput("Please provide a name for the grouping: ");

                const createDescription = await dxUtils.getCommandLineInput(
                    "Optional: Provide a description for the grouping " + "(Leave blank to skip): "
                );

                const createParentId = await dxUtils.getCommandLineInput(
                    "Optional: Provide a parent grouping id for the " + "grouping (Leave blank to skip): "
                );

                const createResult = await this.createGlobalIdentifierGrouping(
                    createName,
                    createDescription,
                    createParentId === "" ? -1 : parseInt(createParentId)
                );

                if (!createResult) {
                    dxUtils.printErrorMessage("Error creating grouping:\n" + JSON.stringify(this.getError(), null, 2));
                } else {
                    dxUtils.printSuccessMessage("Global Identifier Grouping successfully created!");
                }
                break;
            case "modify":
                dxUtils.printHeadingMessage("Modify Global Identifier Grouping");

                const modifyName = await dxUtils.getCommandLineInput(
                    "Please provide the name of the grouping" + "to modify: "
                );

                const modifiedName = await dxUtils.getCommandLineInput(
                    "Optional: Please provide the new name " + "for the grouping (Leave blank to skip): "
                );

                const modifiedDescription = await dxUtils.getCommandLineInput(
                    "Optional: Provide a new " + "description for the grouping (Leave blank to skip): "
                );

                const modifiedParentId = await dxUtils.getCommandLineInput(
                    "Optional: Provide a new parent " +
                        "grouping id for the grouping (Leave blank to skip or provide -1 to remove): "
                );

                let modifications = {};

                if (modifiedName.length > 0) {
                    modifications["name"] = modifiedName;
                }

                if (modifiedDescription.length > 0) {
                    modifications["description"] = modifiedDescription;
                }

                if (modifiedParentId.length > 0) {
                    modifications["parentGroupingId"] = modifiedParentId;
                }

                const modifyResult = await this.modifyGlobalIdentifierGrouping(modifyName, modifications);
                if (!modifyResult) {
                    dxUtils.printErrorMessage("Error modifying grouping:\n" + JSON.stringify(this.getError(), null, 2));
                } else {
                    dxUtils.printSuccessMessage("Global Identifier Grouping successfully modified!");
                }
                break;
            case "remove":
                dxUtils.printHeadingMessage("Remove Global Identifier Grouping");

                const removeName = await dxUtils.getCommandLineInput(
                    "Please provide a name for the grouping" + "that should be removed: "
                );

                const removeResult = await this.removeGlobalIdentifierGrouping(removeName);
                if (!removeResult) {
                    dxUtils.printErrorMessage("Error removing grouping:\n" + JSON.stringify(this.getError(), null, 2));
                } else {
                    dxUtils.printSuccessMessage("Global Identifier Grouping successfully removed!");
                }
                break;
            case "show":
            default:
                dxUtils.printHeadingMessage("Available Global Identifier Groupings");
                dxUtils.printSuccessMessage(
                    JSON.stringify(await this.getGlobalIdentifierGroupingsHierarchy(), null, 2)
                );
        }
    }

    /**
     * Returns a list of all available globalIdentifierGroupings with their children
     * @return {Promise<{}>}
     */
    async getGlobalIdentifierGroupingsHierarchy() {
        const moduleName = this.dataLayer.getModuleNameFromEntityName("globalIdentifierGrouping");

        const allGroupings = await this.dataLayer.executeQuery("SELECT * FROM global_identifier_grouping", moduleName);

        let nameIdMapping = {};
        for (const grouping of allGroupings) {
            nameIdMapping[grouping["id"]] = grouping["name"].toLowerCase();
        }

        let hierarchy = {};
        for (const grouping of allGroupings) {
            const index = grouping["name"].toLowerCase();
            hierarchy[index] = {
                id: grouping["id"],
                children: [],
            };

            const children = await this.getGlobalIdentifierGroupingChildrenRecursive(grouping["id"]);
            for (const child of children) {
                hierarchy[index].children.push(nameIdMapping[child]);
            }
        }

        return hierarchy;
    }

    /**
     * Creates a new globalIdentifierGrouping in the database with the given name, description and parentId
     * @param {string} name The unique name of the globalIdentifierGrouping
     * @param {string} description Optional. A description for this grouping
     * @param {number} parentGroupingId Optional. The primary key id of the parent grouping
     * @return {Promise<boolean>} Returns true if the grouping was successfully created, false otherwise with an error
     * populated in the error array
     */
    async createGlobalIdentifierGrouping(name, description = "", parentGroupingId = -1) {
        if (typeof name === "undefined") {
            this.populateError("Could not create global identifier grouping. No name provided");
            return false;
        }

        const nameNormalized = name.toLowerCase();

        const existingGrouping = await this.dataLayer.readByField("globalIdentifierGrouping", "name", nameNormalized);

        if (existingGrouping === null) {
            const createResult = await this.dataLayer.create("globalIdentifierGrouping", {
                name: nameNormalized,
                description: description,
                parentGroupingId: parentGroupingId,
            });

            if (createResult === -1) {
                this.populateError("Could not create " + nameNormalized + " grouping.");
                this.populateError(this.dataLayer.getError());
                return false;
            }

            return true;
        } else {
            this.populateError("Could not create " + nameNormalized + " grouping. It already exists!");

            return false;
        }
    }

    /**
     * Updates the relevant globalIdentifierGrouping with the modifications provided
     * @param {string} name The unique name of the global identifier grouping to be updated
     * @param {{}} modifications The modifications to apply
     * @param {string} modifications.name Optional. The new name
     * @param {string} modifications.description Optional. The new description
     * @param {number} modifications.parentGroupingId Optional. The new parentId
     * @return {Promise<boolean>} True if the modification was successful, false otherwise with an error populated
     */
    async modifyGlobalIdentifierGrouping(name, modifications) {
        if (typeof name === "undefined") {
            this.populateError("Could not modify global identifier grouping. No name provided");
            return false;
        }

        if (typeof modifications === "undefined") {
            this.populateError("Could not modify global identifier grouping. No modification provided");
            return false;
        }

        const nameNormalized = name.toLowerCase();

        const existingGrouping = await this.dataLayer.readByField("globalIdentifierGrouping", "name", nameNormalized);

        if (existingGrouping === null) {
            this.populateError("Could not modify global identifier grouping. Invalid name provided");
            return false;
        }

        let modificationsNormalized = {};
        for (const key of Object.keys(modifications)) {
            if (key === "name") {
                modificationsNormalized[key] = modifications[key].toLowerCase();
            } else {
                modificationsNormalized[key] = modifications[key];
            }
        }

        const modificationData = { id: existingGrouping["id"], ...modificationsNormalized };
        const updateResult = await this.dataLayer.update("globalIdentifierGrouping", modificationData);

        if (!updateResult) {
            this.populateError("Could not modify " + nameNormalized + " grouping.");
            this.populateError(this.dataLayer.getError());
            return false;
        }

        return true;
    }

    /**
     * Removes the given globalIdentifierGrouping from the database
     * @param {string} name The unique name of the grouping
     * @return {Promise<boolean>} True if removed, false otherwise with an error populated
     */
    async removeGlobalIdentifierGrouping(name) {
        if (typeof name === "undefined") {
            this.populateError("Could not remove global identifier grouping. No name provided");
            return false;
        }

        const nameNormalized = name.toLowerCase();

        const existingGrouping = await this.dataLayer.readByField("globalIdentifierGrouping", "name", nameNormalized);

        if (existingGrouping === null) {
            this.populateError("Could not remove global identifier grouping. Invalid name provided");
            return false;
        }

        const children = await this.getGlobalIdentifierGroupingChildrenRecursive(existingGrouping["id"]);
        if (children.length > 0) {
            this.populateError(
                "Could not remove global identifier grouping. It has children. First remove " + "children"
            );
            return false;
        }

        const removeResult = await this.dataLayer.delete("globalIdentifierGrouping", existingGrouping["id"]);
        if (!removeResult) {
            this.populateError("Could not remove " + nameNormalized + " grouping.");
            this.populateError(this.dataLayer.getError());
            return false;
        }

        return true;
    }

    /**
     * Stores the value for the given key in the session that is identified by the given globalIdentifier
     * @param {string|null} globalIdentifier The id of the session that will be used to store the data
     * @param {string} key The key for the data
     * @param {*} value The data to store
     * @return {Promise<boolean>} True if store was successful
     */
    async storeSessionData(globalIdentifier = "", key = "", value = null) {
        // TODO: Implement this functionality
        return true;
    }

    /**
     * Retrieves the value for the given key in the session that is identified by the given globalIdentifier
     * @param {string|null} globalIdentifier The id of the session that will be used to retrieve the data
     * @param {string} key The key for the data
     * @return {Promise<string>}
     */
    async retrieveSessionData(globalIdentifier = null, key = "") {
        // TODO: Implement this functionality
        if (globalIdentifier === null) {
            return null;
        }
        return "";
    }
    //#endregion

    //#region Project specific functions (To be overridden by the developer as needed)

    /**
     * @return {string} The text value of the default global identifier grouping for the project
     */
    getDefaultGlobalIdentifierGrouping() {
        return "user";
    }

    /**
     * @return {string} The path from your project root where uploaded files will be stored
     */
    getFileUploadPath() {
        return path.join(path.resolve("./"), "/divblox-uploads");
    }

    /**
     * Processes an uploaded file. Should be called during a file upload
     * @param {*} localFileName The name of the uploaded file on the local server
     * @returns {string|null} The final static file path of the file
     */
    async processUploadedFile(localFileName = "") {
        // TODO: Override this function as needed when local file storage is not sufficient.
        // This function is intended to be used when sending files to cloud storage services, but the implementation
        // thereof is left to the developer.

        if (!fs.existsSync(this.getFileUploadPath() + "/" + localFileName)) {
            return null;
        }

        const newFileName = new Date().getTime().toString() + "_" + localFileName;
        fs.renameSync(this.getFileUploadPath() + "/" + localFileName, this.getFileUploadPath() + "/" + newFileName);

        // Let's just return a new static file path by default.
        return this.serverBaseUrl + this.uploadServePath + "/" + newFileName;
    }

    /**
     * A wrapper for your email library of choice. The user needs to align these inputs to their sendEmail/sendMail function
     * @param {string} options.fromAddress The email address to send from. This is optional. If not provided, will use the default smtp email
     * @param {[]} options.toAddresses The email address(es) to send to. An array of email addresses
     * @param {string} options.subject The subject of the email
     * @param {string} options.messageHtml The html message body
     * @param {*} options Any additional options that the user might need for their specific email implementation
     * @return {boolean} True if the email was sent, false otherwise with an error populated
     */
    async sendEmail(options = {}) {
        this.populateError(options, true);
        this.populateError("sendEmail function is NOT implemented", true);
        return false;
    }

    /**
     * A wrapper function for messaging functionality. The idea is that the developer can implement this function in their
     * project using an messaging library of their choice. Intended for platforms like telegram, whatsapp, sms, etc
     * @param {*} options Any relevant options, e.g platform, message, etc as required by the implemented messaging library
     * @return {boolean} True if the message was sent, false otherwise with an error populated
     */
    async sendMessage(options = {}) {
        this.populateError(options, true);
        this.populateError("sendMessage function is NOT implemented", true);
        return false;
    }

    /**
     * A global generic function that can be used to create globally accessible functionality. This function should be
     * overridden in your child divblox class
     * @param {string} functionName The name of the function that should be executed
     * @param {*} options Any options to pass to the executed function
     * @return {{*}} Can be anything that the implemented function returns
     */
    async executeUserDefinedFunction(functionName = "echo", options = {}) {
        switch (functionName) {
            case "echo":
                dxUtils.printInfoMessage("echo invoked: " + Date.now());
                return {};
            default:
                dxUtils.printErrorMessage("Function " + functionName + " is not implemented");
        }
        return {};
    }
    //#endregion
}

module.exports = DivbloxBase;
