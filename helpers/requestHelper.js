//structure for sending proper vendor payload
exports.createVendorPayload = (req) => ({
    to: req.body.to + "@s.whatsapp.org",
    type: req.body.type,
    message: req.body.Options.message || "",
    media: req.body.Options.file || "",
    timestamp: Date.now(),
    typing_time: req.body.Options.typing ? 1 : 0
});

//structure for formatting received vendor payload
exports.formateResponceResults = (req, vendorResponse, encodedMessage) => ({
    success: true,
    message_id: encodedMessage,
    from_me: true,
    type: req.body.type,
    message: req.body.Options.message || "",
    timestamp: vendorResponse.timestamp
});