// 用户相关的CRUD操作
const user = {
    addRandomBytes: 'INSERT INTO web_vertification(data,date) values (?,CURDATE())',
    querylogininfo: 'select extendedpubkey from web_vertification where used=0 and vertified=1 and data=?',
    addloginRecord: 'insert into web_login (extendedpubkey,max_index) values(?,?)',
    updateloginRecord: 'update web_login set max_index = ? where extendedpubkey=?',
    updateVerficicationState: 'update web_vertification set vertified = 1,extendedpubkey=? where data=?',
    updateUsed: 'update web_vertification set used = 1 where data=?',
    queryDataExistance: 'SELECT 1 FROM web_vertification WHERE data =?',
    queryXpubkey: 'select * from web_login where extendedpubkey = ? limit 1', // this means user has login before,just update
    updateMaxIndex: 'update web_login set max_index = ? where extendedpubkey=?',
    addMaxIndex: 'insert into web_login (extendedpubkey,max_index) values(?,?)',
    addAddress: 'INSERT INTO web_addresses (extendedpubkey,address,address_index) values %s'
}

const statistic = {
    sqlRecentMonthTxs: 'SELECT count( * ) AS count, CAST( creation_date AS DATE ) AS date FROM units JOIN outputs USING(unit) WHERE unit IN ( SELECT DISTINCT ( unit ) FROM outputs WHERE asset = ?) AND address in (SELECT address FROM web_addresses WHERE extendedpubkey=?) AND units.creation_date > NOW( ) + INTERVAL - 768 HOUR GROUP BY date',
    sqlTopholder: 'SELECT unit AS asset, cap, address, sum AS amount, sum/cap * 100 AS percentage, @row_number := @row_number + 1 AS rank FROM ( SELECT * FROM ( SELECT unit, cap FROM assets WHERE assets.unit = ? ) AS newtable ) AS atable LEFT JOIN ( SELECT asset, address, sum( amount ) AS sum FROM outputs WHERE is_spent = 0 AND asset = ? GROUP BY address ORDER BY sum DESC ) AS ctable ON atable.unit = ctable.asset, ( SELECT @row_number := 0 ) AS t ORDER BY sum DESC, rank ASC LIMIT 100',
    sqlAllasset: 'SELECT SUM(amount)as amount, asset FROM outputs WHERE is_spent=0 AND asset IS NOT NULL AND address in (SELECT address FROM web_addresses WHERE extendedpubkey=?) GROUP BY asset',
    sqlAllHistoryUnit: 'SELECT unit, ( payload_commission + headers_commission ) AS fees, sum( amount ) AS amount, main_chain_index FROM units JOIN outputs USING ( unit ) WHERE outputs.asset = ? GROUP BY unit ORDER BY main_chain_index DESC LIMIT ?,?',
    sqlAllTxCount: 'SELECT count(DISTINCT(unit)) as count FROM units JOIN outputs USING ( unit ) WHERE outputs.asset = ?',
    sqlMyHistoryUnit: 'SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN outputs USING ( unit ) WHERE outputs.asset = ? AND outputs.address IN ( SELECT address FROM web_addresses WHERE extendedpubkey = ? ) UNION SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN inputs USING ( unit ) WHERE inputs.asset = ? AND inputs.address IN ( SELECT address FROM web_addresses WHERE extendedpubkey = ? ) ORDER BY creation_date DESC LIMIT ?,?',
    sqlScanPayees: 'select DISTINCT(address) from web_addresses where extendedpubkey=? and address in (select address from outputs where outputs.unit=? AND outputs.asset=?)',
    sqlScanPayers: 'select DISTINCT(address) from web_addresses where extendedpubkey=? and address in (select address from inputs where inputs.unit=? AND inputs.asset=?)',
    sqlScanInputsOutputs: 'SELECT unit, creation_date,LEVEL, is_stable, sequence, address, headers_commission + payload_commission AS fee, SUM( amount ) AS amount, address AS to_address, NULL AS from_address, main_chain_index AS mci FROM units CROSS JOIN outputs USING ( unit ) where units.unit=? AND outputs.asset=? GROUP BY unit, address union SELECT unit, creation_date,LEVEL, is_stable, sequence, address, headers_commission + payload_commission AS fee, SUM( amount ) AS amount, null AS to_address, address AS from_address, main_chain_index AS mci FROM units CROSS JOIN inputs USING ( unit ) where units.unit=? AND inputs.asset=? GROUP BY unit, address',
    sqlCap:'SELECT cap FROM assets WHERE unit = ?',
    sqlTokenHolderCount:'SELECT COUNT(DISTINCT(address)) as count FROM outputs WHERE outputs.asset = ? AND is_spent=0 ',
    sqlRecentDayTxCount: 'SELECT COUNT(DISTINCT(unit)) as count FROM units JOIN outputs USING(unit) WHERE outputs.asset = ? AND address in (SELECT address FROM web_addresses WHERE extendedpubkey=?) AND creation_date> NOW() + INTERVAL - 24 HOUR',
    sqlMyAssetBalance: 'SELECT SUM(amount) as amount FROM outputs WHERE outputs.asset = ? AND is_spent=0 AND address in (SELECT address FROM web_addresses WHERE extendedpubkey=?)'

}

