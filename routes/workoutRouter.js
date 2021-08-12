var express = require('express'); 
var router = express.Router();
const workoutController = require("../controllers/workoutController");
const apiMiddleware = require('../middlewares/apiMiddleware');
var multer = require("multer");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images/" , function(err , succ) {
            if(err)
                throw err

        });
    },
    filename: function (req, file, cb) {        
        var name  = (Date.now()+ Date.now() +file.originalname);
        name = name.replace(/ /g,'-');       
        cb(null, name , function(err , succ1) {
            if(err)
                throw err

        });
    }
});

const upload = multer({ storage: storage, limits: 1000000});

router.get('/deleteWorkout/:type/:image/:workoutID',apiMiddleware.redirectAfterAuthentication , workoutController.delete);

router.get('/manageWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getWorkout);
router.get('/addWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getAddWorkout);
router.get('/updateWorkout/:workoutID',apiMiddleware.redirectAfterAuthentication , workoutController.getUpdateWorkout);
router.post('/updateWorkout/:image/:workoutID',apiMiddleware.redirectAfterAuthentication ,upload.single('workoutImage') , workoutController.updateWorkout);
router.post('/addWorkout',apiMiddleware.redirectAfterAuthentication, upload.single('workoutImage'),workoutController.addWorkout);

router.get('/manageGoalWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getGoalWorkout);
router.get('/addGoalWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getAddGoalWorkout);
router.post('/addGoalWorkout',apiMiddleware.redirectAfterAuthentication, upload.single('goalWorkoutImage'),workoutController.addGoalWorkout);
router.get('/updateGoalWorkout/:workoutID',apiMiddleware.redirectAfterAuthentication , workoutController.getUpdateGoalWorkout);
router.post('/updateGoalWorkout/:image/:workoutID',apiMiddleware.redirectAfterAuthentication ,upload.single('goalWorkoutImage') , workoutController.updateGoalWorkout);

router.get('/manageChallengeWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getChallengeWorkout);
router.get('/addChallengeWorkout',apiMiddleware.redirectAfterAuthentication , workoutController.getAddChallengeWorkout);
router.post('/addChallengeWorkout',apiMiddleware.redirectAfterAuthentication, upload.single('challengeWorkoutImage'),workoutController.addChallengeWorkout);
router.get('/updateChallengeWorkout/:workoutID',apiMiddleware.redirectAfterAuthentication , workoutController.getUpdateChallengeWorkout);
router.post('/updateChallengeWorkout/:image/:workoutID',apiMiddleware.redirectAfterAuthentication ,upload.single('challengeWorkoutImage') , workoutController.updateChallengeWorkout);

module.exports = router;