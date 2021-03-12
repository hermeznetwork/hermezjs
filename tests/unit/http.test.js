import * as http from '../../src/http.js'

test('#extractJSON', async () => {
  const response = {
    data: 1
  }
  const request = Promise.resolve(response)
  const extractedResponse = await http.extractJSON(request)
  expect(extractedResponse).toBe(response.data)
})
