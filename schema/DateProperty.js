var inherit = require("matchbox-factory/inherit")
var Property = require("./Property")

module.exports = DateProperty

function DateProperty (property) {
  Property.call(this, property)
}

inherit(DateProperty, Property)

DateProperty.prototype.type = "date"

DateProperty.prototype.getRawValueOf = function (modelValue) {
  return this.toString(modelValue)
}

DateProperty.prototype.getRealValueOf = function (rawValue) {
  return new Date(rawValue)
}

DateProperty.prototype.toString = function (value) {
  return value.toString()
}
