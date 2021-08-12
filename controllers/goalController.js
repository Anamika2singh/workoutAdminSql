const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.get = [
  (req,res)=>{
  	db.query("SELECT * FROM goals",(err,goal)=>{
  		if(err){
        res.render('manage-goal',{msg:'There is a Problem in displaying Goals.',data:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
  		res.render('manage-goal',{msg:tmpMsg,data:goal ,adminData:req.session.admin});
      tmpMsg = '';
  	}) 
  }
]
exports.add = [
body("goalName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
				res.redirect('/goal/manageGoal');
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'goals').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO goals (goal_name , goal_image) VALUES (?,?)",[req.body.goalName,req.file.filename],(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Goal';
                                    res.redirect('/goal/manageGoal');
                                  };
                                	if(inserted){
                                    tmpMsg = 'Goal Added Successfully';
                                		res.redirect('/goal/manageGoal');
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/goal/manageGoal');
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some Problem Occured during adding Goal';
			res.redirect('/goal/manageGoal');
		}
}];

exports.update = [
body("goalName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/goal/manageGoal');
      }else{
        var dataToUpdate = {
          goal_name : req.body.goalName
        };
        if(!empty(req.file))
                 {
                  dataToUpdate.goal_image = req.file.filename; 
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'goals').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE goals SET ? WHERE goal_id = ?",[dataToUpdate , req.params.goalID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Goal';
                                    res.redirect('/goal/manageGoal');
                                  }else
                                  if(updated.affectedRows>0){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'goals');
                                    tmpMsg = 'Goal Updated Successfully';
                                    res.redirect('/goal/manageGoal');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating goal';
                                    res.redirect('/goal/manageGoal');
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/goal/manageGoal');
                        });
                 }else
                 {
                  db.query("UPDATE goals SET ? WHERE goal_id = ?",[dataToUpdate , req.params.goalID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Goal';
                                    res.redirect('/goal/manageGoal');
                                  }else
                                  if(updated.affectedRows>0){
                                    tmpMsg = 'Goal Updated Successfully';
                                    res.redirect('/goal/manageGoal');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating Goal';
                                    res.redirect('/goal/manageGoal');
                                  }
                                }) 
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Goal';
      res.redirect('/goal/manageGoal');
    }
  }
]


exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.goalID))
   {
    db.query("DELETE FROM goals WHERE goal_id = ?",[req.params.goalID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting goal';
        res.redirect('/goal/manageGoal');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'goals');
        tmpMsg = 'Goal Deleted SuccessFully'
        res.redirect('/goal/manageGoal');
      }else{
        tmpMsg = 'Goal Not Found';
        res.redirect('/goal/manageGoal');
      }

    })
   }else
   {
    tmpMsg = 'Goal Not Found';
    res.redirect('/goal/manageGoal');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting goal';
    res.redirect('/goal/manageGoal');
  }
}
]