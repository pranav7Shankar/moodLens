# Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `AWS_REGION` - AWS region (default: us-east-1)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key ID
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- [ ] `SMTP_HOST` - (Optional) SMTP server hostname
- [ ] `SMTP_PORT` - (Optional) SMTP server port
- [ ] `SMTP_USER` - (Optional) SMTP username
- [ ] `SMTP_PASS` - (Optional) SMTP password
- [ ] `NEXT_PUBLIC_APP_URL` - (Optional) Application URL

### 2. Database Setup
- [ ] Run `supabase_users_table.sql` in Supabase SQL Editor
- [ ] Run `supabase_announcements_table.sql` in Supabase SQL Editor
- [ ] Run `supabase_attendance_remove_emotion_migration.sql` in Supabase SQL Editor
- [ ] Run `supabase_emotion_records.sql` in Supabase SQL Editor
- [ ] Run `supabase_anonymous_emotions.sql` in Supabase SQL Editor
- [ ] Verify all RLS policies are enabled
- [ ] Create at least one HR employee in the `employees` table
- [ ] Create at least one user account in the `users` table (via signup or directly)

### 3. AWS Configuration
- [ ] AWS Rekognition service enabled
- [ ] IAM user with Rekognition permissions created
- [ ] Access keys generated and stored securely
- [ ] Verify Rekognition is accessible from deployment region

### 4. Build Verification
- [ ] Run `npm run build` successfully
- [ ] No build errors or warnings
- [ ] All dependencies installed (`npm install`)
- [ ] Test production build locally (`npm start`)

## Deployment Steps

### Vercel (Recommended)

1. **Connect Repository**
   - Push code to GitHub/GitLab/Bitbucket
   - Import project in Vercel dashboard

2. **Configure Environment Variables**
   - Add all required environment variables
   - Verify all values are correct

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment URL

5. **Post-Deployment**
   - Test login functionality
   - Test camera access (requires HTTPS)
   - Test face recognition
   - Test all HR dashboard features
   - Verify announcements system
   - Check attendance tracking

### Other Platforms

#### Netlify
- Use Next.js plugin
- Set build command: `npm run build`
- Set publish directory: `.next`
- Add all environment variables

#### AWS Amplify
- Connect repository
- Select Next.js framework
- Add environment variables
- Configure build settings

#### Railway
- Create new project
- Connect repository
- Set Node.js environment
- Add environment variables
- Deploy

## Post-Deployment Verification

### Functional Tests
- [ ] Homepage loads correctly
- [ ] Kiosk page accessible
- [ ] Camera initializes and works
- [ ] Face recognition works
- [ ] Attendance recording works
- [ ] HR login works
- [ ] HR dashboard loads
- [ ] Employee management works
- [ ] Announcements system works
- [ ] Attendance status displays correctly
- [ ] Mood analytics display correctly

### Security Checks
- [ ] HTTPS enabled (required for camera)
- [ ] Authentication working
- [ ] Protected routes secured
- [ ] API routes protected
- [ ] No sensitive data exposed
- [ ] Security headers present

### Performance Checks
- [ ] Page load times acceptable
- [ ] Images optimized
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Proper error handling

## Troubleshooting

### Camera Not Working
- Verify HTTPS is enabled
- Check browser permissions
- Verify camera is not in use by another app
- Check browser console for errors

### Authentication Issues
- Verify Supabase credentials
- Check users table exists
- Verify RLS policies
- Check cookie settings

### Face Recognition Not Working
- Verify AWS credentials
- Check Rekognition service status
- Verify employee images uploaded
- Check API logs for errors

### Build Failures
- Check Node.js version (18+)
- Verify all dependencies installed
- Check for TypeScript errors
- Review build logs

## Monitoring

### Recommended Monitoring
- Application uptime
- API response times
- Error rates
- User authentication failures
- Face recognition success rate
- Database connection status

### Logs to Monitor
- Application logs
- API route errors
- Authentication failures
- Database query errors
- AWS Rekognition errors

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security patches
- Monitor error logs
- Backup database regularly
- Review and optimize queries
- Check AWS usage and costs

### Updates
- Test updates in staging first
- Backup before major updates
- Update environment variables as needed
- Monitor for breaking changes

## Support

For deployment issues:
1. Check deployment logs
2. Verify environment variables
3. Test locally first
4. Review error messages
5. Check documentation
6. Contact support if needed

