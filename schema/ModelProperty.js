var inherit = require("backyard/function/inherit")
var Property = require("./Property")

module.exports = ModelProperty

function ModelProperty(property) {
  Property.call(this, property)
}

inherit(ModelProperty, Property)

ModelProperty.prototype.type = "model"

ModelProperty.prototype.serialize = function(model, slice) {
  return model.slice(slice)
}

ModelProperty.prototype.instantiate = function(data) {
  return new this.Constructor().restore(data)
}
