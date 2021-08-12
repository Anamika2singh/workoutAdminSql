const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.get = [
  (req,res)=>{ 
  	db.query("SELECT * FROM levels",(err,level)=>{
  		if(err){
        res.render('manage-level',{msg:'There is a Problem in displaying levels.',data:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
  		res.render('manage-level',{msg:tmpMsg,data:level ,adminData:req.session.admin});
      tmpMsg = '';
  	})
  }
]
exports.add = [
body("levelName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
				res.render('manage-level',{msg:"Validation Error",data:[], adminData:req.session.admin})
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'levels').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO levels (name , image) VALUES (?,?)",[req.body.levelName,req.file.filename],(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Level';
                                    res.render('manage-level',{msg:insertErr,data:[] ,adminData:req.session.admin})
                                  };
                                	if(inserted){
                                    tmpMsg = 'Level Added Successfully';
                                		res.redirect('/level/manageLevel');
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                           tmpMsg = 'Some problem occured during uploading files on our server';
                            res.render('manage-level',{msg:upload_err,data:[] ,adminData:req.session.admin})
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some Problem Occured during adding Level';
			res.render('manage-level',{msg:err,data:[] ,adminData:req.session.admin})
		}
}];

exports.update = [
body("levelName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/level/manageLevel');
      }else{
        var dataToUpdate = {
          name : req.body.levelName
        };
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename; 
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'levels').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE levels SET ? WHERE level_id = ?",[dataToUpdate , req.params.levelID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Level';
                                    res.redirect('/level/manageLevel');
                                  }else
                                  if(updated.affectedRows>0){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'levels');
                                    tmpMsg = 'Level Updated Successfully';
                                    res.redirect('/level/manageLevel');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating level';
                                    res.redirect('/level/manageLevel');
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/level/manageLevel');
                        });
                 }else
                 {
                  db.query("UPDATE levels SET ? WHERE level_id = ?",[dataToUpdate , req.params.levelID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Level';
                                    res.redirect('/level/manageLevel');
                                  }else
                                  if(updated.affectedRows>0){
                                    tmpMsg = 'Level Updated Successfully';
                                    res.redirect('/level/manageLevel');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating Level';
                                    res.redirect('/level/manageLevel');
                                  }
                                }) 
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Level';
      res.redirect('/level/manageLevel');
    }
  }
]


exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.levelID))
   {
    db.query("DELETE FROM levels WHERE level_id = ?",[req.params.levelID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting level';
        res.redirect('/level/manageLevel');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'levels');
        tmpMsg = 'Level Deleted SuccessFully'
        res.redirect('/level/manageLevel');
      }else{
        tmpMsg = 'Level Not Found';
        res.redirect('/level/manageLevel');
      }

    })
   }else
   {
    tmpMsg = 'Level Not Found';
    res.redirect('/level/manageLevel');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting level';
    res.redirect('/level/manageLevel');
  }
}
]