var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
var socket_req_res = [];	//http req, res用
var socket_cb_server = [];	//browerへの送信の中継
var socket_bro = [];	//server→browser


var req_data = {
	req_opt:{
		host: '',
		port:'',
		path: '',
		method: '',
		headers: {
		},
	},
	key:'' //socket.ioからのresがこのreqとペアになるための識別コード。httpの規格ではない。
};

var crypto = require('crypto');

var server = http.createServer(function(req, res) {
    //res.writeHead(200, { 'Content-type': 'text/html'});
	//console.log(req.headers);
    console.log(req.url);
	debugger;
	req_data.key = crypto.randomBytes(16).toString('hex');
	var url_split = req.url.split("/");
	var cb_id = url_split[1];
	console.log('cb_id:', cb_id);
	//console.log('socket_req_res[cb_id]:', socket_req_res[cb_id]);
	
	if(socket_req_res[cb_id] !== undefined && req_data.key !== ''){
		req_data.req_opt.headers = req.headers;
		req_data.req_opt.method = req.method;
		req_data.req_opt.path = req.url;
		socket_req_res[cb_id].emit('req_from_ioserver',req_data);
		//console.log('req send to cubie:',req_data);
		socket_req_res[cb_id].once('res_from_cubie'+req_data.key, function(res_cb){
			console.log('headers of res is', res_cb.headers);
			//console.log('data of res is', res_cb.data);
			//fs.writeFile('writetest.txt', res_cb.data , 'binary', function (err) {
			//    if(err !== null) console.log(err);
			//});
			//res.write(res_cb.data);
			res.writeHead(res_cb.statusCode, res_cb.headers);
			res.end(res_cb.data, 'binary');
			//console.log('url of res is', res_cb.url);

			debugger;
		});

	}
	else {
			res.end(fs.readFileSync(__dirname + '/index.html'));}
	
	//socket_cb_server.on('*',function(){});


}).listen(80, function() {
  
   // if run as root, downgrade to the owner of this file
   if (process.getuid() === 0)
    require('fs').stat(__filename, function(err, stats) {
      if (err) return console.log(err)
      process.setuid(stats.uid);
      console.log('uid of process is: ' + process.getuid());
    });
    console.log('Listening at: http://localhost:80');
});

//socket_cb_serverをすべての受信を処理できるようにする。
var _$emit = socketio.prototype.$emit;

socketio.prototype.$emit = function() {
	// オリジナルの$emitを呼び出す。
	_$emit.apply(this, arguments);
	if (arguments.length >= 2) {
		var eventname = arguments[0];
		var message = arguments[1];
		// 任意のイベントは * に補足させる。
		_$emit.apply(this, ['*', eventname, message]);
	}
};

socketio.listen(server).on('connection', function (socket) {
    console.log('connected!');
    //console.log('uid of process is: ' + process.getuid());
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
		if(msg.kind === 'http_req_res')
			socket_req_res[msg.id] = socket;
		
		else if(msg.kind === 'cb_server'){
			socket_cb_server[msg.id] = socket;
			socket.on('*', function(eventname, relay_msg){
				if(socket_bro[msg.id] !== undefined){
					//すべてのイベントをブラウザに送信
					socket_bro[msg.id].emit(eventname, relay_msg);
				
				}
			});
		
		}
		else if(msg.kind === 'borwser'){
			socket_bro[msg.id] = socket;
			//cubieに通知
			socket_cb_server[msg.id].emit('bor_conn',msg);
		}
		
    });

	//まずはcbからのsocket.io、
	//if(socket_cb === undefined )
	//		socket_cb = socket;
	//else if (socket_bor === undefined )
	//		socket_bor = socket;

});

