var express = require('express'); 
var router = express.Router();
const bodyAreaController = require("../controllers/bodyAreaController");
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

router.get('/manageBodyArea',apiMiddleware.redirectAfterAuthentication , bodyAreaController.get);
router.get('/deleteBodyArea/:image/:bodyAreaID',apiMiddleware.redirectAfterAuthentication , bodyAreaController.delete);
router.post('/updateBodyArea/:image/:bodyAreaID',apiMiddleware.redirectAfterAuthentication, upload.single('bodyAreaImage') , bodyAreaController.update);
router.post('/addBodyArea',apiMiddleware.redirectAfterAuthentication, upload.single('bodyAreaImage'),bodyAreaController.add);

module.exports = router;