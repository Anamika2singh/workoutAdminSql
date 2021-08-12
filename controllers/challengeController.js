const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.getChallenge = [ 
  (req,res)=>{
    db.query(`SELECT challenge_id, name, image , body_area ,created_at ,updated_at FROM challenges`,(challengeErr,challenges)=>{
      if(challengeErr){
        res.render('manage-challenge',{msg:'There is a Problem in displaying challenges.',challenges:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
      var count =0;
      if(challenges.length>0){
        for(let challenge of challenges){
          db.query(`SELECT workout FROM challenge_mapping WHERE challenge_id = ${challenge.challenge_id}`,(workoutErr,workouts)=>{
              challenge.workouts = workouts;
              count++;
              if(count==challenges.length)
              {
               res.render('manage-challenge',{msg:tmpMsg,challenges:challenges ,adminData:req.session.admin});
               tmpMsg = '';
              }
          })
        }
      }else{
        res.render('manage-challenge',{msg:'No Challenges Found',challenges:[] ,adminData:req.session.admin});
        tmpMsg = '';
      }
      
    })
  }
]

exports.getAddChallenge = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM body_areas",(err,body_areas)=>{
     data.bodyAreas = body_areas;
  })
  await db.query("SELECT * FROM workouts WHERE type = 3",(err,workouts)=>{
     data.workouts = workouts;
  res.render('add-challenge',{msg:tmpMsg,data:data, adminData:req.session.admin});
  tmpMsg = '';
  })
}]

exports.getUpdateChallenge = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM body_areas",(err,body_areas)=>{
     data.bodyAreas = body_areas;
  })
  await db.query("SELECT * FROM workouts WHERE type = 3",(err,workouts)=>{
     data.workouts = workouts;
  })
  await db.query(`SELECT * FROM challenges WHERE challenge_id = ${req.params.challengeID}`,(challengeErr,challenges)=>{console.log(challenges);
          if(challengeErr){
            tmpMsg = 'Some Problem Occured';
            res.redirect('/challenge/manageChallenge');
          }else
          if(challenges.length>0){
          db.query(`SELECT workout_id , day FROM challenge_mapping WHERE challenge_id = ${challenges[0].challenge_id}`,(workoutErr,workouts)=>{
            if(workoutErr){
              tmpMsg = 'Some Problem Occured';
              res.redirect('/challenge/manageChallenge');
            }else 
            {
              challenges[0].workouts = workouts;
              data.challenge = challenges[0];
              console.log(data);
              res.render('update-challenge',{msg:'',data:data, adminData:req.session.admin});
              tmpMsg = '';
            }
          })
      }else{
        tmpMsg = 'No challenge Found';
        res.redirect('/challenge/manageChallenge');
      } 
   })
}]

// exports.getAddWorkout = [
// async (req,res)=>{
//   var data={};
//   function query(){
//   db.query("SELECT * FROM body_areas",(err,body_areas)=>{
//      data.bodyAreas = body_areas;
//   })
//   db.query("SELECT * FROM levels",(err,levels)=>{
//      data.levels = levels;
//   })
//   db.query("SELECT * FROM exercises",(err,exercises)=>{
//      data.exercises = exercises;
//   })
// }
// function response(){
//   console.log("We found something ",data);
//   res.render('add-workout',{msg:'',data:data, adminData:req.session.admin});
// }
// await query();
// await response();
// }]

