var express = require('express'); 
var router = express.Router();
const articleController = require("../controllers/articleController");
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

router.get('/manageArticle',apiMiddleware.redirectAfterAuthentication , articleController.get);
router.get('/deleteArticle/:image/:articleID',apiMiddleware.redirectAfterAuthentication , articleController.delete);
router.post('/updateArticle/:image/:articleID',apiMiddleware.redirectAfterAuthentication , upload.single('articleImage'), articleController.update);
router.post('/addArticle',apiMiddleware.redirectAfterAuthentication, upload.single('articleImage'),articleController.add);

module.exports = router;