var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var GlobalSMS = {}
var sms = {
    sendSms: function (UUID, phone, res) {
        var smsCode = '123456'
        message.flag = 0;
        message.message = 'OK';
        message.data = smsCode;
        GlobalSMS[UUID] = {phone: phone, smsCode: smsCode}
        res.json(message);
    },
    sendCloudSms: function (phone, req, res) {
        var smsCode = '123456'
        message.flag = 0;
        message.message = 'OK';
        message.data = smsCode;
        req.session[phone] = {phone: phone, smsCode: smsCode};
        res.json(message);
    },
    getSms: function (UUID) {
        return GlobalSMS[UUID];
    },
    deleteSms: function (UUID) {
        return delete GlobalSMS[UUID];
    }
}

module.exports = sms;
