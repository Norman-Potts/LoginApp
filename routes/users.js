var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var sqlite3 = require("sqlite3").verbose();	
const myDbfile = 'mytodo.db';

	
//// Register Route
router.get('/register', function(req, res) {
	res.render('register');	
});

//// Login Route
router.get('/login', function(req, res) {
	res.render('login');	
});



//// Register User
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password = req.body.password2;
	
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	
	var errors = req.validationErrors();
	
	if(errors) {
		res.render('register', {
			errors:errors
		})
	} else {
		try{
			DoInsert(name, email, username,  password, false, null);
			req.flash('success_msg', 'You are registered and can now login');
			res.redirect('/users/login');
		}catch(e)
		{ console.error(e); }
	}
	
	//// Recursive function DoInsert calls it once.
	function DoInsert( name, email, username, password, secondLoop, saltyBit ) {
		if( secondLoop == false){ 
			bcrypt.genSalt(10, function(err, salt) {
				bcrypt.hash(password, salt, function(err, hash) {
					DoInsert(name, email, username, hash, true, salt);
				});
			});
		} else {		
			var db = new sqlite3.Database(myDbfile);
			db.serialize(function() {
				var INSERTstatement = "INSERT INTO users ( usersid, name, username, email, password, salt )"+
				"values ( null, \""+name+"\", \""+username+"\", \""+email+"\", \""+password+"\", \""+saltyBit+"\" )";	
				db.run( INSERTstatement );	
				db.close();			
			});
		}	
	}
});







passport.use(new LocalStrategy(function(Given_Username, Given_Password, done) {
	var db = new sqlite3.Database(myDbfile); 		
	db.get('SELECT salt, password, username, usersid  FROM users WHERE username = ?', Given_Username, function(err, row) {
		if (!row) { return done(null, false, {message:"Unknown User"}); }					 
		var storedPassword = row.password;
		var candidatePassword = Given_Password;
		bcrypt.compare(candidatePassword, storedPassword, function(err, isMatch) {
			if(err) throw err;

			if (!isMatch) { 
				return done(null, false, {message:"Invalid Password"});  
			}else {		
				return done(null, row);
			}		 
		});						
	});		
}));




passport.serializeUser(function(users, done) {
	return done(null, users.usersid);
});

passport.deserializeUser(function(id, done) {
	var db = new sqlite3.Database(myDbfile); 		
	db.get('SELECT usersid  FROM users WHERE usersid = ?', id, function(err, row) {
		if (!row){
			return done(null, false);
		}
		return done(null, row);
	});
});
  

router.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}), function(req, res) { 
	res.redirect('/');
});


router.get('/logout', function (req, res) {
	req.logout();
    req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});



module.exports = router;