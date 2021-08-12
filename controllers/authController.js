const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");

/**
 * Admin login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").trim().isLength({ min: 1 }).withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("password").trim().isLength({ min: 1 }).withMessage("Password must be specified."),	
	(req, res) => {
		try {
			
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.render('login',{adminData : {}, msg : "Validation Error"});
				// return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				db.query("SELECT * FROM admin_profile WHERE email = ?",req.body.email,(err,admin)=>{
					if(err){return apiResponse.ErrorResponse(res, err.message)}
						// console.log(admin);
					if (admin.length>0) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password,admin[0].password,function (err,same) {							
							if(same)
							{																			
								let adminData = {
									adminID: admin[0].admin_id,
									name: admin[0].name,											
									email: admin[0].email
								};

								req.session.admin = adminData;
                                
                                res.redirect('/dashboard');
								// return apiResponse.successResponseWithData(res,"Login Success.", adminData);
								
							}else{
								res.render('login',{adminData : {}, msg : "Email or Password wrong"});
								// return apiResponse.ErrorResponse(res, "Email or Password wrong.");
							}
						});
					}else{
						res.render('login',{adminData : {}, msg : "Email or Password wrong"});
						// return apiResponse.ErrorResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {

			res.render('login',{adminData : {}, msg : err.message});
			// return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.logout = [
(req,res)=>{
	req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
   });
}
];


/**
 * Send OTP to user
 *
 * @param {string}  email 
 *
 * @returns {Object}
 */
	exports.sendPasswordResetEmail = [
		body("email").trim().isLength({ min: 1 }).withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),	
		(req, res) => {
			try{
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.render('forgot-password',{msg:"Validation Error"})
					// return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
				}else {
					db.query("SELECT * FROM admin_profile Where email = ?",[req.body.email],(err,user)=>{
                        if(err)return apiResponse.ErrorResponse(res,"Problem in fetching the user");
                        if (user.length>0) {
                        	let userData={
                        		userID : user[0].admin_id,
                        		email  : user[0].email
                        	}
                        	    const jwtPayload = userData;
								const jwtData = {
									audience: process.env.JWT_AUDIENCE,
									expiresIn: process.env.JWT_TIMEOUT_DURATION,
								};
								const secret = process.env.JWT_SECRET;
								//Generated JWT token with Payload and secret.
								let token = jwt.sign(jwtPayload, secret, jwtData);
							// Html email body
							let html = `<p>Please find your password reset link below.</p><a href='http://3.131.35.97:4000/auth/verifyToken/${token}'>Click here</a><br>Please Do not Share this URL with anyone.<br>Note:- Reset Link will expire in 10 Minute.`;
							// Send confirmation email

							mailer.send(
								process.env.SENDER_EMAIL, 
								req.body.email,
								"Find Your password reset link here",
								html
							).then(success=>{
							    res.render('forgot-password',{msg:"We have shared a password reset link to your email"});								
								// return apiResponse.successResponse(res,"Mail sent successfully.");
							}).catch(error=>{
								res.render('forgot-password',{msg:"Sorry, Some Problem Occurred ,Please try again"});
								// return apiResponse.ErrorResponse(res,"Problem in sending mail.");
							});
						}else
						{
							res.render('forgot-password',{msg:"This is not a valid Email"});
							// return apiResponse.ErrorResponse(res,"Email is not present in our database.");
						}
					})
				}
			}catch(err)
			{
				return apiResponse.ErrorResponse(res, err);
			}
		}
	];

	exports.verifyToken = [
    (req,res)=>{
    	jwt.verify(req.params.token, process.env.JWT_SECRET, {audience: process.env.JWT_AUDIENCE, expiresIn: process.env.JWT_TIMEOUT_DURATION},
        function(err,tokenData){
          if(err){res.end("This is not a authorized URL.")}
          	console.log(tokenData)
          	if(tokenData){
          		db.query("SELECT * FROM admin_profile WHERE admin_id = ? AND email = ?",[tokenData.userID,tokenData.email],(err,user)=>{
          			if(err){
						  res.end("Some Error Occured. Please Try Again")
						}
          				console.log(user);
          				if(user.length>0)
          					{
          						req.session.tmp_admin = user[0].admin_id;
          						console.log("Session",req.session);
          						res.render('reset-password',{msg:""});
          					}
          				else{
          					res.end("This is not a authorized URL");
          				}
          		})
          		
          	}
    	})
    }];


