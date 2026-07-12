import ContactSubmission from '../models/ContactSubmission.js';

export const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    const submission = await ContactSubmission.create({
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 200),
      message: message.trim().slice(0, 5000)
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { id: submission._id }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
