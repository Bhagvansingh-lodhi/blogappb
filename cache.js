const NodeCache = require("node-cache");
module.exports = new NodeCache({ stdTTL: 60 }); // 1 minute cache
