var assert = require("chai").assert
var Model = require("../Model")
var schema = require("../schema")

function createModel(schemaObject) {
  return new (Model.extend({
    schema: schemaObject
  }))
}

function testModel(testTitle, testData, testFn) {
  if (typeof testFn != "function") {
    testFn = testData
    testData = null
  }
  it(testTitle, function() {
    testFn(new Model(testData))
  })
}

function testProperty(testTitle, schemaObject, testFn) {
  it(testTitle, function() {
    var propertyDef = {}
    propertyDef[TEST_PROPERTY_NAME] = schemaObject
    testFn(createModel(propertyDef))
  })
}

function testSchema(testTitle, schemaObject, testFn) {
  it(testTitle, function() {
    testFn(createModel(schemaObject))
  })
}

function testEvents(model, events, testFn, testArgsFn) {
  var called = []
  events.forEach(function(event) {
    model.subscribe(event, function() {
      called.push([event, arguments])
    })
  })
  testFn()
  //assert.equal(events.length, called.length, "Not enough event fired")
  events.forEach(function(event, i) {
    assert.isArray(called[i], "Event did not fire: " + event)
    assert.equal(called[i][0], event, "Wrong event order: " + event)
  })
  typeof testArgsFn == "function" && testArgsFn(called.reduce(function(obj, callValue) {
    obj[callValue[0]] = callValue[1]
    return obj
  }, {}))
}

function verifyValue(model, expectedValues) {
  if (Array.isArray(expectedValues)) {
    assert.include(expectedValues, model.get(TEST_PROPERTY_NAME), "value should equal")
  }
  else {
    assert.equal(model.get(TEST_PROPERTY_NAME), expectedValues, "value should equal")
  }
}
function quality_undefined(model) {
  assert.isFalse(model.isDefined(TEST_PROPERTY_NAME), "when a peoperty is undefined :: isDefined should be false")
}
function quality_defined(model) {
  assert.isTrue(model.isDefined(TEST_PROPERTY_NAME), "when a property is defined :: isDefined should be true")
}
function quality_no_default(model) {
  assert.isFalse(model.hasDefault(TEST_PROPERTY_NAME), "when a property has no default :: hasDefault should be false")
}
function quality_has_default(model) {
  assert.isTrue(model.hasDefault(TEST_PROPERTY_NAME), "when a property has default :: hasDefault should be true")
}
function state_default(model) {
  assert.isTrue(model.isDefault(TEST_PROPERTY_NAME), "when state default :: isDefault should be true")
  assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "when state default :: isChanged should be false")
  assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME), "when state default :: isOriginal should be false")
}
function state_original(model) {
  assert.isFalse(model.isDefault(TEST_PROPERTY_NAME), "when state is original :: isDefault should be false")
  assert.isTrue(model.isOriginal(TEST_PROPERTY_NAME), "when state is original :: isOriginal should be true")
  assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "when state is original :: isChanged should be false")
}
function state_changed(model) {
  assert.isFalse(model.isDefault(TEST_PROPERTY_NAME), "when state changed :: isDefault should be false")
  assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME), "when state changed :: isOriginal should be false")
  assert.isTrue(model.isChanged(TEST_PROPERTY_NAME), "when state changed :: isChanged should be true")
}
function quality_unchanged(model) {
  assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "when a property is unchanged :: isChanged should be false")
}
function quality_not_empty(model) {
  assert.isFalse(model.isEmpty(TEST_PROPERTY_NAME), "when a property is not empty :: isEmpty should be false")
}
function quality_empty(model) {
  assert.isTrue(model.isDefault(TEST_PROPERTY_NAME), "when a property is empty :: isDefault should be false")
  assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME), "when a property is empty :: isOriginal should be false")
  assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "when a property is empty :: isChanged should be false")
  assert.isFalse(model.hasDefault(TEST_PROPERTY_NAME), "when a property is empty :: isDefault should be false")
  assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME), "when a property is empty :: isEmpty should be true")
}

