const dxUtils = require("dx-utilities");
const divbloxObjectBase = require("./object-base");
const DivbloxBase = require("../divblox");
const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const http = require("http");
const https = require("https");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const DIVBLOX_ROOT_DIR = path.join(__dirname, "..", "");

/**
 * The DivbloxWebService is used to expose your Divblox functionality to the web. It uses expressjs for all the
 * webserver-related functionality.
 */
class DivbloxWebService extends divbloxObjectBase {
    /**
     * Sets up the divblox web service and starts an express web server
     * @param {*} config Our web service configuration, described below in more detail
     * @param {string} config.webServerPort The port to use when serving requests
     * @param {boolean} config.useHttps If true, then we will setup a https server
     * @param {*} config.serverHttps An object containing information about the https server to setup
     * @param {string} config.serverHttps.keyPath The path to the key file for the ssl certificate
     * @param {string} config.serverHttps.certPath The path to the ssl certificate file
     * @param {boolean} config.serverHttps.allowHttp If set to true, we will spin up both http and https servers
     * @param {string} config.serverHttps.httpsPort The port to use when serving https requests
     * @param {string} config.apiEndPointRoot The default api endpoint root, should be "./divblox-routes/api" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} config.wwwRoot The default www root, should be "./divblox-routes/www/index" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} config.viewsRoot The root path to your "views" folder, should be "divblox-views" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} config.staticRoot The root path to your "public" folder, should be "divblox-public" if the
     * Divblox Application Generator was used to create your app.
     * @param {[{}]} config.additionalRoutes Additional routes to be defined for express. Each route is an object
     * containing a "location" and "router" property
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(config = {}, dxInstance = null) {
        super();

        dxUtils.printSubHeadingMessage("Starting divbloxjs Web Service");

        this.config = config;
        this.dxInstance = dxInstance;
        this.apiEndPointRoot =
            typeof this.config["apiEndPointRoot"] !== "undefined"
                ? this.config.apiEndPointRoot
                : "./divblox-routes/api";
        this.wwwRoot =
            typeof this.config["wwwRoot"] !== "undefined" ? this.config.wwwRoot : "./divblox-routes/www/index";
        this.viewsRoot = typeof this.config["viewsRoot"] !== "undefined" ? this.config.viewsRoot : "divblox-views";
        this.staticRoot = typeof this.config["staticRoot"] !== "undefined" ? this.config.staticRoot : "public";
        this.port = typeof this.config["webServerPort"] !== "undefined" ? this.config.webServerPort : 3000;
        this.corsAllowedList =
            typeof this.config["webServerCorsAllowedList"] !== "undefined"
                ? this.config["webServerCorsAllowedList"]
                : [];
        this.corsOptions =
            typeof this.config["webServerCorsOptions"] !== "undefined" ? this.config["webServerCorsOptions"] : {};
        this.useHttps = typeof this.config["useHttps"] !== "undefined" ? this.config.useHttps : false;
        this.serverHttpsConfig =
            typeof this.config["serverHttps"] !== "undefined"
                ? this.config.serverHttps
                : {
                      keyPath: null,
                      certPath: null,
                      allowHttp: true,
                      httpsPort: 3001,
                  };
        this.dxApiRouter = null;
        this.initExpress();
    }

    /**
     * Sets up an instance of express to deal with web requests
     */
    initExpress() {
        if (this.useHttps) {
            if (this.serverHttpsConfig.allowHttp) {
                this.expressHttp = express();
                this.setupExpress(this.expressHttp, this.port);
            }
            this.expressHttps = express();
            this.setupExpress(this.expressHttps, this.serverHttpsConfig.httpsPort);
        } else {
            this.expressHttp = express();
            this.setupExpress(this.expressHttp, this.port);
        }

        this.dxApiRouter = express.Router();

        this.addRoute("/", path.join(path.resolve("./"), this.wwwRoot));

        this.jwtMiddleware();

        // Additional middlewares can be added by overriding setupMiddleWares() function
        this.setupMiddleWares();

        this.setupApiRouters();

        if (typeof this.config["additionalRoutes"] !== "undefined") {
            for (const route of this.config["additionalRoutes"]) {
                this.addRoute(route.location, path.join(path.resolve("./"), route.router));
            }
        }

        if (this.useHttps) {
            this.startServer(
                {
                    key: fs.readFileSync(path.join(path.resolve("./"), this.config["serverHttps"]["keyPath"])),
                    cert: fs.readFileSync(path.join(path.resolve("./"), this.config["serverHttps"]["certPath"])),
                },
                true,
            );

            if (this.serverHttpsConfig.allowHttp) {
                this.startServer({}, false);
            }
        } else {
            this.startServer({}, false);
        }
    }

