var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
  
var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
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

socketio.listen(server).on('connection', function (socket) {
    console.log('connected!');
    console.log('uid of process is: ' + process.getuid());
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});

