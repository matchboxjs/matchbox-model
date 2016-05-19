var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = UtcDateProperty

function UtcDateProperty(property) {
  Property.call(this, property)
}

inherit(UtcDateProperty, Property)

UtcDateProperty.prototype.type = "utc"

UtcDateProperty.prototype.serialize = function(modelValue) {
  return +modelValue
}

UtcDateProperty.prototype.parse = function(rawValue) {
  return new Date(rawValue)
}
