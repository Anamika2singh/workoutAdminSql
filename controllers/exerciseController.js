const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.get = [ 
  (req,res)=>{
  	db.query("SELECT * FROM exercises",(err,exercise)=>{
  		if(err){
        res.render('manage-exercise',{msg:'There is a Problem in displaying exercises.',data:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
  		res.render('manage-exercise',{msg:tmpMsg,data:exercise ,adminData:req.session.admin});
      tmpMsg = '';
  	})
  }
]
exports.add = [
body("exerciseName").trim().exists().notEmpty().withMessage("Name is required."),
body("exerciseVideo").trim().exists().notEmpty().withMessage("Video URL is required."),
body("MET").trim().exists().notEmpty().withMessage("MET is required."),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
				res.redirect('/exercise/manageExercise');
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'exercises').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO exercises (name , image, video , MET) VALUES (?,?,?,?)",[req.body.exerciseName,req.file.filename,req.body.exerciseVideo,req.body.MET],(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Exercise';
                                    res.redirect('/exercise/manageExercise');
                                  };
                                	if(inserted){
                                    tmpMsg = 'Exercise Added Success Fully'
                                		res.redirect('/exercise/manageExercise');
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                           res.redirect('/exercise/manageExercise');
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some Problem Occured during adding exercise';
			res.redirect('/exercise/manageExercise');
		}
}];

exports.update = [
body("exerciseName").trim().exists().notEmpty().withMessage("Name is required."),
body("exerciseVideo").trim().exists().notEmpty().withMessage("Video URL is required."),
body("MET").trim().exists().notEmpty().withMessage("MET is required."),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/exercise/manageExercise');
      }else{
        var dataToUpdate = {
          name : req.body.exerciseName,
          video: req.body.exerciseVideo,
          MET  : req.body.MET
        };
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename; 
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'exercises').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE exercises SET ? WHERE exercise_id = ?",[dataToUpdate , req.params.exerciseID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Exercise';
                                    res.redirect('/exercise/manageExercise');
                                  }else
                                  if(updated.affectedRows>0){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'exercises');
                                    tmpMsg = 'Exercise Updated Successfully';
                                    res.redirect('/exercise/manageExercise');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating exercise';
                                    res.redirect('/exercise/manageExercise');
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/exercise/manageExercise');
                        });
                 }else
                 {
                  db.query("UPDATE exercises SET ? WHERE exercise_id = ?",[dataToUpdate , req.params.exerciseID],(updateErr,updated)=>{
                    console.log("updateerr",!empty(updateErr));
                    console.log("updated",updated);
                                  if(!empty(updateErr)){
                                    tmpMsg = 'Some Problem Occured during updating Exercise';
                                    res.redirect('/exercise/manageExercise');
                                  }
                                  else if(updated.affectedRows>0){
                                    tmpMsg = 'Exercise Updated Successfully';
                                    res.redirect('/exercise/manageExercise');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating Exercise';
                                    res.redirect('/exercise/manageExercise');
                                  }
                                }) 
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Exercise';
      res.redirect('/exercise/manageExercise');
    }
  }
]


exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.exerciseID))
   {
    db.query("DELETE FROM exercises WHERE exercise_id = ?",[req.params.exerciseID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting exercise';
        res.redirect('/exercise/manageExercise');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'exercises');
        tmpMsg = 'Exercise Deleted Success Fully'
        res.redirect('/exercise/manageExercise');
      }else{
        tmpMsg = 'Exercise Not Found';
        res.redirect('/exercise/manageExercise');
      }

    })
   }else
   {
    tmpMsg = 'Exercise Not Found';
    res.redirect('/exercise/manageExercise');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting exercise';
    res.redirect('/exercise/manageExercise');
  }
}
]