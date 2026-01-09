# HelpyZo Backend

A service provider marketplace platform built with Node.js, Express, and MongoDB.

## Features

- **User Management**: Customer registration, authentication, and profile management
- **Partner Management**: Business/service provider registration and management
- **Nearby Services**: Find service providers based on location
- **Image Storage**: Store profile pictures, banners, and portfolio images on GitHub
- **JWT Authentication**: Secure token-based authentication
- **Geospatial Queries**: Location-based service discovery

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd helpyzo-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:

     ```env
     DB_URL=mongodb://localhost:27017/HelpyZo
     JWT_SECRET=your-super-secret-jwt-key-here
     PORT=3000
     NODE_ENV=development

     # GitHub Image Storage (Required for image uploads)
     GITHUB_TOKEN=your_github_personal_access_token_here
     GITHUB_REPO=your-username/your-repo-name
     GITHUB_BRANCH=main
     ```

4. **GitHub Setup for Image Storage**

   - Create a GitHub repository for storing images
   - Generate a Personal Access Token with `repo` permissions
   - Add the token and repo details to your `.env` file

5. **Start the server**
   ```bash
   npm start          # Production
   npm run dev        # Development with nodemon
   ```

## API Endpoints

### User Endpoints

#### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/verify-token` - Verify JWT token

#### Profile Management

- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)
- `PUT /api/users/change-password` - Change password (authenticated)
- `PUT /api/users/deactivate` - Deactivate account (authenticated)

#### Image Upload

- `POST /api/users/upload/avatar` - Upload user avatar (authenticated)

#### Location Services

- `GET /api/users/nearby?longitude=X&latitude=Y&maxDistance=Z` - Find nearby users

### Partner Endpoints

#### Authentication

- `POST /api/partners/register` - Register new partner
- `POST /api/partners/login` - Partner login
- `POST /api/partners/verify-token` - Verify JWT token

#### Profile Management

- `GET /api/partners/profile/me` - Get partner profile (authenticated)
- `PUT /api/partners/profile/me` - Update partner profile (authenticated)
- `PUT /api/partners/change-password` - Change password (authenticated)
- `PUT /api/partners/services` - Update services (authenticated)
- `PUT /api/partners/deactivate` - Deactivate account (authenticated)

#### Image Upload

- `POST /api/partners/upload/avatar` - Upload partner avatar (authenticated)
- `POST /api/partners/upload/banner` - Upload banner image (authenticated)
- `POST /api/partners/upload/portfolio` - Upload portfolio images (authenticated)

#### Service Discovery

- `GET /api/partners/nearby?longitude=X&latitude=Y&maxDistance=Z&category=C&minRating=R` - Find nearby partners
- `GET /api/partners/category/:category` - Get partners by service category
- `GET /api/partners/search?q=serviceName` - Search partners by service name
- `GET /api/partners/:partnerId` - Get partner details
- `GET /api/partners/categories` - Get all service categories

## Image Upload Guide

### GitHub Repository Setup

1. **Create a GitHub Repository**

   - Create a new public repository on GitHub
   - This will store all uploaded images

2. **Generate Personal Access Token**

   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Copy the token to your `.env` file

3. **Configure Environment Variables**
   ```env
   GITHUB_TOKEN=your_personal_access_token
   GITHUB_REPO=your-username/your-repo-name
   GITHUB_BRANCH=main
   ```

### Image Upload Examples

#### Upload User Avatar

```bash
curl -X POST http://localhost:3000/api/users/upload/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/your/image.jpg"
```

#### Upload Partner Banner

```bash
curl -X POST http://localhost:3000/api/partners/upload/banner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "banner=@/path/to/banner.jpg"
```

#### Upload Portfolio Images

```bash
curl -X POST http://localhost:3000/api/partners/upload/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "portfolio=@before.jpg" \
  -F "portfolio=@after.jpg" \
  -F "types[]=before" \
  -F "types[]=after" \
  -F "captions[]=Before service" \
  -F "captions[]=After service"
```

### Image Specifications

- **Supported Formats**: JPEG, PNG, WebP
- **Maximum File Size**: 5MB per image
- **Maximum Portfolio Images**: 10 images
- **Storage Location**: Organized in folders (users/avatars, partners/banners, partners/portfolio)

## Service Categories

Available service categories for partners:

- `home_repair` - Home repair services
- `cleaning` - Cleaning services
- `plumbing` - Plumbing services
- `electrical` - Electrical services
- `painting` - Painting services
- `carpentry` - Carpentry services
- `gardening` - Gardening services
- `pest_control` - Pest control services
- `ac_repair` - Air conditioning repair
- `appliance_repair` - Appliance repair
- `automotive` - Automotive services
- `beauty` - Beauty services
- `health` - Health services
- `education` - Education services
- `other` - Other services

## Development

### Project Structure

```
├── controllers/          # Request handlers
├── middlewares/          # Custom middleware
├── models/              # MongoDB schemas
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
├── database/            # Database connection
└── index.js            # Application entry point
```

### Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **GitHub API** - Image storage

## License

ISC
