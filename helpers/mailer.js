const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.send = function (from, to, subject, html)
{
      return new Promise ( function ( resolve , reject){       
        const msg = {
            to: to, // Change to your recipient
            from: from, // Change to your verified sender
            subject: subject,
            // text: html,
            html: html,
          }
          sgMail
            .send(msg)
            .then(() => {
              resolve('Email sent')
            })
            .catch((error) => {
              reject(error)
            })   
    });
};