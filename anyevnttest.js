var app = require('http').createServer(handler)
  , sio = require('socket.io')
  , io = sio.listen(app)
  , fs = require('fs');

app.listen(8001);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
              function (err, data) {
                if (err) {
                  res.writeHead(500);
                  return res.end('Error loading index.html');
                }

                res.writeHead(200);
                res.end(data);
              });
}

// $emitをoverrideする。
console.log('sio', sio);
var _$emit = sio.prototype.$emit;

sio.prototype.$emit = function() {
  // オリジナルの$emitを呼び出す。
  _$emit.apply(this, arguments);
  if (arguments.length >= 2) {
    var eventname = arguments[0];
    var message = arguments[1];
    // 任意のイベントは * に補足させる。
    _$emit.apply(this, ['*', eventname, message]);
  }
};

io.sockets.on('connection', function (socket) {
  socket.on('*', function (eventname, message) {
    io.sockets.emit(eventname, message);
  });
});
