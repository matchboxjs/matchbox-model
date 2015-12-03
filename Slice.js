var forIn = require("matchbox-util/object/in")

module.exports = Slice

function Slice (schema) {
  this.schema = schema || {}
}

Slice.prototype.getSubSlice = function (name) {
  if (this.schema == "*" || this.schema === true) {
    return new Slice("*")
  }
  return new Slice(this.schema[name])
}

Slice.prototype.isInSchema = function (name) {
  return this.schema == "*" || this.schema === true || this.schema.hasOwnProperty(name)
}

Slice.prototype.applyTo = function (model) {
  if (typeof this.schema == "function") {
    return this.schema(model)
  }

  var slice = this
  var json = {}

  forIn(model.schema, function (name, property) {
    if (slice.isInSchema(name)) {
      if (model.hasValue(name)) {
        var value = model.getValue(name)
        var subSlice = slice.getSubSlice(name)
        json[property.name] = property.getRawDataOf(value, subSlice)
      }
    }
  })

  return json
}
