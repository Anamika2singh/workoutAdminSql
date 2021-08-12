var express = require('express'); 
var router = express.Router();
const levelController = require("../controllers/levelController");
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

router.get('/manageLevel',apiMiddleware.redirectAfterAuthentication , levelController.get);
router.get('/deleteLevel/:image/:levelID',apiMiddleware.redirectAfterAuthentication , levelController.delete);
router.post('/updateLevel/:image/:levelID',apiMiddleware.redirectAfterAuthentication, upload.single('levelImage') , levelController.update);
router.post('/addLevel',apiMiddleware.redirectAfterAuthentication, upload.single('levelImage'),levelController.add);

module.exports = router;