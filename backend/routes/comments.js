var express = require('express');
var router = express.Router();
var {comments} = require("../MongoDb")

router.get('/getComments', async function(req, res, next) {
 var Comments = await comments.find({})
 res.status(201).send( Comments );
});

router.post('/postComments', async function(req, res, next) {
   var commentString = req.body;
 var Comments = await comments.create(commentString)
 res.status(201).send( Comments );
});

module.exports = router;