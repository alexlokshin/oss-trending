# oss-trending
 
AWS Lambda code to periodically pull github trending repos and prepare data for the time series analysis. Deploy with `serverless deploy -v` (which will schedule the lambda to run hourly), troubleshoot by looking at the logs with `serverless logs -f capture`. 

## Configuration

All time series data is stored in ElasticSearch, and I'm using AWS ES for that. To configure the endpoint, change  the `elastic.host` setting in `config.properties` file. For local runs, you might want to configure the config.json with you AWS credentials to execute things like `delete-all.js`. Lambda infers credentials from the execution environment and doesn't have to be explicitly confiugred.
