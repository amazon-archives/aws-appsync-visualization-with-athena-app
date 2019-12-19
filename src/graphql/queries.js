/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const startQuery = `query StartQuery($queryString: String!, $countryCode: String!) {
  startQuery(queryString: $queryString, countryCode: $countryCode) {
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
export const getAthenaOperation = `query GetAthenaOperation($id: ID!) {
  getAthenaOperation(id: $id) {
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
export const listAthenaOperations = `query ListAthenaOperations(
  $filter: ModelAthenaOperationFilterInput
  $limit: Int
  $nextToken: String
) {
  listAthenaOperations(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
  }
}
`
export const queryByOwner = `query QueryByOwner(
  $owner: String
  $createdAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelAthenaOperationFilterInput
  $limit: Int
  $nextToken: String
) {
  queryByOwner(
    owner: $owner
    createdAt: $createdAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
  }
}
`
