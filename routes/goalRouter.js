var express = require('express'); 
var router = express.Router();
const goalController = require("../controllers/goalController");
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

router.get('/manageGoal',apiMiddleware.redirectAfterAuthentication , goalController.get);
router.get('/deleteGoal/:image/:goalID',apiMiddleware.redirectAfterAuthentication , goalController.delete);
router.post('/updateGoal/:image/:goalID',apiMiddleware.redirectAfterAuthentication, upload.single('goalImage') , goalController.update);
router.post('/addGoal',apiMiddleware.redirectAfterAuthentication, upload.single('goalImage'),goalController.add);

module.exports = router;