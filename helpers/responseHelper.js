//response helper for successful interaction
exports.success = (data) => ({
    success: true,
    ...data,
});
//response helper for unsuccessful interaction
exports.error = (err) => ({
    success: false,
    error: err.message || err
});