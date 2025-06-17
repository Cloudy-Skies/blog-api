const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Blog title is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    body: {
        type: String,
        required: [true, 'Blog body is required'],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    state: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    read_count: {
        type: Number,
        default: 0,
    },
    reading_time: {
        type: Number, // Stored in minutes
    },
    tags: {
        type: [String],
        trim: true,
    }
}, {
    timestamps: true
});

/**
 * Decision Making: Reading Time Calculation
 * Algorithm: The average adult reading speed is about 225 words per minute (WPM).
 * We will calculate the number of words in the blog's body and divide it by 225.
 * We'll use Math.ceil to round up to the nearest whole number, ensuring even short articles
 * have at least a 1-minute reading time.
 */
blogSchema.pre('save', function (next) {
    if (this.isModified('body') || this.isNew) {
        const wordCount = this.body.split(/\s+/).length;
        const averageWPM = 225;
        this.reading_time = Math.ceil(wordCount / averageWPM);
    }
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
