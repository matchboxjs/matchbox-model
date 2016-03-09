var include = require("backyard/function/include")
var Radio = require("stations")

module.exports = Collection

function Collection() {
  Radio.call(this)
}

include(Collection, Radio)

Collection.prototype.serialize = function(property, slice) {}

Collection.prototype.parse = function(value, property) {}
