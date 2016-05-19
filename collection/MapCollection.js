var include = require("backyard/function/include")
var forIn = require("backyard/object/in")
var Collection = require("./Collection")

module.exports = MapCollection

function MapCollection() {
  Collection.call(this)
  this.__keys = []
  this.__values = []
}

include(MapCollection, Collection)

MapCollection.prototype.serialize = function(property, slice) {
  return this.map(function(value) {
    return property.serialize(value, slice)
  })
}

MapCollection.prototype.parse = function(serializedMap, property) {
  var map = this

  forIn(serializedMap, function(key, serializedValue) {
    map.set(key, property.restore(serializedValue))
  })

  return this
}

MapCollection.prototype.keyOf = function(value) {
  var i = this.__values.indexOf(value)

  if (!!~i) {
    return this.__keys[i]
  }

  return null
}

MapCollection.prototype.get = function(key) {
  var i = this.__keys.indexOf(key)

  if (!!~i) {
    return this.__values[i]
  }
}

MapCollection.prototype.set = function(key, value) {
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

MapCollection.prototype.has = function(key) {
  return !!~this.__keys.indexOf(key)
}

MapCollection.prototype.delete = function(key) {
  var i = this.__keys.indexOf(key)

  if (!!~i) {
    this.__values.splice(i, 1)
    this.broadcast("change")
    return true
  }

  return false
}

MapCollection.prototype.clear = function() {
  this.__keys = []
  this.__values = []
  this.broadcast("change")
}

MapCollection.prototype.forEach = function(cb, context) {
  var collection = this
  context = context || this
  this.__keys.forEach(function(key, i) {
    cb.call(context, collection.__values[i], key, collection)
  })
}

MapCollection.prototype.map = function(cb, context) {
  var collection = this
  context = context || this
  var obj = {}
  this.__keys.forEach(function(key, i) {
    obj[key] = cb.call(context, collection.__values[i], key, collection)
  })
  return obj
}

MapCollection.prototype.reduce = function(cb, initValue, context) {
  var collection = this
  context = context || this
  return this.__keys.reduce(function(aggregateValue, key, i) {
    cb.call(context, aggregateValue, collection.__values[i], key, collection)
  }, initValue)
}

MapCollection.prototype.filter = function(cb, context) {
  var collection = this
  context = context || this
  return this.__keys.filter(function(key, i) {
    return cb.call(context, collection.__values[i], key, collection)
  })
}

MapCollection.prototype.some = function(cb, context) {
  var collection = this
  context = context || this
  return this.__keys.some(function(key, i) {
    cb.call(context, collection.__values[i], key, collection)
  })
}
