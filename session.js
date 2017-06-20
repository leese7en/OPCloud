var sess = require('express-session');
var session = sess({
    secret: 'magustek.com',
    name: 'magustek.com', //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: { maxAge: 30 * 60 * 1000 }, //设置maxAge是30分钟，ession和相应的cookie失效过期
    resave: false,
    rolling: true,
    saveUninitialized: true
});
module.exports = session;