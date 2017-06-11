# oss-trending
 
AWS Lambda code to periodically pull github trending repos and prepare data for the time series analysis. Deploy with `serverless deploy -v` (which will schedule the lambda to run hourly), troubleshoot by looking at the logs with `serverless logs -f capture`. 
