var express = require('express'); 
var router = express.Router();
const exerciseController = require("../controllers/exerciseController");
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

router.get('/manageExercise',apiMiddleware.redirectAfterAuthentication , exerciseController.get);
router.get('/deleteExercise/:image/:exerciseID',apiMiddleware.redirectAfterAuthentication , exerciseController.delete);
router.post('/updateExercise/:image/:exerciseID',apiMiddleware.redirectAfterAuthentication, upload.single('exerciseImage') , exerciseController.update);
router.post('/addExercise',apiMiddleware.redirectAfterAuthentication, upload.single('exerciseImage'),exerciseController.add);

module.exports = router;