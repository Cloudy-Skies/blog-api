const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.signup = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: 'error', message: 'User with this email already exists.' });
        }

        const newUser = await User.create({
            first_name,
            last_name,
            email,
            password
        });

        // Remove password from the output
        newUser.password = undefined;

        logger.info(`New user signed up: ${email}`);
        res.status(201).json({ status: 'success', data: { user: newUser } });

    } catch (error) {
        logger.error('Signup Error:', error);
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password.' });
        }

        // 2. Check if user exists and password is correct
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ status: 'error', message: 'Incorrect email or password.' });
        }

        // 3. If everything is ok, send token to client
        const token = generateToken(user._id);

        // Remove password from output
        user.password = undefined;

        logger.info(`User logged in: ${email}`);
        res.status(200).json({ status: 'success', token, data: { user } });

    } catch (error) {
        logger.error('Login Error:', error);
        next(error);
    }
};
