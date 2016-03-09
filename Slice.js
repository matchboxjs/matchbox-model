module.exports = Slice

function Slice(schema) {
  this.schema = schema || {}
}

Slice.prototype.getSubSlice = function(name) {
  if (this.schema == "*" || this.schema === true) {
    return new Slice("*")
  }
  return new Slice(this.schema[name])
}

Slice.prototype.isInSchema = function(name) {
  return this.schema == "*" || this.schema === true || this.schema.hasOwnProperty(name)
}