var TEST_PROPERTY_NAME = "TEST_PROPERTY_NAME"
var PRIMITIVES = ["string", "float", "number", "boolean"]
var DEFAULT_VALUES = {
  null: null,
  undefined: undefined,
  string: "",
  float: 1.1,
  number: 1,
  boolean: true,
  array: [],
  object: {}
}
var VALID_VALUES = {
  null: null,
  undefined: undefined,
  string: "test",
  float: 11.11,
  number: 10,
  boolean: false,
  array: [],
  object: {}
}
var TYPE_CONSTRUCTORS = {
  null: null,
  undefined: undefined,
  string: schema.StringProperty,
  float: schema.FloatProperty,
  number: schema.NumberProperty,
  boolean: schema.BooleanProperty,
  array: [],
  object: {}
}
var INVALID_VALUES = {
  null: [undefined, "", 0, 1.1, NaN, true, false, [], {}],
  undefined: [null, "", 0, 1.1, NaN, true, false, [], {}],
  string: [null, undefined, 0, 1.1, NaN, true, false, [], {}],
  float: [null, undefined, "", NaN, true, false, [], {}],
  number: [null, undefined, "", NaN, true, false, [], {}],
  boolean: [null, undefined, "", 0, 1.1, NaN, [], {}],
  array: [null, undefined, "", 0, 1.1, NaN, true, false, {}],
  object: [null, undefined, "", 0, 1.1, NaN, true, false, []]
}

function describePrimitives(testFn) {
  PRIMITIVES.forEach(function(type) {
    describe(type, function() {
      testFn(type, TYPE_CONSTRUCTORS[type], DEFAULT_VALUES[type], VALID_VALUES[type], INVALID_VALUES[type])
    })
  })
}

function testPrimitives(testFn) {
  PRIMITIVES.forEach(function(type) {
    it(type, function() {
      testFn(type, TYPE_CONSTRUCTORS[type], DEFAULT_VALUES[type], VALID_VALUES[type], INVALID_VALUES[type])
    })
  })
}

function operation_set(model, value) {
  model.set(TEST_PROPERTY_NAME, value)
  state_changed(model)
  quality_not_empty(model)
  verifyValue(model, value)
}

function operation_commit(model, value) {
  model.commit(TEST_PROPERTY_NAME)
  state_original(model)
  quality_unchanged(model)
  quality_not_empty(model)
  verifyValue(model, value)
}
function operation_reset(model, value) {
  model.reset(TEST_PROPERTY_NAME)
  state_default(model)
  if (model.hasDefault(TEST_PROPERTY_NAME)) {
    quality_not_empty(model)
    verifyValue(model, value)
  }
}
function operation_revert(model, value) {
  model.revert(TEST_PROPERTY_NAME)
  state_original(model)
  quality_unchanged(model)
  quality_not_empty(model)
  verifyValue(model, value)
}

function operation_reset(model, value) {
  model.reset(TEST_PROPERTY_NAME)
  state_default(model)
}

