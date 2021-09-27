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
     */
    constructor(config = {}) {
        super();
        this.config = config;
        console.dir(this.config);
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
        this.addRoute('/api', path.join(path.resolve("./"),this.apiEndPointRoot));

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
        expressInstance.set('views', path.join(path.resolve("./"), this.viewsRoot));
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
     * Adds a route for express to use
     * @param path The url path
     * @param routerPath The path to the router script
     */
    addRoute(path = '/', routerPath) {
        const router = require(routerPath);
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
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
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
        console.log('Listening on ' + bind)
    }

    /**
     * Called once express is setup and our https web server is listening for requests
     */
    onListeningHttps() {
        const addr = this.serverHttps.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind)
    }
}

module.exports = DivbloxWebService;