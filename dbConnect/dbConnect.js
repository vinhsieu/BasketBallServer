
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 20,
    host     : 'localhost',
    user: 'root', 
    password: '',
    database: 'db_app'
});

// exports.connect=function(err) {
//   if (err) throw err;
//   console.log("Connected!!!")
// };



// exports.getPhim=function(){
// 	return new Promise(function(resolve,reject){
// 		pool.query("select * from phim;",function(err,rows,fields){
// 			if(err) reject(err);
// 			resolve(rows);
// 		});
// 	});
// }
module.exports = pool;


