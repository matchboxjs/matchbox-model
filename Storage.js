module.exports = Storage

function Storage (request) {
  this.request = request
}

Storage.prototype.createRequest = function (model, data, method) {
  var requestInit = this.request(model)

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

  return request
}

Storage.prototype.upload = function (model, data) {
  var request = this.createRequest(model, data, "POST")
  return window.fetch(request.url, request)
}

Storage.prototype.update = function (model) {
  var request = this.createRequest(model, null, "GET")
  return window.fetch(request.url, request)
}
