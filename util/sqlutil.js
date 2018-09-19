
var sqlutil = {}

sqlutil.f = function (asset,sql) {
    if ('base' == asset){
        return sql.replace(/\%s/g,'is null')
    }
    else {
        return sql.replace(/\%s/g,'='+"'"+asset+"'")
    }
}

module.exports = sqlutil