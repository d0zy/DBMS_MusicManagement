# Music Club Management System

A web application for managing a music club, including room bookings, instrument inventory, and member management.

## Features

- **Room Booking**: Book music rooms for practice or events (after 10pm the previous day)
- **Instrument Management**: Browse and check out instruments (coming soon)
- **Member Management**: Connect with other musicians (coming soon)

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth (planned)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Supabase account and project

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/music-club-management.git
   cd music-club-management
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your Supabase credentials:
     ```
     DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
     NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
     ```

4. Set up the database schema:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Setup with Supabase

1. Create a new project in [Supabase](https://supabase.com/).
2. Go to Project Settings > Database to find your connection string.
3. Use the connection string to update the `DATABASE_URL` in your `.env` file.
4. Run `npx prisma db push` to create the database schema.

## Project Structure

- `app/`: Next.js app directory
  - `api/`: API routes
  - `booking/`: Booking page
  - `components/`: React components
  - `lib/`: Utility libraries
  - `utils/`: Helper functions
- `prisma/`: Prisma schema and migrations

## Room Booking Rules

- Rooms can only be booked after 10pm the previous day
- Operating hours are from 8:00 AM to 2:00 AM the next day
- All booking slots are 59 minutes (e.g., 8:00 - 8:59)
- Bookings must start at round hours (e.g., 8:00, 9:00)
- Bookings after midnight (00:00 and 1:00 AM) are displayed as next day slots but are counted as bookings for the previous day (e.g., 00:00 AM on April 20th is counted as a booking for April 19th)
- Only available slots are displayed for selection
- On weekdays, one person can book only 1 slot per day in the range 8:00 AM to 2:00 AM the next day
- On weekends (Saturday and Sunday), one person can book up to 2 slots per day
- Bookings are subject to availability
- Users must be logged in to book a room

## Technical Implementation Notes

- The system uses GMT +5:30 timezone for all date-based validations
- This approach simplifies the validation logic for booking limits across day boundaries
- Weekend determination (for booking limits) is based on the day of week in GMT +5:30
- All booking slots are generated and validated in GMT +5:30 timezone
- The frontend displays times in the user's local timezone

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
