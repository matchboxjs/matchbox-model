var ArrayCollection = require("../collection/ArrayCollection")
var Map = require("../collection/MapCollection")

module.exports = Property

function Property (property) {
  property = property || {}
  this.name = property.name || ""
  this.required = property.required == null ? false : !!property.required
  this.collection = property.collection == null ? false : property.collection
  this.default = property.default == null ? null : property.default
  this.Constructor = property.Constructor || null
  if (property.instantiate) this.instantiate = property.instantiate
  this.validate = property.validate || null
}

Property.prototype.type = ""

Property.prototype.getDefault = function () {
  var defaultValue = typeof this.default == "function"
      ? this.default()
      : this.default
  var collection

  if (this.collection == "array") {
    collection = new ArrayCollection()
    if (defaultValue != null) {
      collection.fromRawData(defaultValue)
    }
    return collection
  }
  else if (this.collection == "map") {
    collection = new Map()
    if (defaultValue != null) {
      collection.fromRawData(defaultValue)
    }
    return collection
  }
  else if (this.collection == "function") {
    return new this.collection(defaultValue)
  }
  else {
    return defaultValue
  }
}

Property.prototype.getRawDataOf = function (modelData, slice) {
  var storedValue
  var collection

  if (this.collection == "array" || this.collection == "map") {
    collection = modelData
    storedValue = collection.toRawData(this, slice)
  }
  else {
    storedValue = this.getRawValueOf(modelData, slice)
  }

  return storedValue
}

Property.prototype.getRealDataFrom = function (rawData) {
  var property = this
  var collection
  var realValue

  function processValue (rawValue) {
    var parsedValue = property.getRealValueOf(rawValue)
    return property.create(parsedValue)
  }

  if (this.collection == "array") {
    collection = new ArrayCollection()
    collection.fromRawData(rawData, processValue)
    realValue = collection
  }
  else if (this.collection == "map") {
    collection = new Map()
    collection.fromRawData(rawData, processValue)
    realValue = collection
  }
  else {
    realValue = processValue(rawData)
  }

  return realValue
}

Property.prototype.getRawValueOf = function (modelValue, slice) {
  return modelValue
}

Property.prototype.getRealValueOf = function (rawValue) {
  return rawValue
}

Property.prototype.create = function (parsedValue) {
  if (typeof this.instantiate == "function") {
    return this.instantiate(parsedValue)
  }
  else if (typeof this.Constructor == "function") {
    return new this.Constructor(parsedValue)
  }
  else {
    return parsedValue
  }
}

Property.prototype.toString = function (realValue) {
  return "" + realValue
}
