var pool = require("./dbConnect");


const getType = function () {
	return new Promise(function (resolve, reject) {
		pool.query("select * from product_type;", function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const getTopProduct = function () {
	return new Promise(function (resolve, reject) {
		pool.query("SELECT p.id,p.name as name ,p.id_type as idType, t.name as nameType, p.price, p.description, GROUP_CONCAT(i.id) AS imagesID FROM product p LEFT JOIN images i ON p.id = i.id_product inner join product_type t ON t.id = p.id_type group by p.id LIMIT 0,6", function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const getTypeImage = function (ID) {
	return new Promise(function (resolve, reject) {
		pool.query("select image from product_type where id = '" + ID + "';", function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const getProductByTypeId = function (ID, PAGE) {
	var limit = 6;
	var page = PAGE === null ? 1 : PAGE;
	var offset = (page - 1) * limit;
	return new Promise(function (resolve, reject) {
		var query = "SELECT p.*, t.name as nameType, GROUP_CONCAT(i.id) AS imagesID FROM product p inner join product_type t ON t.id = p.id_type INNER JOIN images i ON i.id_product = p.id WHERE id_type = " + ID + " group by p.id LIMIT " + offset + "," + limit + ";";
		pool.query(query, function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const getImageURLByID = function (ImageID) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT link from images where id =" + ImageID + ";";
		pool.query(query, function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const getSizeByProductId = function (ProductID) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT s.name,sdt.number, sdt.id as id_size_detail FROM product p INNER JOIN size_detail sdt ON sdt.id_product = p.id INNER JOIN size s ON s.id = sdt.id_size WHERE p.id = " + ProductID + " and sdt.number > 0 ";
		pool.query(query, function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const search = function (Key) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT p.*, GROUP_CONCAT(i.id) AS imagesID FROM product p INNER JOIN images i ON p.id = i.id_product where name like '%" + Key + "%' group by p.id";
		pool.query(query, function (err, rows, fields) {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const login = function (email, password) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT u.email, u.name, u.address, u.phone FROM users u where email = '" + email + "' and password = '" + password + "'";
		pool.query(query, function (err, rows, fields) {
			if (err) reject(err);
			if (rows[0] !== null) {
				resolve(rows);
			}
			else {
				resolve(null);
			}
		});
	});
};

const register = function (email, password, name) {
	return new Promise(function (resolve, reject) {
		var query = "INSERT INTO users(email,password,name) VALUES('" + email + "','" + password + "','" + name + "')";
		pool.query(query, function (err, rows, fields) {
			if (err) console.log(err);
			resolve(rows);
		});
	});
};

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

const TinhTongTien = function (listProduct) {
	return new Promise(async function (resolve, reject) {
		var totalPrice = 0;
		await asyncForEach(listProduct, async (product, index, array) => {
			const id = product.id;
			var query = "select price from product where id=" + id + "";
			pool.query(query, function (err, rows, fields) {
				totalPrice = totalPrice + rows[0].price * product.quantity;
				if (index + 1 === array.length) {
					resolve(totalPrice);
				}
			});
		})
	});
}

const InsertBill = function (idCustomer, TongTien) {
	return new Promise(function (resolve, reject) {
		var query = "INSERT INTO bill(id_customer,date_order, total) VALUES (" + idCustomer + ", NOW(), " + TongTien + ")";
		pool.query(query, { title: 'test' }, function (err, result) {
			if (err) console.log(err);
			let insertID = result.insertId;
			resolve(insertID);
		});
	});
}


const InsertBillDetail = function (idBill, listProduct) {
	return new Promise(async function (resolve, reject) {
		await asyncForEach(listProduct, async (product, index, array) => {
			let totalPrice = await TinhTongTien(Object.values([product]));
			var query = "INSERT INTO bill_detail(id_bill,id_product, quantity, price,id_size_detail) VALUES (" + idBill + ", " + product.id + ", " + product.quantity + ", " + totalPrice + "," + product.idsize + ")";
			pool.query(query, function (err, rows) {
				if (err) console.log(err);
				else {
					var query2 = "UPDATE size_detail SET number = number - " + product.quantity + " WHERE id =" + product.idsize + "";
					pool.query(query2, function (err, rows) {
						if (err) console.log(err);
					});
				}
			});
			if (index + 1 === array.length) {
				resolve("THANH_CONG");
			}
		}
		);
	});
}

const Cart = function (idCustomer, listProduct) {
	return new Promise(async function (resolve, reject) {
		let TongTien = await TinhTongTien(listProduct);
		let insertID = await InsertBill(idCustomer, TongTien);
		let temp = await InsertBillDetail(insertID, listProduct);
		if (temp) {
			resolve({
				'orderID' : insertID,
				'TongTien' :TongTien
			});
		}
	});
}

const findCusIdByEmail = function (email) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT id FROM users where email = '" + email + "'";
		pool.query(query, function (err, rows) {
			if (err) console.log(err);
			resolve(rows[0].id);
		});
	});
}

const orderHistory = function (email) {
	return new Promise(function (resolve, reject) {
		var query = "SELECT b.id, b.date_order, b.status, b.total FROM bill b INNER JOIN users u ON u.id=b.id_customer where u.email ='" + email + "' ORDER BY b.id DESC";
		pool.query(query, function (err, rows) {
			if (err) console.log(err);
			resolve(rows);
		});
	});
}

const changeInfo = function (email, data) {
	return new Promise(function (resolve, reject) {
		var query = "UPDATE users SET phone='" + data.phone + "', address='" + data.address + "' WHERE email='" + email + "'";
		pool.query(query, function (err, rows) {
			if (err) console.log(err);
			resolve('THANH_CONG');
		});
	});
}

const setCart = function (email, data) {
	return new Promise(async function (resolve, reject) {
		let cusid = await findCusIdByEmail(email);

		var query = "DELETE FROM `cart_detail` WHERE id_customer =" + cusid;
		pool.query(query, async function (err, rows) {
			if (err) console.log(err);
			else {
				await asyncForEach(data, async (product, index, array) => {
					const id = product.productInfo.product.id;
					const quantity = product.quantity;
					const sizeid = product.productInfo.size;


					var query2 = "SELECT number FROM size_detail WHERE id = " + sizeid;
					pool.query(query2, function (err, rows, fields) {
						if (err) console.log(err);
						var number = rows[0]['number'];
						var query;
						if (quantity <= number) {
							query = "INSERT INTO `cart_detail`(id_customer, id_product, quantity, id_size_detail) VALUES ('" + cusid + "','" + id + "','" + quantity + "','" + sizeid + "')";
						}
						else {
							query = "INSERT INTO `cart_detail`(id_customer, id_product, quantity, id_size_detail) VALUES ('" + cusid + "','" + id + "','" + number + "','" + sizeid + "')";
						}
						pool.query(query, function (err2, rows2) {
							if (err2) console.log(err2);
							if (index + 1 === array.length) {
								resolve("THANH_CONG");
							}
						});
					});
				})
			}
		});
	});
};

const getCartDetail = function (email) {
	return new Promise(async function (resolve, reject) {
		let cusid = await findCusIdByEmail(email);
		var query = "SELECT d.collectionID,d.description,d.id as productID,d.id_hang,d.id_type, GROUP_CONCAT(img.id) as imagesID,d.name as productName,pt.name as productTypeName,d.new,d.price,d.status, sdt.id as SizeID, s.name as SizeName, cdt.quantity FROM cart_detail cdt join product d ON cdt.id_product = d.id JOIN size_detail sdt ON cdt.id_size_detail = sdt.id JOIN size s ON sdt.id_size = s.id JOIN images img ON img.id_product = d.id JOIN product_type pt ON pt.id = d.id_type WHERE id_customer = " + cusid + " GROUP BY cdt.id_size_detail";

		pool.query(query, function (err, rows) {
			var result = [];
			if (rows.length === 0) {
				resolve("KHONG_CO");
			}
			else {
				asyncForEach(rows, async (product, index, array) => {
					const item = {
						productInfo: {
							product: {
								collectionID: product['collectionID'],
								description: product['description'],
								id: product['productID'],
								id_hang: product['id_hang'],
								id_type: product['id_type'],
								imagesID: product['imagesID'],
								name: product['productName'],
								nameType: product['productTypeName'],
								new: product['new'],
								price: product['price'],
								status: product['status']
							},
							size: product['SizeID'],
							sizename: product['SizeName']
						},
						quantity: product['quantity']
					}
					result = result.concat(item);
					if (index + 1 === array.length) {
						resolve(result);
					}
				});
			}
		});

	});
};

const updateProduct = function (orderID, magiaodich,checkOutID, isSuccess, checkOutDate) {
	if(isSuccess){
		return new Promise(function (resolve, reject) {
			var query = "UPDATE bill SET check_out_id='" + checkOutID + "', check_out_date='" + checkOutDate + "', magiaodich ='"+magiaodich+"', status = '1'  WHERE id='" + orderID + "'";
			pool.query(query, function (err, rows) {
				if (err) console.log(err);
				resolve('THANH_CONG');
			});
		});
	}
	else{
		return new Promise(function (resolve, reject) {
			var query = "UPDATE bill SET check_out_id='" + checkOutID + "', check_out_date='" + checkOutDate + "', status = '2'  WHERE id='" + orderID + "'";
			pool.query(query, function (err, rows) {
				if (err) console.log(err);
				resolve('THANH_CONG');
			});
		});
	}
}
const updateURL = function (idProduct, url){
	return new Promise(function (resolve, reject) {
		var query = "UPDATE bill SET url_payment ='"+url.toString()+"' WHERE id='" + idProduct + "'";
		pool.query(query, function (err, rows) {
			if (err) console.log(err);
			resolve('THANH_CONG');
		});
	});
};


module.exports = {
	findCusIdByEmail: findCusIdByEmail,
	getType: getType,
	getTopProduct: getTopProduct,
	getTypeImage: getTypeImage,
	getProductByTypeId: getProductByTypeId,
	getImageURLByID: getImageURLByID,
	getSizeByProductId: getSizeByProductId,
	search: search,
	login: login,
	register: register,
	Cart: Cart,
	orderHistory: orderHistory,
	changeInfo: changeInfo,
	setCart: setCart,
	getCartDetail: getCartDetail,
	updateProduct: updateProduct,
	updateURL: updateURL
};