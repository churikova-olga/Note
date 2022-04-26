express = require('express');
const router = express.Router()
const path = require('path')
const db = require('./../db')
const bodyParser = require("body-parser");



function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the page
    res.redirect('/login');
}


module.exports = function (app, passport) {
    app.get('/login', (req, res)=>{
        res.render('login', { message: req.flash('loginMessage') });
    });

    app.post('/login', (req, res, next)=>{
        passport.authenticate('local-login', function (err, user){
            if(err){
                return next(err)
            }
            if(!user){
                return res.redirect('/login')
            }
            req.logIn(user, function(err){
                if(err){
                    return next(err)
                }
                //

                req.session.userinfo = user

                return res.redirect('/')
            })
        })(req, res, next)
    })

    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup', { message: req.flash('signupMessage')});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true, // allow flash messages
    }), (req, res) => {
        // let data = req.body.login
        // /
        return res.redirect('login')
    });

    app.get('/', isLoggedIn, (req, res)=>{
            let user = req.session.userinfo
            let comments_list = []
            db.query('SELECT *, DATE_FORMAT(dateTimeNote, "%d.%m.%Y %H:%i:%s") as new_dateNote FROM note WHERE idUserNote = ?', [user.idUser], function (err, note) {
                if (err) throw err;
                let note_len = note.length
                let note_i = 0

                let recursive_comments_getter = function (note_i) {
                    if (note_i < note_len) {
                        db.query('SELECT *, DATE_FORMAT(dateTimeComment, "%d.%m.%Y %H:%i:%s") as new_date FROM comment WHERE idNoteComment= ? order by new_date DESC', [note[note_i].idNote],
                            function (err, comments) {
                                comments_list[note_i] = comments
                                recursive_comments_getter(note_i + 1)
                            })
                    } else {
                        console.log(comments_list.length)
                        res.render('index', {note: note, comments: comments_list});
                    }
                }
                recursive_comments_getter(note_i)
            })

    });
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });

    app.post('/delete/:id', isLoggedIn, (req, res)=> {
        let id = req.params.id
        db.query('DELETE FROM `note` where idNote = ?', [id], function(err, notedelete){
            if(err) throw err;
            return res.redirect('/')
        })
    })


    app.get('/add/note',isLoggedIn, function(req, res) {
        res.render('noteCreate');
    });

    app.post('/add/note', isLoggedIn, function(req, res) {
        let data = req.body
        let createNote = {
            idUserNote: req.session.userinfo.idUser,
            title: data.title,
            description: data.description,
        }
        let sql ='INSERT INTO note (`title`, `description`, `idUserNote` ) VALUES (?,?,?)'
        db.query(sql, [createNote.title, createNote.description, createNote.idUserNote], function (err, note) {
            if(err) throw err;
            return res.redirect('/')
        })
    });

    app.get('/add/comment/:id',isLoggedIn, function(req, res) {
        let id = req.params.id
        res.render('commentCreate', {idNote: id});
    });

    app.post('/add/comment/:id',isLoggedIn, function(req, res) {
        let id = req.params.id
        let data = req.body
        console.log(data)
        let createComment = {
           idNoteComment: id,
           message: data.message,
        }
        let sql ='INSERT INTO comment (`idNoteComment`, `message`) VALUES (?,?)'
        db.query(sql, [createComment.idNoteComment, createComment.message], function (err, comment) {
            if(err) throw err;
            return res.redirect('/')
        })
    });

    app.get('/edit/:id',isLoggedIn, function(req, res) {
        let user = req.session.userinfo
        let id = req.params.id
        db.query('SELECT * FROM note WHERE idUserNote = ? and idNote = ?', [user.idUser, id], function (err, note) {
            if (err) throw err;
            res.render('edit', {idNote: id, note: note});
        });
    });
    app.post('/edit/:id',isLoggedIn, function(req, res) {
        let user = req.session.userinfo
        let id = req.params.id
        let data = req.body
        let note = {
            title: data.title,
            description: data.description,
        }
        db.query('UPDATE `note` SET `title`= ?,`description`= ? WHERE idUserNote = ? and idNote = ?', [note.title,note.description,user.idUser, id], function (err, note) {
            if (err) throw err;
            return res.redirect('/')
        });
    });
    return router
}