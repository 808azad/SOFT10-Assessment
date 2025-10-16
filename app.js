const express = require('express');
const app = express();
const messageRoutes = require("./routes/messageRoutes.js")

//enabling proper JSON usage in Express
app.use(express.json());

//root router
app.get('/', (req, res) => {
    res.send('Message API is running');
});

//router that mounts other routes from messageRoutes
app.use('/v1/message', messageRoutes);

const PORT = 3000
app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
})