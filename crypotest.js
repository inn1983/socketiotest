var crypto = require('crypto');

crypto.randomBytes(16, function(ex, buf){
	var token = buf.toString('hex');
	console.log(token);
});
