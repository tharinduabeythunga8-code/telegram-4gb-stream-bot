const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => res.send("🚀 4GB File Stream Server is Running Safely!"));

app.get("/stream/:fileId", async (req, res) => {
    const fileId = req.params.fileId;
    res.status(200).send("Stream endpoint configured successfully.");
});

app.listen(PORT, () => {
    console.log(`✅ Server web service actively running on port ${PORT}`);
});