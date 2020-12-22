const HttpStatusCode = {
  NOT_FOUND: 404
}

/**
 * Retrieve data from http response
 * @param {object} request
 * @returns {object} http data
*/
async function extractJSON (request) {
  return request.then(response => response.data)
}

export {
  HttpStatusCode,
  extractJSON
}
