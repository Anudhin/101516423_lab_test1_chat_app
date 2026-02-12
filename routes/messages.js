const express = require("express");
const router = express.Router();
const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");

router.get("/group-messages/:room", async (req, res) => {
  try {
    const room = req.params.room;
    const msgs = await GroupMessage.find({ room })
      .sort({ date_sent: -1 })
      .limit(50);

    return res.json(msgs.reverse());
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/private-messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const msgs = await PrivateMessage.find({
      $or: [
        { from_user: user1, to_user: user2 },
        { from_user: user2, to_user: user1 }
      ]
    })
      .sort({ date_sent: -1 })
      .limit(50);

    return res.json(msgs.reverse());
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
