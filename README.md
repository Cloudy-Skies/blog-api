# Blogging API

A RESTful API for a simple blogging platform.

## Overview

This API allows users to create, read, update, and delete blog posts. It also includes authentication and authorization features to ensure that only authorized users can perform certain actions.

## Features

- User authentication and authorization
- Create, read, update, and delete blog posts
- Support for multiple blog posts per user
- Validation for blog post titles, bodies, and tags

## Endpoints

### Authentication

- `POST /api/v1/auth/signup`: Create a new user account
- `POST /api/v1/auth/login`: Login to an existing user account

### Blogs

- `GET /api/v1/blogs`: Retrieve a list of all blog posts
- `POST /api/v1/blogs`: Create a new blog post
- `GET /api/v1/blogs/:id`: Retrieve a single blog post by ID
- `PUT /api/v1/blogs/:id`: Update a single blog post by ID
- `DELETE /api/v1/blogs/:id`: Delete a single blog post by ID

## Requirements

- Node.js (version 14 or higher)
- MongoDB (version 4 or higher)
- Express.js (version 4 or higher)

## Installation

1. Clone the repository: `git clone https://github.com/your-username/your-repo-name.git`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

## Testing

1. Run the tests: `npm test`

## License

ISC License

## Contributing

Contributions are welcome! Please submit a pull request with your changes.