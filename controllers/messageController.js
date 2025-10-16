const messageService = require('../services/messageService');
const responseHelper = require('../helpers/responseHelper');

//main client-vendor interaction controller
exports.sendMessage = (req, res) => {
    try{
        const result = messageService.processMessage(req);
        console.log(result)
        return res.json(responseHelper.success(result));
    } catch(err){
        console.error(err);
        return res.status(500).json(responseHelper.error(err));
    }
}