var express = require('express'); 
var router = express.Router();
const authController = require("../controllers/authController");
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

router.post("/login",upload.any() ,authController.login);
router.get("/logout", apiMiddleware.redirectAfterAuthentication ,authController.logout);
router.post("/sendPasswordResetEmail",upload.any() ,authController.sendPasswordResetEmail);
router.post("/resetPassword",upload.any(),authController.resetPassword);
router.get("/verifyToken/:token",authController.verifyToken);
router.get("/changePassword",apiMiddleware.redirectAfterAuthentication ,authController.getChangePassword);
router.post("/changePassword",apiMiddleware.redirectAfterAuthentication, upload.any(),authController.changePassword);

// router.get("/login",(req,res)=>{
//     console.log("Reached here");
//     res.render('dashboard');
// })

module.exports = router;
