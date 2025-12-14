// utils/sendEmail.js
// REWRITTEN to use Brevo (Sendinblue) HTTP API with native 'fetch'
// This bypasses the ETIMEDOUT error by using HTTPS (Port 443) instead of SMTP (Port 587/465).

// Brevo (formerly Sendinblue) API endpoint for transactional emails (v3)
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async (options) => {
    
    // Safety check for the new API Key
    if (!process.env.BREVO_API_KEY) {
        console.error("FATAL ERROR: BREVO_API_KEY is not set.");
        throw new Error("Email provider (Brevo) not configured.");
    }
    
    // 1. Prepare data for the Brevo API
    const mailData = {
        // 'sender' is the email address that appears in the 'From' field
        sender: {
            name: "NutriPlan App", // Replace with your desired App/Sender Name
            email: process.env.EMAIL_USER // This should be a verified sender in Brevo
        },
        // 'to' is an array of recipient objects
        to: [{ 
            email: options.email 
        }],
        // Subject and body
        subject: options.subject,
        textContent: options.message // This carries the OTP message
    };

    try {
        // 2. Send the HTTP POST request
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authorization using the API Key is CRITICAL
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify(mailData)
        });

        // 3. Handle response
        const data = await response.json();
        
        if (!response.ok) {
            // Brevo API returns status codes like 400, 401, or 429 for failures
            console.error('Brevo API Error:', response.status, data);
            throw new Error(`Brevo API failed with status ${response.status}: ${data.message || 'Unknown error'}`);
        }

        console.log('Brevo Email sent successfully:', data);
        
    } catch (error) {
        // If the 'fetch' operation itself fails (e.g., DNS error, network issue)
        console.error('Email Sending Exception:', error);
        throw new Error("Failed to send email via Brevo API.");
    }
};

module.exports = sendEmail;