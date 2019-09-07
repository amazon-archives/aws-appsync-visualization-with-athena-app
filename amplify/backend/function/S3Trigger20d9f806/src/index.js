/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiAthenaGraphQlAPIGraphQLAPIIdOutput = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIIDOUTPUT
var apiAthenaGraphQlAPIGraphQLAPIEndpointOutput = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIENDPOINTOUTPUT

Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk')
const https = require('https')
const urlParse = require('url').URL
const mutation = require('./mutation').announceQueryResult

const apiRegion = process.env.REGION
const apiEndpoint = process.env.API_APPSYNCATHENAVIZ_GRAPHQLAPIENDPOINTOUTPUT
const endpoint = new urlParse(apiEndpoint).hostname.toString()

exports.handler = async (event, context) => {
  // Get the object from the event and show its content type
  const region = event.Records[0].awsRegion
  const bucket = event.Records[0].s3.bucket.name
  const key = event.Records[0].s3.object.key

  console.log(`S3 Event --> Region: ${region}, Bucket: ${bucket}, Key: ${key}`)

  const match = key.match(/([\w-]+)\.csv$/)
  if (match) {
    const QueryExecutionId = match[1]

    const variables = {
      input: {
        QueryExecutionId,
        file: {
          bucket,
          region,
          key
        }
      }
    }

    const req = new AWS.HttpRequest(apiEndpoint, apiRegion)
    req.method = 'POST'
    req.headers.host = endpoint
    req.headers['Content-Type'] = 'application/json'
    req.body = JSON.stringify({
      query: mutation,
      operationName: 'announceQueryResult',
      variables,
      authMode: 'AWS_IAM'
    })
    const signer = new AWS.Signers.V4(req, 'appsync', true)
    signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate())

    console.log('req -->', JSON.stringify(req, null, 2))

    const data = await new Promise((resolve, reject) => {
      const httpRequest = https.request({ ...req, host: endpoint }, result => {
        result.on('data', data => resolve(JSON.parse(data.toString())))
      })

      httpRequest.write(req.body)
      httpRequest.end()
    })
    console.log('data -->', JSON.stringify(data, null, 2))
  }
  context.done(null, 'Successfully processed S3 event') // SUCCESS with message
}
