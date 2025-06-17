const Blog = require('../models/blog.model');
const logger = require('../utils/logger');

// Logged in users can create a blog
exports.createBlog = async (req, res, next) => {
    try {
        const { title, description, body, tags } = req.body;

        const newBlog = await Blog.create({
            title,
            description,
            body,
            tags,
            author: req.user._id, // From auth middleware
        });

        logger.info(`Blog created by ${req.user.email}: ${title}`);
        res.status(201).json({ status: 'success', data: { blog: newBlog } });
    } catch (error) {
        // Handle potential unique title error
        if (error.code === 11000) {
            return res.status(409).json({ status: 'error', message: 'A blog with this title already exists.' });
        }
        logger.error('Create Blog Error:', error);
        next(error);
    }
};

// Both logged in and not logged in users can get a list of published blogs
exports.getPublishedBlogs = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        // Search query
        const searchQuery = { state: 'published' };
        if (req.query.author) {
            // This is a simplified search by author's first or last name.
            // For a production app, a more robust solution might involve a separate User lookup.
            const User = require('../models/user.model');
            const author = await User.find({
                $or: [
                    { first_name: { $regex: req.query.author, $options: 'i' } },
                    { last_name: { $regex: req.query.author, $options: 'i' } }
                ]
            }).select('_id');
            const authorIds = author.map(user => user._id);
            searchQuery.author = { $in: authorIds };
        }
        if (req.query.title) {
            searchQuery.title = { $regex: req.query.title, $options: 'i' };
        }
        if (req.query.tags) {
            const tags = req.query.tags.split(',').map(tag => tag.trim());
            searchQuery.tags = { $in: tags };
        }

        // Sorting
        const sortQuery = {};
        if (req.query.orderBy) {
            const [field, order] = req.query.orderBy.split(':');
            const allowedFields = ['read_count', 'reading_time', 'timestamp'];
            if (allowedFields.includes(field)) {
                sortQuery[field] = order === 'desc' ? -1 : 1;
            }
        } else {
            sortQuery.createdAt = -1; // Default sort
        }

        const blogs = await Blog.find(searchQuery)
            .populate('author', 'first_name last_name')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        const totalBlogs = await Blog.countDocuments(searchQuery);

        res.status(200).json({
            status: 'success',
            results: blogs.length,
            data: { blogs },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / limit),
                totalBlogs,
            }
        });
    } catch (error) {
        logger.error('Get Published Blogs Error:', error);
        next(error);
    }
};

// Get a single published blog
exports.getPublishedBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { _id: req.params.id, state: 'published' },
            { $inc: { read_count: 1 } }, // Increment read_count
            { new: true } // Return the updated document
        ).populate('author', 'first_name last_name email');

        if (!blog) {
            return res.status(404).json({ status: 'error', message: 'Published blog not found.' });
        }

        res.status(200).json({ status: 'success', data: { blog } });
    } catch (error) {
        logger.error('Get Published Blog Error:', error);
        next(error);
    }
};


// OWNER ACTIONS

// Get list of owner's blogs
exports.getMyBlogs = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Filtering
        const filterQuery = { author: req.user._id };
        if (req.query.state && ['draft', 'published'].includes(req.query.state)) {
            filterQuery.state = req.query.state;
        }

        const blogs = await Blog.find(filterQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBlogs = await Blog.countDocuments(filterQuery);

        res.status(200).json({
            status: 'success',
            results: blogs.length,
            data: { blogs },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / limit),
                totalBlogs,
            }
        });
    } catch (error) {
        logger.error('Get My Blogs Error:', error);
        next(error);
    }
};

// Update blog state (e.g., from draft to published)
exports.updateBlogState = async (req, res, next) => {
    try {
        const { state } = req.body;
        if (!state || !['published'].includes(state)) {
            return res.status(400).json({ status: 'error', message: 'Invalid state provided. Can only update to "published".' });
        }

        const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id });

        if (!blog) {
            return res.status(404).json({ status: 'error', message: 'Blog not found or you are not the owner.' });
        }

        blog.state = state;
        await blog.save();

        logger.info(`Blog state updated by ${req.user.email}: ${blog.title} to ${state}`);
        res.status(200).json({ status: 'success', data: { blog } });
    } catch (error) {
        logger.error('Update Blog State Error:', error);
        next(error);
    }
};

// Edit a blog
exports.updateBlog = async (req, res, next) => {
    try {
        const { title, description, body, tags } = req.body;
        const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id });

        if (!blog) {
            return res.status(404).json({ status: 'error', message: 'Blog not found or you are not the owner.' });
        }

        // Update fields if they are provided
        if (title) blog.title = title;
        if (description) blog.description = description;
        if (body) blog.body = body;
        if (tags) blog.tags = tags;

        await blog.save(); // pre-save hook will recalculate reading_time if body changed

        logger.info(`Blog updated by ${req.user.email}: ${blog.title}`);
        res.status(200).json({ status: 'success', data: { blog } });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ status: 'error', message: 'A blog with this title already exists.' });
        }
        logger.error('Update Blog Error:', error);
        next(error);
    }
};

// Delete a blog
exports.deleteBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findOneAndDelete({ _id: req.params.id, author: req.user._id });

        if (!blog) {
            return res.status(404).json({ status: 'error', message: 'Blog not found or you are not the owner.' });
        }

        logger.info(`Blog deleted by ${req.user.email}: ${blog.title}`);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        logger.error('Delete Blog Error:', error);
        next(error);
    }
};
