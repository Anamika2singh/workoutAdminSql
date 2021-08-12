var isset = require('isset');
var empty = require('is-empty');
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

module.exports.redirectAfterAuthentication = function (req, res, next) { 
   console.log(req.session.admin);
  if (req.originalUrl!='/auth/login' && req.originalUrl!='/auth/register' && req.originalUrl!='/auth/sendPasswordResetEmail'&& req.originalUrl!='/auth/resetPassword' && req.originalUrl!='/auth//verifyToken/:token')
  {         
    // decode token
      if (isset(req.session.admin) && !empty(req.session.admin)) {
          // verifies secret and checks exp 
                  db.query("SELECT * FROM admin_profile WHERE admin_id = ?",[req.session.admin.adminID],(err,admin)=>{
                    if(admin.length>0){
                      next();
                    }else{
                      res.redirect('/');
                    }
                  })
                
        }
      else {
          res.redirect('/');
      }
  }else{
    next();
  }    
}