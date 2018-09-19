const bbc = require('./util/httpUtil')

var assets = [
    {'asset':'8upgkLYC84GkSxg4OwjvP33wvBvbXrCnh0PKYPFy+3E=','amount':5}
]

bbc.asyncGroupFetch(assets,function (results) {

    console.log(JSON.stringify(results))
})