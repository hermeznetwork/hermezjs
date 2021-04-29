const HttpStatusCode = {
  NOT_FOUND: 404
}

/**
 * Retrieve data from http response
 * @param {Object} request
 * @returns {Object} http data
*/
async function extractJSON (request) {
  const response = await request

  return response.data
}

export {
  HttpStatusCode,
  extractJSON
}
