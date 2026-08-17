# Custom Email Invitation Function for HR System

## How It Works

This custom function handles user invitations by:
1. Creating the user in Supabase Admin API
2. Generating a password reset link via Supabase
3. Sending a custom email via Gmail SMTP using your credentials from .env

## How to Use

1. Ensure your .env file contains valid Gmail SMTP credentials:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=battambangprogrammer@gmail.com
   SMTP_PASS=zjhx aack clzc swbx (remove spaces: zjhxaackclzcswbx)
   EMAIL_FROM=UNT Website <battambangprogrammer@gmail.com>
   ```

2. Use this function to create users and send invitations:
   ```ts
   // Example usage in your API route
   const { success, message, user } = await supabaseAdmin.functions.invoke('send-invite-email', {
     email: 'user@example.com',
     display_name: 'Test User',
     role_id: 1,
     redirect_to: 'http://localhost:3000/auth/reset-password'
   });
   ```

3. The user will receive an email with a "Set Up Account" link that expires in 24 hours

## How It Works

1. The function creates the user in Supabase Admin API (without sending email)
2. It generates a password reset link using Supabase's built-in functionality
3. It sends a custom HTML email via Gmail SMTP using your credentials
4. The email includes a prominent "Set Up Account" button and the direct link

## Important Notes

- This function bypasses Supabase's built-in email system
- It requires Docker to be running for local development (if using local Supabase)
- For production, configure SMTP in the Supabase Dashboard
- The email template is customizable in the code