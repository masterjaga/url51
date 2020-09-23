const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://mongoDbUser:3TQSsmEEfTQdnbd@cluster0-mte9s.gcp.mongodb.net?retryWrites=true&w=majority";

// Shortener
router.post('/shorten',async (req, res) => {

    let shortURL = req.body.shortURL;
    let longURL = req.body.longURL;

    try {
        let client = await MongoClient.connect(uri);
        let db = client.db("test");
        let insertedURL = await db.collection("urls").insertOne({
            "shortURL": shortURL,
            "longURL": longURL,
            "timesClicked":0
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
	res.send("OK")
});

// Redirect 
router.get('/:key',async (req, res) => {

    try {
        let client = await MongoClient.connect(url);
        let db = client.db("test");
        let urlDocument = await db.collection("urls").findOne({
            shortURL: "https://url-shortener-umesh.herokuapp.com/"+req.params.key
        });
        console.log("req.params : "+req.params)
        if (!urlDocument) {
            res.json({
                status: 404,
                message: "Short URL not found in DB",
            });
        } else {
            let currentShortUrl = await db.collection("urls").findOneAndUpdate({
                shortURL: "https://url-shortener-umesh.herokuapp.com/"+req.params.key
            }, {
                $inc: {
                    timesClicked: 1
                }
            });

            res.redirect(urlDocument.longURL);
        }
        client.close();
    } catch (error) {
        client.close();
        console.log(error);
        res.send(error);
    }

        /*
	db.read(req.params.key + "/url").then( (url) => {
		res.redirect(url);
    });
    */
});

module.exports = router;