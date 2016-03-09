var Property = require("./Property")
var FloatProperty = require("./FloatProperty")
var DateProperty = require("./DateProperty")
var ModelProperty = require("./ModelProperty")
var BooleanProperty = require("./BooleanProperty")
var NumberProperty = require("./NumberProperty")
var StringProperty = require("./StringProperty")
var UtcDateProperty = require("./UtcDateProperty")

var schema = module.exports = {}

schema.Property = Property
schema.FloatProperty = FloatProperty
schema.DateProperty = DateProperty
schema.ModelProperty = ModelProperty
schema.BooleanProperty = BooleanProperty
schema.NumberProperty = NumberProperty
schema.StringProperty = StringProperty
schema.UtcDateProperty = UtcDateProperty

schema.create = function(name, value) {
  if (value == null) {
    return null
  }

  var type = typeof value
  var options = {
    name: name
  }

  if (Array.isArray(value)) {
    options.collection = "array"
    value = value[0]
  }

  options.default = value

  switch (type) {
    case "boolean":
      return new BooleanProperty(options)
    case "string":
      return new StringProperty(options)
    case "number":
      // note: it fails for 1.0
      if (value === +value && value !== (value | 0)) {
        return new FloatProperty(options)
      }
      return new NumberProperty(options)
    case "function":
      return new ModelProperty(options)
    default:
      return new Property(value)
  }
}