    /**
     * Sets the jwtToken in the res.locals object (jwtToken)
     * If found, value, else null
     *
     */
    jwtMiddleware() {
        this.dxApiRouter.use((req, res, next) => {
            let jwtToken = null;

            if (typeof req["headers"] !== "undefined") {
                if (typeof req["headers"]["authorization"] !== "undefined") {
                    jwtToken = req["headers"]["authorization"].replace("Bearer ", "");
                } else if (typeof req["headers"]["cookie"] !== "undefined") {
                    const cookies = req["headers"]["cookie"].split(";");

                    for (const cookie of cookies) {
                        const cookieDecoded = decodeURIComponent(cookie);
                        if (cookieDecoded.indexOf('jwt="') !== -1) {
                            jwtToken = cookieDecoded.replace('jwt="', "");
                            jwtToken = jwtToken.substring(0, jwtToken.length - 1).trim();
                        }
                    }
                }
            }

            res.locals.jwtToken = jwtToken;
            next();
        });
    }

    getFilesByExtensionRecursive(rootDir, ext, filePaths, result) {
        filePaths = filePaths || fs.readdirSync(rootDir);
        result = result || [];

        filePaths.forEach((filePath) => {
            const newRootDir = path.join(rootDir, filePath);
            if (fs.statSync(newRootDir).isDirectory()) {
                result = this.getFilesByExtensionRecursive(newRootDir, ext, fs.readdirSync(newRootDir), result);
                return;
            }

            if (filePath.endsWith(ext)) {
                result.push(newRootDir);
            }
        });
        return result;
    }

