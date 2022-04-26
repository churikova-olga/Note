const mysql = require('mysql')
const db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'password',
    database: 'database'
})

db.connect((err) => {
    if (err) {
        throw err
    } else {
        console.log('Connect ')
    }
})

module.exports = db