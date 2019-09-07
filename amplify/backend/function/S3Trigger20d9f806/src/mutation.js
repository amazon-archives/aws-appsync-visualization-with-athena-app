module.exports = {
  announceQueryResult: `mutation announceQueryResult($input: AnnounceInput!) {
    announceQueryResult(input: $input) {
      QueryExecutionId
      file {
      bucket
      region
      key
      }
    }
  }
  `
}
