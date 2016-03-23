var forIn = require("backyard/object/in")
var factory = require("offspring")
var CacheExtension = factory.CacheExtension
var Radio = require("stations")
var Property = require("./schema/Property")
var schema = require("./schema")
var Slice = require("./Slice")
var ArrayCollection = require("./collection/ArrayCollection")
var MapCollection = require("./collection/MapCollection")
var Storage = require("./storage/Storage")

var undefinedProperty = new Property()

// Schema

/**
 *
 * @param {Model} model
 * @param {String} propertyName
 * @return {Property}
 * */
function getProperty(model, propertyName) {
  if (inSchema(model, propertyName)) {
    var property = model.schema[propertyName]
    if (property instanceof Property) {
      return property
    }
    throw new Error("Unable to access '" + propertyName + "': Invalid property descriptor.")
  }
  else if (model.strict) {
    throw new Error("Unable to access '" + propertyName + "': Missing property descriptor.")
  }
  return undefinedProperty
}

function inSchema(model, name) {
  return !!model.schema && model.schema.hasOwnProperty(name)
}

function attemptAccess(model, propertyName) {
  if (model.strict && !inSchema(model, propertyName)) {
    throw new Error("Unable to access '" + propertyName + "': Missing property descriptor.")
  }
}

function verifyModification(model, propertyName) {
  if (model.strict && !inSchema(model, propertyName)) {
    throw new Error("Unable to modify '" + propertyName + "': Strict schema.")
  }
}

function changeValue(model, propertyName, newValue) {
  model.valuesChanged[propertyName] = newValue
  ++model.changedPropertyCount
}

function unChangeValue(model, propertyName) {
  delete model.valuesChanged[propertyName]
  --model.changedPropertyCount
}

function commitChange(model, propertyName) {
  model.valuesOriginal[propertyName] = model.valuesChanged[propertyName]
  unChangeValue(model, propertyName)
}

function broadcastPropertyChange(model, propertyName) {
  model.broadcast("change:" + propertyName)
}
function broadcastGenericChange(model) {
  model.broadcast("change")
}
function broadcastChange(model, propertyName) {
  broadcastPropertyChange(model, propertyName)
  broadcastGenericChange(model)
}

function reduceKeys(model, cb) {
  return model.keys().reduce(function(obj, key) {
    cb(key, obj)
    return obj
  }, {})
}

function transformValues(model, cb) {
  return reduceKeys(model, function(key, obj) {
    obj[key] = cb(key)
  })
}

