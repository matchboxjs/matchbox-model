var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = DateProperty

function DateProperty(property) {
  Property.call(this, property)
}

inherit(DateProperty, Property)

DateProperty.prototype.type = "date"
DateProperty.prototype.primitive = false

DateProperty.prototype.getRawValueOf = function(modelValue) {
  return this.toString(modelValue)
}

DateProperty.prototype.getRealValueOf = function(rawValue) {
  return new Date(rawValue)
}

DateProperty.prototype.verifyValue = function(value) {
  return value instanceof Date
}

DateProperty.prototype.toString = function(value) {
  return value.toString()
}
