# 🚘 Travas (RideLink)

Travas is a modern ridesharing platform connecting drivers with empty seats to passengers seeking affordable, secure, and convenient travel across Kenya.

## Stack Architecture

### Backend
- **Framework**: Django 5 (Python) & Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Dev)
- **Caching**: Redis
- **Payments**: M-Pesa (Daraja API) & Stripe
- **Authentication**: JWT (SimpleJWT)

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **State Management**: React Context
- **PWA**: Fully supported (Manifest & Service Workers)

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis (for caching)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

**Environment Variables (.env)**
Create a `.env` file in the `backend` folder:
```env
# Security
SECRET_KEY=your_secret_key_here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgres://user:password@localhost:5432/travas

# Caching (Redis)
REDIS_URL=redis://localhost:6379/1

# Payments (M-Pesa)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox

# Payments (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Run migrations and start server:
```bash
python manage.py migrate
python manage.py runserver
```
*Backend runs on: `http://localhost:8000`*

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

**Environment Variables (.env.local)**
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run the development server:
```bash
npm run dev
```
*Frontend runs on: `http://localhost:3000`*

---

## Performance & SEO

- **SEO**: Fully optimized with dynamic Sitemap, Robots.txt, and Open Graph metadata.
- **Performance**: 
  - **Redis Caching**: Used for session storage and API response caching.
  - **Image Optimization**: Next.js Image component with WebP conversion.
  - **Minification**: Production builds automatically remove console logs and minify assets.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License.
