var defaults = require("backyard/object/defaults")
var ArrayCollection = require("../collection/ArrayCollection")
var Map = require("../collection/MapCollection")

var constantIndex = 0
var ERR_REQUIRED = Property.ERR_REQUIRED = ++constantIndex
var ERR_TYPE_MISMATCH = Property.ERR_TYPE_MISMATCH = ++constantIndex

module.exports = Property

function Property(property) {
  property = defaults(property, {
    name: "",
    required: false,
    collections: null,
    default: null,
    Constructor: null,
    instantiate: null,
    validator: null
  })
  this.name = property.name
  this.required = property.required
  this.collection = property.collection
  this.default = property.default
  this.Constructor = property.Constructor
  if (property.instantiate) this.instantiate = property.instantiate
  this.validator = property.validator
}

Property.prototype.type = ""

Property.prototype.serialize = function(value, slice) {
  return value
}

Property.prototype.parse = function(serialized) {
  return serialized
}

Property.prototype.restore = function(serialized) {
  return this.create(this.parse(serialized))
}

Property.prototype.getDefault = function() {
  var defaultValue = typeof this.default == "function"
    ? this.default()
    : this.default
  var collection

  if (this.collection == "array") {
    collection = new ArrayCollection()
    if (defaultValue != null) {
      collection.parse(defaultValue)
    }
    return collection
  }
  else if (this.collection == "map") {
    collection = new Map()
    if (defaultValue != null) {
      collection.parse(defaultValue)
    }
    return collection
  }
  else if (this.collection == "function") {
    return new this.collection(defaultValue)
  }
  return defaultValue
}

Property.prototype.hasDefault = function() {
  return this.default != null
}

Property.prototype.isValid = function(value) {
  if (this.required && value == null) {
    return ERR_REQUIRED
  }
  if (this.type && typeof value != this.type) {
    return ERR_TYPE_MISMATCH
  }
  if (this.Constructor && !(value instanceof this.Constructor)) {
    return ERR_TYPE_MISMATCH
  }
}

Property.prototype.validate = function(value) {
  return this.isValid(value) || this.validator && this.validator(value)
}

Property.prototype.equals = function(value, other) {
  return value === other
}

Property.prototype.create = function(parsedValue) {
  if (typeof this.instantiate == "function") {
    return this.instantiate(parsedValue)
  }
  else if (typeof this.Constructor == "function") {
    return new this.Constructor(parsedValue)
  }
  return parsedValue
}

Property.prototype.toString = function(realValue) {
  return "" + realValue
}
