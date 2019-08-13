# Visualizing big data with AWS AppSync, Amazon Athena, and AWS Amplify

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/aws-samples/aws-appsync-visualization-with-athena-app)

This project shows how to use [Amazon Athena](https://aws.amazon.com/athena/), [AWS AppSync](https://aws.amazon.com/appsync/), and [AWS Amplify](https://aws.amazon.com/amplify/) to build an application that interacts with big data. The application is built using React, the [AWS Amplify Javascript library](https://github.com/aws-amplify/amplify-js), and the [D3.js](https://d3js.org/) Javascript library to render custom visualizations. The application code can be found in this [GitHub repository](https://github.com/aws-samples/aws-appsync-visualization-with-athena-app)
It uses Amazon Athena to query data hosted in a public Amazon Simple Storage Service (Amazon S3) bucket by the [Registry of Open Data on AWS](https://registry.opendata.aws/). Specifically, the [High Resolution Population Density Maps + Demographic Estimates by CIESIN and Facebook](https://registry.opendata.aws/dataforgood-fb-hrsl/) is used. 
This public dataset provides "population data for a selection of countries, allocated to 1 arcsecond blocks and provided in a combination of CSV and Cloud-optimized GeoTIFF files", and is hosted in the S3 bucket `s3://dataforgood-fb-data`

![architecture](architecture.png)

## Getting started

Deploy the application in a single step to the Amplify Console by clicking the button above.

For more information about this app and how to get started, please see the [blog post](<BLOGPOST>).

## Application Overview

1. Users sign in to the app using Amazon Cognito User Pools. The JWT access token returned at sign-in is sent in an authorization header to AWS AppSync with every GraphQL operation.
2. A user selects a country from the drop-down list and clicks "Query". This triggers a GraphQL query. When the app receives the `QueryExecutionId` in the response, it subscribes to mutations on that ID.
3. AppSync makes a SigV4-signed request to the Amazon Athena API with the specified query.
4. Amazon Athena runs the query against the specified table
    1. The query returns the sum of the population at recorded longitudes for the selected country along with a count of latitudes at each longitude.
    ```sql
    SELECT longitude, count(latitude) as count, sum(population) as tot_pop
      FROM "default"."hrsl"
      WHERE country='${countryCode.trim()}'
      group by longitude
      order by longitude
    ```
5. The results of the query are stored in the result S3 bucket, under the "/protected/athena/" prefix. Signed-in app users can access these results using their IAM credentials.
6. Putting the query result file in the bucket generates a Amazon S3 event and triggers the announcer Lambda function
7. The announcer Lambda function sends a `announceQueryResult` mutation with the S3 bucket and object information
8. The mutation triggers a subscription with the mutation's selection set
9. The client retrieves the result file from the S3 bucket and displays the custom visualization.

![App Snapshot](app-image.png)

## License Summary

This sample code is made available under the MIT-0 license. See the LICENSE file.
