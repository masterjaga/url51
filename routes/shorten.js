const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://mongoDbUser:3TQSsmEEfTQdnbd@cluster0-mte9s.gcp.mongodb.net?retryWrites=true&w=majority";

// Shortener
router.post('/shorten', async (req, res) => {

    let shortURL = req.body.shortURL;
    let longURL = req.body.longURL;
    let userEmail = req.body.currentUserEmail;

    try {
        let client = await MongoClient.connect(uri);
        let db = client.db("test");
        let insertedURL = await db.collection("urls").insertOne({
            "shortURL": shortURL,
            "longURL": longURL,
            "timesClicked": 0,
            "user": userEmail
        });

        // TODO add url of each user in user collection

        client.close();
        console.log("successfully inserted URLs");
        res.send("successfully inserted URLs");
    } catch (err) {
        console.log(err);
        res.send(err);
    }

    //db.write(req.query.key, {"url": req.query.url});
    //res.send("OK")
});

// Redirect 
router.get('/:key', async (req, res) => {

    let client;
    try {
        client = await MongoClient.connect(uri);
        let db = client.db("test");
        let urlDocument = await db.collection("urls").findOne({
            shortURL: "https://url-shortener-umesh.herokuapp.com/" + req.params.key
        });
        console.log("req.params : " + req.params)
        if (!urlDocument) {
            res.json({
                status: 404,
                message: "Short URL not found in DB",
            });
        } else {
            let currentShortUrl = await db.collection("urls").findOneAndUpdate({
                shortURL: "https://url-shortener-umesh.herokuapp.com/" + req.params.key
            }, {
                $inc: {
                    timesClicked: 1
                }
            });

            res.redirect(urlDocument.longURL);
        }
        client.close();
    } catch (error) {
        //client.close();
        console.log(error);
        res.send(error);
    }

    /*
db.read(req.params.key + "/url").then( (url) => {
    res.redirect(url);
});
*/
});

//Get all URls of a user
router.get('/getURLs/:userEmail', async (req, res) => {

    let userEmail = req.params.userEmail;

    try {
        let client = await MongoClient.connect(uri);
        let db = client.db("test");
        let URLsOfUser = await db.collection("urls").find({
            "user": userEmail
        }).toArray();

        client.close();
        console.log("successfully retrieved URLs for user");
        res.send(URLsOfUser);
    } catch (err) {
        console.log(err);
        res.send(err);
    }

    //db.write(req.query.key, {"url": req.query.url});
    //res.send("OK")
});

module.exports = router;