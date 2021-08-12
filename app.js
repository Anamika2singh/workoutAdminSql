var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
require("dotenv").config();
var indexRouter = require('./routes/indexRouter');
var authRouter = require('./routes/authRouter');
var bodyAreaRouter = require('./routes/bodyAreaRouter');
var goalRouter = require('./routes/goalRouter');
var levelRouter = require('./routes/levelRouter');
var exerciseRouter = require('./routes/exerciseRouter');
var workoutRouter = require('./routes/workoutRouter');
var challengeRouter = require('./routes/challengeRouter');
var articleRouter = require('./routes/articleRouter');
var apiResponse = require("./helpers/apiResponse");
const mysql = require('mysql');
const ejs = require('ejs');
const bodyParser = require('body-parser');
var session = require('express-session');
var schedule = require('node-schedule');


const db = mysql.createConnection ({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER_NAME,
    password: process.env.MYSQL_USER_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to Database');
});
global.db = db;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth',express.static(path.join(__dirname, 'public')));
app.use('/auth/verifyToken',express.static(path.join(__dirname, 'public')));
app.use('/bodyArea',express.static(path.join(__dirname, 'public')));
app.use('/goal',express.static(path.join(__dirname, 'public')));
app.use('/level',express.static(path.join(__dirname, 'public')));
app.use('/exercise',express.static(path.join(__dirname, 'public')));
app.use('/workout',express.static(path.join(__dirname, 'public')));
app.use('/workout/updateWorkout',express.static(path.join(__dirname, 'public')));
app.use('/workout/updateGoalWorkout',express.static(path.join(__dirname, 'public')));
app.use('/workout/updateChallengeWorkout',express.static(path.join(__dirname, 'public')));
app.use('/challenge',express.static(path.join(__dirname, 'public')));
app.use('/challenge/updateChallenge',express.static(path.join(__dirname, 'public')));
app.use('/article',express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
//app.use(upload.any());
app.use(session({
    secret: 'newScan@@#@@@#$@@*&$%$@B!@A&*@@R',
    resave: false,
    saveUninitialized: true,
    cookie: {} /* { secure: true } */
    }));
var sessionChecker = (req, res, next) => {
    if (isSet(req.session.admin) && !empty(req.session.admin)) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/bodyArea', bodyAreaRouter);
app.use('/goal', goalRouter);
app.use('/level', levelRouter);
app.use('/exercise', exerciseRouter);
app.use('/workout', workoutRouter);
app.use('/challenge', challengeRouter);
app.use('/article', articleRouter);



// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

schedule.scheduleJob("0 */24 * * *",async function() { 
    console.log("running a task daily at 12:00 AM");
       await db.query("UPDATE articles SET featured = 0");
       await db.query("UPDATE articles SET featured = 1 ORDER BY RAND() limit 1");
       await db.query("UPDATE workouts SET featured = 0 WHERE type = 2");
       await db.query("UPDATE workouts SET featured = 1 WHERE type = 2 ORDER BY RAND() limit 1");
       await db.query("UPDATE workouts SET featured = 0 WHERE type = 1");
       await db.query("UPDATE workouts SET featured = 1 WHERE type = 1 ORDER BY RAND() limit 1");
       // await db.query("UPDATE workouts SET based_on_goal = 0 WHERE type = 2");
       // await db.query("UPDATE workouts SET based_on_goal = 1 WHERE type = 2 ORDER BY RAND() limit 1");
}); 


app.listen(process.env.PORT || 5000, () => {
    console.log(`Server started ${process.env.PORT}...`)
  })
module.exports = app;
