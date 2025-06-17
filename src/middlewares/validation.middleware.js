const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

exports.validateSignup = [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('first_name').notEmpty().withMessage('First name is required.'),
    body('last_name').notEmpty().withMessage('Last name is required.'),
    handleValidationErrors
];

exports.validateLogin = [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password cannot be empty.'),
    handleValidationErrors
];

exports.validateBlogCreation = [
    body('title').notEmpty().withMessage('Title is required.'),
    body('body').notEmpty().withMessage('Body is required.'),
    body('tags').optional().isArray().withMessage('Tags must be an array of strings.'),
    handleValidationErrors
];
