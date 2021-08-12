var express = require('express');
var router = express.Router();
var isSet = require('isset');
var empty = require('is-empty');
const apiMiddleware = require('../middlewares/apiMiddleware');

/* GET home page. */
router.get('/', function(req, res, next) {
	if(isSet(req.session.admin) && !empty(req.session.admin))
	{
		res.redirect('/dashboard');
	}else{
		res.render('login', { msg: '' });
	} 
});

router.get('/dashboard',apiMiddleware.redirectAfterAuthentication,async function(req, res) {
    let data= {};
	await db.query("SELECT COUNT(user_id) AS users FROM user_profile",(err,users)=>{
				data.users = users[0].users;
	});
	await db.query("SELECT COUNT(user_id) AS paidUsers FROM user_profile WHERE premium = 1",(err,paidUsers)=>{
				data.paidUsers = paidUsers[0].paidUsers;
	});
	await db.query("SELECT COUNT(body_area_id) AS bodyAreas FROM body_areas",(err,bodyAreas)=>{
				data.bodyAreas = bodyAreas[0].bodyAreas;
	});
	await db.query("SELECT COUNT(level_id) AS levels FROM levels",(err,levels)=>{
				data.levels = levels[0].levels;
	});
	await db.query("SELECT COUNT(exercise_id) AS exercises FROM exercises",(err,exercises)=>{
				data.exercises = exercises[0].exercises;
	});
	await db.query("SELECT COUNT(goal_id) AS goals FROM goals",(err,goals)=>{
				data.goals = goals[0].goals;
	});
	await db.query("SELECT article_id , name FROM articles",(err,articles)=>{ 
				data.articles = articles;
				data.articleCount = articles.length;
	});
	await db.query("SELECT COUNT(workout_id) AS workouts FROM workouts WHERE type = 1",(err,workouts)=>{
				data.workouts = workouts[0].workouts;
	});
	await db.query("SELECT COUNT(challenge_id) AS challenges FROM challenges",(err,challenges)=>{
				data.challenges = challenges[0].challenges;
	});
	await db.query("SELECT workout_id, name FROM workouts WHERE type = 2",(err,goalWorkouts)=>{
				data.goalWorkouts = goalWorkouts;
				data.goalWorkoutCount = goalWorkouts.length;
	});
	await db.query("SELECT name FROM articles WHERE featured = 1",(err,featuredArticle)=>{
			if(featuredArticle.length>0)
			{
				data.featuredArticle = featuredArticle[0].name;
			}
	});
	await db.query("SELECT name FROM workouts WHERE featured = 1 AND type = 2",(err,featuredWorkout)=>{
			if(featuredWorkout.length>0)
			{
				data.featuredWorkout = featuredWorkout[0].name;
			}
			res.render('dashboard', {data:data, adminData:req.session.admin });
	});
});

router.post('/changeFeatured',apiMiddleware.redirectAfterAuthentication,async(req,res)=>{
	if(!empty(req.body.article))
	{
	   await db.query("UPDATE articles SET featured = 0");
       await db.query("UPDATE articles SET featured = 1 WHERE article_id=?",[req.body.article]);
    }
    if(!empty(req.body.workout))
    {
       await db.query("UPDATE workouts SET featured = 0");
       await db.query("UPDATE workouts SET featured = 1 WHERE workout_id = ?",[req.body.workout]);
	}
	res.redirect('/dashboard');
})

router.get('/forgotPassword', function(req, res) {
     res.render('forgot-password',{msg:""});
});

router.get('/manage-user', apiMiddleware.redirectAfterAuthentication ,function(req, res) {
	let order = 'DESC';
	let filter = '';
	if(req.query.sort=='OtoN'){
        order = "ASC"
	}
	if(req.query.filter==='0')
		filter = "WHERE premium = 0";
	if(req.query.filter==='1')
		filter = "WHERE premium = 1";
	// SELECT * FROM user_profile ${filter} ORDER BY created_at ${order}
	
	db.query(`SELECT user_profile.name,user_profile.email,user_profile.gender,user_profile.height,user_profile.weight,user_profile.premium,user_profile.created_at,goals.goal_name
	 FROM user_profile LEFT JOIN goals ON user_profile.goal_id = goals.goal_id ${filter}
	  ORDER BY user_profile.created_at ${order}`,(error,result)=>{
		if(error){
			res.render("error",{message:error});
		}
		res.render('manage-user', { userData : result, adminData:req.session.admin});
	})
});

router.get('/privacyPolicy', function(req, res) {
     res.render('privacy-policy');
});

module.exports = router;