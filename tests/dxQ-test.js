const dxQ = require("../dx-orm/query-model-base");

dxQ.findArray(
    null,
    "GlobalIdentifierGrouping",
    null,
    dxQ.orCondition(
        dxQ.like("Name", "User"),
        dxQ.notEqual("Name", "John"),
        dxQ.andCondition(dxQ.equal("Description", "Test"), dxQ.greaterOrEqual("Id", "1"))
    )
);