describe("Model", function() {

  describe("constructor", function() {
    testModel("creation", null, function(model) {
      state_default(model)
      quality_undefined(model)
      quality_no_default(model)
      quality_empty(model)
    })
  })

  describe("api", function() {
    describe("toJSON", function() {
    })
    describe("stringify", function() {
    })
    describe("toString", function() {
    })
    describe("serialize", function() {
    })
    describe("restore", function() {
    })

    describe("getStorage", function() {
    })
    describe("store", function() {
    })
    describe("fetch", function() {
    })

    describe("get", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testModel("if there's a changed value, it should return the changed one", function(model) {
          model.set(TEST_PROPERTY_NAME, defaultValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.equal(model.get(TEST_PROPERTY_NAME), validValue)
        })
        testModel("if there's no changed value, it should return the original one", function(model) {
          model.set(TEST_PROPERTY_NAME, defaultValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.get(TEST_PROPERTY_NAME), defaultValue)
        })
        testModel("if there's no original value, it should return the default one", function(model) {
          assert.equal(model.get(TEST_PROPERTY_NAME), model.getDefault(TEST_PROPERTY_NAME))
        })
        testProperty("if provided a default, it should return the default value", new PropertyClass({default: defaultValue}), function(model) {
          assert.equal(model.get(TEST_PROPERTY_NAME), defaultValue)
        })
        testModel("if there's no default value, it should return null", function(model) {
          assert.isNull(model.get(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("set", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testModel("it should reflect on isChanged()", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          state_changed(model)
        })
        testModel("it should reflect on get()", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          verifyValue(model, validValue)
        })
        testModel("it should fire an event when value changed", function(model) {
          testEvents(model, ["change:" + TEST_PROPERTY_NAME, "change"], function() {
            model.set(TEST_PROPERTY_NAME, validValue)
          })
        })
        testModel("it should not fire an event when value isn't changed", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
        })
      })
    })
    describe("reset", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should revert to the default value", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME, validValue)
          model.reset()
          assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME))
          assert.isFalse(model.isChanged(TEST_PROPERTY_NAME))
          assert.isTrue(model.isDefault(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("commit", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testModel("it should reflect on isOriginal()", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.getOriginal(TEST_PROPERTY_NAME), validValue)
        })
        testModel("it should reflect on getOriginal()", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.getOriginal(TEST_PROPERTY_NAME), validValue)
          assert.equal(model.get(TEST_PROPERTY_NAME), validValue)
        })
        testModel("it should reflect on get()", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.get(TEST_PROPERTY_NAME), validValue)
        })
        testModel("it should change nothing if called twice", function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.get(TEST_PROPERTY_NAME), validValue)
        })
      })
    })
    describe("revert", function() {
      testPrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        var model = new Model()
        model.set(TEST_PROPERTY_NAME, defaultValue)
        model.commit(TEST_PROPERTY_NAME)
        model.set(TEST_PROPERTY_NAME, validValue)
        model.revert(TEST_PROPERTY_NAME)
        assert.equal(model.get(TEST_PROPERTY_NAME), defaultValue, "it should revert to the original value")
        assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "it should reflect on onChanged()")
        assert.isTrue(model.isOriginal(TEST_PROPERTY_NAME), "it should reflect on isOriginal()")
        model.revert(TEST_PROPERTY_NAME)
        assert.isTrue(model.isOriginal(TEST_PROPERTY_NAME), "calling twice shouldn't affect isOriginal()")
        assert.isFalse(model.isChanged(TEST_PROPERTY_NAME), "calling twice shouldn't affect isChanged()")
        assert.equal(model.get(TEST_PROPERTY_NAME), defaultValue, "calling twice shouldn't affect get()")
      })
    })

    describe("keys", function() {
      testSchema("it should return an array", {}, function(model) {
        assert.isArray(model.keys())
      })
      testSchema("it should have the length of the number of properties", {a: 1, b: "", c: true}, function(model) {
        assert.lengthOf(model.keys(), 3)
      })
      testSchema("it should contain all property names", {a: 1, b: "", c: true}, function(model) {
        assert.include(model.keys(), "a")
        assert.include(model.keys(), "b")
        assert.include(model.keys(), "c")
      })
      it("asd", function() {
        var Base = Model.extend({
          schema: {a: 1, b: "", c: true}
        })
        var Extended = Base.extend({
          schema: {
            d: 1
          }
        })
        assert.notEqual(Base.prototype.propertyList, Extended.prototype.propertyList, "property list reference should differ on every prototype")
        var model = new Extended()
        assert.isArray(model.keys())
        assert.lengthOf(model.keys(), 4)
        assert.include(model.keys(), "a")
        assert.include(model.keys(), "b")
        assert.include(model.keys(), "c")
      })
    })
    describe("values", function() {
      testSchema("it should be an array", {a: 1, b: "", c: true}, function(model) {
        assert.isArray(model.values())
      })
      testSchema("it should have the length of the number of properties", {a: 1, b: "", c: true}, function(model) {
        assert.lengthOf(model.values(), 3)
      })
      testSchema("it should contain all property names", {a: 1, b: "", c: true}, function(model) {
        assert.include(model.values(), 1)
        assert.include(model.values(), "")
        assert.include(model.values(), true)
      })
    })
    describe("changedKeys", function() {
      testSchema("it should be an array", {a: 1, b: "", c: true}, function(model) {
        assert.isArray(model.changedKeys())
      })
      testSchema("it should have the length of the number of changed properties", {a: 1, b: "", c: true}, function(model) {
        model.set("a", 2)
        assert.lengthOf(model.changedKeys(), 1)
      })
      testSchema("it should contain all property names", {a: 1, b: "", c: true}, function(model) {
        model.set("a", 2)
        model.set("b", "b")
        model.set("c", false)
        assert.include(model.changedKeys(), "a")
        assert.include(model.changedKeys(), "b")
        assert.include(model.changedKeys(), "c")
      })
    })
    describe("changedValues", function() {
      testSchema("it should be an array", {a: 1, b: "", c: true}, function(model) {
        assert.isArray(model.changedValues())
      })
      testSchema("it should have the length of the number of properties", {a: 1, b: "", c: true}, function(model) {
        model.set("a", 2)
        assert.lengthOf(model.changedValues(), 1)
      })
      testSchema("it should contain all values", {a: 1, b: "", c: true}, function(model) {
        model.set("a", 2)
        model.set("b", "b")
        model.set("c", false)
        assert.include(model.values(), 2)
        assert.include(model.values(), "b")
        assert.include(model.values(), false)
      })
    })

    //describe("slice", function() {})
    //describe("isDefined", function() {})

    describe("changes", function() {
      testModel("it should be an object", function(model) {
        assert.isObject(model.changes())
      })
      testSchema("it should be contain changed keys", {"a": ""}, function(model) {
        model.set("a", "b")
        assert.lengthOf(Object.keys(model.changes()), 1)
      })
      testSchema("values should equal to changed values", {"a": ""}, function(model) {
        model.set("a", "b")
        assert.property(model.changes(), "a")
        assert.propertyVal(model.changes(), "a", "b")
      })
    })
    describe("originals", function() {
      testModel("it should be an object", function(model) {
        assert.isObject(model.originals())
      })
      testSchema("it should be contain original keys", {"a": ""}, function(model) {
        assert.lengthOf(Object.keys(model.originals()), 1)
      })
      testSchema("values should equal to original values", {"a": ""}, function(model) {
        model.set("a", "b")
        model.commit("a")
        assert.property(model.originals(), "a")
        assert.propertyVal(model.originals(), "a", "b")
      })
    })
    describe("defaults", function() {
      testModel("it should be an object", function(model) {
        assert.isObject(model.defaults())
      })
      testSchema("it should be contain original keys", {"a": ""}, function(model) {
        assert.lengthOf(Object.keys(model.defaults()), 1)
      })
      testSchema("values should equal to original values", {"a": ""}, function(model) {
        assert.property(model.defaults(), "a")
        assert.propertyVal(model.defaults(), "a", "")
      })
    })
    //describe("invalids", function() {})

    describe("getDefault", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should return the default value", new PropertyClass({default: defaultValue}), function(model) {
          assert.equal(model.getDefault(TEST_PROPERTY_NAME), defaultValue)
        })
      })
    })
    describe("getOriginal", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should return the original value", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.equal(model.getOriginal(TEST_PROPERTY_NAME), validValue)
        })
      })
    })
    describe("getChanged", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should return the changed value", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.equal(model.getChanged(TEST_PROPERTY_NAME), validValue)
        })
      })
    })

    describe("isEmpty", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("properties with default value are not empty", new PropertyClass({default: defaultValue}), function(model) {
          assert.isFalse(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with null default value are empty", new PropertyClass({default: null}), function(model) {
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with undefined default value are empty", new PropertyClass({default: undefined}), function(model) {
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with changed value are not empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.isFalse(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with null changed value are empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, null)
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with undefined changed value are empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, undefined)
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with original value are not empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.isFalse(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with null original value are empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, null)
          model.commit(TEST_PROPERTY_NAME)
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
        testProperty("properties with undefined original value are empty", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, undefined)
          model.commit(TEST_PROPERTY_NAME)
          assert.isTrue(model.isEmpty(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("isChanged", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should change when it's not the default", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.isTrue(model.isChanged(TEST_PROPERTY_NAME))
        })
        testProperty("it should change when it's the not original", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, defaultValue)
          model.commit(TEST_PROPERTY_NAME)
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.isTrue(model.isChanged(TEST_PROPERTY_NAME))
        })
        testProperty("it should not change when it's the default", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, defaultValue)
          assert.isFalse(model.isChanged(TEST_PROPERTY_NAME))
        })
        testProperty("it should not change when it's the original", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, defaultValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.isFalse(model.isChanged(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("isOriginal", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should be false when it's the default", new PropertyClass({default: defaultValue}), function(model) {
          assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME))
        })
        testProperty("it should be false when it's changed", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.isFalse(model.isOriginal(TEST_PROPERTY_NAME))
        })
        testProperty("it should be true when it's the original", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.isTrue(model.isOriginal(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("isDefault", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should be true when it's the default", new PropertyClass({default: defaultValue}), function(model) {
          assert.isTrue(model.isDefault(TEST_PROPERTY_NAME))
        })
        testProperty("it should be false when it's changed", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          assert.isFalse(model.isDefault(TEST_PROPERTY_NAME))
        })
        testProperty("it should be false when it's the original", new PropertyClass({default: defaultValue}), function(model) {
          model.set(TEST_PROPERTY_NAME, validValue)
          model.commit(TEST_PROPERTY_NAME)
          assert.isFalse(model.isDefault(TEST_PROPERTY_NAME))
        })
      })
    })
    describe("hasDefault", function() {
      describePrimitives(function(type, PropertyClass, defaultValue, validValue, invalidValues) {
        testProperty("it should be true when it has a default", new PropertyClass({default: defaultValue}), function(model) {
          assert.isTrue(model.hasDefault(TEST_PROPERTY_NAME))
        })
        testProperty("it should be false when it doesn't have a default", new PropertyClass({}), function(model) {
          assert.isFalse(model.hasDefault(TEST_PROPERTY_NAME))
        })
      })
    })
    //describe("isRequired", function() {})
    //describe("isValid", function() {})
    //describe("equals", function() {})
    //describe("typeOf", function() {})
    //describe("instanceOf", function() {})

    //describe("validate", function() {})
  })
})
