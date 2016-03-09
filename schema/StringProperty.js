var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = StringProperty

function StringProperty(property) {
  Property.call(this, property)
}

inherit(StringProperty, Property)

StringProperty.prototype.type = "string"

StringProperty.prototype.verifyValue = function(value) {
  return typeof value == "string"
}