/**
 * Admin Reset Password
 *
 * @param {string}  password
 * @param {string}  confirmPassword
 *
 * @returns {Object}
 */
	exports.resetPassword = [	
		body("password").trim().isLength({ min: 6 }).withMessage("Password must be specified and of minimum six digit."),
		body("confirmPassword").trim().isLength({ min: 6 }).withMessage("Confirm Password must be specified."),	
	(req, res) => {
		
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.render('reset-password',{msg:"Validation Error"});
			}else if(req.body.password !== req.body.confirmPassword){
                    res.render('reset-password',{msg:"New Password And Confirm Password should be same"})
			}else{
				bcrypt.hash(req.body.password,10,function(err, hash) {
					console.log('hash',hash);
					console.log("tmp_admin",req.session.tmp_admin)
					db.query("UPDATE admin_profile SET password = ? WHERE admin_id = ?",[hash,req.session.tmp_admin],(err,updated)=>{
                       console.log(updated);
                       if(err){res.render('reset-password',{msg:"Problem in Updating Password"})}
                       if(updated.affectedRows>0){
                       	 req.session.destroy();
                       	 res.render('reset-password',{msg:"Password Changed Successfully, Please Close the window and login"});
                       }else{
                        	res.render('reset-password',{msg:"You can't change your password right now, Please generate new password reset email."});
                       }
					})
							
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.getChangePassword = [
(req,res)=>{
	try{
      res.render('change-password',{msg:'',adminData:req.session.admin});
	}catch(err){
		res.render('change-password',{msg:"Problem in loading Change Password Page.",adminData:req.session.admin});
	}
}]

/**
 * Admin Change Password
 *
 * @param {string}  oldPassword
 * @param {string}  newPassword
 *
 * @returns {Object}
 */
	exports.changePassword = [	
		body("oldPassword").isLength({ min: 1 }).trim().withMessage("Old Password must be specified."),
		body("newPassword").isLength({ min: 6 }).trim().withMessage("New Password must be specified and of minimum Six digit."),
		body("confirmNewPassword").isLength({ min: 6 }).trim().withMessage(" Confirm New Password must be specified and of minimum Six digit."),		
	(req, res) => {
		
      try {
      	console.log(req.body);
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.render('change-password',{msg:"Validation Error", adminData:req.session.admin});
			}else if(req.body.newPassword !== req.body.confirmNewPassword){
                    res.render('change-password',{msg:"New Password And Confirm Password should be same", adminData:req.session.admin})
			}else {
					db.query("SELECT * FROM admin_profile WHERE admin_id = ?",[req.session.admin.adminID],(findErr,user)=>{
						if(user.length>0){
                            bcrypt.compare(req.body.oldPassword,user[0].password,async(err,same)=>{
                            	if(same)
                            	{
                            		bcrypt.hash(req.body.newPassword,10,function(err, hash) {
									console.log('hash',hash);
									console.log("tmp_admin",req.session.tmp_admin)
									db.query("UPDATE admin_profile SET password = ? WHERE admin_id = ?",[hash,req.session.admin.adminID],(err,updated)=>{
				                       console.log(updated);
				                       if(err){res.render('change-password',{msg:"Problem in Updating Password", adminData:req.session.admin})}
				                       if(updated.affectedRows>0){
				                       	 res.render('change-password',{msg:"Password Changed Successfully", adminData:req.session.admin});
				                       }else{
				                         res.render('change-password',{msg:"Problem in Updating Password", adminData:req.session.admin});
				                       }
									})
											
								});
                            	}else{
                            		res.render('change-password',{msg:"Current Password is Wrong.", adminData:req.session.admin});
                            	}
                            })
                        }else{
                        	res.render('change-password',{msg:"Authorization Failed.", adminData:req.session.admin});
                        }
					})
			}
		} catch (err) {
			res.render('change-password',{msg:err.message, adminData:req.session.admin});
		}
	}];
