const express = require("express");
const router = express.Router();
const query = require('../dbConnect/query')
const jwt = require('jsonwebtoken');
const config = require('../config/config')
var querystring = require('querystring');
const tokenList = {};
const utils = require('../config/Utils');
var https = require('https');

router.get('/types', async function (req, res) {
	var type = JSON.stringify(await query.getType());
	res.status(200).send(type);
});


router.get('/topProduct', async function (req, res) {
	var topProduct = JSON.stringify(await query.getTopProduct());
	res.status(200).send(topProduct);
});


router.get('/typesImage/:idType', async function (req, res) {//Lay hinh anh cua category
	var url = JSON.stringify(await query.getTypeImage(req.params.idType));
	url = JSON.parse(url)[0]['image'];
	const result = "E:\\xampp\\htdocs\\M-Dev-Store\\admin_area\\other_images\\" + url.toString();
	res.sendFile(result);
});

router.get('/productByType/:idType/:page', async function (req, res) {// json danh sach cac san pham
	var result = JSON.stringify(await query.getProductByTypeId(req.params.idType, req.params.page));
	res.send(result);
});

router.get('/imageByID/:imageID', async function (req, res) {//Lay hinh anh bang hinh anh id
	var url = JSON.stringify(await query.getImageURLByID(req.params.imageID));
	url = JSON.parse(url)[0]['link'];
	const result = "E:\\xampp\\htdocs\\M-Dev-Store\\admin_area\\product_images\\" + url.toString();
	res.sendFile(result);
});

router.get('/search/:key', async function (req, res) {
	var result = JSON.stringify(await query.search(req.params.key));
	res.send(result);
});
router.get('/search/:key', async function (req, res) {
	var result = JSON.stringify(await query.search(req.params.key));
	res.send(result);
});

router.get('/size/:productID', async function (req, res) {
	var result = JSON.stringify(await query.getSizeByProductId(req.params.productID));
	res.send(result);
});



router.post('/login', async function (req, res) {
	const postData = req.body;
	const crypto = require('crypto');
	let hash = crypto.createHash('md5').update(postData.pass).digest("hex");
	const user = {
		"email": postData.email,
		"pass": hash,
	}
	var result = await query.login(postData.email, hash);
	if (result.length > 0) {
		const token = jwt.sign(user, config.secret, {
			expiresIn: config.tokenLife,
		});
		var cart = await query.getCartDetail(postData.email);
		const response = {
			'token': token,
			'user': result,
			'cart': cart === "KHONG_CO" ? [] : cart
		}
		res.json(response);
	}
	else {
		res.status(401).json({
			message: 'Tài Khoản Không Tồn Tại',
		});
	}
});

router.post('/register', async function (req, res) {
	const postData = req.body;
	const crypto = require('crypto');
	let hash = crypto.createHash('md5').update(postData.password).digest("hex");
	var result = JSON.stringify(await query.register(postData.email, hash, postData.name));
	if (result) {
		res.send('THANH CONG');
	}
	else {
		res.send('KHONG THANH CONG');
	}
});

const TokenCheckMiddleware = async (req, res, next) => {
	// Lấy thông tin mã token được đính kèm trong request
	const token = req.body.token || req.query.token || req.headers['x-access-token'];
	// decode token
	if (token) {
		// Xác thực mã token và kiểm tra thời gian hết hạn của mã
		try {
			const decoded = await utils.verifyJwtToken(token, config.secret);
			// Lưu thông tin giã mã được vào đối tượng req, dùng cho các xử lý ở sau
			req.decoded = decoded;
			next();
		} catch (err) {
			// Giải mã gặp lỗi: Không đúng, hết hạn...
			console.error(err);
			return res.status(401).json({
				message: 'Unauthorized access.',
			});
		}
	} else {
		// Không tìm thấy token trong request
		return res.status(403).send({
			message: 'No token provided.',
		});
	}
}

router.use(TokenCheckMiddleware);