    /**
     * Handles the setup of the routers for the api endpoints. Iterates over all provided packages and installs routing
     * for each endpoint and operation
     */
    setupApiRouters() {
        dxUtils.printSubHeadingMessage("Configuring API routes");

        let instantiatedEndpointGroup = {};
        // Setup the API routes for each provided divblox package
        for (const packageNameKebabCase of Object.keys(this.dxInstance.packages)) {
            const packageObj = this.dxInstance.packages[packageNameKebabCase];
            const packageName = packageObj.packageNameCamelCase;

            let filePaths = [];
            filePaths = this.getFilesByExtensionRecursive(
                path.join(path.resolve("./"), packageObj.packageRoot),
                "endpoint.js",
            );

            filePaths.forEach((filePath) => {
                const Endpoint = require(filePath);
                const endpointConfigInstance = new Endpoint(this.dxInstance);
                endpointConfigInstance.initEndpoint();
                const endpointName = endpointConfigInstance.endpointName ?? "undefined";

                instantiatedEndpointGroup[`${packageName} / ${endpointName}`] = endpointConfigInstance;

                //#region Endpoint routes that do NOT receive operations
                this.dxApiRouter.all("/" + endpointName, async (req, res, next) => {
                    res.header("x-powered-by", "divbloxjs");
                    res.send({ message: "No operation provided" });
                });
                //#endregion

                //#region Endpoint routes that DO receive operations
                for (const configOperation of endpointConfigInstance.declaredOperations) {
                    const operationName = configOperation.operationName;
                    const finalPath = "/" + packageName + "/" + operationName;
                    // NOTE: Will be re-instantiated for every endpoint operation to prevent cross-pollination of data between requests
                    const endpoint = new Endpoint(this.dxInstance);
                    endpoint.initEndpoint();
                    const declaredOperation = endpoint.declaredOperations.filter((declaredOperation) => {
                        return (
                            declaredOperation.operationName === configOperation.operationName &&
                            declaredOperation.requestType === configOperation.requestType
                        );
                    })?.["0"];

                    //#region Endpoint operations that use inline functions from operation definitions
                    if (configOperation.f) {
                        this.executeInlineFunctionDefinition(finalPath, endpoint, declaredOperation);
                        continue;
                    }
                    //#endregion

                    //#region Endpoint operations that use the executeOperation structure to deal with function execution
                    //#region Operations without parameters
                    this.dxApiRouter.all(finalPath, async (req, res, next) => {
                        // NOTE: Re-instantiating packageEndpoint to prevent cross-pollination of data between requests
                        const endpoint = new Endpoint(this.dxInstance);
                        endpoint.initEndpoint();
                        await endpoint.executeOperation(operationName, req, res);
                        this.sendResponse(endpoint, operationName, req, res);
                    });
                    //#endregion

                    //#region Operations with parameters
                    for (const param of configOperation.parameters) {
                        if (param.in === "path") {
                            const finalPath = "/" + endpointName + "/" + operationName + "/:" + param.name;
                            this.dxApiRouter.all(finalPath, async (req, res, next) => {
                                // NOTE: Re-instantiating packageEndpoint to prevent cross-pollination of data between requests
                                const endpoint = new Endpoint(this.dxInstance);
                                endpoint.initEndpoint();
                                await endpoint.executeOperation(operationName, req, res);
                                this.sendResponse(endpoint, operationName, req, res);
                            });
                        }
                    }
                    //#endregion
                    //#endregion
                }
                //#endregion
            });
        }

        this.addRoute("/api", undefined, this.dxApiRouter);

        this.writeSwaggerDoc(instantiatedEndpointGroup);

        this.serveSwaggerUi(this.getSwaggerConfig(instantiatedEndpointGroup));
    }

    /**
     * Executes the common HTTP request types using a custom middleware to handle the inline function invocation
     * @param {string} path Endpoint operation path
     * @param packageEndpoint Instantiated package endpoint class
     * @param declaredOperation Declared operation definition
     */
    executeInlineFunctionDefinition(path, packageEndpoint, declaredOperation) {
        switch (declaredOperation.requestType) {
            case "GET":
                this.dxApiRouter.get(path, this.inlineFunctionMiddleware(packageEndpoint, declaredOperation));
                break;
            case "POST":
                this.dxApiRouter.post(path, this.inlineFunctionMiddleware(packageEndpoint, declaredOperation));
                break;
            case "PUT":
                this.dxApiRouter.put(path, this.inlineFunctionMiddleware(packageEndpoint, declaredOperation));
                break;
            case "PATCH":
                this.dxApiRouter.patch(path, this.inlineFunctionMiddleware(packageEndpoint, declaredOperation));
                break;
            case "DELETE":
                this.dxApiRouter.delete(path, this.inlineFunctionMiddleware(packageEndpoint, declaredOperation));
                break;
            default:
                break;
        }
    }

    /**
     * Handles the execution of a declared operation's inline function call
     *
     * @param packageEndpoint Instantiated package endpoint class
     * @param declaredOperation Declared operation configuration object
     * @returns {(function(import('express').Request, import('express').Response, import('express').NextFunction): Promise<void>)|*}
     */
    inlineFunctionMiddleware = (packageEndpoint, declaredOperation) => {
        return async (req, res, next) => {
            const beforeSuccess = await packageEndpoint.onBeforeExecuteOperation(
                declaredOperation.operationName,
                req,
                res,
            );
            if (!beforeSuccess) {
                this.sendResponse(packageEndpoint, declaredOperation.operationName, req, res);
                return;
            }

            await declaredOperation.f(req, res);
            this.sendResponse(packageEndpoint, declaredOperation.operationName, req, res);
        };
    };

