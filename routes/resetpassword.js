const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://mongoDbUser:3TQSsmEEfTQdnbd@cluster0-mte9s.gcp.mongodb.net?retryWrites=true&w=majority";

userRoutes.post('/forgot', function (req, res) {

    const email = req.body.email
    User
        .findOne({
            where: { email: email },//checking if the email address sent by client is present in the db(valid)
        })
        .then(function (user) {
            if (!user) {
                return throwFailed(res, 'No user found with that email address.')
            }
            ResetPassword
                .findOne({
                    where: { userId: user.id, status: 0 },
                }).then(function (resetPassword) {
                    if (resetPassword)
                        resetPassword.destroy({
                            where: {
                                id: resetPassword.id
                            }
                        })
                    token = crypto.randomBytes(32).toString('hex')//creating the token to be sent to the forgot password form (react)
                    bcrypt.hash(token, null, null, function (err, hash) {//hashing the password to store in the db node.js
                        ResetPassword.create({
                            userId: user.id,
                            resetPasswordToken: hash,
                            expire: moment.utc().add(config.tokenExpiry, 'seconds'),
                        }).then(function (item) {
                            if (!item)
                                return throwFailed(res, 'Oops problem in creating new password record')
                            let mailOptions = {
                                from: '"<jyothi pitta>" jyothi.pitta@ktree.us',
                                to: user.email,
                                subject: 'Reset your account password',
                                html: '<h4><b>Reset Password</b></h4>' +
                                    '<p>To reset your password, complete this form:</p>' +
                                    '<a href=' + config.clientUrl + 'reset/' + user.id + '/' + token + '">' + config.clientUrl + 'reset/' + user.id + '/' + token + '</a>' +
                                    '<br><br>' +
                                    '<p>--Team</p>'
                            }
                            let mailSent = sendMail(mailOptions)//sending mail to the user where he can reset password.User id and the token generated are sent as params in a link
                            if (mailSent) {
                                return res.json({ success: true, message: 'Check your mail to reset your password.' })
                            } else {
                                return throwFailed(error, 'Unable to send email.');
                            }
                        })
                    })
                });
        })
})

app.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user
        });
    });
});

app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
  
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
  
          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport('SMTP', {
          service: 'SendGrid',
          auth: {
            user: '!!! YOUR SENDGRID USERNAME !!!',
            pass: '!!! YOUR SENDGRID PASSWORD !!!'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/');
    });
  });

module.exports = router;