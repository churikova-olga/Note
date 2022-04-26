const express = require('express')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
// const ejs = require('express-handlebars')
const flash = require('connect-flash');
const path = require('path')
const passport = require('passport')
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const db = require('./db')
const mysql = require("mysql");
const fileUpload = require('express-fileupload')
const PORT = process.env.PORT || 3000
const app = express()




app.use(express.static(path.join(__dirname, 'public')))

app.use(expressLayouts)
app.set("view engine", "ejs");
app.set('layout', './layouts/main')


app.use(cookieParser()); // read cookies (needed for auth)

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(express.json());

app.use(
    session({
        secret: 'sdsdfds',
        key: 'homework',
        cookie: {
            path: '/',
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        },
        store: new MySQLStore({expiration: 10800000, createDatabaseTable: true,
            schema: {
                tableName: 'sessiontbl',
                columnNames: {
                    session_id: 'session_id',
                    expires: 'expires',
                    data: 'data'
                }
            }},db),
        resave: false,
        saveUninitialized: true
    })
)


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./passport-config')(passport);
require('./routes/route.js')(app, passport);

app.listen(PORT, ()=> {
    console.log('Server has been started...')
})


