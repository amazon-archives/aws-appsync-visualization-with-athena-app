/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiAppsyncathenavizGraphQLAPIIdOutput = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIIDOUTPUT
var apiAppsyncathenavizGraphQLAPIEndpointOutput = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIENDPOINTOUTPUT
Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk')
const https = require('https')
const URL = require('url').URL
const mutation = require('./mutation').createAthenaOperation

const apiRegion = process.env.REGION
const apiEndpoint = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIENDPOINTOUTPUT
const endpoint = new URL(apiEndpoint).hostname.toString()

exports.handler = async function(event, context) {
  console.log(JSON.stringify(event, null, 2))

  const variables = {
    input: {
      id: event.prev.result.QueryExecutionId,
      owner: event.identity.claims.sub,
      queryString: event.arguments.queryString,
      countryCode: event.arguments.countryCode,
      status: 'REQUESTED'
    }
  }

  const req = new AWS.HttpRequest(apiEndpoint, apiRegion)
  req.method = 'POST'
  req.headers.host = endpoint
  req.headers['Content-Type'] = 'application/json'
  req.body = JSON.stringify({
    query: mutation,
    operationName: 'CreateAthenaOperation',
    variables,
    authMode: 'AWS_IAM'
  })
  const signer = new AWS.Signers.V4(req, 'appsync', true)
  signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate())

  console.log('req -->', JSON.stringify(req, null, 2))

  const result = await new Promise((resolve, reject) => {
    const httpRequest = https.request({ ...req, host: endpoint }, result => {
      result.on('data', data => resolve(JSON.parse(data.toString())))
    })

    httpRequest.write(req.body)
    httpRequest.end()
  })
  return result.data.createAthenaOperation
}
