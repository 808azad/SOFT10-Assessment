const express = require('express');
const app = express();

//assuming authTokens.json located in the same folder
const authToken = require('./authTokens.json');
const crypto = require('crypto');

//enabling proper JSON usage in Express
app.use(express.json());

//custom request validator
const validateRequest = (request, authToken) => {
    
    //validating request header
    const clientToken = request.get('x-api-key');
    if(!clientToken) {
        return {
            valid: false,
            error: "Missing x-api-key header"
        }
    }

    //validating if client token exist in authToken.json
    const matchedClient = authToken.clients.find(c => c.client_token === clientToken);
    if(!matchedClient){
        return {
            valid: false,
            error: "Client token is invalid"
        }
    }

    //validating all the fields of the given structure 
    const body = request.body;
    if(!body || !body.to || !body.type || !body.Options){
        return {
            valid: false,
            error: "Missing fields: to, type or Options"
        }
    }

    //validating message types
    if(!['text', 'image'].includes(body.type)){
        return {
            valid: false,
            error: "Invalid message type. Message types must be text or image"
        }
    }

    //validating Option type text 
    if(body.type === 'text' && !body.Options.message){
        return {
            valid: false,
            error: "Missing message field for type text"
        }
    }

    //validating Option type image
    if(body.type === 'image' && !body.Options.file){
        return {
            valid: false,
            error: "Missing file field for type image"
        }
    }

    return {
        valid: true,
        vendorToken: matchedClient.vendor_token
    }

}

//encoder based on crypto package
const encodeMessageID = (messageID) => {
    const algorithm = 'aes-256-cbc';
    const secretStr = 'my-secret-key';

    //creating 32 byte hash for AES algorithm
    const key = crypto.createHash('sha256').update(secretStr).digest();
    
    //defining custom init. vector for getting the same encryption each time
    const initVec = Buffer.alloc(16, 0);

    //creating cipher object for encryption
    const cipher = crypto.createCipheriv(algorithm, key, initVec);

    //encrypting the messageID (from utf8 to hex)
    let encoded = cipher.update(messageID, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
}

// Adapter for client-vendor interactions
app.post('/v1/message/send', async(req, res) => {
    try{
        const validResult = validateRequest(req, authToken);
        if(!validResult.valid){
            return res.status(400).json({
                success: false, 
                error: validResult.error
            });
        }

        //creating payload for vendor API
        const vendorPayload = {
            to: req.body.to + "@s.whatsapp.org",
            type: req.body.type,
            message: req.body.Options.message || "",
            media: req.body.Options.file || "",
            timestamp: Date.now(),
            typing_time: req.body.Options.typing ? 1 : 0
        }

        //checking if Option type is text or image
        const vendorURL = req.body.type === 'text' 
            ? 'https://example.com/message/send-text' 
            : 'https://example.com/message/send-image';
        
        //response fetching logic from vendor API
        const response = await fetch(vendorURL, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${validResult.vendorToken}`},
            body: JSON.stringify(vendorPayload)
        });

        let vendorResponse = await response.json();
        
        //Encoding message id
        let vendorMessageID = vendorResponse.message_id;
        let encodedMessage = encodeMessageID(vendorMessageID); 

        // returning the final response
        return res.json({
            success: true,
            message_id: encodedMessage,
            from_me: true,
            type: req.body.type,
            message: req.body.Options.message,
            timestamp: vendorResponse.timestamp
        });
    } catch(err){
        console.error(err);
        res.status(500).json({
            success: false, 
            error: "Internal server error"
        });
    }
});