const tokenInfo = {
   }

const tx = {
    sqlAddOutputs: 'INSERT INTO web_outputs(asset,message,txid,outputs) VALUES (?,?,?,?)',
    sqlUpdateOutputs: 'UPDATE  web_outputs SET unit= ? where txid=?',
    sqlQueryOutputs: 'SELECT * FROM web_outputs where txid=?',
    sqlQueryOutputsState: 'SELECT unit FROM web_outputs where txid=?'
}

const commonStatistic = {
    sqlBaseTopHolder: '',
    sqlTopHolder: 'SELECT unit AS asset, cap, address, sum AS amount, sum/cap * 100 AS percentage, @row_number := @row_number + 1 AS rank FROM ( SELECT * FROM ( SELECT unit, cap FROM assets WHERE assets.unit = ? ) AS newtable ) AS atable LEFT JOIN ( SELECT asset, address, sum( amount ) AS sum FROM outputs WHERE is_spent = 0 AND asset = ? GROUP BY address ORDER BY sum DESC ) AS ctable ON atable.unit = ctable.asset, ( SELECT @row_number := 0 ) AS t ORDER BY sum DESC, rank ASC LIMIT 100',
    sqlAllAsset: 'SELECT SUM(amount)as amount, case when asset is null then \'base\' else asset end  as asset FROM outputs WHERE is_spent=0  AND address = ? GROUP BY asset',
    sqlConfirmedBalance: 'SELECT COALESCE(SUM(amount), 0) AS balance FROM outputs  left join units on outputs.unit=units.unit WHERE outputs.asset %s AND outputs.address = ? AND units.sequence = \'good\'  AND units.is_stable = 1 AND outputs.is_spent=0',
    sqlUnconfirmedBalance: 'SELECT COALESCE(SUM(amount), 0) AS balance FROM outputs  left join units on outputs.unit=units.unit WHERE outputs.asset %s AND outputs.address = ? AND units.sequence = \'good\'  AND units.is_stable = 0 AND outputs.is_spent=0',
    sqlTxHistory: 'SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN outputs USING ( unit ) WHERE outputs.asset %s AND outputs.address = ? UNION SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN inputs USING ( unit ) WHERE inputs.asset %s AND inputs.address = ? ORDER BY creation_date DESC LIMIT ?,?',
    sqlReadableHistory: ''
}


const test = {
    test: 'select * from web_login limit 10 left join '
}

module.exports = {
    user,
    test,
    tx,
    statistic,
    tokenInfo,
    commonStatistic
}