const dxUtils = require("dx-utils");
const divbloxObjectBase = require('./object-base');
const createError = require('http-errors');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const https = require('https');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const DIVBLOX_ROOT_DIR = path.join(__dirname, '..', '');

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
        this.apiEndPointRoot = typeof this.config["apiEndPointRoot"] !== "undefined" ? this.config.apiEndPointRoot : './divblox-routes/api';
        this.wwwRoot = typeof this.config["wwwRoot"] !== "undefined" ? this.config.wwwRoot : './divblox-routes/www/index';
        this.viewsRoot = typeof this.config["viewsRoot"] !== "undefined" ? this.config.viewsRoot : 'divblox-views';
        this.staticRoot = typeof this.config["staticRoot"] !== "undefined" ? this.config.staticRoot : 'public';
        this.port = typeof this.config["webServerPort"] !== "undefined" ? this.config.webServerPort : 3000;
        this.useHttps = typeof this.config["useHttps"] !== "undefined" ? this.config.useHttps : false;
        this.serverHttpsConfig =
            typeof this.config["serverHttps"] !== "undefined" ?
                this.config.serverHttps :
                {
                    "keyPath": null,
                    "certPath": null,
                    "allowHttp": true,
                    "httpsPort": 3001
                };
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

        this.addRoute('/', path.join(path.resolve("./"), this.wwwRoot));

        this.setupApiRouters();

        if (typeof this.config["additionalRoutes"] !== "undefined") {
            for (const route of this.config["additionalRoutes"]) {
                this.addRoute(route.location, path.join(path.resolve("./"), route.router));
            }
        }

        if (this.useHttps) {
            this.startServer({
                key: fs.readFileSync(path.join(path.resolve("./"),this.config["serverHttps"]["keyPath"])),
                cert: fs.readFileSync(path.join(path.resolve("./"),this.config["serverHttps"]["certPath"]))
            }, true);
            if (this.serverHttpsConfig.allowHttp) {
                this.startServer({}, false);
            }
        } else {
            this.startServer({}, false);
        }
    }

    /**
     * Handles the setup of the routers for the api endpoints. Iterates over all provided packages and installs routing
     * for each endpoint and operation
     */
    setupApiRouters() {
        dxUtils.printSubHeadingMessage("Configuring API routes");

        const router = express.Router();

        router.all('/', async (req, res, next) => {
            res.redirect('/api/docs');
        });

        let instantiatedPackages = {};
        for (const packageName of Object.keys(this.dxInstance.packages)) {
            const packageObj = this.dxInstance.packages[packageName];
            const packageEndpoint = require(path.join(path.resolve("./"), packageObj.packageRoot+"/endpoint"));
            const packageInstance = new packageEndpoint(this.dxInstance);

            instantiatedPackages[packageName] = packageInstance;

            const endpointName = packageInstance.endpointName === null ? packageName : packageInstance.endpointName

            router.all('/'+endpointName, async (req, res, next) => {
                await packageInstance.executeOperation(null,
                    {"headers": req.headers,
                            "body": req.body,
                            "query": req.query});

                delete packageInstance.result["success"];

                res.send(packageInstance.result);
            });

            let handledPaths = [];

            for (const operation of packageInstance.declaredOperations) {
                const operationName = operation.operationName;
                const finalPath = '/'+endpointName+'/'+operationName;

                if (!handledPaths.includes(finalPath)) {
                    router.all(finalPath, async (req, res, next) => {
                        await packageInstance.executeOperation(operationName,
                            {"headers": req.headers,
                                "body": req.body,
                                "query": req.query,
                                "method": req.method,
                                "files": req.files});

                        if (packageInstance.result["success"] !== true) {
                            res.status(400);

                            if (packageInstance.result["message"] === "Not authorized") {
                                res.status(401);
                            }
                        }

                        delete packageInstance.result["success"];

                        res.send(packageInstance.result);
                    });

                    handledPaths.push(finalPath);
                }
                for (const param of operation.parameters) {
                    if (param.in === "path") {
                        const finalPath = '/'+endpointName+'/'+operationName+"/:"+param.name;

                        if (!handledPaths.includes(finalPath)) {
                            router.all(finalPath, async (req, res, next) => {
                                await packageInstance.executeOperation(operationName,
                                    {"headers": req.headers,
                                        "body": req.body,
                                        "query": req.query,
                                        "path": req.params[param.name],
                                        "method": req.method,
                                        "files": req.files});

                                if (packageInstance.result["success"] !== true) {
                                    res.status(400);

                                    if (packageInstance.result["message"] === "Not authorized") {
                                        res.status(401);
                                    }
                                }

                                delete packageInstance.result["success"];

                                res.send(packageInstance.result);
                            });

                            handledPaths.push(finalPath);
                        }
                    }
                }
            }
        }

        this.addRoute('/api',undefined, router);

        dxUtils.printSubHeadingMessage("Configuring Swagger UI");

        const swaggerDocument = this.getSwaggerConfig(instantiatedPackages);
        fs.writeFileSync(DIVBLOX_ROOT_DIR+"/dx-orm/swagger.json", JSON.stringify(swaggerDocument,null,2));

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
     * Returns the openapi json configuration that will be used to setup swagger ui.
     * https://swagger.io/specification/
     * @param {*} instantiatedPackages The packages that have be instantiated by the web-service
     * @return {*} A json object that conforms to the openapi 3.0.3 spec
     */
    getSwaggerConfig(instantiatedPackages) {
        const swaggerPath = this.dxInstance.configPath.replace("dxconfig.json","swagger.json");
        if (fs.existsSync(swaggerPath)) {
            const staticConfigStr = fs.readFileSync(swaggerPath,'utf-8');
            dxUtils.printInfoMessage("Swagger config was loaded from predefined swagger.json file. You can delete it to " +
                "force divbloxjs to generate it dynamically, based on your package endpoints.");
            return JSON.parse(staticConfigStr);
        } else {
            dxUtils.printInfoMessage("Swagger config was dynamically generated. To use a predefined swagger config, copy " +
                "the file located in /node_modules/divbloxjs/dx-orm/swagger.json to your divblox-config folder and modify it");
        }

        let tags = [];
        let paths = {};
        let declaredEntitySchemas = [];

        for (const packageName of Object.keys(instantiatedPackages)) {
            const packageInstance = instantiatedPackages[packageName];
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

            const endpointName = packageInstance.endpointName === null ? packageName : packageInstance.endpointName;
            const endpointDescription = packageInstance.endpointDescription === null ? packageName : packageInstance.endpointDescription;

            tags.push({
                "name": endpointName,
                "description": endpointDescription,
            });

            for (const operation of packageInstance.declaredOperations) {
                if (operation.disableSwaggerDoc) {
                    continue;
                }
                const operationName = operation.operationName;

                let pathParameters = "";
                for (const param of operation.parameters) {
                    if (param.in === "path") {
                        pathParameters += "/{"+param.name+"}";
                    }
                }

                const path = "/"+endpointName+"/"+operationName+pathParameters;

                if (typeof paths[path] === "undefined") {
                    paths[path] = {};
                }

                let requestBodyContent = Object.keys(operation.requestSchema).length > 0 ?
                    {"application/json":
                            {"schema": operation.requestSchema}
                    } : {};

                if (Object.keys(operation.additionalRequestSchemas).length > 0) {
                    for (const additionalSchema of Object.keys(operation.additionalRequestSchemas)) {
                        requestBodyContent[additionalSchema] = {};
                        requestBodyContent[additionalSchema]["schema"] = operation.additionalRequestSchemas[additionalSchema];
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

                let responseBodyContent = Object.keys(operation.responseSchema).length > 0 ?
                    {"application/json":
                            {"schema": operation.responseSchema}
                    } : {};

                if (Object.keys(operation.additionalResponseSchemas).length > 0) {
                    for (const additionalSchema of Object.keys(operation.additionalResponseSchemas)) {
                        responseBodyContent[additionalSchema] = {};
                        responseBodyContent[additionalSchema]["schema"] = operation.additionalResponseSchemas[additionalSchema];
                    }
                }

                paths[path][operation.requestType.toLowerCase()] = {
                    "tags": [endpointName],
                    "summary": operation.operationSummary,
                    "description": operation.operationDescription,
                    "parameters": operation.parameters,
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content" : responseBodyContent
                        },
                        "400": {
                            "description": "Bad request",
                            "content" : {
                                "application/json" : {
                                    "schema": {
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "408": {
                            "description": "Request timed out",
                            "content" : {
                                "application/json" : {
                                    "schema": {
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (Object.keys(requestBodyContent).length > 0) {
                    paths[path][operation.requestType.toLowerCase()]["requestBody"] =
                        {
                            "description": "The following should be provided in the request body",
                            "content": requestBodyContent
                        }
                }

                if (operation.requiresAuthentication) {
                    paths[path][operation.requestType.toLowerCase()]["security"] = [{"bearerAuth": []}];

                    const securityDescription = "This operation requires JWT authentication using " +
                        "Authorization: Bearer xxxx<br>This should be sent as part of the header of the request<br><br>";

                    paths[path][operation.requestType.toLowerCase()]["responses"]["401"] = {
                        "description": "Unauthorized",
                        "content" : {
                            "application/json" : {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    };

                    paths[path][operation.requestType.toLowerCase()]["description"] =
                        securityDescription +
                        paths[path][operation.requestType.toLowerCase()]["description"];
                }
            }
        }

        let dataModelSchema = require(DIVBLOX_ROOT_DIR+"/dx-orm/generated/schemas/data-model-schema.js");

        let schemas = {};

        for (const entity of Object.keys(dataModelSchema)) {
            if (!declaredEntitySchemas.includes(entity)) { continue; }

            const properties = dataModelSchema[entity];
            schemas[entity] = {
                "type": "object",
                "properties": {
                    ...properties
                }
            };
        }

        if (Object.keys(schemas).length === 0) {
            dxUtils.printWarningMessage("No data model entity schemas have been defined for swagger ui. You can define " +
                "these within the package endpoint");
        }

        const tokensToReplace = {
            "Title": this.dxInstance.configObj.appName,
            "Description": this.dxInstance.configObj.appName + " API documentation",
            "Tags": JSON.stringify(tags),
            "Paths": JSON.stringify(paths),
            "Schemas": JSON.stringify(schemas)
        };
        let swaggerTemplate = fs.readFileSync(DIVBLOX_ROOT_DIR+"/dx-orm/swagger.json.tpl",'utf-8');

        for (const token of Object.keys(tokensToReplace)) {
            const search = '['+token+']';

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
        expressInstance.set('port', this.port);
        expressInstance.use(logger('dev'));
        expressInstance.use(express.json());
        expressInstance.use(express.urlencoded({ extended: false }));
        expressInstance.use(cookieParser());
        expressInstance.use(fileUpload());
        expressInstance.use(express.static(path.join(path.resolve("./"), this.staticRoot)));
        expressInstance.set('views',
            [path.join(path.resolve("./"), this.viewsRoot),
                DIVBLOX_ROOT_DIR+'/dx-core-views']);
        expressInstance.set('view engine', 'pug');
    }

    /**
     * Starts the relevant servers based on the provided configurations
     * @param options Typically things like ssl certs and keys
     * @param isHttps
     */
    startServer(options = {}, isHttps = false) {
        if (isHttps) {
            // catch 404 and forward to error handler
            this.expressHttps.use(function(req, res, next) {
                next(createError(404));
            });

            // error handler
            this.expressHttps.use(function(err, req, res, next) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render('error');
            });

            this.serverHttps = https.createServer(options, this.expressHttps);
            this.serverHttps.listen(this.serverHttpsConfig.httpsPort);
            this.serverHttps.on('error', this.onErrorHttps.bind(this));
            this.serverHttps.on('listening', this.onListeningHttps.bind(this));
        } else {
            // catch 404 and forward to error handler
            this.expressHttp.use(function(req, res, next) {
                next(createError(404));
            });

            // error handler
            this.expressHttp.use(function(err, req, res, next) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render('error');
            });

            this.serverHttp = http.createServer(this.expressHttp);
            this.serverHttp.listen(this.port);
            this.serverHttp.on('error', this.onErrorHttp.bind(this));
            this.serverHttp.on('listening', this.onListeningHttp.bind(this));
        }
    }

    /**
     * Adds a route for express to use. Either the routerPath or the router MUST be provided.
     * If a path is provided, it will take precedence over the provided router
     * @param {string} path The url path
     * @param {string} routerPath Optional. The path to the router script
     * @param {Router} router Optional. The router script to use
     */
    addRoute(path = '/', routerPath, router) {
        if (typeof routerPath !== "undefined") {
            router = require(routerPath);
        }
        if (typeof router === "undefined") {
            this.populateError("Invalid router or router path provided for addRoute")
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

    /**
     * An error handler for our http web server
     * @param error The error that was passed
     */
    onErrorHttp(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;
        this.handleError(error, bind);
    }

    /**
     * An error handler for our https web server
     * @param error The error that was passed
     */
    onErrorHttps(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof this.serverHttpsConfig.httpsPort === 'string'
            ? 'Pipe ' + this.serverHttpsConfig.httpsPort
            : 'Port ' + this.serverHttpsConfig.httpsPort;
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
            case 'EACCES':
                dxUtils.printErrorMessage(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                dxUtils.printErrorMessage(bind + ' is already in use');
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
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        dxUtils.printSuccessMessage('Web server listening on '+bind+';');

        if (typeof addr !== 'string') {
            dxUtils.printInfoMessage('Public Root: http://localhost:'+addr.port);
            dxUtils.printInfoMessage('API Root: http://localhost:'+addr.port+'/api');
        }
    }

    /**
     * Called once express is setup and our https web server is listening for requests
     */
    onListeningHttps() {
        const addr = this.serverHttps.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        dxUtils.printSuccessMessage('Web server listening on '+bind+';');

        if (typeof addr !== 'string') {
            dxUtils.printInfoMessage('Public Root: https://localhost:'+addr.port);
            dxUtils.printInfoMessage('API Root: https://localhost:'+addr.port+'/api');
        }
    }
}

module.exports = DivbloxWebService;