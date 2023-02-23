const express = require("express");
const router = express.Router();
const dx = require("../dx-app");

router.all("/", async (req, res, next) => {
    //TODO: This must be updated to look nicer
    res.render("index", { title: "Divblox API Root" });
});

for (const packageName of Object.keys(dx.packages)) {
    const packageObj = dx.packages[packageName];
    const packageEndpoint = require("../" + packageObj.packageRoot + "/endpoint");

    router.all("/" + packageName, async (req, res, next) => {
        await packageEndpoint.executeOperation(null, { headers: req.headers, body: req.body, query: req.query }, dx);
        res.send(packageEndpoint.result);
    });
    router.all("/" + packageName + "/doc", async (req, res, next) => {
        await packageEndpoint.executeOperation("doc", { headers: req.headers, body: req.body, query: req.query }, dx);
        console.dir(packageEndpoint.result);
        //TODO: Implement this
        res.render("index", { title: "API Documentation - TO BE COMPLETED" });
    });

    for (const operation of Object.keys(packageEndpoint.declaredOperations)) {
        router.all("/" + packageName + "/" + operation, async (req, res, next) => {
            await packageEndpoint.executeOperation(
                operation,
                { headers: req.headers, body: req.body, query: req.query },
                dx
            );
            res.send(packageEndpoint.result);
        });
    }
}

module.exports = router;
