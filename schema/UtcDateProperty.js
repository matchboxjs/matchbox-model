var inherit = require("matchbox-factory/inherit")
var Property = require("./Property")

module.exports = UtcDateProperty

function UtcDateProperty (property) {
  Property.call(this, property)
}

inherit(UtcDateProperty, Property)

UtcDateProperty.prototype.type = "utc"

UtcDateProperty.prototype.getRawValueOf = function (modelValue) {
  return this.toString(modelValue)
}

UtcDateProperty.prototype.getRealValueOf = function (rawValue) {
  return new Date(rawValue)
}

UtcDateProperty.prototype.verifyValue = function (value) {
  return value instanceof Date
}

UtcDateProperty.prototype.toString = function (value) {
  return "" + value.getTime()
}
