const dxUtils = require("dx-utils");
const divbloxObjectBase = require('./object-base');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');

/**
 * The DivbloxWebService is used to expose your Divblox functionality to the web. It uses expressjs for all the
 * webserver-related functionality.
 */
class DivbloxWebService extends divbloxObjectBase {
    /**
     * Sets up the divblox web service and starts an express web server
     * @param {*} config Our web service configuration, described below in more detail
     * @param {string} config.webServerPort The port to use when serving requests
     * @param {string} config.apiEndPointRoot The default api endpoint root, should be "./divblox-routes/api" if the
     * Divblox Application Generator was used to create your app.
     * * @param {string} config.wwwRoot The default www root, should be "./divblox-routes/www/index" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} config.viewsRoot The root path to your "views" folder, should be "divblox-views" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} config.staticRoot The root path to your "public" folder, should be "divblox-public" if the
     * Divblox Application Generator was used to create your app.
     */
    constructor(config = {}) {
        super();
        this.config = config;
        this.apiEndPointRoot = typeof this.config["apiEndPointRoot"] !== "undefined" ? this.config.apiEndPointRoot : './divblox-routes/api';
        this.wwwRoot = typeof this.config["wwwRoot"] !== "undefined" ? this.config.wwwRoot : './divblox-routes/www/index';
        this.viewsRoot = typeof this.config["viewsRoot"] !== "undefined" ? this.config.viewsRoot : 'divblox-views';
        this.staticRoot = typeof this.config["staticRoot"] !== "undefined" ? this.config.staticRoot : 'public';
        this.port = typeof this.config["webServerPort"] !== "undefined" ? this.config.webServerPort : 3000;

        this.express = express();
        this.express.use(logger('dev'));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(path.join(__dirname, this.staticRoot)));
        this.express.set('views', path.join(__dirname, this.viewsRoot));
        this.express.set('view engine', 'pug');

        this.addRoute('/', this.wwwRoot);
        this.addRoute('/api', this.apiEndPointRoot);
        
        // catch 404 and forward to error handler
        this.express.use(function(req, res, next) {
            next(createError(404));
        });

        // error handler
        this.express.use(function(err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });

        this.express.set('port', this.port);

        this.server = http.createServer(this.express);
        this.server.listen(this.port);
        this.server.on('error', this.onError.bind(this));
        this.server.on('listening', this.onListening.bind(this));
    }

    addRoute(path = '/', routerPath) {
        const router = require(routerPath);
        this.express.use(path, router);
    }

    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

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

    onListening() {
        const addr = this.server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind)
    }
}

module.exports = DivbloxWebService;