var inherit = require("backyard/function/inherit")
var Storage = require("./Storage")

module.exports = RemoteStorage

function RemoteStorage(calibrateRequest) {
  if (typeof calibrateRequest != "function") {
    throw new Error("Invalid arguments: 'calibrateRequest' must be a function")
  }
  this.calibrateRequest = calibrateRequest
}

inherit(RemoteStorage, Storage)

RemoteStorage.prototype.store = function(model, data) {
  return this.post(model, data)
}

RemoteStorage.prototype.fetch = function(model) {
  return this.get(model).then(function(response) {
    if (!response.ok) {
      console.warn("Failed to fetch remote storage: Status " + response.status)
      var e = new Error("Storage error")
      e.response = response
      throw e
    }
    return response.json().catch(function(e) {
      console.warn("Failed to fetch remote storage: Invalid response")
      throw e
    })
  })
}

RemoteStorage.prototype.put = function(model, data) {
  return this.request(model, data, "PUT")
}
RemoteStorage.prototype.patch = function(model, data) {
  return this.request(model, data, "PATCH")
}
RemoteStorage.prototype.post = function(model, data) {
  return this.request(model, data, "POST")
}
RemoteStorage.prototype.get = function(model, data) {
  return this.request(model, data, "GET")
}
RemoteStorage.prototype.delete = function(model, data) {
  return this.request(model, data, "DELETE")
}
RemoteStorage.prototype.header = function(model, data) {
  return this.request(model, data, "HEADER")
}

RemoteStorage.prototype.request = function(model, data, method) {
  var requestInit = this.calibrateRequest(model, data)

  if (!requestInit.url) {
    throw new Error("Unable to send request: missing url parameter")
  }

  if (!requestInit.method) {
    requestInit.method = method
  }

  var request = new window.Request(requestInit.url, requestInit)

  if (!request.headers.has("Content-Type")) {
    request.headers.set("Content-Type", "application/json")
  }
  if (!request.headers.has("Accept")) {
    request.headers.set("Accept", "application/json")
  }

  if (data != null) {
    if (typeof data != "string") {
      data = JSON.stringify(data)
    }
    request.body = data
  }

  return window.fetch(request.url, request)
}
