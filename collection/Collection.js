var include = require("matchbox-factory/include")
var Radio = require("matchbox-radio")

module.exports = Collection

function Collection () {
  Radio.call(this)
}

include(Collection, Radio)

Collection.prototype.toRawData = function (property, slice) {}

Collection.prototype.fromRawData = function (rawData, processValue) {}