var Model = factory({
  strict: false,
  include: [Radio],

  extensions: {
    schema: new CacheExtension(function(prototype, name, property) {
      if (!(property instanceof Property)) {
        property = schema.create(name, property)
      }
      property.name = property.name || name
      ++prototype.propertyCount
      if (!prototype.hasOwnProperty("propertyList")) {
        prototype.propertyList = []
      }
      prototype.propertyList.push(property.name)

      return property
    }),
    slices: new CacheExtension(function(prototype, name, slice) {
      if (!(slice instanceof Slice)) {
        slice = new Slice(slice)
      }

      return slice
    }),
    storage: new CacheExtension(function(prototype, name, storage) {
      if (!(storage instanceof Storage)) {
        throw new Error("Invalid block: not a storage")
      }

      return storage
    })
  },

  slices: {
    "default": "*"
  },
  schema: {},
  storage: {},

  /**
   * @constructor Model
   * @property {boolean} isChanged
   * */
  constructor: function Model() {
    var model = this
    Radio.call(this)
    this.valuesOriginal = {}
    this.valuesChanged = {}
    this.errors = {}
    this.changedPropertyCount = 0
    Model.initialize(this)
    this.keys().forEach(function(propertyName) {
      var property = getProperty(model, propertyName)
      if (property.primitive) return

      if (property.type == "model" || property.collection) {
        var value = model.get(propertyName)
        value.subscribe("change", function() {
          broadcastChange(model, propertyName)
        })
      }
    })
  },

  prototype: {
    propertyCount: 0,
    propertyList: [],
    /**
     * Ensures that the model only contains values according to its schema.
     * If true, only the properties in the model's schema are available for operations.
     * Attempting to access a property if a strict model's schema doesn't define it will throw an error.
     * */
    strict: false,

    // Conversion

    /**
     * Generic toJSON.
     *
     * @this Model
     * @return {Object}
     * */
    toJSON: function() {
      return this.slice("default")
    },
    /**
     * Stringify a property or the whole model.
     *
     * @this Model
     * @return {string}
     * */
    stringify: function() {
      return ""
    },
    /**
     * Generic toString
     * @return {String}
     * */
    toString: function() {
      return ""
    },
    /**
     * Serialize the model.
     *
     * @this Model
     * @return {Object}
     * */
    serialize: function() {
      return this.slice("default")
    },
    /**
     * Restore every value in the model with a serialized data set.
     *
     * @this Model
     * @param {*} serialized
     * @return {Model} this
     * */
    restore: function(serialized) {
      if (typeof serialized == "string") {
        try {
          serialized = JSON.parse(serialized)
        }
        catch (e) {
          console.error(e)
          throw new Error("Unable to restore model: invalid data")
        }
      }

      var model = this

      forIn(this.schema, function(name, property) {
        var serializedValue = serialized[name]
        var value

        if (serializedValue != null) {
          if (property.collection) {
            // collection
            switch (property.collection) {
              case "array":
                value = new ArrayCollection()
                break
              case "map":
                value = new MapCollection()
                break
            }
            value.parse(serializedValue, property)
          }
          else {
            // not a collection
            value = property.restore(serializedValue)
          }
          model.valuesOriginal[name] = value
        }
      })

      return this
    },

    // Storage

    /**
     * Returns a shared storage adapter
     *
     * @this Model
     * @param {String} storageName
     * @return {Storage}
     * */
    getStorage: function(storageName) {
      var storage = this.storage[storageName]
      if (!(storage instanceof Storage)) {
        throw new Error("Invalid storage: '" + storageName + "'")
      }
      return storage
    },
    /**
     * Store a slice of the model in a storage.
     *
     * @this Model
     * @param {String} storageName
     * @param {String} sliceName
     * */
    store: function(storageName, sliceName) {
      var storage = this.getStorage(storageName)
      var data = this.slice(sliceName)

      return storage.store(this, data)
    },
    /**
     * Fetch from a storage and restore the model with the data returned.
     *
     * @this Model
     * @param {String} storageName
     * */
    fetch: function(storageName) {
      var model = this
      var storage = this.getStorage(storageName)

      return storage.fetch(this).then(function(serialized) {
        model.restore(serialized)
        return model
      })
    },

    // Access

    /**
     * Get the current value of a property.
     * If the value is changed, it returns the changed value.
     * If the value is not changed, it returns the original value.
     * The original value may be the default value.
     *
     * @this Model
     * @param {String} propertyName
     * @return {*}
     * */
    get: function(propertyName) {
      if (this.isChanged(propertyName)) {
        return this.getChanged(propertyName)
      }
      if (this.isOriginal(propertyName)) {
        return this.getOriginal(propertyName)
      }
      return this.getDefault(propertyName)
    },
    /**
     * Set the value of a property.
     * If the value is the same as the current, it won't do anything.
     * If the value differs from the current and the original, it will become a changed value.
     * If the value differs from the current but is the same as the original,
     * the changed value will be removed.
     *
     * @this Model
     * @param {String} propertyName
     * @param {*} value
     * */
    set: function(propertyName, value) {
      verifyModification(this, propertyName)
      var property = getProperty(this, propertyName)
      var originalValue = this.getOriginal(propertyName)
      var defaultValue = this.getDefault(propertyName)
      if (this.isChanged(propertyName)) {
        if (property.equals(this.getChanged(propertyName), value)) {
          return
        }
        if (property.equals(originalValue, value)) {
          unChangeValue(this, propertyName)
          broadcastChange(this, propertyName)
        }
        else {
          changeValue(this, propertyName, value)
          broadcastChange(this, propertyName)
        }
      }
      else if (!property.equals(originalValue, value) && !property.equals(defaultValue, value)) {
        changeValue(this, propertyName, value)
        broadcastChange(this, propertyName)
      }
    },
    /**
     * Set the value of a property to its default.
     * If the current value is already equals to the default nothing happens.
     * If no property name is provided, all properties will be defaulted.
     *
     * @this Model
     * @param {String} [propertyName]
     * */
    reset: function(propertyName) {
      var model = this
      var changed = false
      function reset(name) {
        if (model.isChanged(name)) {
          unChangeValue(model, name)
          changed = true
        }
        if (model.isOriginal(name)) {
          delete model.valuesOriginal[name]
          changed = true
        }
        if (changed) {
          broadcastPropertyChange(model, name)
        }
      }

      if (typeof propertyName == "string") {
        reset(propertyName)
      }
      else {
        this.keys().forEach(reset)
        if (changed) {
          broadcastGenericChange(model)
        }
      }
    },
    /**
     * Update one or all original values with changed ones. Changed values will be removed.
     * If a value isn't changed, nothing happens.
     *
     * @this Model
     * @param {String} [propertyName]
     * */
    commit: function(propertyName) {
      var model = this
      function commit(name) {
        if (model.isChanged(name)) {
          commitChange(model, name, model.getChanged(name))
        }
      }
      if (typeof propertyName == "string") {
        commit(propertyName)
      }
      else {
        this.keys().forEach(commit)
      }
    },
    /**
     * Revert one or all changed values so only the original remains.
     * If a value isn't changed, nothing happens.
     *
     * @this Model
     * @param {String} [propertyName]
     * */
    revert: function(propertyName) {
      var model = this
      function revert(name) {
        if (model.isChanged(name)) {
          unChangeValue(model, name)
          broadcastChange(model, name)
        }
      }
      if (typeof propertyName == "string") {
        revert(propertyName)
      }
      else {
        this.keys().forEach(revert)
      }
    },

    // Value lists

    /**
     * Returns property names in an array.
     *
     * @this Model
     * @return {Array}
     * */
    keys: function() {
      return this.propertyList.slice()
    },
    /**
     * Returns values as an array.
     *
     * @this Model
     * @return {Array}
     * */
    values: function() {
      return this.propertyList.map(function(propertyName) {
        return this.get(propertyName)
      }, this)
    },
    /**
     * Returns the changed property names in an array.
     *
     * @this Model
     * */
    changedKeys: function() {
      return this.propertyList.filter(function(propertyName) {
        return this.isChanged(propertyName)
      }, this)
    },
    /**
     * Returns the changed values in an array.
     *
     * @this Model
     * */
    changedValues: function() {
      return this.propertyList.filter(function(propertyName) {
        return this.isChanged(propertyName)
      }, this).map(function(propertyName) {
        return this.get(propertyName)
      }, this)
    },

    // Slice & Schema

    /**
     * Return a slice of the model as a raw key-value hash.
     *
     * @this Model
     * @param {String} sliceName
     * @return {Object}
     * */
    slice: function(sliceName) {
      if (!this.slices.hasOwnProperty(sliceName)) {
        throw new Error("Unable to get slice of model: invalid slice name '" + sliceName + "'")
      }

      var model = this
      var slice = this.slices[sliceName]

      if (typeof slice.schema == "function") {
        return slice.schema(this)
      }

      var json = {}

      forIn(model.schema, function(name, property) {
        if (!slice.isInSchema(name) || model.isEmpty(name)) {
          return
        }

        var value = model.get(name)
        var subSlice = slice.getSubSlice(name)
        var fieldName = property.name
        var serialized

        if (property.collection) {
          serialized = value.serialize(this, property, subSlice)
        }
        else {
          serialized = property.serialize(value, subSlice)
        }

        json[fieldName] = serialized
      })

      return json
    },
    isDefined: function(propertyName) {
      return inSchema(this, propertyName)
    },

    // Hash getters

    /**
     * Return changed values as a key-value hash.
     *
     * @this Model
     * @return {Object}
     * */
    changes: function() {
      var model = this
      return reduceKeys(this, function(propertyName, ret) {
        if (model.isChanged(propertyName)) {
          ret[propertyName] = model.getChanged(propertyName)
        }
      })
    },
    /**
     * Return original values as a key-value hash.
     *
     * @this Model
     * @return {Object}
     * */
    originals: function() {
      return transformValues(this, this.getOriginal.bind(this))
    },
    /**
     * Return default values as a key-value hash.
     *
     * @this Model
     * @return {Object}
     * */
    defaults: function() {
      return transformValues(this, this.getDefault.bind(this))
    },
    /**
     * Get invalid values as a key-value hash.
     *
     * @this Model
     * @return {Object}
     * */
    invalids: function() {
      return this.errors
    },

    // Single value getters

    /**
     * Get the default value of a property.
     * If no property is provided, all default values of the model will be returned as a raw string-value hash.
     *
     * @this Model
     * @param {String} [propertyName]
     * @return {*}
     * */
    getDefault: function(propertyName) {
      return getProperty(this, propertyName).getDefault()
    },
    /**
     * Get the original value of a property.
     * If no property is provided, all original values of the model will be returned as a raw string-value hash.
     *
     * @this Model
     * @param {String} [propertyName]
     * @return {*}
     * */
    getOriginal: function(propertyName) {
      attemptAccess(this, propertyName)
      return this.valuesOriginal[propertyName]
    },
    /**
     * Get the changed value of a property.
     *
     * @this Model
     * @param {String} propertyName
     * @return {*}
     * */
    getChanged: function(propertyName) {
      attemptAccess(this, propertyName)
      return this.valuesChanged[propertyName]
    },
    /**
     * Get the serialized value of a property
     * @param {String} propertyName
     * @return {*}
     * */
    getRaw: function(propertyName) {
      var property = getProperty(this, propertyName)
      var value = this.get(propertyName)

      if (property.collection) {
        return value.serialize(this, property)
      }
      else {
        return property.serialize(value)
      }
    },

    // Quality and state checks

    /**
     * Check if a property has a value other than `null` or `undefined`.
     *
     * @this Model
     * @param {String} propertyName
     * @return {boolean}
     * */
    isEmpty: function(propertyName) {
      return this.get(propertyName) == null
    },
    /**
     * Check if a property has an original or changed value.
     * @param {String} propertyName
     * @return {boolean}
     * */
    isSet: function(propertyName) {
      return this.isChanged(propertyName) || this.isOriginal(propertyName)
    },
    /**
     * Check if a value or the model is changed.
     *
     * @this Model
     * @param {String} [propertyName] if provided, it only checks for that property, otherwise the whole model
     * @return {boolean}
     * */
    isChanged: function(propertyName) {
      if (typeof propertyName == "string") {
        return this.valuesChanged.hasOwnProperty(propertyName)
      }
      return this.changedPropertyCount > 0
    },
    /**
     * Check if the current value is the original
     *
     * @param {String} propertyName
     * @return {boolean}
     * */
    isOriginal: function(propertyName) {
      return !this.isChanged(propertyName) && this.valuesOriginal.hasOwnProperty(propertyName)
    },
    /**
     * Check if the current value of a property is the default one.
     *
     * @this Model
     * @param {String} [propertyName]
     * @return {boolean}
     * */
    isDefault: function(propertyName) {
      return !this.isChanged(propertyName) && !this.valuesOriginal.hasOwnProperty(propertyName)
    },
    /**
     * Check if a property has default value.
     *
     * @this Model
     * @param {String} propertyName
     * @return {boolean}
     * */
    hasDefault: function(propertyName) {
      return this.isDefined(propertyName) && getProperty(this, propertyName).hasDefault()
    },
    /**
     * Check if a property is required.
     *
     * @this Model
     * @param {String} propertyName
     * @return {boolean}
     * */
    isRequired: function(propertyName) {
      return getProperty(this, propertyName).required
    },
    /**
     * Check if a property's current value is valid.
     * It won't update the internal validation registry.
     *
     * @this Model
     * @param {String} [propertyName]
     * @return {boolean}
     * */
    isValid: function(propertyName) {
      return getProperty(this, propertyName).validate(this.get(propertyName))
    },
    /**
     * Check if a property's value equals to another value.
     *
     * @this Model
     * @param {String} propertyName
     * @param {*} value
     * @return {boolean}
     * */
    equals: function(propertyName, value) {
      return getProperty(this, propertyName).equals(this.get(propertyName), value)
    },
    /**
     * Returns the type of a property, or compares it to the given type.
     *
     * @this Model
     * @param {String} propertyName
     * @param {String} [compare]
     * @return {String|Boolean}
     * */
    typeOf: function(propertyName, compare) {
      var type = getProperty(this, propertyName).type
      if (typeof compare == "string") {
        return type === compare
      }
      return type
    },
    /**
     * Returns the constructor of a property, or compares it to its value.
     *
     * @this Model
     * @param {String} propertyName
     * @param {Function} [compare]
     * @return {Function|Boolean}
     * */
    instanceOf: function(propertyName, compare) {
      var Constructor = getProperty(this, propertyName).Constructor
      if (typeof compare == "function") {
        return this.get(propertyName) instanceof Constructor
      }
      return Constructor
    },

    // Validation

    /**
     * Validate the model or just one property according to its property rules.
     * It will update the internal validation registry.
     *
     * @this Model
     * @param {String} [propertyName]
     * @return {boolean}
     * */
    validate: function(propertyName) {
      var model = this
      var isValid = true
      this.errors = {}
      function validate(name) {
        var property = getProperty(model, name)
        var validationError = property.validate(model.get(name))
        if (validationError) {
          model.errors[name] = validationError
          isValid = false
        }
      }
      if (typeof propertyName == "string") {
        validate(propertyName)
      }
      else {
        this.keys().every(validate)
      }
      return isValid
    }
  }
})

module.exports = Model
