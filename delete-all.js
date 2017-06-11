var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');


var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./config.properties');
console.log('ES Host:', properties.get('elastic.host'));

var client = require('elasticsearch').Client({
    hosts: properties.get('elastic.host'),
    connectionClass: require('http-aws-es'),
    amazonES: {
        region: AWS.config.region,
        accessKey: AWS.config.accessKeyId,
        secretKey: AWS.config.secretAccessKey
    }
});


client.deleteByQuery({
    index: 'trending',
    body: {
        query: {
            match_all: {  }
        }
    }
}, function (err, response) {
    console.log(err);
    console.log(response);
});