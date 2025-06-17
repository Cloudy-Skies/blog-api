const express = require('express');
const blogController = require('../controllers/blog.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateBlogCreation } = require('../middlewares/validation.middleware');

const router = express.Router();

// PUBLIC ROUTES
// GET /api/v1/blogs - Get a list of all published blogs (paginated, searchable, orderable)
router.get('/', blogController.getPublishedBlogs);

// GET /api/v1/blogs/:id - Get a single published blog
router.get('/:id', blogController.getPublishedBlog);


// PROTECTED ROUTES (Require login)
router.use(protect);

// POST /api/v1/blogs - Create a new blog
router.post('/', validateBlogCreation, blogController.createBlog);

// GET /api/v1/blogs/my-blogs - Get a list of blogs owned by the logged-in user
router.get('/my-blogs', blogController.getMyBlogs);

// PATCH /api/v1/blogs/:id - Update a blog owned by the logged-in user
router.patch('/:id', blogController.updateBlog);

// PATCH /api/v1/blogs/:id/publish - Change the state of a blog to 'published'
router.patch('/:id/publish', blogController.updateBlogState);

// DELETE /api/v1/blogs/:id - Delete a blog owned by the logged-in user
router.delete('/:id', blogController.deleteBlog);


module.exports = router;
