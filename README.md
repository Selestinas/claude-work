# BookShelf

A web application for tracking books you've read, saving them to your library, and marking books you want to read in the future.

## Features

- **Email authentication** — passwordless login with verification code
- **Book search** — search millions of books via Open Library API (Russian & English)
- **Personal library** — save books as Read, Want to Read, or Favorite
- **Bilingual UI** — English and Russian interface

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, Sequelize
- **Frontend:** React, React Router, i18next
- **Book data:** Open Library API
- **Auth:** JWT + email verification codes

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

1. **Database:** Create a PostgreSQL database named `bookshelf`

2. **Server:**
   ```bash
   cd server
   cp .env.example .env    # edit with your DB and email credentials
   npm install
   npm run dev
   ```

3. **Client:**
   ```bash
   cd client
   npm install
   npm start
   ```

The app runs at `http://localhost:3000` (frontend) and `http://localhost:5000` (API).