    /**
     *
     * @param packageInstance
     * @param operationName
     * @param {import('express').Request} req The received request object
     * @param {import('express').Response} res The received response object
     */
    sendResponse(packageInstance, operationName, req, res) {
        const currentlyExecutingOperation = packageInstance.getDeclaredOperation(operationName, req.method);

        // Default status code configured in endpoint
        if (packageInstance.result?.success) {
            if (packageInstance.result.success !== true) {
                res.status(400);
            } else {
                res.status(
                    currentlyExecutingOperation.successStatusCode ? currentlyExecutingOperation.successStatusCode : 200,
                );
            }
        }

        // If result has specifically updated the status code
        if (packageInstance.statusCode) {
            res.status(packageInstance.statusCode);
        }

        if (packageInstance?.cookie && packageInstance.cookie !== null) {
            const cookie = packageInstance.cookie;
            res.cookie(cookie["name"], JSON.stringify(cookie["data"]), {
                secure: cookie["secure"],
                httpOnly: cookie["httpOnly"],
                maxAge: cookie["maxAge"],
            });
            packageInstance.cookie = null;
        }

        delete packageInstance?.result?.success;
        delete packageInstance?.result?.unauthorized;

        res.header("x-powered-by", "divbloxjs");
        res.send(packageInstance.result);
    }

    /**
     * Serves the provided swagger config document as a swagger UI on the path /api/docs
     * @param {*} swaggerDocument
     */
    serveSwaggerUi(swaggerDocument) {
        if (this.useHttps) {
            this.expressHttps.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            if (this.serverHttpsConfig.allowHttp) {
                this.expressHttp.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            }
        } else {
            this.expressHttp.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        }
    }

    /**
     * Writes the swagger config document to a json file that conforms to the openapi 3.0.3 spec
     * @param {*} instantiatedEndpointGroup
     */
    writeSwaggerDoc(instantiatedEndpointGroup = null) {
        dxUtils.printSubHeadingMessage("Configuring Swagger UI");

        if (instantiatedEndpointGroup === null) {
            dxUtils.printErrorMessage("No packages instantiated");
        }

        const swaggerDocument = this.getSwaggerConfig(instantiatedEndpointGroup);
        fs.writeFileSync(DIVBLOX_ROOT_DIR + "/dx-orm/swagger.json", JSON.stringify(swaggerDocument, null, 2));
    }

