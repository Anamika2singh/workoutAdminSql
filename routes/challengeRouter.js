var express = require('express'); 
var router = express.Router();
const challengeController = require("../controllers/challengeController");
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


router.get('/manageChallenge',apiMiddleware.redirectAfterAuthentication , challengeController.getChallenge);
router.get('/addChallenge',apiMiddleware.redirectAfterAuthentication , challengeController.getAddChallenge);
router.get('/deleteChallenge/:image/:challengeID',apiMiddleware.redirectAfterAuthentication , challengeController.delete);
router.get('/updateChallenge/:challengeID',apiMiddleware.redirectAfterAuthentication , challengeController.getUpdateChallenge);
router.post('/addChallenge',apiMiddleware.redirectAfterAuthentication, upload.single('challengeImage'),challengeController.addChallenge);
router.post('/updateChallenge/:image/:challengeID',apiMiddleware.redirectAfterAuthentication, upload.single('challengeImage'),challengeController.updateChallenge);

module.exports = router;