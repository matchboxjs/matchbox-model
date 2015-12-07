var Model = require("./Model")
var Slice = require("./Slice")
var Storage = require("./Storage")
var collection = require("./collection")
var schema = require("./schema")

module.exports = Model

Model.Slice = Slice
Model.Storage = Storage
Model.collection = collection
Model.schema = schema
