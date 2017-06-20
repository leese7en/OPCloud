var express = require('express');
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var actionUtil = require("./framework/action/actionUtils")();
var query = actionUtil.query;
var fs = require('fs');
var router = express.Router();
var async = require("async");
var configConst = require('./utils/tools/configConst');
var GlobalAgent = require('./message/GlobalAgent');
var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiU0lEIjoiY25QLWk5aXdhNG9aeU9adGU0cjZKc0YteUZoSTBwMDEiLCJQV0QiOiJkMDdhNWQzNzFiY2JkYTE4N2RiNmJkZDFiNzVlMzRiYSIsIm5hbWUiOiJhZG1pbiIsIkpOTyI6IjEiLCJpYXQiOjE0NjgyODYzMDcsImV4cCI6MTQ5OTgyMjMwN30.dg7JmsvUBo_bG8PHOn7-n6YQTS5moVggEkmcURtfOyY"
//首页信息
router.get('/calendar', function (req, res, next) {
    res.render('mq/calendar');
});
router.get('/indicators', function (req, res, next) {
    res.render('mq/indicators');
});

router.get('/messageBox', function (req, res, next) {
    res.render('mq/messageBox');
});

router.get('/projectView', function (req, res, next) {
    res.render('mq/projectView');
});

router.get('/RTChart', function (req, res, next) {
    res.render('mq/RTChart');
});

router.get('/statistics', function (req, res, next) {
    res.render('mq/statistics');
});

router.get('/', function (req, res, next) {
    if (req.sessionID != undefined && req.session != undefined && req.session.user) {
        var user = req.session.user;
        res.render('index', {
            userName: user.name
        });
    } else {
        res.render('index', {
            userName: '登录'
        });
    }
});

router.get('/index', function (req, res, next) {
    res.render('index');
});
//找回密码
router.get('/system/forgetPwd', function (req, res, next) {
    res.render('system/forgetPwd');
});
//找回密码
router.get('/system/customer/register', function (req, res, next) {
    res.render('system/register');
});
//找回密码
router.get('/system/customer/registerIndividual', function (req, res, next) {
    res.render('system/registerIndividual');
});

router.get('/api', function (req, res, next) {
    res.render('api/api', {
        token: token
    });
});

// 全部企业信息管理(超级管理员界面)
router.get('/system/customer/enterpriseList', function (req, res, next) {
    res.render('system/enterpriseList');
});

router.get('/system/sysLog/sysLog', function (req, res, next) {
    res.render('system/sysLog', {
        token: token,
        pageName: '系统日志'
    });
});


router.get('/test', function (req, res, next) {
    res.render('api/test', {
        token: token
    });
});

/**
 *数据查询
 */
router.get('/dataview/realtime/realtime', function (req, res, next) {
    res.render('dataview/realtime', {
        token: token,
        pageName: "实时数据"
    });
});

router.get('/dataview/history/history', function (req, res, next) {
    res.render('dataview/history', {
        token: token,
        pageName: "历史数据"
    });
});

router.get('/dataview/historySnapSta/historySnapSta', function (req, res, next) {
    res.render('dataview/historySnapSta', {
        token: token,
        pageName: "历史统计"
    });
});

router.get('/dataview/alarmRealtime/alarmRealtime', function (req, res, next) {
    res.render('dataview/alarmRealtime', {
        token: token,
        pageName: "报警实时数据"
    });
});

router.get('/dataview/alarmHistory/alarmHistory', function (req, res, next) {
    res.render('dataview/alarmHistory', {
        token: token,
        pageName: "报警历史数据"
    });
});

/*项目管理*/
router.get('/domain/domain', function (req, res, next) {
    res.render('domain/domain/domain', {
        token: token,
        pageName: "域管理"
    });
});

/*项目管理*/
router.get('/domain/mtree', function (req, res, next) {
    res.render('domain/mtree/mtree', {
        token: token,
        pageName: "测点管理"
    });
});

/**
 * trend
 */
router.get('/trend/trend', function (req, res, next) {
    var userId = req.session.user.USER_ID;
    var sql = 'select id ,trend_point from sys_user_style where user_id = ' + userId;
    logger.debug('获取图形首页信息：' + sql);
    query(sql, function (err, rows) {
        if (err) {
            logger.error('获取用户设定首页信息错误：' + err);
            res.render('datatrend/trend', {
                token: token,
                pageName: "趋势"
            });
            return;
        } else if (rows && rows.length > 0 && rows[0].trend_point) {
            res.render('datatrend/trend', {
                token: token,
                pageName: "趋势",
                pointNames: rows[0].trend_point
            });
            return;
        } else {
            res.render('datatrend/trend', {
                token: token,
                pageName: "趋势"
            });
            return;
        }
    });
});

/**
 * view
 */
