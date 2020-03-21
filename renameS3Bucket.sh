#!/bin/bash

file="./amplify/backend/storage/sQueryResults/parameters.json"

export RESULT_BUCKET_SUFFIX="$(envCache --get resultBucketSuffix)"

if [ -z "$RESULT_BUCKET_SUFFIX" ]; then
  rand=`dd if=/dev/urandom bs=9 count=1 2>/dev/null | base64 | tr '+/' 'a'| tr '[:upper:]' '[:lower:]'`
  suffix="aa-$rand"
  echo "Using new prefix: $suffix"
  envCache --set resultBucketSuffix ${suffix}
else
  echo "Using existing prefix: $RESULT_BUCKET_SUFFIX"
  suffix="$RESULT_BUCKET_SUFFIX"
fi
sed -i "s/aws-athena-query-results[^\"]*/aws-athena-query-results-$suffix/" $file


echo "************************************************************"
echo "Your S3 bucket in which Athena can store your query results:"
echo ">> aws_user_files_s3_bucket: aws-athena-query-results-$suffix-$USER_BRANCH <<"
echo "************************************************************"