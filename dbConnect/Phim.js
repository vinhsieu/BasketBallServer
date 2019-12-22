var pool = require("./dbConnect");


exports.getType = function(){
	return new Promise(function(resolve,reject){
		pool.query("select * from product_type;",function(err,rows,fields){
			if(err) reject(err);
			resolve(rows);
		});
	});
}

exports.getPhimURLbyID = function(id){
	return new Promise(function(resolve,reject){
		pool.query("select URL from phim where MAPHIM = '"+id+"';",function(err,rows,fields){
			if(err) reject(err);
			resolve(rows);
		});
	});
}
