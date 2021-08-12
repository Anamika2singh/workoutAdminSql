const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');
var tmpMsg = '';
exports.get = [
  (req,res)=>{
    var sort = 'DESC';
    // if(req.query.sort == 'OtoN'){
    //   sort = 'ASC';
    // }
  	db.query(`SELECT * FROM body_areas ORDER BY created_at ${sort}`,(err,bodyArea)=>{
  		if(err){
        res.render('manage-bodyarea',{msg:'There is a Problem in displaying Body Areas.',data:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
  		res.render('manage-bodyarea',{msg:tmpMsg,data:bodyArea ,adminData:req.session.admin});
      tmpMsg = '';
  	})
  }
] 
exports.add = [
body("bodyAreaName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.'
				res.redirect('/bodyArea/manageBodyArea');
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'bodyAreas').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO body_areas (name , image) VALUES (?,?)",[req.body.bodyAreaName,req.file.filename],(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some problem Occured during Inserting. Please Try Again';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  };
                                	if(inserted){
                                    tmpMsg = 'Body area Added Successfully';
                                		res.redirect('/bodyArea/manageBodyArea');
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/bodyArea/manageBodyArea');
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some problem Occured during Inserting. Please Try Again';
			res.redirect('/bodyArea/manageBodyArea');
		}
}];

exports.update = [
body("bodyAreaName").trim().exists().notEmpty().withMessage("Name is required."),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/bodyArea/manageBodyArea');
      }else{
        var dataToUpdate = {
          name : req.body.bodyAreaName
        };
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename; 
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'bodyAreas').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE body_areas SET ? WHERE body_area_id = ?",[dataToUpdate , req.params.bodyAreaID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Body Area';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }else
                                  if(updated.affectedRows>0){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'bodyAreas');
                                    tmpMsg = 'Body Area Updated Successfully';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating bodyArea';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/bodyArea/manageBodyArea');
                        });
                 }else
                 {
                  db.query("UPDATE body_areas SET ? WHERE body_area_id = ?",[dataToUpdate , req.params.bodyAreaID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Body Area';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }else
                                  if(updated.affectedRows>0){
                                    tmpMsg = 'Body Area Updated Successfully';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating Body Area';
                                    res.redirect('/bodyArea/manageBodyArea');
                                  }
                                }) 
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Body Area';
      res.redirect('/bodyArea/manageBodyArea');
    }
  }
]

exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.bodyAreaID))
   {
    db.query("DELETE FROM body_areas WHERE body_area_id = ?",[req.params.bodyAreaID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting Body Area';
        res.redirect('/bodyArea/manageBodyArea');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'bodyAreas');
        tmpMsg = 'Body Area Deleted SuccessFully'
        res.redirect('/bodyArea/manageBodyArea');
      }else{
        tmpMsg = 'BodyArea Not Found';
        res.redirect('/bodyArea/manageBodyArea');
      }

    })
   }else
   {
    tmpMsg = 'Body Area Not Found';
    res.redirect('/bodyArea/manageBodyArea');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting Body Area';
    res.redirect('/bodyArea/manageBodyArea');
  }
}
]