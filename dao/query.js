const pool = require('./connect');
module.exports = {
    /**
     * 通过连接池执行数据CRUD操作
     */
    query: function (sqlString, params) {
        return new Promise((resolve, reject) => {
            pool.getConnection(function (err, connection) {
                if (err) {
                    reject(err)
                } else {
                  var query =  connection.query(sqlString, params, (err, rows) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(rows)
                        }
                        connection.release()
                    })
                    console.log('----------------***************** SQL *****************----------------')
                    console.log(query.sql)
                    console.log('----------------***************** SQL *****************----------------')
                }
            })
        })
    }
}