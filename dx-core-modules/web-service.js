const dxUtils = require("dx-utils");
const divbloxObjectBase = require('./object-base');
const createError = require('http-errors');
const express = require('express');
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

        this.addRoute('/', path.join(path.resolve("./"),this.wwwRoot));

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
        const router = express.Router();

        router.all('/', async (req, res, next) => {
            //TODO: This must be updated to look nicer
            res.render('dx-core-index', { title: 'Divblox API Root' });
        });

        let instantiatedPackages = {};
        for (const packageName of Object.keys(this.dxInstance.packages)) {
            const packageObj = this.dxInstance.packages[packageName];
            const packageEndpoint = require(path.join(path.resolve("./"), packageObj.packageRoot+"/endpoint"));

            instantiatedPackages[packageName] = packageEndpoint;

            const endpointName = packageEndpoint.endpointName === null ? packageName : packageEndpoint.endpointName

            router.all('/'+endpointName, async (req, res, next) => {
                await packageEndpoint.executeOperation(null, {"headers":req.headers,"body":req.body,"query":req.query}, this.dxInstance);

                delete packageEndpoint.result["success"];

                res.send(packageEndpoint.result);
            });

            for (const operation of Object.keys(packageEndpoint.declaredOperations)) {
                router.all('/'+endpointName+'/'+operation, async (req, res, next) => {
                    await packageEndpoint.executeOperation(operation, {"headers":req.headers,"body":req.body,"query":req.query}, this.dxInstance);
                    if (packageEndpoint.result["success"] !== true) {
                        res.status(400);

                        if (packageEndpoint.result["message"] === "Not authorized") {
                            res.status(401);
                        }
                    }

                    delete packageEndpoint.result["success"];

                    res.send(packageEndpoint.result);
                });

                const operationDefinition = packageEndpoint.declaredOperations[operation];

                for (const param of operationDefinition.parameters) {
                    if (param.in === "path") {
                        router.all('/'+endpointName+'/'+operation+"/:"+param.name, async (req, res, next) => {
                            await packageEndpoint.executeOperation(operation, {"headers":req.headers,"body":req.body,"query":req.query,"path":req[param.name]}, this.dxInstance);
                            if (packageEndpoint.result["success"] !== true) {
                                res.status(400);

                                if (packageEndpoint.result["message"] === "Not authorized") {
                                    res.status(401);
                                }
                            }

                            delete packageEndpoint.result["success"];

                            res.send(packageEndpoint.result);
                        });
                    }
                }
            }
        }

        this.addRoute('/api',undefined, router);

        const swaggerDocument = this.getSwaggerConfig(instantiatedPackages);

        if (this.useHttps) {
            this.expressHttps.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            if (this.serverHttpsConfig.allowHttp) {
                this.expressHttp.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            }
        } else {
            this.expressHttp.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        }
    }

    getSwaggerConfig(instantiatedPackages) {
        let tags = [];
        let paths = {};

        for (const packageName of Object.keys(instantiatedPackages)) {
            const packageEndpoint = instantiatedPackages[packageName];
            if (Object.keys(packageEndpoint.declaredOperations).length === 0) {
                continue;
            }

            const endpointName = packageEndpoint.endpointName === null ? packageName : packageEndpoint.endpointName;
            const endpointDescription = packageEndpoint.endpointDescription === null ? packageName : packageEndpoint.endpointDescription;

            tags.push({
                "name": endpointName,
                "description": endpointDescription,
            });

            for (const operation of Object.keys(packageEndpoint.declaredOperations)) {
                const operationDefinition = packageEndpoint.declaredOperations[operation];

                let pathParameters = "";
                for (const param of operationDefinition.parameters) {
                    if (param.in === "path") {
                        pathParameters += "/{"+param.name+"}";
                    }
                }

                const path = "/"+endpointName+"/"+operation+pathParameters;

                paths[path] = {};

                const requestBodyContent = Object.keys(operationDefinition.requestSchema).length > 0 ?
                    {"schema": operationDefinition.requestSchema} : {};

                const responseBodyContent = Object.keys(operationDefinition.responseSchema).length > 0 ?
                    {"schema": operationDefinition.responseSchema} : {};

                paths[path][operationDefinition.requestType.toLowerCase()] = {
                    "tags": [endpointName],
                    "summary": operationDefinition.operationDescription,
                    "parameters": operationDefinition.parameters,
                    "requestBody": {
                        "description": "The following should be provided in the request body",
                        "content": {
                            "application/json": requestBodyContent
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content" : {
                                "application/json" : responseBodyContent
                            }
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
                        "401": {
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
                if (operationDefinition.requiresAuthentication) {
                    paths[path][operationDefinition.requestType.toLowerCase()]["security"] = [{"bearerAuth": []}];
                }
            }
        }

        let dataModelSchema = require(DIVBLOX_ROOT_DIR+"/dx-orm/generated/schemas/data-model-schema.js");

        let schemas = {};

        for (const entity of Object.keys(dataModelSchema)) {
            const properties = dataModelSchema[entity];
            schemas[entity] = {
                "type": "object",
                "properties": {
                    ...properties
                }
            };
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
        dxUtils.printSuccessMessage('Web server listening on ' + bind)
    }

    /**
     * Called once express is setup and our https web server is listening for requests
     */
    onListeningHttps() {
        const addr = this.serverHttps.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        dxUtils.printSuccessMessage('Web server listening on ' + bind)
    }
}

module.exports = DivbloxWebService;