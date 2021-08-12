const { body,validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
var empty = require('is-empty');

var tmpMsg = '';

exports.delete = [
(req,res)=>{
  try
  {
   if(!empty(req.params.workoutID) && !empty(req.params.workoutID) && req.params.type<=3 && req.params.type>=1)
   {
    db.query("DELETE FROM workouts WHERE workout_id = ?",[req.params.workoutID],(error,deleted)=>{
      if(error)
      {
        tmpMsg = 'Some Problem Occured during Deleting Workout';
          if(req.params.type == 1)
            res.redirect('/workout/manageWorkout');
          if(req.params.type == 2)
            res.redirect('/workout/manageGoalWorkout');
          if(req.params.type == 3)
            res.redirect('/workout/manageChallengeWorkout');
      }else if(deleted.affectedRows>0)
      {
        utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'workouts');
        db.query("DELETE FROM workout_mapping WHERE workout_id = ?",[req.params.workoutID]);
        db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
        tmpMsg = 'workout Deleted SuccessFully';
          if(req.params.type == 1)
            res.redirect('/workout/manageWorkout');
          if(req.params.type == 2)
            res.redirect('/workout/manageGoalWorkout');
          if(req.params.type == 3)
            res.redirect('/workout/manageChallengeWorkout');
      }else{
         tmpMsg = 'workout Not Found';
          if(req.params.type == 1)
            res.redirect('/workout/manageWorkout');
          if(req.params.type == 2)
            res.redirect('/workout/manageGoalWorkout');
          if(req.params.type == 3)
            res.redirect('/workout/manageChallengeWorkout');
      }

    })
   }else
   {
    tmpMsg = 'workout Not Found';
          if(req.params.type == 1)
            res.redirect('/workout/manageWorkout');
          else if(req.params.type == 2)
            res.redirect('/workout/manageGoalWorkout');
          else if(req.params.type == 3)
            res.redirect('/workout/manageChallengeWorkout');
          else
            res.send('Page Not Found');
   }
  }catch(err){
    tmpMsg = 'Some Problem Occured during Deleting workout';
        if(req.params.type == 1)
          res.redirect('/workout/manageWorkout');
        if(req.params.type == 2)
          res.redirect('/workout/manageGoalWorkout');
        if(req.params.type == 3)
          res.redirect('/workout/manageChallengeWorkout');

  }
}
]

//For Body Area and Level Based Workouts
///////////////////////////////////////////////////////////////////////////Start////////////////////////////////////////////////////////////////////
exports.getWorkout = [ 
  (req,res)=>{
  	db.query(`SELECT workout_id, name, body_area, level ,image ,created_at ,updated_at FROM workouts WHERE type = 1`,(workoutErr,workouts)=>{
  		if(workoutErr){
        res.render('manage-workout',{msg:'There is a Problem in displaying workouts.',workouts:[] ,adminData:req.session.admin});
       tmpMsg = '';
    };
      var count =0;
      if(workouts.length>0){
        for(let workout of workouts){
          db.query(`SELECT exercise , repetition , duration FROM workout_mapping WHERE workout_id = ${workout.workout_id}`,(exerciseErr,exercises)=>{
              workout.exercises = exercises;
              count++;
              if(count==workouts.length)
              {
               res.render('manage-workout',{msg:tmpMsg,workouts:workouts ,adminData:req.session.admin});
               tmpMsg = '';
              }
          })
        }
      }else{
        res.render('manage-workout',{msg:'No Workouts Found',workouts:[] ,adminData:req.session.admin});
        tmpMsg = '';
      }
  		
  	})
  }
]

exports.getAddWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM body_areas",(err,body_areas)=>{
     data.bodyAreas = body_areas;
  })
  await db.query("SELECT * FROM levels",(err,levels)=>{
     data.levels = levels;
  })
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
  res.render('add-workout',{msg:tmpMsg,data:data, adminData:req.session.admin});
  tmpMsg = '';
  })
}]

