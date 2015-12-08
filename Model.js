var define = require("matchbox-util/object/define")
var factory = require("matchbox-factory")
var forIn = require("matchbox-util/object/in")
var CacheExtension = require("matchbox-factory/CacheExtension")
var Radio = require("matchbox-radio")
var Property = require("./schema/Property")
var Slice = require("./Slice")
var Storage = require("./Storage")

module.exports = factory({
  include: [Radio],

  extensions: {
    schema: new CacheExtension(function (prototype, name, property) {
      property.name = property.name || name
      ++prototype.propertyCount

      return property
    }),
    slices: new CacheExtension(function (prototype, name, slice) {
      if (!(slice instanceof Slice)) {
        slice = new Slice(slice)
      }

      return slice
    }),
    storage: new CacheExtension(function (prototype, name, storage) {
      if (typeof storage != "function") {
        console.log("Unable to create storage: initializer is not a function")
      }

      return new Storage(storage)
    })
  },

  slices: {
    'default': "*"
  },
  schema: {},
  storage: {},

  constructor: function Model() {
    define.value(this, "_values", {})
    define.value(this, "_changed", {})
    this.changedPropertyCount = 0
    Radio.call(this)
    Model.initialize(this)
  },

  accessor: {
    isChanged: function () {
      return this.changedPropertyCount > 0
    }
  },

  prototype: {
    propertyCount: 0,
    /**
     * Ensures that the model only contains values according to its schema.
     * If true, only the properties in the model's schema are available for operations.
     * Attempting to access a property if a strict model's schema doesn't define it will throw an error.
     * */
    strict: false,

    // DATA CONVERSION

    /**
     * returns the default slice (the whole model as raw json)
     * */
    toJSON: function () {
      return this.getSlice("default")
    },
    /**
     * Re-builds the model from raw data according to its schema.
     * - only sets properties defined in the schema
     * - if a property already has value it doesn't change it
     * - unset properties will be initialized to their schema default value
     *
     * @param {Object} data
     * @return {Model} this
     * */
    fromRawData: function (data) {
      if (typeof data == "string") {
        try {
          data = JSON.parse(data)
        } catch (e) {
          console.error("Unable to restore model: invalid data")
          return this
        }
      }

      var model = this

      forIn(this.schema, function (name, property) {
        var storedValue = data[name]

        if (storedValue == null) {
          if (!model.isSet(name)) {
            model._values[name] = property.getDefault()
          }
        }
        else {
          model._values[name] = property.getRealDataFrom(storedValue)
        }
      })

      return this
    },
    /**
     * Returns a slice of the model.
     * May contain the whole model, or only specific properties.
     * The returned value is a raw representation of the model suitable to store as JSON.
     *
     * @param {String} slice the defined slice name
     * @return {*}
     * */
    getSlice: function (slice) {
      if (slice == null) {
        slice = "default"
      }

      if (typeof slice == "string") {
        if (!this.slices.hasOwnProperty(slice)) {
          throw new Error("Unable to get slice of model: invalid slice name '"+slice+"'")
        }
        slice = this.slices[slice]
      }

      var rawData = slice.applyTo(this)
      return rawData
    },

    // SCHEMA

    getSchema: function (name) {
      var property
      if (this.schema && this.schema.hasOwnProperty(name)) {
        property = this.schema[name]
      }
      if (property instanceof Property) {
        return property
      }

      throw new Error("Unable to access unknown schema: '" + name + "'")
    },
    hasSchema: function (name) {
      return !!this.schema && this.schema.hasOwnProperty(name)
    },
    verifyAccess: function (name, errorMessage) {
      if (!this.strict) return true
      if (!this.hasSchema(name)) throw new Error(errorMessage || "Unable to access foreign property on strict model: '"+name+"'")
      return true
    },

    // STORAGE

    getStorage: function (name) {
      var storage
      name = name || "default"
      if (typeof name == "string") {
        storage = this.storage[name]
      }
      if (!(storage instanceof Storage)) {
        throw new Error("Invalid storage: '" + name + "'")
      }

      return storage
    },
    /**
     * Upload a slice of the model to a remote storage
     *
     * @param {String} storage
     * @param {String} slice
     * @return {Promise}
     * */
    upload: function (storage, slice) {
      if (!slice) {
        storage = slice
        slice = null
      }

      var data = this.getSlice(slice)
      var storage = this.getStorage(storage)

      return storage.upload(this, data)
    },
    /**
     * Update the model from a remote storage
     *
     * @param {String} storage
     * @return {Promise}
     * */
    update: function (storage) {
      var model = this
      var storage = this.getStorage(storage)

      return storage.update(this).then(function (response) {
        if (response.ok) {
          return response.json(function (data) {
            model.fromRawData(data)
            return model
          }).catch(function (e) {
            console.error("Failed to update model from remote storage: Invalid response data")
            throw e
          })
        }
        else {
          console.warn("Failed to update model from remote storage: Unsuccessful request with status " + storage.status)
          return response
        }
      })
    },

    // PROPERTY ACCESS

    /**
     * Returns the current active value of a property.
     * - if the value changed, the changed value
     * - otherwise the original one
     *
     * @param {String} propertyName
     * @return {*}
     * */
    get: function (propertyName) {
      this.verifyAccess(propertyName)
      return this.isPropertyChanged(propertyName)
          ? this.getChangedValue(propertyName)
          : this.getOriginalValue(propertyName)
    },
    /**
     * Returns the current value of a property.
     * - the current active value if the value is set (changed or initialized)
     * - otherwise returns the default value
     *
     * @param {String} propertyName
     * @return {*}
     * */
    getValue: function (propertyName) {
      return this.isSet(propertyName)
          ? this.get(propertyName)
          : this.getDefaultValue(propertyName)
    },
    /**
     * Returns the original value which a property was initialized with.
     *
     * @param {String} propertyName
     * @return {*}
     * */
    getOriginalValue: function (propertyName) {
      this.verifyAccess(propertyName)
      return this._values.hasOwnProperty(propertyName)
          ? this._values[propertyName]
          : null
    },
    /**
     * Returns the default schema value of a property
     *
     * @param {String} propertyName
     * @return {*}
     * */
    getDefaultValue: function (propertyName) {
      this.verifyAccess(propertyName)
      if (this.hasSchema(propertyName)) {
        var property = this.getSchema(propertyName)
        return property.getDefault()
      }
      throw new Error("Unable to access unknown default value: '" + propertyName + "'")
    },
    /**
     * Returns the changed value of a property.
     *
     * @param {String} propertyName
     * @return {*}
     * */
    getChangedValue: function (propertyName) {
      this.verifyAccess(propertyName)
      return this._changed.hasOwnProperty(propertyName)
          ? this._changed[propertyName]
          : null
    },

    // PROPERTY CHECK

    /**
     * Check if a property is changed.
     *
     * @param {String} propertyName
     * @return {boolean}
     * */
    isPropertyChanged: function (propertyName) {
      this.verifyAccess(propertyName)
      return this._changed.hasOwnProperty(propertyName)
    },
    /**
     * Check if a property was initialized with a value.
     * - an initialized value is not undefined and not null.
     *
     * @param {String} propertyName
     * @return {boolean}
     * */
    isInitialized: function (propertyName) {
      this.verifyAccess(propertyName)
      return this._values.hasOwnProperty(propertyName) && this._values[propertyName] != null
    },
    /**
     * Check if a property has a changed or initialized value.
     *
     * @param {String} propertyName
     * @return {boolean}
     * */
    isSet: function (propertyName) {
      this.verifyAccess(propertyName)
      return this.isPropertyChanged(propertyName) || this.isInitialized(propertyName)
    },
    /**
     * Check if a property has any value that is not null or undefined.
     * - has a changed value
     * - has an initialized value
     * - has a default value
     *
     * @param {String} propertyName
     * @return {boolean}
     * */
    hasValue: function (propertyName) {
      this.verifyAccess(propertyName)
      return null != this.getValue(propertyName)
    },

    // PROPERTY CHANGE

    /**
     * Sets a property's value
     * - setting a value unequal to the original will:
     *   - change the model
     *   - trigger a change event
     * - setting a value unequal to the previous changed value will:
     *   - change the model if it isn't already changed
     *   - trigger a change event
     * - setting a value to the original value from a changed will:
     *   - revert the property undoing the change
     *   - trigger a change event
     * - setting a value to its current active value will do nothing
     *
     * @param {String} propertyName
     * @param {*} value
     * @return {*} value
     * */
    set: function (propertyName, value) {
      this.verifyAccess(propertyName)
      if (this.isInitialized(value) && value == this.getOriginalValue(propertyName)) {
        this.revertChange(propertyName)
      }
      else {
        if (this.hasSchema(propertyName)) {
          var schema = this.getSchema(propertyName)
          if (!schema.verifyValue(value)) {
            throw new Error("Unable to set invalid type: " + schema.type + " " + propertyName)
          }
        }

        var changed

        if (!this.isPropertyChanged(propertyName)) {
          ++this.changedPropertyCount
          changed = true
        }
        else {
          changed = this._changed[propertyName] !== value
        }

        this._changed[propertyName] = value

        if (changed) {
          this.broadcast("change")
        }
      }
      return value
    },

    // REVERT

    /**
     * Reverts a property's changed value if it was changed before.
     *
     * @param {String} propertyName
     * @return {boolean} true if it was changed before
     * */
    revertChange: function (propertyName) {
      this.verifyAccess(propertyName)
      if (this.isPropertyChanged(propertyName)) {
        --this.changedPropertyCount
        this.broadcast("change")
      }
      return delete this._changed[propertyName]
    },
    /**
     * Reverts all changes in the model.
     *
     * @return {boolean} if the model was changed
     * */
    revertAllChanges: function () {
      var changed = this.isChanged

      this._changed = {}
      if (changed) {
        this.broadcast("change")
      }

      return changed
    },

    // COMMIT

    /**
     * Set the original value to the changed value if it was changed
     *
     * @param {String} propertyName
     * */
    commitChange: function (propertyName) {
      this.verifyAccess(propertyName)
      if (this.isPropertyChanged(propertyName)) {
        this._values[propertyName] = this._changed[propertyName]
        delete this._changed[propertyName]
        --this.changedPropertyCount
      }
    },
    /**
     * Set all values to their changed values if they were changed
     * */
    commitAllChanges: function () {
      var model = this
      forIn(this._changed, function (name) {
        model.commitChange(name)
      })
    },

    // ERASE

    /**
     * Remove the value if a property
     * Note: it doesn't remove the changed value.
     *
     * @param {String} propertyName
     * */
    eraseValue: function (propertyName) {
      this.verifyAccess(propertyName)
      this._values[propertyName] = null
    },
    /**
     * Clears the model's original values.
     * Note: it doesn't remove changed values.
     * */
    eraseAllValues: function () {
      var model = this
      forIn(this._changed, function (name) {
        model.eraseValue(name)
      })
    }
  }
})
