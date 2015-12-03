var inherit = require("matchbox-factory/inherit")
var Property = require("./Property")

module.exports = ModelProperty

function ModelProperty (property) {
  Property.call(this, property)
}

inherit(ModelProperty, Property)

ModelProperty.prototype.type = "model"

ModelProperty.prototype.getRawValueOf = function (model, slice) {
  return model.getSlice(slice)
}

ModelProperty.prototype.instantiate = function (data) {
  return new this.Constructor().fromRawData(data)
}
