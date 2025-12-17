# EasyBook - Appointment Booking System

EasyBook is a centralized online platform where users can easily view available time slots and book appointments. It helps organize schedules, prevents conflicts, reduces waiting times, and ensures that both students and staff manage their time more efficiently.

## Features

- ✅ User registration and login with role-based access (Student, Staff, Admin)
- ✅ View available time slots for teachers, tutors, or offices
- ✅ Book and cancel appointments
- ✅ Admin panel for managing schedules
- ✅ Real-time dashboard statistics
- ✅ Role-based filtering and permissions

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas account)
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:

**For Local MongoDB:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/easybook
JWT_SECRET=your-secret-jwt-key-change-this-in-production
```

**For MongoDB Atlas (Cloud):**
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/easybook?retryWrites=true&w=majority
JWT_SECRET=your-secret-jwt-key-change-this-in-production
```

**To get your MongoDB Atlas connection string:**
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Go to your cluster and click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database user credentials
6. Replace `<cluster>` with your cluster name (or use the full cluster URL provided)
7. Optionally change `easybook` to your preferred database name

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional, defaults to localhost:5000):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

## Usage

1. **Register/Login**: Create an account or login with existing credentials
   - Choose your role: Student, Staff, or Admin during registration
   
2. **Students**:
   - View available time slots
   - Book appointments
   - View and cancel your appointments
   
3. **Staff**:
   - Create time slots with date, time, and max bookings
   - View all appointments
   - Delete their own time slots and appointments
   - View dashboard statistics

4.  **Admin**:
   - Create time slots with date, time, and max bookings
   - View all appointments
   - Delete time slots and appointments
   - View dashboard statistics
   - Manage user accounts

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Time Slots
- `GET /api/timeslots` - Get all time slots
- `POST /api/timeslots` - Create a time slot (Staff/Admin only)
- `DELETE /api/timeslots/:id` - Delete a time slot (Staff/Admin only)

### Appointments
- `GET /api/appointments` - Get appointments (filtered by role)
- `POST /api/appointments` - Book an appointment (Student only)
- `PATCH /api/appointments/:id/cancel` - Cancel an appointment
- `DELETE /api/appointments/:id` - Delete an appointment (Staff/Admin only)

## Project Structure

```
webdev-easybook/
├── backend/
│   ├── middleware/      # Authentication & authorization middleware
│   ├── models/          # MongoDB models (User, Appointment, TimeSlot)
│   ├── routes/          # API routes
│   └── server.js        # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/       # API utility functions
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Notes

- **MongoDB Connection**: You can use either a local MongoDB instance or MongoDB Atlas (cloud). The connection string format is different for each:
  - Local: `mongodb://localhost:27017/easybook`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/easybook`
- Make sure MongoDB is running (if using local) or your Atlas cluster is accessible
- JWT tokens are stored in localStorage
- All API requests require authentication except for time slot viewing
- Role-based access control is enforced on both frontend and backend

