module.exports = Storage

function Storage (request) {
  this.request = request
}

Storage.prototype.createRequest = function (data, method) {
  var requestInit = this.request()

  if (!this.request.method) {
    requestInit.method = method
  }

  if (data != null) {
    if (typeof data != "string") {
      data = JSON.stringify(data)
    }
    requestInit.body = data
  }

  var request = new window.Request(requestInit.url, requestInit)

  if (!request.headers.has("Content-Type")) {
    request.headers.set("Content-Type", "application/json")
  }
  if (!request.headers.has("Accept")) {
    request.headers.set("Accept", "application/json")
  }

  return request
}

Storage.prototype.upload = function (data) {
  var request = this.createRequest(data, "POST")
  return window.fetch(request.url, request)
}

Storage.prototype.update = function () {
  var request = this.createRequest(null, "GET")
  return window.fetch(request.url, request)
}
