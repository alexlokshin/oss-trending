'use strict';
let trending = require('trending-github');
let NodeCache = require("node-cache");
let myCache = new NodeCache();
let google = require('google')
let Tokenizer = require('sentence-tokenizer');
let tokenizer = new Tokenizer('Chuck');
let dateFormat = require('dateformat');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./config.properties');
//console.log('Current region:', process.env.AWS_REGION);
//console.log('ES Host:', properties.get('elastic.host'));

//TODO: Scan trending repos daily for Java, Javascript and Go
//Keep track of trending repos, and visualize on a timeline

function respondWith(statusCode, err, payload, callback) {
    var body = {};
    if (err)
        body.error = err;
    if (payload)
        body.payload = {version: '1.0.3', text: translate(payload), repos: compress(payload)};
    var response = {
        statusCode: statusCode,
        body: JSON.stringify(body),
    };
    callback(err, response);
}

function concatenateArray(arr) {
    if (!arr)
        return '';
    var text = '';
    for (var i = 0; i < arr.length; i++) {
        if (i > 0) {
            if (i == arr.length - 1)
                text += ' and ';
            else
                text += ', ';
        }
        text += arr[i];
    }
    return text;
}

function compress(repos) {
    return repos.filter((x) => x.stars > 0 && x.language.trim().length > 0).map((x) => {
        return {
            name: x.author + '/' + x.name,
            stars: x.stars,
            forks: x.forks,
            ratio: x.forks / x.stars,
            language: x.language
        }
    });
}

function translate(repos) {
    var text = 'Here is the daily open source digest, brought to you by looking through the recent contributions to the community. Most interesting projects seem to be: ';
    var languages = {};
    var authors = {};
    var repositories = [];
    for (var i = 0; i < repos.length; i++) {
        if (repos[i].language.trim().length > 0) {
            if (!languages[repos[i].language])
                languages[repos[i].language] = 1;
            languages[repos[i].language] = languages[repos[i].language] + 1;
            if (!authors[repos[i].author])
                authors[repos[i].author] = 1;
            authors[repos[i].author] = authors[repos[i].author] + 1;
            if (i < 4 && repos[i].description && repos[i].description.trim().length > 0) {
                repositories.push(repos[i].author + ' - ' + repos[i].name + ' - ' + repos[i].description.replace(/[^A-Za-z0-9\s]/g, ''));
            }
        }
    }
    if (repositories.length > 0) {
        text += concatenateArray(repositories);
        text += '. ';
    }
    var sortedAuthors = sortPropertiesByValue(authors).filter((v, index) => v[1] > 1 && index < 3).map((v) => v[0]);
    var sortedLanguages = sortPropertiesByValue(languages).filter((v, index) => v[1] > 1 && index < 3).map((v) => v[0]);

    if (sortedLanguages.length > 0) {
        text += 'Most prominent languages of innovation are: ';
        text += concatenateArray(sortedLanguages);
        text += '. ';
    }

    if (sortedAuthors.length > 0) {
        text += 'Most significant contributors are: ';
        text += concatenateArray(sortedAuthors);
        text += '. ';
    }


    return text;
}

function sortPropertiesByValue(obj) {
    var keyValues = [];
    for (var key in obj)
        if (obj.hasOwnProperty(key))
            keyValues.push([key, obj[key]]);
    keyValues.sort(function (a, b) {
        return b[1] - a[1];
    });
    return keyValues;
}

function report(cacheKey, callback) {
    myCache.get(cacheKey, function (err, value) {
        if (err) {
            respondWith(500, err, null, callback);
        } else {
            if (value == undefined) {
                trending(cacheKey)
                    .then(repos => {
                        myCache.set(cacheKey, repos, 60000);
                        respondWith(200, null, repos, callback);
                    });
            } else {
                respondWith(200, null, value, callback);
            }
        }
    });
}

function capture(callback) {
    trending('daily').then(
        repos => {
            //console.log('Current region:', process.env.AWS_REGION);
            //console.log('ES Host:', properties.get('elastic.host'));

            var AWS = require('aws-sdk');
            var myCredentials = new AWS.EnvironmentCredentials('AWS');
            var client = require('elasticsearch').Client({
                hosts: properties.get('elastic.host'),
                connectionClass: require('http-aws-es'),
                amazonES: {
                    region: process.env.AWS_REGION,
                    credentials: myCredentials
                }
            });

            var date = dateFormat(new Date(), "yyyy-mm-dd");
            var id = 'trending-daily-' + date;
            var compressedRepos = compress(repos);
            var bulkItems = [];

            compressedRepos.map((x) => {
                bulkItems.push({index: {_index: 'trending', _type: 'daily', _id: id + '-' + x.name}});
                x['date'] = date;
                x['timestamp'] = new Date();
                x['unixtime'] = Math.floor(new Date() / 1000);
                bulkItems.push(x);
            });

            client.bulk({body: bulkItems}, function (err, resp) {
                if (err)
                    console.error(err);
                else
                    console.log('Inserted items.');
            });

            var body = {Status: 'OK'};
            var response = {
                statusCode: 200,
                body: JSON.stringify(body),
            };
            callback(null, response);
        }
    );
}

module.exports.monthly = (event, context, callback) => {
    report('monthly', callback);
};

module.exports.weekly = (event, context, callback) => {
    report('weekly', callback);
};

module.exports.daily = (event, context, callback) => {
    report('daily', callback);
};

module.exports.capture = (event, context, callback) => {
    capture(callback);
};

