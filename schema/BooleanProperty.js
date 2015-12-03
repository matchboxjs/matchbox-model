var inherit = require("matchbox-factory/inherit")
var Property = require("./Property")

module.exports = BooleanProperty

function BooleanProperty (property) {
  Property.call(this, property)
}

inherit(BooleanProperty, Property)

BooleanProperty.prototype.type = "boolean"
