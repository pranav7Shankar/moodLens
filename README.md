# MoodLens - AI-Powered Facial Recognition and Emotion Detection System

A comprehensive HR management system with facial recognition attendance tracking, emotion analysis, and employee management capabilities.

## Features

- **Facial Recognition Attendance**: Automatic check-in using AWS Rekognition
- **Emotion Detection**: Real-time emotion analysis from facial expressions
- **Employee Management**: Complete CRUD operations for employee database
- **HR Dashboard**: Comprehensive dashboard with analytics and insights
- **Announcements System**: Post and manage announcements for employees
- **Attendance Tracking**: View and manage employee attendance records
- **Mood Analytics**: Visualize employee emotions and mood trends

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based auth with bcrypt
- **Face Recognition**: AWS Rekognition
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Fonts**: Orbitron, Gasoek One (custom fonts)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- AWS account with Rekognition access
- (Optional) SMTP server for email functionality

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facialAnalysis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables:
     ```env
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     AWS_REGION=us-east-1
     AWS_ACCESS_KEY_ID=your_aws_access_key_id
     AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
     SMTP_HOST=smtp.gmail.com (optional)
     SMTP_PORT=587 (optional)
     SMTP_USER=your_email@gmail.com (optional)
     SMTP_PASS=your_app_password (optional)
     ```

4. **Set up Supabase database**
   - Run the SQL scripts in your Supabase SQL Editor:
     - `supabase_users_table.sql` - Creates users table for authentication
     - `supabase_announcements_table.sql` - Creates announcements table
     - `supabase_attendance_remove_emotion_migration.sql` - Sets up attendance table
     - `supabase_emotion_records.sql` - Creates emotion records table
     - `supabase_anonymous_emotions.sql` - Creates anonymous emotions table

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Main app: http://localhost:3000
   - HR Dashboard: http://localhost:3000/hr/login

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── attendance/   # Attendance and face recognition
│   │   ├── announcements/ # Announcements CRUD
│   │   ├── employees/    # Employee management
│   │   └── hr/           # HR authentication
│   ├── hr/               # HR dashboard pages
│   └── page.js           # Main landing page
├── components/
│   ├── hr/               # HR dashboard components
│   ├── AttendanceKiosk.js # Kiosk interface
│   └── EmployeeDashboard.js # Employee announcements
├── lib/
│   └── supabaseAdmin.js  # Supabase admin client
├── middleware.js         # Route protection
└── styles/
    └── globals.css       # Global styles and fonts
```

## Environment Variables

### Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)
- `AWS_REGION`: AWS region for Rekognition (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key

### Optional
- `SMTP_HOST`: SMTP server hostname (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_SECURE`: Use secure connection (default: false)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `NEXT_PUBLIC_APP_URL`: Application URL (default: http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure environment variables**
   - Add all environment variables from `.env.example`
   - Ensure all required variables are set

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-project.vercel.app`

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- **Netlify**: Use Next.js build plugin
- **AWS Amplify**: Configure Next.js build settings
- **Railway**: Set Node.js environment
- **DigitalOcean App Platform**: Use Next.js preset

### Build Commands

```bash
# Production build
npm run build

# Start production server
npm start
```

## Security Considerations

- All API routes are protected with authentication middleware
- Passwords are hashed using bcrypt
- Row Level Security (RLS) enabled on all Supabase tables
- Security headers configured in `next.config.mjs`
- HTTPS required for camera access in production

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires HTTPS for camera)
- Mobile browsers: Supported with responsive design

## Troubleshooting

### Camera not working
- Ensure you're using HTTPS in production
- Check browser permissions for camera access
- Verify camera is not being used by another application

### Authentication issues
- Verify Supabase credentials are correct
- Check that users table exists and has proper RLS policies
- Ensure cookies are enabled in browser

### Face recognition not working
- Verify AWS credentials are correct
- Check AWS Rekognition service is enabled
- Ensure employee images are uploaded and accessible

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
