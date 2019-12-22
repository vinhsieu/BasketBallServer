var express = require("express");
var router	= express.Router();

router.post('/update', function (req, res) {
	//handle update order requests
});

router.get('/', function (req, res) {
	//get all orders
	var orders = {};
	console.log("this has pass");
	res.status(200).send({message:"successful"});
});

router.get('/:orderId', function (req, res) {
	//get order by orderId
});

module.exports = router;