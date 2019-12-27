const express = require("express");
const router = express.Router();
const query = require('../dbConnect/query')
const jwt = require('jsonwebtoken');
const config = require('../config/config')
var querystring = require('querystring');
const tokenList = {};
const utils = require('../config/Utils');
var https = require('https');

var ghn = [];

function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

router.get('/types', async function (req, res) {
	var type = JSON.stringify(await query.getType());
	res.status(200).send(type);
});

router.get('/backSucccess', async function (req, res) {
	const checkOut = req.query;
	const checkOutId = checkOut.id;
	const orderID = checkOut.mrc_order_id.toString().split('.')[1];
	const magiaodich = checkOut.txn_id;
	const status = checkOut.stat;
	const checkOutDate = checkOut.update_at;
	if (status === 'c') {
		var result = await (query.updateProduct(orderID, magiaodich, checkOutId, true, checkOutDate));
		res.send("<script>window.open('http://192.168.0.135/M-Dev-Store/customer/my_account.php?my_orders', '_self');</script>");
	}
	else {
		query.updateProduct(orderID, magiaodich, checkOutId, false, checkOutDate);
		// res.send('<p>Đã Hủy Thành Công, Bạn Có Thể Thanh Toán Lại</p>');
		res.send("<script>window.open('http://192.168.0.135/M-Dev-Store/customer/my_account.php?my_orders', '_self');</script>"); 
	}
});

