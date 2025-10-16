const authToken = require('../authTokens.json')
const crypto = require('crypto')
const requestHelper = require('../helpers/requestHelper')

//encoding messageID
const encodeMessageID = (messageID) => {
    const algorithm = 'aes-256-cbc';
    const secretStr = 'my-secret-key';
    const key = crypto.createHash('sha256').update(secretStr).digest();
    const initVec = Buffer.alloc(16, 0);

    const cipher = crypto.createCipheriv(algorithm, key, initVec);
    let encoded = cipher.update(messageID, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
};

//validating client request
const validateRequest = (req) => {
    const clientToken = req.get('x-api-key');
    if (!clientToken) throw new Error("Missing x-api-key header");

    const matchedClient = authToken.clients.find(c => c.client_token === clientToken);
    if (!matchedClient) throw new Error("Client token is invalid");

    const body = req.body;
    if (!body || !body.to || !body.type || !body.Options) 
        throw new Error("Missing fields: to, type or Options");

    if (!['text', 'image'].includes(body.type)) 
        throw new Error("Invalid message type. Must be text or image");

    if (body.type === 'text' && !body.Options.message)
        throw new Error("Missing message field for type text");

    if (body.type === 'image' && !body.Options.file)
        throw new Error("Missing file field for type image");

    return matchedClient.vendor_token;
};

//simulating fetching from vendor api
const fetchVendor = (payload, vendorToken) => {
    console.log("Simulated vendor call:", payload, vendorToken);
    return {
        status: "success",
        message_id: "simulated-message-id",
        from_me: true,
        type: payload.type,
        message: payload.message || payload.caption,
        timestamp: Date.now()
    };
};

//processing client message
exports.processMessage = (req) => {
    const vendorToken = validateRequest(req);
    const vendorPayload = requestHelper.createVendorPayload(req);
    const vendorResponse = fetchVendor(vendorPayload, vendorToken);
    const encodedMessage = encodeMessageID(vendorResponse.message_id);
    return requestHelper.formateResponceResults(req, vendorResponse, encodedMessage);
}