exports.getUpdateWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM body_areas",(err,body_areas)=>{
     data.bodyAreas = body_areas;
  })
  await db.query("SELECT * FROM levels",(err,levels)=>{
     data.levels = levels;
  })
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
     })
  await db.query(`SELECT * FROM workouts WHERE workout_id = ${req.params.workoutID}`,(workoutErr,workouts)=>{console.log(workouts);
          if(workoutErr){
            tmpMsg = 'Some Problem Occured';
            res.redirect('/workout/manageWorkout');
          }else
          if(workouts.length>0){
          db.query(`SELECT exercise_id , repetition , duration FROM workout_mapping WHERE workout_id = ${workouts[0].workout_id}`,(exerciseErr,exercises)=>{
            if(exerciseErr){
              tmpMsg = 'Some Problem Occured';
              res.redirect('/workout/manageWorkout');
            }else 
            {
              workouts[0].exercises = exercises;
              data.workout = workouts[0];
              console.log(data);
              res.render('update-workout',{msg:'',data:data, adminData:req.session.admin});
              tmpMsg = '';
            }
          })
      }else{
        tmpMsg = 'No Workout Found';
        res.redirect('/workout/manageWorkout');
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

exports.addWorkout = [
body("workoutName").trim().exists().notEmpty().withMessage("Name is required"),
body("bodyArea").trim().exists().notEmpty().withMessage("Body Area is required"),
body("level").trim().exists().notEmpty().withMessage("level is required"),
(req,res)=>{
   try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
				res.redirect('/workout/addWorkout');
			}else{
				if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                var bodyArea = req.body.bodyArea.split(".");
                                var level = req.body.level.split(".");

                                db.query("INSERT INTO workouts (name , image,body_area_id, body_area,level_id ,level , type) VALUES (?,?,?,?,?,?,?)",[req.body.workoutName,req.file.filename,bodyArea[0],bodyArea[1],level[0],level[1],1],async(insertErr,inserted)=>{
                                	if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Workout';
                                    res.redirect('/workout/addWorkout');
                                  };
                                	if(inserted){
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[inserted.insertId,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            tmpMsg = 'Workout Added Successfully';
                                             res.redirect('/workout/manageWorkout');
                                           }
                                      })
                                    }
                                    
                                	}
                                })									
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/workout/addWorkout');
                        });
                 }
			}
		} catch (err) {
      tmpMsg = 'Some Problem Occured during adding Workout';
			res.redirect('/workout/addWorkout');
		}
}];

exports.updateWorkout = [
body("workoutName").trim().exists().notEmpty().withMessage("Name is required"),
body("bodyArea").trim().exists().notEmpty().withMessage("Body Area is required"),
body("level").trim().exists().notEmpty().withMessage("level is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/updateWorkout/req.params.workoutID');
      }else{
        var bodyArea = req.body.bodyArea.split(".");
        var level = req.body.level.split(".");
        dataToUpdate = {
          name : req.body.workoutName,
          body_area_id : bodyArea[0],
          body_area    : bodyArea[1],
          level_id     : level[0],
          level        : level[1]
        }
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename;
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'workouts');
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                          res.redirect('/workout/updateWorkout/req.params.workoutID');
                        });
                 }else{
                  db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during updateing Workout';
      res.redirect('/workout/updateWorkout/req.params.workoutID');
    }
}];


///////////////////////////////////////////////////////////////////END//////////////////////////////////////////////////////////////////////////

///For Goal Based Workouts
///////////////////////////////////////////////Start///////////////////////////////////////////////////

exports.getGoalWorkout = [ 
  (req,res)=>{
    db.query(`SELECT workout_id, name, goal ,image ,created_at ,updated_at FROM workouts WHERE type = 2`,(goalWorkoutErr,goalWorkouts)=>{
      if(goalWorkoutErr){
        res.render('manage-goal-workout',{msg:'There is a Problem in displaying goalWorkouts.',goalWorkouts:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
      var count =0;
      if(goalWorkouts.length>0){
        for(let goalWorkout of goalWorkouts){
          db.query(`SELECT exercise , repetition , duration FROM workout_mapping WHERE workout_id = ${goalWorkout.workout_id}`,(exerciseErr,exercises)=>{
              goalWorkout.exercises = exercises;
              count++;
              if(count==goalWorkouts.length)
              {
               res.render('manage-goal-workout',{msg:tmpMsg,goalWorkouts:goalWorkouts ,adminData:req.session.admin});
               tmpMsg = '';
              }
          })
        }
      }else{
        res.render('manage-goal-workout',{msg:'No Goal Workout Found',goalWorkouts:[] ,adminData:req.session.admin});
        tmpMsg = '';
      }
      
    })
  }
]

exports.getAddGoalWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM goals",(err,goals)=>{
     data.goals = goals;
  })
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
  res.render('add-goal-workout',{msg:tmpMsg,data:data, adminData:req.session.admin});
  tmpMsg = '';
  })
}]

