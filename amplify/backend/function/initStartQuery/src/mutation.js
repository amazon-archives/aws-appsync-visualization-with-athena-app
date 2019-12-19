module.exports = {
  createAthenaOperation: `mutation CreateAthenaOperation($input: CreateAthenaOperationInput!) {
    createAthenaOperation(input: $input) {
      id
      queryString
      countryCode
      owner
      status
      file {
        bucket
        region
        key
      }
      createdAt
    }
  }
  `
}
