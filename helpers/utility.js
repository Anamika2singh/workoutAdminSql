var fs = require('fs');
const AWS = require('aws-sdk');
const jwt = require("jsonwebtoken");
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY,
    region:process.env.S3_BUCKET_REGION
});  




exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};


exports.uploadFile = (path,fileName,content_type,bucket) => {   
	
    return new Promise( function ( resolve , reject ) {
		// Read content from the file
        //const fileContent = fs.readFileSync(path+fileName);     
        const readStream = fs.createReadStream(path+fileName);
        // Setting up S3 upload parameters       
        // Uploading files to the bucket
        var response = {};
        const params = {
            Bucket: bucket,
            Key: fileName,
            ACL: 'public-read',
            Body: readStream,
            ContentType: content_type                   
        };

        s3.upload(params, async function(err, data) {            
            readStream.destroy();            
            if (err) {
                console.log("Error is here",err);
                response = {
                    message:'error',
                    data: err
                }
            }       

            if(data)
            {
                console.log("Data is here",data);
                fs.unlink(path+fileName, function (err) {
                    if (err) {
                        response = {
                            message:'error',
                            data: err
                        }
                        reject(response);
                    }else{

                        console.log(`File uploaded successfully. ${data.Location}`); 

                        response = {
                            message:'success',
                            data: data.Location
                        }

                        resolve(response);
                    }
                });        
                
            }
            
        });
    });    
};


exports.deleteS3File = (fileName, bucket_name) =>{

    return new Promise(function (resolve, reject){
        var response = {};
        const params = {
            Bucket: bucket_name,
            Key: fileName                             
        };

        s3.deleteObject(params, function(err, data) {
            if (err) {
                response = {
                    message:'error',
                    err: err
                }
                reject(response);
            }
            if(data){
            response={
                message:"Deleted Successfully.",
                data: data
            }  
            resolve(response);
        }else{
            response = {
                    message:'File Not Found.'
                }
                reject(response);
        }
        });
    });
};


exports.containsObject = (obj, list)=>{
    var i;   
    for (i = 0; i < list.length; i++) {
        if (list[i].start_time === obj.start_time || list[i].end_time === obj.end_time) {
            return true;
        }
    }

    return false;
}

exports.verifyUser = (token) =>
{
    return new Promise( function ( resolve , reject ) {
        jwt.verify(token, process.env.JWT_SECRET, {audience: process.env.JWT_AUDIENCE, expiresIn: process.env.JWT_TIMEOUT_DURATION},function(err,token_data){
            if(err)
            {
                reject(err);
            }
            if(token_data)
            {
                resolve(token_data);
            }
        });
    });
}

exports.getMonthName = (month) =>{   
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];    
    return monthNames[month];
}

exports.getWeeksInMonth = (week)=>{

    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();    
    const weeks = [];
        const firstDay = new Date(year, month, 1); 
        const lastDay = new Date(year, month + 1, 0);       
        const daysInMonth = lastDay.getDate();      
        let dayOfWeek = firstDay.getDay();       
        let start;
        let end;

        for (let i = 1; i < daysInMonth + 1; i++) {

            if (dayOfWeek === 0 || i === 1) {
                start = i;
            }

            if (dayOfWeek === 6 || i === daysInMonth) {

                end = i;

                if (start !== end) {

                    weeks.push({
                        start: new Date(year, month, parseInt(start)+1),
                        end: new Date(year, month, parseInt(end)+1)
                    });
                }
            }

            dayOfWeek = new Date(year, month, i).getDay();
        }
       
        if(weeks)
        {
            return weeks[week];
        }
}
