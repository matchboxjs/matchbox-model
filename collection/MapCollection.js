var include = require("matchbox-factory/include")
var forIn = require("matchbox-util/object/in")
var Collection = require("./Collection")

module.exports = MapCollection

function MapCollection () {
  Collection.call(this)
  this.__keys = []
  this.__values = []
}

include(MapCollection, Collection)

MapCollection.prototype.toRawData = function (property, slice) {
  return this.map(function (key, modelData) {
    return property.getRawValueOf(modelData, slice)
  })
}

MapCollection.prototype.fromRawData = function (storedValue, processValue) {
  var map = this

  forIn(storedValue, function (key, value) {
    var realValue = processValue(value)
    map.set(key, realValue)
  })

  return this
}

MapCollection.prototype.keyOf = function (value) {
  var i = this.__values.indexOf(value)

  if (!!~i) {
    return this.__keys[i]
  }

  return null
}

MapCollection.prototype.get = function (key) {
  var i = this.__keys.indexOf(key)

  if (!!~i) {
    return this.__values[i]
  }
}

MapCollection.prototype.set = function (key, value) {
  var i = this.__keys.indexOf(key)

  if (!!~i) {
    if (this.__values[i] !== value) {
      this.__values.splice(i, 1, value)
      this.broadcast("change")
    }
  }
  else {
    this.__keys.push(key)
    this.__values.push(value)
    this.broadcast("change")
  }

  return value
}

MapCollection.prototype.has = function (key) {
  return !!~this.__keys.indexOf(key)
}

MapCollection.prototype.delete = function (key) {
  var i = this.__keys.indexOf(key)

  if (!!~i) {
    this.__values.splice(i, 1)
    this.broadcast("change")
    return true
  }

  return false
}

MapCollection.prototype.clear = function () {
  this.__keys = []
  this.__values = []
  this.broadcast("change")
}

MapCollection.prototype.forEach = function (cb, context) {
  this.__keys.forEach(function (key, i) {
    cb(key, this.__values[i], context || this)
  }, this)
}

MapCollection.prototype.map = function (cb, context) {
  var obj = {}
  this.__keys.forEach(function (key, i) {
    obj[key] = cb.call(this || this, key, this.__values[i])
  }, this)
  return obj
}

MapCollection.prototype.filter = function (cb, context) {
  return this.__keys.filter(function (key, i) {
    return cb(key, this.__values[i], context || this)
  }, this)
}

MapCollection.prototype.some = function (cb, context) {
  return this.__keys.some(function (key, i) {
    cb(key, this.__values[i], context || this)
  }, this)
}
