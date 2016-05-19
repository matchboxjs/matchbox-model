var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = DateProperty

function DateProperty(property) {
  Property.call(this, property)
}

inherit(DateProperty, Property)

DateProperty.prototype.type = "date"

DateProperty.prototype.serialize = function(modelValue) {
  return +modelValue
}

DateProperty.prototype.parse = function(rawValue) {
  return new Date(rawValue)
}