exports.getUpdateGoalWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM goals",(err,goals)=>{
     data.goals = goals;
  })
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
     })
  await db.query(`SELECT * FROM workouts WHERE workout_id = ${req.params.workoutID}`,(workoutErr,workouts)=>{console.log(workouts);
          if(workoutErr){
            tmpMsg = 'Some Problem Occured';
            res.redirect('/workout/manageGoalWorkout');
          }else
          if(workouts.length>0){
          db.query(`SELECT exercise_id , repetition , duration FROM workout_mapping WHERE workout_id = ${workouts[0].workout_id}`,(exerciseErr,exercises)=>{
            if(exerciseErr){
              tmpMsg = 'Some Problem Occured';
              res.redirect('/workout/manageGoalWorkout');
            }else 
            {
              workouts[0].exercises = exercises;
              data.workout = workouts[0];
              console.log(data);
              res.render('update-goal-workout',{msg:'',data:data, adminData:req.session.admin});
              tmpMsg = '';
            }
          })
      }else{
        tmpMsg = 'No Workout Found';
        res.redirect('/workout/manageGoalWorkout');
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

exports.addGoalWorkout = [
body("goalWorkoutName").trim().exists().notEmpty().withMessage("Name is required"),
body("goal").trim().exists().notEmpty().withMessage("Goal is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/addGoalWorkout');
      }else{
        if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                var goal = req.body.goal.split(".");

                                db.query("INSERT INTO workouts (name , image,goal_id ,goal , type) VALUES (?,?,?,?,?)",[req.body.goalWorkoutName,req.file.filename,goal[0],goal[1],2],async(insertErr,inserted)=>{
                                  if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Workout';
                                    res.redirect('/workout/addGoalWorkout');
                                  };
                                  if(inserted){
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[inserted.insertId,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            tmpMsg = 'Goal Workout Added SuccessFully';
                                             res.redirect('/workout/manageGoalWorkout');
                                           }
                                      })
                                    }
                                    
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/workout/addGoalWorkout');
                        });
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Workout';
      res.redirect('/workout/addGoalWorkout');
    }
}];

exports.updateGoalWorkout = [
body("goalWorkoutName").trim().exists().notEmpty().withMessage("Name is required"),
body("goal").trim().exists().notEmpty().withMessage("Goal is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
      }else{
        var goal = req.body.goal.split(".");
        dataToUpdate = {
          name    : req.body.goalWorkoutName,
          goal_id : goal[0],
          goal    : goal[1]
        }
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename;
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'workouts');
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageGoalWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                          res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
                        });
                 }else{
                  db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageGoalWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during updateing Workout';
      res.redirect('/workout/updateGoalWorkout/req.params.workoutID');
    }
}];


/////////////////////////////////////////////////////////////////////////////END//////////////////////////////////////////////////////////////////////////


///For Challenge Workouts
///////////////////////////////////////////////////////////////////////////Start///////////////////////////////////////////////////////////////////////
exports.getChallengeWorkout = [ 
  (req,res)=>{
    db.query(`SELECT workout_id, name, image ,created_at ,updated_at FROM workouts WHERE type = 3`,(workoutErr,workouts)=>{
      if(workoutErr){
        res.render('manage-challenge-workout',{msg:'There is a Problem in displaying workouts.',workouts:[] ,adminData:req.session.admin});
        tmpMsg = '';
      };
      var count =0;
      if(workouts.length>0){
        for(let workout of workouts){
          db.query(`SELECT exercise , repetition , duration FROM workout_mapping WHERE workout_id = ${workout.workout_id}`,(exerciseErr,exercises)=>{
              workout.exercises = exercises;
              count++;
              if(count==workouts.length)
              {
               res.render('manage-challenge-workout',{msg:tmpMsg,workouts:workouts ,adminData:req.session.admin});
               tmpMsg = '';
              }
          })
        }
      }else{
        res.render('manage-challenge-workout',{msg:'No Challenge Workouts Found',workouts:[] ,adminData:req.session.admin});
        tmpMsg = '';
      }
      
    })
  }
]

exports.getAddChallengeWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
  res.render('add-challenge-workout',{msg:tmpMsg,data:data, adminData:req.session.admin});
  tmpMsg = '';
  })
}]

