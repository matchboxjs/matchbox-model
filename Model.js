var define = require("matchbox-util/object/define")
var factory = require("matchbox-factory")
var forIn = require("matchbox-util/object/in")
var inherit = require("matchbox-factory/inherit")
var CacheExtension = require("matchbox-factory/CacheExtension")
var Radio = require("matchbox-radio")
var Property = require("./schema/Property")
var Slice = require("./Slice")

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
    })
  },

  slices: {
    'default': "*"
  },

  constructor: function Model() {
    define.value(this, "_values", {})
    define.value(this, "_changed", {})
    this.changedPropertyCount = 0
    Model.initialize(this)
  },

  accessor: {
    isChanged: function () {
      return this.changedPropertyCount > 0
    }
  },

  prototype: {
    propertyCount: 0,

    // DATA CONVERSION

    toJSON: function () {
      return this.getSlice("default")
    },
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
          if (!this.isSet(name)) {
            model._values[name] = property.getDefault()
          }
        }
        else {
          model._values[name] = property.getRealDataFrom(storedValue)
        }
      })

      return this
    },
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
      if (this.schema.hasOwnProperty(name)) {
        property = this.schema[name]
      }
      if (property instanceof Property) {
        return property
      }

      throw new Error("Unable to access unknown schema: '" + name + "'")
    },

    // PROPERTY ACCESS

    get: function (propertyName) {
      return this.isPropertyChanged(propertyName)
        ? this.getChangedValue(propertyName)
        : this.getOriginalValue(propertyName)
    },
    getValue: function (propertyName) {
      return this.isSet(propertyName)
        ? this.get(propertyName)
        : this.getDefaultValue(propertyName)
    },
    getOriginalValue: function (propertyName) {
      return this._values[propertyName]
    },
    getDefaultValue: function (propertyName) {
      var property = this.getSchema(propertyName)
      return property.getDefault()
    },
    getChangedValue: function (propertyName) {
      return this._changed[propertyName]
    },

    // PROPERTY CHECK

    isPropertyChanged: function (propertyName) {
      return this._changed.hasOwnProperty(propertyName)
    },
    isSet: function (propertyName) {
      return null != this.get(propertyName)
    },
    hasValue: function (propertyName) {
      return null != this.getValue(propertyName)
    },

    // PROPERTY CHANGE

    set: function (propertyName, value) {
      if (value == this.getOriginalValue(propertyName)) {
        this.revertChange(propertyName)
      }
      else {
        if (!this.isPropertyChanged(propertyName)) {
          ++this.changedPropertyCount
        }
        this._changed[propertyName] = value
      }
      return value
    },

    // REVERT

    revertChange: function (propertyName) {
      if (this.isPropertyChanged(propertyName)) {
        --this.changedPropertyCount
      }
      return delete this._changed[propertyName]
    },
    revertAllChanges: function () {
      var model = this
      forIn(this._changed, function (name) {
        model.revertChange(name)
      })
    },

    // COMMIT

    commitChange: function (propertyName) {
      if (this.isPropertyChanged(propertyName)) {
        this._values[propertyName] = this._changed[propertyName]
        this.revertChange(propertyName)
      }
    },
    commitAllChanges: function () {
      var model = this
      forIn(this._changed, function (name) {
        model.commitChange(name)
      })
    },

    // ERASE

    eraseValue: function (propertyName) {
      this._values[propertyName] = null
    },
    eraseAllValues: function () {
      var model = this
      forIn(this._changed, function (name) {
        model.eraseValue(name)
      })
    }
  }
})
