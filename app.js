var express = require('express');
var path = require('path');
var fs = require('fs');  
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var sqlite3 = require("sqlite3").verbose();

var routes = require('./routes/index');
var users = require('./routes/users');

/// Initialize Express App.
var app = express();

/// The View Engine.
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layouts'}));
app.set('view engine', 'handlebars');

/// The Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

/// Set static folder.
app.use(express.static(path.join(__dirname, 'public')));

/// Middleware for Express Session.
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
	
}));

app.use(passport.initialize());
app.use(passport.session());



//// Express Validator Middleware.
app.use(expressValidator()); 

//// Connect Flash.
app.use(flash());

//// Global variables
app.use(function(req, res, next) {
	
	res.locals.success_msg = req.flash('success_msg'); //// global variable for success messages.
	res.locals.error_msg = req.flash('error_msg');     //// for any error messages
	res.locals.error = req.flash('error');             //// passport sets its own flash messages as error.
	res.locals.user = req.user || null;
	next();
});


//// middle ware for route files.
app.use('/', routes);
app.use('/users', users);


//// Set Port
app.set('port', (process.env.PORT || 3000 ));
app.listen(app.get('port'), function() {
	console.log('Server started on port '+app.get('port'));
});





//// On start up, set up database, if there already is one delete it.
var file = 'mytodo.db';
fs.access(file, fs.constants.R_OK | fs.constants.W_OK, (err) => { 
	if(!err)  {
		console.log(' Database file exists going to delete now. ');
		fs.unlink(file, (err) => {
			if (err) { console.log("Failed to delete database:"+err); }
        }); ////Do db delete file.
	} else
	{ console.log(' Database file does not exist...'); }
	var db = new sqlite3.Database(file);
	db.serialize(function() {
		var DROPtableStatement = "DROP TABLE IF EXISTS Users;";
		db.run(DROPtableStatement);	
		var CREATEtableStatement = "CREATE TABLE users ( usersid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, username TEXT, email TEXT, password TEXT, salt TEXT );";			
		db.run(CREATEtableStatement);				

		db.close();
		console.log(" Database created.");
	});
});
////Done Database check if exists and create.
