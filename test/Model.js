var assert = require("chai").assert
var Model = require("../Model")
var schema = require("../schema/index")

function simple (name, fn) {
  var count = fn.length
  var models = []
  while (count) {
    models.unshift(new Model())
    --count
  }
  it(name, function () {
    fn.apply(null, models)
  })
}

function extended (name, def, fn) {
  var SubClass = Model.extend(def)
  it(name, function () {
    fn.call(null, new SubClass())
  })
}

function extendedModel (name, fn) {
  extended(name, {
    schema: {
      string: new schema.StringProperty(),
      number: new schema.NumberProperty(),
      float: new schema.FloatProperty(),
      boolean1: new schema.BooleanProperty(),
      boolean2: new schema.BooleanProperty()
    }
  }, fn)
}

function verifyStateUninitialized (model, property) {
  assert.equal(model.changedPropertyCount, 0)
  assert.isFalse(model.isChanged)
  assert.isFalse(model.isPropertyChanged(property))
  assert.isFalse(model.isSet(property))
  assert.isNull(model.get(property))
  assert.isNull(model.getOriginalValue(property))
  assert.isNull(model.getChangedValue(property))
  if (model.hasSchema(property)) assert.isNull(model.getDefaultValue(property))
}
function verifyStateChanged (model, property, value) {
  assert.equal(model.changedPropertyCount, 1)
  assert.isTrue(model.isChanged)
  assert.isTrue(model.isPropertyChanged(property))
  assert.isTrue(model.isSet(property))
  assert.equal(model.get(property), value)
  assert.equal(model.getValue(property), value)
  assert.equal(model.getChangedValue(property), value)
}
function verifyStateInitialized (model, property, value) {
  assert.equal(model.changedPropertyCount, 0)
  assert.isFalse(model.isChanged)
  assert.isFalse(model.isPropertyChanged(property))
  // non null
  if (model.isInitialized(property)) {
    assert.isTrue(model.isSet(property))
    assert.equal(model.getValue(property), value)
  }
  // null value
  else {
    if (model.hasSchema(property)) {
      assert.equal(model.getValue(property), model.getDefaultValue(property))
    }
  }
  assert.equal(model.get(property), value)
  assert.isNull(model.getChangedValue(property))
}

function verifyStates (model, property, value) {

  // 1. Uninitialized
  verifyStateUninitialized(model, property)

  // 2. Changed
  model.set(property, value)
  verifyStateChanged(model, property, value)

  // 3. Uninitialized/Reverted

  model.revertChange(property)
  verifyStateUninitialized(model, property)

  // 3. Committed/Initialized

  model.set(property, value)
  verifyStateChanged(model, property, value)
  model.commitChange(property)
  verifyStateInitialized(model, property, value)

  // 4. Erased/Uninitialized

  model.eraseValue(property)
  verifyStateUninitialized(model, property)
}

function verifySchemaValueChange (model, property, validValue, invalidValues) {
  verifyStates(model, property, validValue)

  invalidValues.forEach(function (invalidValue) {
    assert.throws(function () {
      model.set(property, invalidValue)
    })
  })
}

function verifyDefaultValue (model, property) {
  var schema = model.getSchema(property)
  var defaultValue = schema.getDefault()

  assert.isNull(model.get(property))
  assert.equal(model.getValue(property), defaultValue)
  assert.equal(model.getDefaultValue(property), defaultValue)
}

describe("Model", function () {

  describe("value access", function () {
    simple("string", function (model) {
      verifyStates(model, "string", "test")
    })
    simple("number", function (model) {
      verifyStates(model, "number", 1)
    })
    simple("float", function (model) {
      verifyStates(model, "float", 1.1)
    })
    simple("boolean", function (model) {
      verifyStates(model, "boolean1", true)
      verifyStates(model, "boolean2", false)
    })
    simple("array", function (model) {
      verifyStates(model, "array", [])
    })
    simple("object", function (model) {
      verifyStates(model, "object", {})
    })
    simple("null", function (model) {
      verifyStates(model, "null", null)
    })
    simple("undefined", function (model) {
      verifyStates(model, "undefined", undefined)
    })
    // TODO: date tests
    // welp..
    //simple("NaN", function (model) {
    //  verifyValueChange(model, "NaN", NaN)
    //})
  })

  describe("schema", function () {
    extendedModel("string", function (model) {
      verifySchemaValueChange(model, "string", "test", [null, undefined, [], {}, 1, false, true, NaN])
    })
    extendedModel("number", function (model) {
      verifySchemaValueChange(model, "number", 1, [null, undefined, [], {}, "test", false, true, NaN])
      verifySchemaValueChange(model, "number", 1.1, [null, undefined, [], {}, "test", false, true, NaN])
    })
    extendedModel("float", function (model) {
      verifySchemaValueChange(model, "float", 1.1, [null, undefined, [], {}, "test", false, true, NaN])
      verifySchemaValueChange(model, "float", 1, [null, undefined, [], {}, "test", false, true, NaN])
    })
    extendedModel("boolean", function (model) {
      verifySchemaValueChange(model, "boolean1", true, [null, undefined, [], {}, 1, "test", NaN])
      verifySchemaValueChange(model, "boolean2", false, [null, undefined, [], {}, 1, "test", NaN])
    })
    // TODO: date tests
  })


  describe("default value", function () {
    extendedModel("string", function (model) {
      verifyDefaultValue(model, "string", "test")
    })
    extendedModel("number", function (model) {
      verifyDefaultValue(model, "number", 1)
      verifyDefaultValue(model, "number", 1.1)
    })
    extendedModel("boolean", function (model) {
      verifyDefaultValue(model, "boolean1", true)
      verifyDefaultValue(model, "boolean2", false)
    })
    // TODO: date tests
  })

  // TODO: test collections
  // TODO: test data conversions (toJSON, fromJSON)
  // TODO: test slices
})
