# MiniLedger — Personal Loan Tracker

MiniLedger is a full-stack loan tracking application that helps users record money lent to friends, track repayments, and monitor overdue loans.

## Features

- **Phone OTP Login:** Mock OTP authentication with OTP printed in the backend terminal.
- **Loan Management:** Add loans with a friend's name, amount, and due date.
- **Repayment Tracking:** Mark loans as repaid.
- **Loan Dashboard:** View total lent, total repaid, outstanding balance, and overdue amount.
- **Overdue Highlighting:** Identify unpaid loans past their due date.
- **Persistent Storage:** PostgreSQL database hosted on Neon.

## Tech Stack

**Backend:** Node.js, Express.js, TypeScript, PostgreSQL  
**Frontend:** React Native, Expo, Expo Router  
**Database Hosting:** Neon PostgreSQL

## Project Structure

```text
mini_ledger/
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── loans.ts
│       │   └── summary.ts
│       ├── db.ts
│       └── server.ts
├── mobile/
│   └── src/
│       └── app/
│           ├── index.tsx
│           ├── explore.tsx
│           └── _layout.tsx
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- A PostgreSQL database
- Expo-compatible development environment

## Setup Instructions

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd mini_ledger
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=YOUR_POSTGRESQL_CONNECTION_STRING
PORT=5000
```

Configure your PostgreSQL database using the schema described below.

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Configure the mobile application

Open a second terminal:

```bash
cd mobile
npm install
npx expo start
```

Press `w` to open the web version in your browser.

For local web development, the frontend API URL is configured in the application source. If accessing the frontend from a different device or deploying it, update the API URL to the backend's reachable address.

## Database Schema

### Users

- `id`: Primary key
- `phone`: Unique phone number
- `created_at`: Account creation timestamp

### Loans

- `id`: Primary key
- `user_id`: Reference to the user
- `friend_name`: Name of the friend
- `amount`: Loan amount
- `due_date`: Repayment due date
- `is_repaid`: Repayment status
- `created_at`: Loan creation timestamp

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check API status |
| POST | `/api/auth/send-otp` | Generate and log a mock OTP |
| POST | `/api/auth/verify-otp` | Verify OTP and log in |
| POST | `/api/loans` | Add a loan |
| GET | `/api/loans?userId=1` | Retrieve a user's loans |
| PATCH | `/api/loans/:id/repay` | Mark a loan as repaid |
| GET | `/api/summary?userId=1` | Retrieve loan totals and overdue amount |

## Authentication Note

This project uses mock OTP authentication for demonstration. OTPs are printed in the backend terminal. This is not production-grade authentication; production deployment would require secure OTP delivery, proper session or token management, and authorization checks.

## Running Tests

Run the backend TypeScript check:

```bash
cd backend
npm run typecheck
```

## Demo

- **GitHub:** Add your repository URL here.
- **Screen Recording:** Add your demo video link here.

## Future Improvements

- Receipt photo uploads
- Secure production authentication
- Automated backend tests
- Loan reminders and notifications

---

Built as a full-stack loan tracking application using TypeScript, React Native, Express, and PostgreSQL.
