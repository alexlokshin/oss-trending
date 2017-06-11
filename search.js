var google = require('google')
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('Chuck');

google.resultsPerPage = 10;
google('The Kotlin Programming Language', function (err, res){
 for (var i=0; i<res.links.length && i<4; i++){
    if (res.links[i].link /*&& res.links[i].link.indexOf('wiki')!=-1*/){
        tokenizer.setEntry(res.links[i].description);
        console.log('*', res.links[i]);
        console.log(tokenizer.getSentences());
}
}
})
