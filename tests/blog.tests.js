const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Blog = require('../src/models/blog.model');

let mongoServer;
let testUser, testToken, publishedBlog, draftBlog;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test user
    await request(app)
        .post('/api/v1/auth/signup')
        .send({
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            password: 'password123'
        });

    // Log in to get a token
    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
            email: 'test@example.com',
            password: 'password123'
        });
    testUser = res.body.data.user;
    testToken = res.body.token;
});

beforeEach(async () => {
    // Clear blogs and create new ones for each test
    await Blog.deleteMany({});
    publishedBlog = await Blog.create({ title: 'Published Blog', body: 'This is a test.', author: testUser._id, state: 'published' });
    draftBlog = await Blog.create({ title: 'Draft Blog', body: 'This is a draft.', author: testUser._id, state: 'draft' });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Blog Endpoints', () => {

    // Test for public access to published blogs
    describe('GET /api/v1/blogs', () => {
        it('should return a list of published blogs', async () => {
            const res = await request(app).get('/api/v1/blogs');
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.blogs).toBeInstanceOf(Array);
            expect(res.body.data.blogs.length).toBe(1);
            expect(res.body.data.blogs[0].title).toBe('Published Blog');
        });
    });

    // Test for creating a blog (protected)
    describe('POST /api/v1/blogs', () => {
        it('should create a new blog when authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/blogs')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    title: 'My New Test Blog',
                    body: 'Content of the new blog.',
                    tags: ['testing', 'api']
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.blog.title).toBe('My New Test Blog');
            expect(res.body.data.blog.state).toBe('draft');
        });

        it('should fail to create a blog without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/blogs')
                .send({ title: 'Unauthorized Blog', body: 'This should fail.' });

            expect(res.statusCode).toEqual(401);
        });
    });

    // Test for owner deleting their blog
    describe('DELETE /api/v1/blogs/:id', () => {
        it('should allow the owner to delete their own blog', async () => {
            const res = await request(app)
                .delete(`/api/v1/blogs/${publishedBlog._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.statusCode).toEqual(204);

            const foundBlog = await Blog.findById(publishedBlog._id);
            expect(foundBlog).toBeNull();
        });
    });
});
