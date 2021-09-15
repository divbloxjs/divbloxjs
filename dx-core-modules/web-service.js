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
     *
     * @param dataModel
     * @param {*} apiConfig Our api configuration, described below in more detail
     * @param {string} apiConfig.webServerPort The port to use when serving requests
     * @param {string} apiConfig.apiEndPointRoot The default api endpoint root, should be "./divblox-routes/api" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} apiConfig.viewsRoot The root path to your "views" folder, should be "divblox-views" if the
     * Divblox Application Generator was used to create your app.
     * @param {string} apiConfig.staticRoot The root path to your "public" folder, should be "public" if the
     * Divblox Application Generator was used to create your app.
     */
    constructor(dataModel = {}, apiConfig = {}) {
        super();
        this.dataModel = dataModel;
        this.apiConfig = apiConfig;
        this.apiEndPointRoot = typeof this.apiConfig["apiEndPointRoot"] !== "undefined" ? this.apiConfig.apiEndPointRoot : './divblox-routes/api';
        this.viewsRoot = typeof this.apiConfig["viewsRoot"] !== "undefined" ? this.apiConfig.viewsRoot : 'divblox-views';
        this.staticRoot = typeof this.apiConfig["staticRoot"] !== "undefined" ? this.apiConfig.staticRoot : 'public';
        this.port = typeof this.apiConfig["webServerPort"] !== "undefined" ? this.apiConfig.webServerPort : 3000;

        this.express = express();
        this.express.use(logger('dev'));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(path.join(__dirname, this.staticRoot)));
        this.express.set('views', path.join(__dirname, this.viewsRoot));
        this.express.set('view engine', 'pug');

        this.addRoute('/', this.apiEndPointRoot);
        
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