var inherit = require("matchbox-factory/inherit")
var Property = require("./Property")

module.exports = NumberProperty

function NumberProperty (property) {
  Property.call(this, property)
}

inherit(NumberProperty, Property)

NumberProperty.prototype.type = "number"

NumberProperty.prototype.verifyValue = function (value) {
  return typeof value == "number" && !isNaN(value)
}
