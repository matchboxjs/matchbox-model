var include = require("matchbox-factory/include")
var Collection = require("./Collection")

function ArrayCollection () {
  Collection.call(this)
}
ArrayCollection.prototype = []
include(ArrayCollection, Collection)

function change (collection, arrayMethod, args) {
  var result = Array.prototype[arrayMethod].apply(collection, args)
  collection.broadcast("change")
  return result
}

ArrayCollection.prototype.toRawData = function (property, slice) {
  return this.map(function (modelData) {
    return property.getRawValueOf(modelData, slice)
  })
}

ArrayCollection.prototype.fromRawData = function (rawData, processValue) {
  rawData.forEach(function (rawValue) {
    var realValue = processValue(rawValue)
    this.push(realValue)
  }, this)

  return this
}

ArrayCollection.prototype.at = function (index) {
  return this[index]
}

ArrayCollection.prototype.remove = function (item) {
  var index = this.indexOf(item)

  if (!!~index) {
    change(this, "splice", [index, 1])
    return true
  }

  return false
}

ArrayCollection.prototype.removeAll = function (items) {
  var changed = false

  items.forEach(function (item) {
    var index = this.indexOf(item)
    if (!!~index) {
      var result = Array.prototype.splice.call(this, index, 1)
      return true
    }
    return result
  }, this)

  if (changed) {
    this.broadcast("change")
  }

  return changed
}

// Native overrides

ArrayCollection.prototype.pop = function () {
  return change(this, "pop", arguments)
}

ArrayCollection.prototype.push = function () {
  return change(this, "push", arguments)
}

ArrayCollection.prototype.reverse = function () {
  return change(this, "reverse", arguments)
}

ArrayCollection.prototype.shift = function () {
  return change(this, "shift", arguments)
}

ArrayCollection.prototype.unshift = function () {
  return change(this, "unshift", arguments)
}

ArrayCollection.prototype.splice = function () {
  return change(this, "splice", arguments)
}

ArrayCollection.prototype.sort = function () {
  return change(this, "sort", arguments)
}

ArrayCollection.prototype.copyWithin = function () {
  return change(this, "copyWithin", arguments)
}

ArrayCollection.prototype.fill = function () {
  return change(this, "fill", arguments)
}