router.get('/gview/view', function (req, res, next) {
    var user = req.session.user;
    var userId = user.USER_ID;
    var domainId = GlobalAgent.getUserDomain(userId).toString();
    if (!domainId) {
        res.render('gview/view', {
            token: token,
            pageName: "实时图形"
        });
        return;
    }
    var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
    async.waterfall(
        [
            function (callback) {
                var sql = 'select id,diagram_file from sys_user_style where user_id = ' + userId;
                logger.debug('获取图形首页信息：' + sql);
                query(sql, function (err, rows) {
                    if (err) {
                        logger.error('获取用户设定首页信息错误：' + err);
                        res.render('gview/view', {
                            token: token,
                            pageName: "实时图形"
                        });
                        return;
                    } else {
                        callback(null, rows[0])
                    }
                });
            },
            function (row, callback) {
                var sql = 'select URI from sys_domain where DOMAIN_ID in (' + domainId + ') order by URI';
                logger.debug('获取domain信息sql:' + sql);
                query(sql, function (err, rows) {
                    if (err) {
                        logger.error('获取域信息出错');
                        res.render('gview/view', {
                            token: token,
                            pageName: "实时图形"
                        });
                    } else {
                        if (row) {
                            var URI = row.diagram_file;
                            var domainURI = '';
                            for (var i in rows) {
                                var r = rows[i]
                                {
                                    if (URI.indexOf(r.URI) == 0) {
                                        domainURI = r.URI;
                                    }
                                }
                            }
                            URI = URI.replace(domainURI + '/', '');
                            req.session.domainDiagram = domainURI;
                            res.render('gview/view', {
                                token: token,
                                pageName: "实时图形",
                                fileName: URI
                            });
                            return;
                        }
                        for (var i in rows) {
                            var URI = rows[i].URI;
                            var fp = path + URI + '/mainmenu.zxml';
                            if (fs.existsSync(fp)) {
                                req.session.domainDiagram = URI;
                                res.render('gview/view', {
                                    token: token,
                                    pageName: "实时图形",
                                    fileName: 'mainmenu.zxml'
                                });
                                return;
                            }
                        }
                        res.render('gview/view', {
                            token: token,
                            pageName: "实时图形"
                        });
                    }
                });
            }
        ],
        function (err) {
            res.render('gview/view', {
                token: token,
                pageName: "实时图形"
            });
        });
});
/**
 * view
 */
router.get('/gview/replayer', function (req, res, next) {
    res.render('gview/replayer', {
        token: token,
        pageName: "过程回放"
    });
});

/**
 * 加载首页
 */
router.get('/system/indexMessage', function (req, res, next) {
    // var userId = req.session.user.USER_ID;
    // var sql = "select b.PAGE_ID as pageId,b.PAGE_NAME,b.URL as pageUrl,a.PAGE_NO as pageNo from sys_user_page a inner join sys_page b on a.PAGE_ID = b.PAGE_ID where b.PAGE_TYPE_ID = 3 and a.USER_ID = " + userId + " order by a.PAGE_NO";
    // logger.debug('获取首页显示的信息sql：' + sql);
    // query(sql, function(err, rows, columns) {
    //     if (err || rows.length < 1) {
    //         logger.error('获取首页信息错误：' + (err || rows.length));
    //         res.render('system/indexMessage', { token: token, pageName: "首页" });
    //     } else {
    //         var size = rows.length;
    //         var content = ''
    //         var i = 0;
    //         for (i = 0; i < size; i++) {
    //             var con = rows[i];
    //             if (i % 2 == 0) {
    //                 content += '<section class="col-lg-6 connectedSortable">';
    //                 content += ' <iframe id="contentIfream" name="contentIfream" src="/' + con.pageUrl + '" style="width: 100%;height: 99%;overflow-y:auto;"></iframe>';
    //             } else {
    //                 content += ' <iframe id="contentIfream" name="contentIfream" src="/' + con.pageUrl + '" style="width: 100%;height: 99%;overflow-y:auto;"></iframe>';
    //                 content += '</section>';
    //             }
    //         }
    //         if (i == size && i % 2 != 0) {
    //             content += '</section>';
    //         }
    //         res.render('system/indexMessage', { token: token, pageName: "首页", content: content });
    //     }
    // });
    res.render('system/indexMessage', {
        token: token,
        pageName: "首页"
    });
});

router.get('/system/fileManage', function (req, res, next) {
    res.render('system/fileManage', {
        token: token,
        pageName: "文件管理"
    });
});

router.get('/system/token', function (req, res, next) {
    res.render('system/token', {
        token: token,
        pageName: "证书管理"
    });
});


router.get('/main', function (req, res, next) {
    res.render('main');
});
//任务管理
router.get('/model/taskManage', function (req, res, next) {
    res.render('model/taskManage', {
        token: token,
        pageName: "任务管理"
    });
});
//任务管理
router.get('/system/role/role', function (req, res, next) {
    res.render('system/role', {
        token: token,
        pageName: "角色管理"
    });
});


// 联联看相关
router.get('/box/device', function (req, res, next) {
    var userType = req.session.user.IS_SYSTEM;
    res.render('box/device', {
        token: token,
        pageName: "设备列表",
        userType: userType
    });
});


//服务器运行状态
router.get('/system/server/serverStatus', function (req, res, next) {
    res.render('system/serverStatus', {
        token: token,
        pageName: "状态监视"
    });
});


module.exports = router;