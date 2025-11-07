import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const body = await request.json();
        const { recipients, subject, body: emailBody, recipientType, selectedEmployees, selectedDepartments } = body || {};
        
        // Get current logged-in user
        const employeeId = request.cookies.get('hr_auth')?.value;
        
        if (!employeeId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // Fetch current user details
        const { data: currentUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, name, email')
            .eq('id', employeeId)
            .single();
        
        if (userError || !currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        if (!currentUser.email) {
            return NextResponse.json({ 
                error: 'Sender email not configured',
                details: 'Your employee profile does not have an email address. Please contact the administrator.'
            }, { status: 400 });
        }
        
        // Validate inputs
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }
        
        if (!subject || !emailBody) {
            return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
        }
        
        // Remove duplicates from recipients
        const uniqueRecipients = [...new Set(recipients.filter(email => email && email.trim()))];
        
        if (uniqueRecipients.length === 0) {
            return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
        }
        
        // Configure email transporter
        // Supports Gmail SMTP or generic SMTP servers via environment variables
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
        const smtpUser = process.env.SMTP_USER || currentUser.email;
        const smtpPass = process.env.SMTP_PASS;
        
        // Check if SMTP is configured
        if (!smtpPass) {
            console.error('SMTP_PASS environment variable is not set. Email sending is disabled.');
            return NextResponse.json({ 
                error: 'Email service not configured',
                details: 'SMTP_PASS environment variable is required. Please configure your email service in the environment variables.'
            }, { status: 500 });
        }
        
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            // For Gmail, you may need to allow "Less secure app access" or use an App Password
            // For other providers, adjust these settings as needed
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production' // Reject unauthorized in production
            }
        });
        
        // Verify transporter configuration
        try {
            await transporter.verify();
            // SMTP server verified and ready
        } catch (verifyError) {
            console.error('SMTP verification failed:', verifyError);
            return NextResponse.json({ 
                error: 'Email service configuration error',
                details: 'Failed to connect to SMTP server. Please check your SMTP settings.'
            }, { status: 500 });
        }
        
        // Helper function to escape HTML
        const escapeHtml = (text) => {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
        
        // Prepare email content
        // Escape HTML entities first, then convert line breaks
        const htmlBody = emailBody
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
        
        // Send email
        try {
            const mailOptions = {
                from: `"${currentUser.name}" <${smtpUser}>`,
                replyTo: currentUser.email, // Allow recipients to reply to the actual sender
                to: uniqueRecipients.join(', '),
                subject: subject,
                text: emailBody, // Plain text version
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin: 0;">${escapeHtml(subject)}</h2>
                            </div>
                            <div class="content">
                                <div style="white-space: pre-wrap;">${htmlBody}</div>
                            </div>
                            <div class="footer">
                                <p>This email was sent from MoodLens HR Dashboard by ${escapeHtml(currentUser.name)} (${escapeHtml(currentUser.email)})</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };
            
            const info = await transporter.sendMail(mailOptions);
            // Email sent successfully
        } catch (sendError) {
            console.error('Error sending email:', sendError);
            return NextResponse.json({ 
                error: 'Failed to send email',
                details: sendError.message || 'An error occurred while sending the email. Please check your SMTP configuration.'
            }, { status: 500 });
        }
        
        // Store email record in database (optional - silently fails if table doesn't exist)
        try {
            const { error: emailRecordError } = await supabaseAdmin
                .from('email_logs')
                .insert([{
                    sender_id: currentUser.id,
                    sender_name: currentUser.name,
                    sender_email: currentUser.email,
                    recipients: uniqueRecipients,
                    subject: subject,
                    recipient_type: recipientType,
                    selected_employees: selectedEmployees || [],
                    selected_departments: selectedDepartments || [],
                    sent_at: new Date().toISOString()
                }]);
            
            // Silently ignore errors (table might not exist)
            if (emailRecordError && emailRecordError.code !== 'PGRST205') {
                // Only log non-table-not-found errors for debugging
                console.error('Error logging email:', emailRecordError);
            }
        } catch (logError) {
            // Silently ignore logging errors - email sending should still succeed
            // Uncomment the line below for debugging if needed:
            // console.error('Error creating email log:', logError);
        }
        
        return NextResponse.json({
            success: true,
            message: `Email queued for ${uniqueRecipients.length} recipient${uniqueRecipients.length > 1 ? 's' : ''}`,
            recipients: uniqueRecipients.length,
            from: currentUser.email
        });
        
    } catch (e) {
        console.error('Error sending email:', e);
        return NextResponse.json({ 
            error: 'Failed to send email', 
            details: e.message 
        }, { status: 500 });
    }
}

