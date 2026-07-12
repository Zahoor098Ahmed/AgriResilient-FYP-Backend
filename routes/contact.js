import express from 'express';
import { body, validationResult } from 'express-validator';
import { submitContact } from '../controllers/contactController.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  submitContact
);

export default router;