router.post('/cart', async (req, res) => {
	const cusId = await query.findCusIdByEmail(req.decoded.email);
	const result = await query.Cart(cusId, req.body.arrayDetail);
	if (result) {
		res.send('THANH CONG');
	}
	else {
		res.send('KHONG THANH CONG');
	}
})

router.post('/cartOnline', async function (req, res) {
	//Xu Ly Don Hang
	const cusId = await query.findCusIdByEmail(req.decoded.email);
	const orderinfo = await query.Cart(cusId, req.body.arrayDetail);

	//Tao Bao Kim Token
	const API_KEY = 'a18ff78e7a9e44f38de372e093d87ca1';
	const API_SECRET = '9623ac03057e433f95d86cf4f3bef5cc';
	const TOKEN_EXPIRE = 60; //token expire time in seconds
	const ENCODE_ALG = 'HS256';

	const tokenId = 1;
	var d = new Date();
	const issuedAt = d.getTime();
	const notBefore = issuedAt;
	const expire = notBefore + TOKEN_EXPIRE;

	const data = {
		'iat': issuedAt,         // Issued at: time when the token was generated
		'jti': tokenId,          // Json Token Id: an unique identifier for the token
		'iss': API_KEY,     // Issuer
		'nbf': notBefore,        // Not before
		'exp': expire,           // Expire
		'form_params': {                  // request body (dữ liệu post)
			"mrc_order_id": "ORD." + orderinfo['orderID'],
			"total_amount": orderinfo['TongTien'],
			"description": 'Thanh Toan Don Hang:' + orderinfo['orderID'],
			"url_success": "https://github.com/vinhsieu/M-Dev-Store?fbclid=IwAR3ST7m7fp98CcvDx3LwbXVUbnvDfVzVpldKa1WolRKXtZxpZpIcUt3XGkM",
			"url_detail": "https://github.com/vinhsieu/BanQABR"
		}
	};
	const token = jwt.sign(data, API_SECRET, { algorithm: ENCODE_ALG });
	//Request len Bao Kim
	var options = {
		'method': 'POST',
		'hostname': 'sandbox-api.baokim.vn',
		'path': '/payment/api/v4/order/send?jwt=' + token + '&null=null',
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		'maxRedirects': 20
	};
	var req = https.request(options, function (response) {
		var chunks = [];

		response.on("data", function (chunk) {
			chunks.push(chunk);
		});

		response.on("end", function (chunk) {
			var body = Buffer.concat(chunks);
			console.log(body.data);
		});

		response.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = querystring.stringify({
		"mrc_order_id": "ORD." + orderinfo['orderID'],
		"total_amount": orderinfo['TongTien'],
		"description": 'Thanh Toan Don Hang:' + orderinfo['orderID'],
		"url_success": "https://github.com/vinhsieu/M-Dev-Store?fbclid=IwAR3ST7m7fp98CcvDx3LwbXVUbnvDfVzVpldKa1WolRKXtZxpZpIcUt3XGkM",
		"url_detail": "https://github.com/vinhsieu/BanQABR"
	});

	req.write(postData);

	req.end();
	// res.json(token);
});

router.post('/orderHistory', async (req, res) => {
	var result = JSON.stringify(await query.orderHistory(req.decoded.email));
	res.send(result);
})

router.post('/checkLogin', async function (req, res) {
	const Data = req.decoded;
	var result = await query.login(Data.email, Data.pass);
	const response = {
		'token': req.body.token,
		'user': result
	}
	res.json(response);
});

router.post('/setCart', async function (req, res) {
	const userInfo = req.decoded;
	const dataCart = req.body.cartArray;
	var serCart = await query.setCart(userInfo.email, dataCart);
	var result = await query.getCartDetail(userInfo.email);
	res.json(result);
});

router.post('/changeInfo', async function (req, res) {
	const account = req.decoded;
	const data = req.body;
	var result = await query.changeInfo(account.email, data.userInfo);
	res.json({ message: result });
});

router.post('/cart_detail', async function (req, res) {
	const account = req.decoded;
	var result = await query.getCartDetail(account.email);
	res.json(result);
});


module.exports = router;