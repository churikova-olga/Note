
const mysql = require('mysql');
const LocalStrategy = require('passport-local').Strategy
let db = require('./db')
const bcrypt = require('bcrypt-nodejs');

module.exports = function(passport) {

    passport.serializeUser(function (user, done){
        console.log('Сериализация: ', user.idUser)
        done(null, user.idUser)
    });


    passport.deserializeUser(function(idUser, done) {
        db.query("SELECT * FROM user WHERE idUser = ? ",[idUser], function(err, result){
            done(err, result[0]);
        });
    });

    passport.use(
        'local-signup',
        new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },

            function(req, email, password, done) {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                // console.log(Lastname)
                let data = req.body
                db.query("SELECT * FROM user WHERE email = ?", [email], function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    if (result.length) {
                        if(result[0].email === email){
                            return done(null, false, req.flash('signupMessage', 'Такой email уже зарегестрирован'));
                        }
                    } else {

                        // if there is no user with that username
                        // create the user
                        let newUserMysql = {
                            firstname: data.firstName,
                            lastname: data.lastName,
                            email: email,
                            password: bcrypt.hashSync(password, null, null),  // use the generateHash function in our user model
                        };
                        let insertQuery = "INSERT INTO user (lastname, firstname, email, password) values (?,?,?,?)";
                        db.query(insertQuery, [newUserMysql.lastname, newUserMysql.firstname, newUserMysql.email, newUserMysql.password],
                            function (err, result) {
                                newUserMysql.idUser = result.insertId
                                return done(null, newUserMysql);
                            });
                    }
                });
            })
    )

    passport.use(
        'local-login',
        new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },
            function(req, email, password, done) { // callback with email and password from our form
                db.query("SELECT * FROM user WHERE email = ?", [email], function (err, result) {
                    if (err) return done(err);
                    if (!result.length) {
                        return done(null, false, req.flash('loginMessage', 'Неправильный логин или пароль')); // req.flash is the way to set flashdata using connect-flash
                    }
                    // if the user is found but the password is wrong
                    // if (password !== result[0].password)
                    if (!bcrypt.compareSync(password, result[0].password))
                        return done(null, false, req.flash('loginMessage', 'Неправильный пароль')); // create the loginMessage and save it to session as flashdata

                    // all is well, return successful user
                    return done(null, result[0]);
                });
            })
    );

};
