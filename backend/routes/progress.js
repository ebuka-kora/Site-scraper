const express = require("express");
const router = express.Router();

let clients = [];

router.get("/progress", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

const sendProgress = (percent) => {
  clients.forEach((res) =>
    res.write(`data: ${JSON.stringify({ percent })}\n\n`)
  );
};

module.exports = { router, sendProgress };
