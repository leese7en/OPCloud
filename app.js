var express = require('express');
var session = require('./session');
var path = require('path');
var favicon = require('serve-favicon');
var hbs = require('hbs');
hbs.registerPartials(__dirname + '/views/partials');
var log4js = require('log4js');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var api = require('./routes/api/apiV1');
var trend = require('./routes/datatrend/trend');
var gview = require('./routes/gview/view');
var openplant = require('./routes/openplant/openplant');
var system = require('./routes/system/system');
var domain = require('./routes/domain/domain');
var dataview = require('./routes/dataview/dataview');

var givew = require("./routes/rsa/gview")
var filter = require('./routes/filter');
var helpers = require('handlebars-helpers')();
var message = require('./routes/message/message');

var device = require('./routes/box/box');

var modelService = require('./routes/model/model');
//------------------------------重启服务用户状态修改
var serverInit = require('./routes/system/serverInit');
//-----------------------------  对外接口

var ibox = require('./routes/interface/box/box');

var app = express();
log4js.configure({
    appenders: [
        {type: 'console'}, //控制台输出
        {
            type: 'file', //文件输出
            filename: __dirname + '/logs/log.log',
            maxLogSize: 10 * 1024 * 1024,
            backups: 10,
            category: 'system'
        }, {
            type: 'file', //文件输出
            filename: __dirname + '/logs/apilog.log',
            maxLogSize: 10 * 1024 * 1024,
            backups: 10,
            category: 'api'
        },
        {
            type: 'file', //文件输出
            filename: __dirname + '/logs/iboxlog.log',
            maxLogSize: 10 * 1024 * 1024,
            backups: 10,
            category: 'Ibox'
        }, {
            type: 'file', //文件输出
            filename: __dirname + '/logs/modallog.log',
            maxLogSize: 10 * 1024 * 1024,
            backups: 10,
            category: 'model'
        }, {
            type: 'file', //文件输出
            filename: __dirname + '/logs/opmq.log',
            maxLogSize: 10 * 1024 * 1024,
            backups: 10,
            category: 'opmq'
        }
    ],
    replaceConsole: false
});
var systemLog = log4js.getLogger('system');
systemLog.setLevel('debug');
app.use(log4js.connectLogger(systemLog, {level: log4js.levels.INFO, format: ':status :method :url'}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//TODO 关闭开发者模式，设置为Log4js
// app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session);
//tp 2016年7月4日13:51:19  处理登录验证检查
app.use(filter.checkLogin);
app.use('/', index);
app.use('/system', system);
app.use('/openplant', openplant);
app.use('/trend', trend);
app.use('/gview', gview);
app.use('/domain', domain);
app.use('/gview', givew);
app.use('/dataview', dataview);
app.use('/message', message);
app.use('/api', api);
app.use('/box', device);
app.use('/Ibox', ibox);
app.use('/model', modelService);

app.get('*', function (req, res) {
    res.render('error/404', {
        title: 'No Found'
    })
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

serverInit.initUserOnline();

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
