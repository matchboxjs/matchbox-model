var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = FloatProperty

function FloatProperty(property) {
  Property.call(this, property)
}

inherit(FloatProperty, Property)

FloatProperty.prototype.type = "float"
