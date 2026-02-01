```markdown
# 🎯 Events & Activities Platform – Backend

**Server powering real-world social connections**  
RESTful API built with **Express.js**, **Prisma ORM**, **PostgreSQL**, JWT authentication, and role-based access control — designed to support the Events & Activities frontend platform.

Handles event creation, user/host/admin management, participant registration, payments (Stripe-ready), file uploads, and more.

[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📍 Live Demo & Repositories

**Client (Frontend) Repository:**  
https://github.com/naeemul-online/event-and-activities-prisma-and-express-client.git

**Server (Backend) Repository:**  
https://github.com/naeemul-online/event-and-activities-prisma-and-express-server.git

**Client Live Deployment:**  
https://event-and-activities-prisma-and-exp.vercel.app

**Server Live Deployment:**  
https://event-and-activities-prisma-and-express.onrender.com

### Demo Access

**Admin Credentials** (for demo purposes only):  
- Email: `admin@gmail.com`  
- Password: `Admin@123`

> **Security Note:** These credentials are for testing only. Change them immediately in production environments.

## ✨ Core Features

- JWT-based authentication & refresh tokens
- Role-based access control (User, Host, Admin)
- Full CRUD for Events, Users, Hosts, Participants
- Event categories, fees, capacity limits, images
- Participant join/leave logic + status tracking
- Host revenue & event statistics
- Admin user/event moderation & system overview
- Secure file uploads (Cloudinary)
- Payment webhook support (Stripe-ready)
- Input validation with **Zod**
- Centralized error handling & logging

## 🛠 Tech Stack

| Layer              | Technology                     |
|--------------------|--------------------------------|
| Runtime            | Node.js ≥ 18                   |
| Framework          | Express.js                     |
| Language           | TypeScript                     |
| ORM/Database       | Prisma + PostgreSQL            |
| Authentication     | JWT + bcrypt                   |
| Validation         | Zod                            |
| File Storage       | Cloudinary                     |
| Payments           | Stripe (webhooks prepared)     |
| Logging            | Custom + Morgan (dev)          |
| Environment        | dotenv                         |
| CORS               | cors                           |

## 📂 Project Structure

```text
src/
├── config/               # db, cloudinary, jwt, etc.
├── controllers/          # route handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── event.controller.ts
│   ├── host.controller.ts
│   ├── admin.controller.ts
│   └── payment.controller.ts
├── middleware/
│   ├── auth.middleware.ts      # JWT verification + role checks
│   ├── error.middleware.ts
│   └── validate.middleware.ts  # Zod schema validation
├── models/               # Prisma schema (generated)
├── routes/               # Express routers
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── event.routes.ts
│   ├── host.routes.ts
│   ├── admin.routes.ts
│   └── payment.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── event.service.ts
│   ├── host.service.ts
│   └── admin.service.ts
├── types/
├── utils/
│   ├── errorHandler.ts
│   ├── cloudinary.ts
│   └── constants.ts
├── prisma/
│   └── schema.prisma
└── server.ts             # entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database (local or hosted)
- Cloudinary account (for image uploads)

### Installation

```bash
# Clone the repo
git clone https://github.com/naeemul-online/event-and-activities-prisma-and-express-server.git
cd event-and-activities-prisma-and-express-server

# Install dependencies
npm install

# Copy example env
cp .env.example .env

# Fill in .env (see below)
```

### Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/events_db?schema=public"

# JWT
JWT_SECRET=your-very-long-secret-key
JWT_REFRESH_SECRET=another-very-long-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=7

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (optional / future)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Development

```bash
# Generate Prisma client & migrate
npx prisma generate
npx prisma migrate dev --name init

# Start development server (with nodemon)
npm run dev
# → http://localhost:5000
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## 🛡️ Security Notes
- Never commit `.env` or sensitive keys
- Use strong, unique `JWT_SECRET` values
- Enable HTTPS in production
- Rate limiting recommended (e.g., express-rate-limit)
- Sanitize inputs even with Zod

## 📌 API Documentation
- Currently using OpenAPI/Swagger (planned) or Postman collection
- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <token>`

Example endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/events`
- `POST /api/v1/events`
- `POST /api/v1/events/:id/join`

## 🛣 Roadmap (Future)
- Email notifications (Nodemailer / Resend)
- In-app notifications
- Rate limiting & security headers
- Swagger / OpenAPI docs
- Caching layer (Redis)
- Advanced filtering & search (full-text)

## 📄 License

Built for **client demonstration / educational purposes**.

Feel free to fork and learn from it — but **do not use the branding / name in production** without permission.

---

Made with ❤️ to bring people together through shared experiences  
Questions? → Open an issue!
```