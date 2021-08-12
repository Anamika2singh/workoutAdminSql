const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.get = [ 
  (req,res)=>{
  	db.query("SELECT * FROM articles",(err,article)=>{
  		if(err){
        res.render('manage-article',{msg:'There is a Problem in displaying articles.',data:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
  		res.render('manage-article',{msg:tmpMsg,data:article ,adminData:req.session.admin});
      tmpMsg = '';
  	})
  }
]
exports.add = [
body("articleName").trim().exists().notEmpty().withMessage("Name is required."),
body("articleURL").trim().exists().notEmpty().withMessage("Article URL is required."),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
				res.redirect('/article/manageArticle');
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'articles').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO articles (name , image, url) VALUES (?,?,?)",[req.body.articleName,req.file.filename,req.body.articleURL],(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding article';
                                    res.redirect('/article/manageArticle');
                                  };
                                	if(inserted){
                                    tmpMsg = 'Article Added Successfully';
                                		res.redirect('/article/manageArticle');
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/article/manageArticle');
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some Problem Occured during adding article';
			res.redirect('/article/manageArticle');
		}
}];

exports.update = [
body("articleName").trim().exists().notEmpty().withMessage("Name is required."),
body("articleURL").trim().exists().notEmpty().withMessage("Article URL is required."),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/article/manageArticle');
      }else{
        var dataToUpdate = {
          name : req.body.articleName,
          url  : req.body.articleURL 
        };
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename; 
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'articles').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE articles SET ? WHERE article_id = ?",[dataToUpdate , req.params.articleID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating article';
                                    res.redirect('/article/manageArticle');
                                  }else
                                  if(updated.affectedRows>0){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'articles');
                                    tmpMsg = 'Article Updated Successfully';
                                    res.redirect('/article/manageArticle');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating article';
                                    res.redirect('/article/manageArticle');
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/article/manageArticle');
                        });
                 }else
                 {
                  db.query("UPDATE articles SET ? WHERE article_id = ?",[dataToUpdate , req.params.articleID],(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating article';
                                    res.redirect('/article/manageArticle');
                                  }else
                                  if(updated.affectedRows>0){
                                    tmpMsg = 'Article Updated Successfully';
                                    res.redirect('/article/manageArticle');
                                  }else
                                  {
                                    tmpMsg = 'Some Problem Occured during updating article';
                                    res.redirect('/article/manageArticle');
                                  }
                                }) 
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding article';
      res.redirect('/article/manageArticle');
    }
  }
]

exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.articleID) && !empty(req.params.image))
   {
    db.query("DELETE FROM articles WHERE article_id = ?",[req.params.articleID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting Article';
        res.redirect('/article/manageArticle');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'articles');
              tmpMsg = 'Article Deleted SuccessFully';
              res.redirect('/article/manageArticle');
      }else{
        tmpMsg = 'Article Not Found';
        res.redirect('/article/manageArticle');
      }

    })
   }else
   {
    tmpMsg = 'Article Not Found';
    res.redirect('/article/manageArticle');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting Article';
    res.redirect('/article/manageArticle');
  }
}
]