exports.addChallenge = [
body("challengeName").trim().exists().notEmpty().withMessage("Challenge Name is required"),
body("bodyArea").trim().exists().notEmpty().withMessage("Body Area is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/challenge/addChallenge');
      }else{
        if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'challenges').then(async uploaded=>{
                            if(uploaded)
                            {
                            	var bodyArea = req.body.bodyArea.split(".");
                                db.query("INSERT INTO challenges (name , image , body_area_id , body_area) VALUES (?,?,?,?)",[req.body.challengeName,req.file.filename,bodyArea[0],bodyArea[1]],async(insertErr,inserted)=>{
                                  if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Challenge';
                                    res.redirect('/challenge/addChallenge');
                                  };
                                  if(inserted){
                                    var count =0;
                                    for(let i=0;i<req.body.workouts.length;i++){
                                      var workouts = req.body.workouts[i].split(".");
                                      db.query("INSERT INTO challenge_mapping (challenge_id,day ,workout_id, workout) VALUES (?,?,?,?)",[inserted.insertId,i+1,workouts[0],workouts[1]],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                        }
                                          if(count==req.body.workouts.length){
                                            tmpMsg = 'Challenge added Successfully';
                                             res.redirect('/challenge/manageChallenge');
                                           }
                                      })
                                    }
                                    
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/challenge/addChallenge');
                        });
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Challenge';
      res.redirect('/challenge/addChallenge');
    }
}];

exports.updateChallenge = [
body("challengeName").trim().exists().notEmpty().withMessage("Name is required"),
body("bodyArea").trim().exists().notEmpty().withMessage("Body Area is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/updateChallenge/req.params.workoutID');
      }else{
        var bodyArea = req.body.bodyArea.split(".");
        dataToUpdate = {
          name : req.body.challengeName,
          body_area_id : bodyArea[0],
          body_area    : bodyArea[1]
        }
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename;
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'challenges').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE challenges SET ? WHERE challenge_id = ?",[dataToUpdate , req.params.challengeID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating challenge';
                                    res.redirect('/challenge/updateChallenge/req.params.challengeID');
                                  }else
                                  if(updated){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'challenges');
                                    var count =0;
                                    for(let i=0;i<req.body.workouts.length;i++){
                                      var workout = req.body.workouts[i].split(".");
                                      db.query("UPDATE challenge_mapping SET workout_id = ?, workout = ? WHERE challenge_id = ? AND day = ?",
                                        [workout[0], workout[1],  req.params.challengeID,workout[2]],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                        }
                                          if(count==req.body.workouts.length){
                                            tmpMsg = 'Challenge updated Successfully';
                                            res.redirect('/challenge/manageChallenge');
                                           }
                                      })
                                    }
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                          res.redirect('/workout/updateChallenge/req.params.challengeID');
                        });
                 }else{
                  db.query("UPDATE challenges SET ? WHERE challenge_id = ?",[dataToUpdate , req.params.challengeID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating challenge';
                                    res.redirect('/challenge/updateChallenge/req.params.challengeID');
                                  }else
                                  if(updated){
                                    var count =0;
                                    for(let i=0;i<req.body.workouts.length;i++){
                                      var workout = req.body.workouts[i].split(".");
                                      db.query("UPDATE challenge_mapping SET workout_id = ?, workout = ? WHERE challenge_id = ? AND day = ?",[workout[0], workout[1],  req.params.challengeID,workout[2]],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                        }
                                          if(count==req.body.workouts.length){
                                            tmpMsg = 'Challenge updated Successfully';
                                            res.redirect('/challenge/manageChallenge');
                                           }
                                      })
                                    }
                                  }
                                })
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during updating Workout';
      res.redirect('/workout/updateChallenge/req.params.challengeID');
    }
}];

exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.challengeID))
   {
    db.query("DELETE FROM challenges WHERE challenge_id = ?",[req.params.challengeID],(error,deleted)=>{
      console.log(deleted);
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting challenge';
        res.redirect('/challenge/manageChallenge');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'challenges');
        db.query("DELETE FROM challenge_mapping WHERE challenge_id = ?",[req.params.challengeID]);
        tmpMsg = 'Challenge Deleted SuccessFully'
        res.redirect('/challenge/manageChallenge');
      }else{
        tmpMsg = 'Challenge Not Found';
        res.redirect('/challenge/manageChallenge');
      }

    })
   }else
   {
    tmpMsg = 'Challenge Not Found';
    res.redirect('/challenge/manageChallenge');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting challenge';
    res.redirect('/challenge/manageChallenge');
  }
}
]