    /**
     * Returns the openapi json configuration that will be used to setup swagger ui.
     * https://swagger.io/specification/
     * @param {*} instantiatedEndpointGroup The packages that have be instantiated by the web-service
     * @return {*} A json object that conforms to the openapi 3.0.3 spec
     */
    getSwaggerConfig(instantiatedEndpointGroup) {
        const swaggerPath = this.dxInstance.configPath.replace("dxconfig.json", "swagger.json");
        if (fs.existsSync(swaggerPath)) {
            const staticConfigStr = fs.readFileSync(swaggerPath, "utf-8");
            dxUtils.printInfoMessage(
                "Swagger config was loaded from predefined swagger.json file. You can delete it to " +
                    "force divbloxjs to generate it dynamically, based on your package endpoints.",
            );
            return JSON.parse(staticConfigStr);
        } else {
            dxUtils.printInfoMessage(
                "Swagger config was dynamically generated. To use a predefined swagger config, copy " +
                    "the file located in /node_modules/divbloxjs/dx-orm/swagger.json to your divblox-config folder and modify it",
            );
        }

        let tags = [];
        let paths = {};
        let declaredEntitySchemas = [];

        for (const packageInstance of Object.values(instantiatedEndpointGroup)) {
            packageInstance.initEndpoint();
            const packageName = packageInstance.controller.packageName;
            const endpointName = packageInstance.endpointName ?? "undefined";
            const endpointDescription = packageInstance.endpointDescription ?? "Not provided";
            const tagName = `${packageName} / ${endpointName}`;

            if (packageInstance.declaredOperations.length === 0) {
                continue;
            }

            if (packageInstance.disableSwaggerDocs) {
                continue;
            }

            if (packageInstance.declaredSchemas.length > 0) {
                for (const entity of packageInstance.declaredSchemas) {
                    if (!declaredEntitySchemas.includes(entity)) {
                        declaredEntitySchemas.push(entity);
                    }
                }
            }

            tags.push({
                name: tagName,
                description: endpointDescription,
            });

            for (const operation of packageInstance.declaredOperations) {
                if (operation.disableSwaggerDoc) {
                    continue;
                }

                let parameters = operation.parameters || [];
                let operationPath = "";
                let pathParameters = operation.operationName.split("/");

                let hasIdPathParam = false;
                for (const pathParameter of pathParameters) {
                    if (pathParameter === ":id") {
                        hasIdPathParam = true;
                    }
                    if (!pathParameter.startsWith(":")) {
                        operationPath += "/" + pathParameter;
                        continue;
                    }

                    let parameterName = pathParameter.substring(1);
                    operationPath += "/{" + parameterName + "}";

                    if (parameters.some((p) => p.name == parameterName && p.in == "path")) {
                        continue;
                    }

                    parameters.push({
                        in: "path",
                        name: parameterName,
                        required: true,
                        description: `The ${parameterName} path parameter`,
                    });
                }

                const path = "/" + packageName + operationPath;
                if (typeof paths[path] === "undefined") {
                    paths[path] = {};
                }

                let requestBodyContent =
                    Object.keys(operation.requestSchema).length > 0
                        ? { "application/json": { schema: operation.requestSchema } }
                        : {};

                if (Object.keys(operation.additionalRequestSchemas).length > 0) {
                    for (const additionalSchema of Object.keys(operation.additionalRequestSchemas)) {
                        requestBodyContent[additionalSchema] = {};
                        requestBodyContent[additionalSchema]["schema"] =
                            operation.additionalRequestSchemas[additionalSchema];
                    }
                }

                //TODO: Cater for examples in endpoint spec
                /*if (Object.keys(requestBodyContent).length > 0) {
                 requestBodyContent["application/json"]["examples"] = {
                 "exampleInput":{
                 "summary": "Summary value",
                 "values": {
                 "def":"value1"
                 }
                 }
                 };
                 }*/

                let responseBodyContent =
                    Object.keys(operation.responseSchema).length > 0
                        ? { "application/json": { schema: operation.responseSchema } }
                        : {};

                if (Object.keys(operation.additionalResponseSchemas).length > 0) {
                    for (const additionalSchema of Object.keys(operation.additionalResponseSchemas)) {
                        responseBodyContent[additionalSchema] = {};
                        responseBodyContent[additionalSchema]["schema"] =
                            operation.additionalResponseSchemas[additionalSchema];
                    }
                }

                paths[path][operation.requestType.toLowerCase()] = {
                    tags: [tagName],
                    summary: operation.operationSummary,
                    description: operation.operationDescription,
                    parameters: parameters,
                    responses: {},
                };

                const defaultOperationSuccessStatusCode = operation.successStatusCode
                    ? operation.successStatusCode
                    : 200;
                const defaultOperationSuccessMessage = operation.successMessage ? operation.successMessage : "OK";

                paths[path][operation.requestType.toLowerCase()].responses[defaultOperationSuccessStatusCode] = {
                    description: defaultOperationSuccessMessage,
                    content: responseBodyContent,
                };

                paths[path][operation.requestType.toLowerCase()].responses[400] = {
                    description: "Bad request",
                    content: {
                        "application/json": {
                            schema: {
                                properties: {
                                    message: {
                                        type: "string",
                                        example: "Description of problem presented here",
                                    },
                                },
                            },
                        },
                    },
                };

                if (hasIdPathParam) {
                    paths[path][operation.requestType.toLowerCase()].responses[404] = {
                        description: "Resource not found",
                    };
                }

                paths[path][operation.requestType.toLowerCase()].responses[408] = {
                    description: "Request timed out",
                    content: {
                        "application/json": {
                            schema: {
                                properties: {
                                    message: {
                                        type: "string",
                                        example: "Internet connection poor. Please try again",
                                    },
                                },
                            },
                        },
                    },
                };

                Object.entries(operation.responses).forEach(([statusCode, config]) => {
                    paths[path][operation.requestType.toLowerCase()].responses[statusCode] = config;
                    // refer to https://swagger.io/docs/specification/describing-responses/
                    // 408: {"description":"","content":{"application/json":{"schema":{"properties":{"message":{"type":"string"}}}}}}
                });

                if (Object.keys(requestBodyContent).length > 0) {
                    paths[path][operation.requestType.toLowerCase()]["requestBody"] = {
                        description: "The following should be provided in the request body",
                        content: requestBodyContent,
                    };
                }

                if (operation.requiresAuthentication) {
                    paths[path][operation.requestType.toLowerCase()]["security"] = [{ bearerAuth: [] }];

                    const securityDescription =
                        "This operation requires JWT authentication using " +
                        "Authorization: Bearer xxxx<br>This should be sent as part of the header of the request<br><br>";

                    paths[path][operation.requestType.toLowerCase()]["responses"][401] = {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    properties: {
                                        message: {
                                            type: "string",
                                        },
                                    },
                                },
                            },
                        },
                    };

                    paths[path][operation.requestType.toLowerCase()]["description"] =
                        securityDescription + paths[path][operation.requestType.toLowerCase()]["description"];
                }
            }

            // console.log("-----------------------------------");
        }

        let dataModelSchema = require(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/data-model.schema.js");

        let schemas = {
            dataSeriesSort: {
                type: "object",
                properties: {
                    sort: {
                        type: "object",
                        properties: {
                            attributeName: {
                                type: "string",
                                enum: ["asc", "desc"],
                            },
                            attributeNameTwo: {
                                type: "string",
                                enum: ["asc", "desc"],
                            },
                        },
                    },
                },
            },
            dataSeriesFilter: {
                type: "object",
                properties: {
                    filter: {
                        type: "object",
                        properties: {
                            attributeNameOne: {
                                type: "object",
                                properties: {
                                    like: {
                                        type: "string",
                                    },
                                    eq: {
                                        type: "string",
                                    },
                                    ne: {
                                        type: "string",
                                    },
                                },
                            },
                            attributeNameTwo: {
                                type: "object",
                                properties: {
                                    lt: {
                                        type: "string",
                                    },
                                    lte: {
                                        type: "string",
                                    },
                                },
                            },
                            attributeNameThree: {
                                type: "object",
                                properties: {
                                    gt: {
                                        type: "string",
                                    },
                                    gte: {
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };

        for (const entity of Object.keys(dataModelSchema)) {
            if (!declaredEntitySchemas.includes(entity)) {
                continue;
            }

            const properties = dataModelSchema[entity];
            schemas[entity] = {
                type: "object",
                properties: {
                    ...properties,
                },
            };
        }

        if (Object.keys(schemas).length === 0) {
            dxUtils.printWarningMessage(
                "No data model entity schemas have been defined for swagger ui. You can define " +
                    "these within the package endpoint",
            );
        }

        const tokensToReplace = {
            Title: this.dxInstance.configObj.appName,
            Version:
                this.dxInstance.configObj.appVersion !== undefined ? this.dxInstance.configObj.appVersion : "1.0.0",
            Description: this.dxInstance.configObj.appName + " API documentation",
            // RootUrl: this.dxInstance.configObj.environmentArray[process.env.NODE_ENV].serverBaseUrl ?? "http://localhost",
            Tags: JSON.stringify(tags),
            Paths: JSON.stringify(paths),
            Schemas: JSON.stringify(schemas),
        };
        let swaggerTemplate = fs.readFileSync(DIVBLOX_ROOT_DIR + "/dx-orm/swagger.json.tpl", "utf-8");

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";

            let done = false;
            while (!done) {
                done = swaggerTemplate.indexOf(search) === -1;
                //TODO: This should be done with the replaceAll function
                swaggerTemplate = swaggerTemplate.replace(search, tokensToReplace[token]);
            }
        }
        return JSON.parse(swaggerTemplate);
    }

    /**
     * A simple wrapper function that sets up a few things for express
     * @param expressInstance
     * @param port
     */
    setupExpress(expressInstance, port) {
        expressInstance.set("port", this.port);

        // Default middlewares required by divbloxjs
        this.setupExpressCors(expressInstance);
        expressInstance.use(logger("dev"));
        expressInstance.use(express.json());
        expressInstance.use(express.urlencoded({ extended: false }));
        expressInstance.use(cookieParser());
        expressInstance.use(fileUpload());
        expressInstance.use(express.static(path.join(path.resolve("./"), this.staticRoot)));
        expressInstance.use(this.dxInstance.uploadServePath, express.static(this.dxInstance.getFileUploadPath()));
        ////////////////////////////////////////////

        expressInstance.set("views", [
            path.join(path.resolve("./"), this.viewsRoot),
            DIVBLOX_ROOT_DIR + "/dx-core-views",
        ]);
        expressInstance.set("view engine", "pug");

        if (!fs.existsSync(this.dxInstance.getFileUploadPath())) {
            fs.mkdirSync(this.dxInstance.getFileUploadPath());
        }
    }

    /**
     * This function is intended to be overridden by the implemented web-service class to allow
     * for any additional express middleware that the developer might want to use
     */
    setupMiddleWares() {
        // TODO: Setup additional application level middleware here using either the http or https express instances
        // Example
        /*this.expressHttp.use( (req, res, next) => {
         console.log("APP Request Type:", req.method);
         next();
         });*/
        // TODO: Setup additional route level middleware here using the apiRouter
        // Example
        /*this.dxApiRouter.use( (req, res, next) => {
         console.log("ROUTE Request Type:", req.method);
         next();
         });

         this.dxApiRouter.use("/user/:id", (req, res, next) => {
         console.log("ROUTE Request Type for user with an id:", req.method);
         next();
         });*/
    }

    /**
     * Initializes the cors configuration for expressjs, based on the provided configuration data
     * @param expressInstance
     */
    setupExpressCors(expressInstance) {
        const corsOptionsDelegate = (req, callback) => {
            if (this.corsAllowedList.indexOf(req.header("Origin")) !== -1 || this.corsAllowedList.includes("*")) {
                this.corsOptions.origin = true; // reflect (enable) the requested origin in the CORS response
            } else {
                this.corsOptions.origin = false; // disable CORS for this request
            }
            callback(null, this.corsOptions); // callback expects two parameters: error and options
        };

        expressInstance.use(cors(corsOptionsDelegate));
    }

    /**
     * Starts the relevant servers based on the provided configurations
     * @param options Typically things like ssl certs and keys
     * @param isHttps
     */
    startServer(options = {}, isHttps = false) {
        if (isHttps) {
            // Setup a redirect to swagger UI
            this.expressHttps.get("/api", async (req, res, next) => {
                res.redirect("/api/docs");
            });

            // catch 404 and forward to error handler
            this.expressHttps.use(function (req, res, next) {
                next(createError(404));
            });

            // error handler
            this.expressHttps.use(function (err, req, res, next) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get("env") === "development" ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render("error");
            });

            this.serverHttps = https.createServer(options, this.expressHttps);
            this.serverHttps.listen(this.serverHttpsConfig.httpsPort);
            this.serverHttps.on("error", this.onErrorHttps.bind(this));
            this.serverHttps.on("listening", this.onListeningHttps.bind(this));
        } else {
            // Setup a redirect to swagger UI
            this.expressHttp.get("/api", async (req, res, next) => {
                res.redirect("/api/docs");
            });

            // catch 404 and forward to error handler
            this.expressHttp.use(function (req, res, next) {
                next(createError(404));
            });

            // error handler
            this.expressHttp.use(function (err, req, res, next) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get("env") === "development" ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render("error");
            });

            this.serverHttp = http.createServer(this.expressHttp);
            this.serverHttp.listen(this.port);
            this.serverHttp.on("error", this.onErrorHttp.bind(this));
            this.serverHttp.on("listening", this.onListeningHttp.bind(this));
        }
    }

    /**
     * Adds a route for express to use. Either the routerPath or the router MUST be provided.
     * If a path is provided, it will take precedence over the provided router
     * @param {string} path The url path
     * @param {string} routerPath Optional. The path to the router script
     * @param {Router} router Optional. The router script to use
     */
    addRoute(path = "/", routerPath, router) {
        if (typeof routerPath !== "undefined") {
            router = require(routerPath);
        }
        if (typeof router === "undefined") {
            this.populateError("Invalid router or router path provided for addRoute");
            return;
        }
        if (this.useHttps) {
            this.expressHttps.use(path, router);
            if (this.serverHttpsConfig.allowHttp) {
                this.expressHttp.use(path, router);
            }
        } else {
            this.expressHttp.use(path, router);
        }
    }

    //region Helpers
    /**
     * An error handler for our http web server
     * @param error The error that was passed
     */
    onErrorHttp(error) {
        if (error.syscall !== "listen") {
            throw error;
        }

        const bind = typeof this.port === "string" ? "Pipe " + this.port : "Port " + this.port;
        this.handleError(error, bind);
    }

    /**
     * An error handler for our https web server
     * @param error The error that was passed
     */
    onErrorHttps(error) {
        if (error.syscall !== "listen") {
            throw error;
        }

        const bind =
            typeof this.serverHttpsConfig.httpsPort === "string"
                ? "Pipe " + this.serverHttpsConfig.httpsPort
                : "Port " + this.serverHttpsConfig.httpsPort;
        this.handleError(error, bind);
    }

    /**
     * An error handle function that provides a bit more info on the webserver error and forces the server to quit
     * @param error
     * @param bind
     */
    handleError(error, bind) {
        // handle specific listen errors with friendly messages
        switch (error.code) {
            case "EACCES":
                dxUtils.printErrorMessage(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case "EADDRINUSE":
                dxUtils.printErrorMessage(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Called once express is setup and our http web server is listening for requests
     */
    onListeningHttp() {
        const addr = this.serverHttp.address();
        const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

        dxUtils.printSuccessMessage("Web server listening on " + bind + ";");

        if (typeof addr !== "string") {
            dxUtils.printInfoMessage("Public Root: http://localhost:" + addr.port);
            dxUtils.printInfoMessage("API Root: http://localhost:" + addr.port + "/api");
        }
    }

    /**
     * Called once express is setup and our https web server is listening for requests
     */
    onListeningHttps() {
        const addr = this.serverHttps.address();
        const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

        dxUtils.printSuccessMessage("Web server listening on " + bind + ";");

        if (typeof addr !== "string") {
            dxUtils.printInfoMessage("Public Root: https://localhost:" + addr.port);
            dxUtils.printInfoMessage("API Root: https://localhost:" + addr.port + "/api");
        }
    }

    //endregion
}

module.exports = DivbloxWebService;