router.get('/ghn', async function (req, res) {
	//Request len Bao Kim
	var options = {
		'method': 'POST',
		'hostname': 'dev-online-gateway.ghn.vn',
		'path': '/apiv3-api/api/v1/apiv3/CalculateFee?',
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		'maxRedirects': 20
	};
	var req = https.request(options, function (response) {
		var chunks = [];
		response.on("data", function (chunk) {
			chunks.push(chunk);
		});
		response.on("end", async function (chunk) {
			var body = Buffer.concat(chunks);
			console.log(body.toString());
		});
		response.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = JSON.stringify({
		"token": "TokenStaging",
		"Weight": 10000,
		"Length": 10,
		"Width": 110,
		"Height": 20,
		"FromDistrictID": 1443,
		"ToDistrictID": 1452,
		"ServiceID": 53319,
		"OrderCosts": [
			{
				"ServiceID": 100022
			},
			{
				"ServiceID": 53337
			}
		],
		"InsuranceFee": 1000003
	});
	req.write(postData);
	req.end();
});

router.get('/city', async function (req, res) {
	if (ghn.length === 0) {
		var options = {
			'method': 'POST',
			'hostname': 'dev-online-gateway.ghn.vn',
			'path': '/apiv3-api/api/v1/apiv3/GetDistricts?',
			'headers': {
				'Content-Type': 'application/json'
			},
			'maxRedirects': 20
		};

		var req1 = https.request(options, function (res1) {
			var chunks = [];

			res1.on("data", function (chunk) {
				chunks.push(chunk);
			});

			res1.on("end", function (chunk) {
				var body = Buffer.concat(chunks);
				var json = JSON.parse(body)['data'];
				ghn = json;
				json = json.filter(e => e.Code === '');
				var json = json.map(e => {
					return { ProvinceID: e.ProvinceID, ProvinceName: e.ProvinceName };
				});

				res.send(json);
			});

			res1.on("error", function (error) {
				console.error(error);
			});
		});

		var postData = JSON.stringify({ "token": "TokenStaging" });

		req1.write(postData);

		req1.end();
	}
	else {
		var json = ghn;
		json = json.filter(e => e.Code === '');
		var json = json.map(e => {
			return { ProvinceID: e.ProvinceID, ProvinceName: e.ProvinceName };
		});
		res.send(json);
	}
})

router.get('/district/:cityid', async function (req, res) {
	const cityid = req.params.cityid;
	if (ghn.length === 0) {
		var options = {
			'method': 'POST',
			'hostname': 'dev-online-gateway.ghn.vn',
			'path': '/apiv3-api/api/v1/apiv3/GetDistricts?',
			'headers': {
				'Content-Type': 'application/json'
			},
			'maxRedirects': 20
		};

		var req1 = https.request(options, function (res1) {
			var chunks = [];

			res1.on("data", function (chunk) {
				chunks.push(chunk);
			});

			res1.on("end", function (chunk) {
				var body = Buffer.concat(chunks);
				var json = JSON.parse(body)['data'];
				ghn = json;
				json = json.filter(e => e.ProvinceID == cityid);
				var json = json.map(e => {
					return { DistrictID: e.DistrictID, DistrictName: e.DistrictName };
				});

				res.send(json);
			});

			res1.on("error", function (error) {
				console.error(error);
			});
		});

		var postData = JSON.stringify({ "token": "TokenStaging" });

		req1.write(postData);

		req1.end();
	}
	else {
		var json = ghn;
		json = json.filter(e => e.ProvinceID == cityid);
		var json = json.map(e => {
			return { DistrictID: e.DistrictID, DistrictName: e.DistrictName };
		});
		res.send(json);
	}
})

router.get('/ward/:districtID', async function (req, res) {
	const districtID = req.params.districtID;
	var options = {
		'method': 'POST',
		'hostname': 'dev-online-gateway.ghn.vn',
		'path': '/apiv3-api/api/v1/apiv3/GetWards?',
		'headers': {
			'Content-Type': 'application/json'
		},
		'maxRedirects': 20
	};

	var req1 = https.request(options, function (res1) {
		var chunks = [];

		res1.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res1.on("end", function (chunk) {
			var body = Buffer.concat(chunks);
			var json = JSON.parse(body)['data'];
			if(json !== null){
				json = json['Wards'];
				if(json !== null){
					json = json.map(e => {
						return { WardCode: e.WardCode, WardName: e.WardName };
					});
		
					res.send(json);
				}
				else{
					res.send("CO_LOI");
				}
			}
			else{
				res.send("PHUONG_KHONG_TON_TAI");
			}
		});

		res1.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = JSON.stringify({
		"token": "TokenStaging",
		"DistrictID": parseInt(districtID)
	});

	req1.write(postData);

	req1.end();
})

router.get('/shipFee/:districtID/:weight', async function (req, res) {
	const districtID = req.params.districtID;
	const weight = req.params.weight;
	var options = {
		'method': 'POST',
		'hostname': 'dev-online-gateway.ghn.vn',
		'path': '/apiv3-api/api/v1/apiv3/CalculateFee?',
		'headers': {
			'Content-Type': 'application/json'
		},
		'maxRedirects': 20
	};

	var req1 = https.request(options, function (res1) {
		var chunks = [];

		res1.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res1.on("end", function (chunk) {
			var body = Buffer.concat(chunks);
			var json = JSON.parse(body)['data'];

			res.send(json);
		});

		res1.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = JSON.stringify({
		"token": "TokenStaging",
		"Weight": parseInt(weight),
		"FromDistrictID": 1463,
		"ToDistrictID": parseInt(districtID),
		"ServiceID": 53320
	});

	req1.write(postData);

	req1.end();
})

router.get('/typesImage/:idType', async function (req, res) {//Lay hinh anh cua category
	var url = JSON.stringify(await query.getTypeImage(req.params.idType));
	url = JSON.parse(url)[0]['image'];
	const result = "E:\\xampp\\htdocs\\M-Dev-Store\\admin_area\\other_images\\" + url.toString();
	res.sendFile(result);
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

router.post('/getGHN', async function (req, res) {
	const billID = req.body.billID;
	const isCod = req.body.isCod;
	const user = JSON.parse(JSON.stringify(await query.getUserInfoByBillId(billID)))[0];

	var options = {
		'method': 'POST',
		'hostname': 'dev-online-gateway.ghn.vn',
		'path': '/apiv3-api/api/v1/apiv3/CreateOrder?',
		'headers': {
			'Content-Type': 'application/json'
		},
		'maxRedirects': 20
	};

	var req1 = https.request(options, function (res1) {
		var chunks = [];

		res1.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res1.on("end",async function (chunk) {
			var body = Buffer.concat(chunks);
			var result = JSON.parse(body);
			if (result.msg === 'Success') {
				result = result['data'];

				var result2 = await query.updateBill(billID, result['OrderID'], result['OrderCode'], result['ExpectedDeliveryTime'], result['TotalServiceFee']);
				if (result2 === 'THANH_CONG') {
					res.send(result['OrderCode']);
				}
				else{
					res.send('THAT_BAI');
				}
			}
			else {
				res.send('THAT_BAI');
			}
		});

		res1.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = JSON.stringify({
		"token": "TokenStaging",
		"PaymentTypeID": 2,
		"FromDistrictID": 1463,
		"FromWardCode": "21808",
		"ToDistrictID": user.districtID,//District ID cua Khach
		"ToWardCode": user.wardID.toString(),// Ward ID cua khach
		"ClientContactName": "Dang Vinh Sieu",
		"ClientContactPhone": "0906568946",
		"ClientAddress": "Ktx Khu A",
		"CustomerName": user.name,//Ten Khach Hang
		"CustomerPhone": user.phone,//SDT 
		"ShippingAddress": user.address,//Dia Chi
		"CoDAmount": 0,//COD
		"NoteCode": "CHOXEMHANGKHONGTHU",
		"ServiceID": 53321,
		"Weight": 1020,// Khoi Luonh
		"Length": 10,
		"Width": 10,
		"Height": 10,
		"ReturnContactName": "Dang Vinh Sieu",
		"ReturnContactPhone": "0906568946",
		"ReturnAddress": "Ktx Khu A",
		"ReturnDistrictID": 1463,
		"ExternalReturnCode": "GHN",
		"AffiliateID": 252905
	});

	req1.write(postData);

	req1.end();
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
		const temp = await query.deleteCartDetail(cusId);
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
	const ramdonPre = makeid(5);
	const data = {
		'iat': issuedAt,         // Issued at: time when the token was generated
		'jti': tokenId,          // Json Token Id: an unique identifier for the token
		'iss': API_KEY,     // Issuer
		'nbf': notBefore,        // Not before
		'exp': expire,           // Expire
		'form_params': {                  // request body (dữ liệu post)
			"mrc_order_id": ramdonPre + '.' + orderinfo['orderID'],
			"total_amount": orderinfo['TongTien'],
			"description": 'Thanh Toan Don Hang:' + orderinfo['orderID'],
			"url_success": "http://192.168.0.135:3000/api/backSucccess",
			"url_detail": "http://192.168.0.135:3000/api/backSucccess"
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
		response.on("end", async function (chunk) {
			var body = Buffer.concat(chunks);
			const url = JSON.parse(body)['data']['payment_url'].toString();
			const updateURl = await query.updateURL(orderinfo['orderID'], url);
			const temp = await query.deleteCartDetail(cusId);
			res.send(JSON.parse(body)['data']['payment_url'].toString());
		});
		response.on("error", function (error) {
			console.error(error);
		});
	});



	var postData = querystring.stringify({
		"mrc_order_id": ramdonPre + '.' + orderinfo['orderID'],
		"total_amount": orderinfo['TongTien'],
		"description": 'Thanh Toan Don Hang:' + orderinfo['orderID'],
		"url_success": "http://192.168.0.135:3000/api/backSucccess",
		"url_detail": "http://192.168.0.135:3000/api/backSucccess"
	});
	req.write(postData);
	req.end();
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