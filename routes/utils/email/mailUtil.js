var nodemailer = require("nodemailer");
// 开启一个 SMTP 连接池
var smtpTransport = nodemailer.createTransport("SMTP", {
    host: "smtpcom.263xmail.com", // 主机
    secureConnection: true, // 使用 SSL
    port: 465, // SMTP 端口
    auth: {
        user: "license@magustek.com", // 账号
        pass: "2016magus" // 密码
    }
});


var mailUtil = {
    sendMail: function (mailOptions, callback) {
        // 发送邮件
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, response);
            }
            smtpTransport.close(); // 如果没用，关闭连接池

        });
    }
}

module.exports = mailUtil;