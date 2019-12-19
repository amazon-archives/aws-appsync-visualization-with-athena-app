module.exports = {
  updateAthenaOperation: `mutation UpdateAthenaOperation($input: UpdateAthenaOperationInput!) {
    updateAthenaOperation(input: $input) {
      id
      queryString
      countryCode
      status
      file {
        bucket
        region
        key
      }
      owner
      createdAt
    }
  }
  `
}
