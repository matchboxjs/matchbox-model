var Property = require("./Property")
var FloatProperty = require("./FloatProperty")
var DateProperty = require("./DateProperty")
var ModelProperty = require("./ModelProperty")
var BooleanProperty = require("./BooleanProperty")
var NumberProperty = require("./NumberProperty")
var StringProperty = require("./StringProperty")
var UtcDateProperty = require("./UtcDateProperty")

var schema = module.exports = {}

schema.Property = Property
schema.FloatProperty = FloatProperty
schema.DateProperty = DateProperty
schema.ModelProperty = ModelProperty
schema.BooleanProperty = BooleanProperty
schema.NumberProperty = NumberProperty
schema.StringProperty = StringProperty
schema.UtcDateProperty = UtcDateProperty
