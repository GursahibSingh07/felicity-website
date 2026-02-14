const Registration = require("../models/Registration");

exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({
        user: req.user.id,
        }).populate("event");

        const events = registrations
        .map((reg) => reg.event)
        .filter((event) => event !== null);


    res.status(200).json(events);
  } 
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};
