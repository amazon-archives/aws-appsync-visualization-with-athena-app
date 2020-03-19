/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const deleteAthenaOperation = /* GraphQL */ `
  mutation DeleteAthenaOperation($input: DeleteAthenaOperationInput!) {
    deleteAthenaOperation(input: $input) {
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
`;
export const createAthenaOperation = /* GraphQL */ `
  mutation CreateAthenaOperation($input: CreateAthenaOperationInput!) {
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
`;
export const updateAthenaOperation = /* GraphQL */ `
  mutation UpdateAthenaOperation($input: UpdateAthenaOperationInput!) {
    updateAthenaOperation(input: $input) {
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
`;
