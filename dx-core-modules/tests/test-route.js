var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    // res.send('Test route served');
    res.render('index', { title: 'Divblox' });
});
router.get('/api', function(req, res, next) {
    // res.send('Test route served');
    res.render('index', { title: 'Divblox' });
});

module.exports = router;