exports.getUpdateChallengeWorkout = [
async (req,res)=>{
  var data={};
  await db.query("SELECT * FROM exercises",(err,exercises)=>{
     data.exercises = exercises;
     })
  await db.query(`SELECT * FROM workouts WHERE workout_id = ${req.params.workoutID}`,(workoutErr,workouts)=>{console.log(workouts);
          if(workoutErr){
            tmpMsg = 'Some Problem Occured';
            res.redirect('/workout/manageChallengeWorkout');
          }else
          if(workouts.length>0){
          db.query(`SELECT exercise_id , repetition , duration FROM workout_mapping WHERE workout_id = ${workouts[0].workout_id}`,(exerciseErr,exercises)=>{
            if(exerciseErr){
              tmpMsg = 'Some Problem Occured';
              res.redirect('/workout/manageChallengeWorkout');
            }else 
            {
              workouts[0].exercises = exercises;
              data.workout = workouts[0];
              console.log(data);
              res.render('update-challenge-workout',{msg:'',data:data, adminData:req.session.admin});
              tmpMsg = '';
            }
          })
      }else{
        tmpMsg = 'No Workout Found';
        res.redirect('/workout/manageChallengeWorkout');
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

exports.addChallengeWorkout = [
body("challengeWorkoutName").trim().exists().notEmpty().withMessage("Name is required"),
(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
       tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/addChallengeWorkout');
      }else{
        console.log("This is body ",req.body);
        if(!empty(req.file))
                 {
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("INSERT INTO workouts (name , image, type) VALUES (?,?,?)",[req.body.challengeWorkoutName,req.file.filename,3],async(insertErr,inserted)=>{
                                  if(insertErr){
                                    tmpMsg = 'Some Problem Occured during adding Workout';
                                    res.redirect('/workout/addChallengeWorkout');
                                  };
                                  if(inserted){
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[inserted.insertId,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            tmpMsg = 'Challenge Workout added Successfully';
                                             res.redirect('/workout/manageChallengeWorkout');
                                           }
                                      })
                                    }
                                    
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                            tmpMsg = 'Some problem occured during uploading files on our server';
                            res.redirect('/workout/addChallengeWorkout');
                        });
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during adding Workout';
      res.redirect('/workout/addChallengeWorkout');
    }
}];

exports.updateChallengeWorkout = [
body("challengeWorkoutName").trim().exists().notEmpty().withMessage("Name is required"),(req,res)=>{
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        tmpMsg = 'Some Fields are not being Validated on our end. Please Enter Correct details.';
        res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
      }else{
        dataToUpdate = {
          name    : req.body.challengeWorkoutName
        }
        if(!empty(req.file))
                 {
                  dataToUpdate.image = req.file.filename;
                        //upload new profile image to s3 bucket
                        utility.uploadFile(req.file.destination,req.file.filename,req.file.mimetype,process.env.S3_BUCKET_NAME+'workouts').then(async uploaded=>{
                            if(uploaded)
                            {
                                db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    utility.deleteS3File(req.params.image, process.env.S3_BUCKET_NAME+'workouts');
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageChallengeWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })                  
                            }
                        }).catch(upload_err=>{
                          tmpMsg = 'Some problem occured during uploading files on our server';
                          res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
                        });
                 }else{
                  db.query("UPDATE workouts SET ? WHERE workout_id = ?",[dataToUpdate , req.params.workoutID],async(updateErr,updated)=>{
                                  if(updateErr){
                                    tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
                                  }else
                                  if(updated){
                                    db.query(`DELETE FROM workout_mapping WHERE workout_id = ?`,[req.params.workoutID],(deleteErr,deleted)=>{
                                    if (deleteErr) {
                                      tmpMsg = 'Some Problem Occured during updating Workout';
                                    res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
                                  }else{
                                    var count =0;
                                    for(let i=0;i<req.body.exercise.length;i++){
                                      var repetition;
                                      var duration;
                                      if(req.body.type[i]==1)
                                      {
                                        repetition = req.body.reps[i];
                                        duration = null;
                                      }else{
                                        duration = req.body.reps[i];
                                        repetition = null;
                                      }
                                      var exercise = req.body.exercise[i].split(".");
                                      db.query("INSERT INTO workout_mapping (workout_id,exercise_id, exercise ,repetition , duration) VALUES (?,?,?,?,?)",[req.params.workoutID,exercise[0],exercise[1],repetition, duration],(err,mapped)=>{
                                        if(mapped){
                                          count++;
                                          console.log(count);
                                        }
                                          if(count==req.body.exercise.length){
                                            db.query("DELETE FROM exercise_order WHERE workout_id = ?",[req.params.workoutID]);
                                            tmpMsg = 'Workout updated Successfully';
                                            res.redirect('/workout/manageChallengeWorkout');
                                           }
                                      })
                                    }
                                  }
                                    })
                                  }
                                })
                 }
      }
    } catch (err) {
      tmpMsg = 'Some Problem Occured during updateing Workout';
      res.redirect('/workout/updateChallengeWorkout/req.params.workoutID');
    }
}];

///////////////////////////////////////////////////////////////////END//////////////////////////////////////////////////////////////////////////
