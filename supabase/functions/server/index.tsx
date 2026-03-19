import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Twilio configuration
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

// Function to send SMS via Twilio
async function sendSMS(to: string, message: string) {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured. SMS will not be sent.');
    console.log(`[SMS NOT SENT] To: ${to}, Message: ${message}`);
    return { success: false, message: 'Twilio not configured' };
  }

  // Check if the phone number is a placeholder/default value
  if (twilioPhoneNumber === '+12025551234' || twilioPhoneNumber.includes('555')) {
    console.warn('⚠️ Twilio phone number is a placeholder. Please purchase a Twilio phone number and update TWILIO_PHONE_NUMBER in Supabase.');
    console.log(`[SMS NOT SENT - PLACEHOLDER NUMBER] To: ${to}, Message: ${message}`);
    return { success: false, message: 'Twilio phone number is a placeholder. Please purchase a real Twilio number.' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      console.warn('⚠️ SMS failed. If you see error 21659, you need to purchase a Twilio phone number.');
      throw new Error(data.message || 'Failed to send SMS');
    }

    console.log(`✅ SMS sent successfully to ${to}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
    console.warn('💡 Tip: Purchase a Twilio phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/search and update TWILIO_PHONE_NUMBER in Supabase.');
    return { success: false, error: error.message };
  }
}

// Create Razorpay instance only if credentials are available
let razorpay: any = null;
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

console.log('🔑 Razorpay Key ID (first 10 chars):', razorpayKeyId?.substring(0, 10));
console.log('🔑 Razorpay Key Secret (first 10 chars):', razorpayKeySecret?.substring(0, 10));
console.log('🔑 Razorpay Key ID length:', razorpayKeyId?.length);
console.log('🔑 Razorpay Key Secret length:', razorpayKeySecret?.length);

if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.warn('Razorpay credentials not found. Payment features will be disabled.');
  console.warn(`RAZORPAY_KEY_ID present: ${!!razorpayKeyId}`);
  console.warn(`RAZORPAY_KEY_SECRET present: ${!!razorpayKeySecret}`);
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e222e178/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Debug endpoint - Check Razorpay configuration and test connection
app.get("/make-server-e222e178/debug/razorpay", async (c) => {
  try {
    const debug = {
      keyIdPresent: !!razorpayKeyId,
      keyIdPrefix: razorpayKeyId?.substring(0, 10),
      keyIdLength: razorpayKeyId?.length,
      keySecretPresent: !!razorpayKeySecret,
      keySecretLength: razorpayKeySecret?.length,
      razorpayInitialized: !!razorpay,
      isLiveMode: razorpayKeyId?.startsWith('rzp_live_'),
      timestamp: new Date().toISOString(),
    };

    // Try to fetch Razorpay orders to test credentials
    if (razorpay) {
      try {
        const orders = await razorpay.orders.all({ count: 1 });
        debug.credentialsValid = true;
        debug.testResult = 'Successfully connected to Razorpay';
      } catch (error) {
        debug.credentialsValid = false;
        debug.testError = error.error?.description || error.message || 'Unknown error';
        debug.testErrorCode = error.error?.code;
      }
    }

    return c.json(debug);
  } catch (error) {
    return c.json({ 
      error: 'Failed to check Razorpay status',
      details: error.message 
    }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-e222e178/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields: email, password, name" }, 400);
    }

    // Create user with Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error("Error creating user:", error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('already been registered')) {
        return c.json({ 
          error: "This email is already registered. Please sign in or use a different email address." 
        }, 409);
      }
      
      return c.json({ error: error.message || "Failed to create user" }, 400);
    }

    console.log(`User created successfully: ${email}`);
    return c.json({ success: true, user: { id: data.user.id, email, name } });
  } catch (error) {
    console.error("Error in signup endpoint:", error);
    return c.json({ error: `Failed to sign up: ${error.message}` }, 500);
  }
});

// Generate and send OTP for password reset
app.post("/make-server-e222e178/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      return c.json({ error: "No account found with this email address" }, 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in KV store with 10-minute expiration
    const otpKey = `otp:${email}`;
    await kv.set(otpKey, {
      otp,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Send OTP via email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('Resend API key not configured. OTP will be logged instead.');
      console.log(`OTP for ${email}: ${otp}`);
      return c.json({ 
        success: true, 
        message: "OTP generated (email service not configured)",
        dev_otp: otp // Only for development
      });
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'VASTRAM <onboarding@resend.dev>',
        to: email,
        subject: 'Password Reset OTP - VASTRAM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #b45309;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your VASTRAM account. Use the OTP below to proceed:</p>
            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; text-align: center;">
              <h1 style="color: #b45309; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              VASTRAM - Alandi road, Vishrawadi, near fish market, bus stop, Pune(411015), Maharashtra<br/>
              Phone: 9284631943 / 8669279635
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log(`Password reset OTP sent successfully to ${email}`);
    return c.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error('Error in forgot-password endpoint:', error);
    return c.json({ error: `Failed to send OTP: ${error.message}` }, 500);
  }
});

// Verify OTP
app.post("/make-server-e222e178/auth/verify-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return c.json({ error: "Email and OTP are required" }, 400);
    }

    // Get stored OTP
    const otpKey = `otp:${email}`;
    const storedData = await kv.get(otpKey);

    if (!storedData) {
      return c.json({ error: "OTP has expired or is invalid" }, 400);
    }

    // Check if OTP has expired
    const expiresAt = new Date(storedData.expiresAt);
    if (new Date() > expiresAt) {
      await kv.del(otpKey);
      return c.json({ error: "OTP has expired. Please request a new one." }, 400);
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return c.json({ error: "Invalid OTP" }, 400);
    }

    console.log(`OTP verified successfully for ${email}`);
    return c.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error('Error in verify-otp endpoint:', error);
    return c.json({ error: `Failed to verify OTP: ${error.message}` }, 500);
  }
});

// Reset password
app.post("/make-server-e222e178/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return c.json({ error: "Email, OTP, and new password are required" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    // Verify OTP again
    const otpKey = `otp:${email}`;
    const storedData = await kv.get(otpKey);

    if (!storedData) {
      return c.json({ error: "OTP has expired or is invalid" }, 400);
    }

    // Check if OTP has expired
    const expiresAt = new Date(storedData.expiresAt);
    if (new Date() > expiresAt) {
      await kv.del(otpKey);
      return c.json({ error: "OTP has expired. Please request a new one." }, 400);
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return c.json({ error: "Invalid OTP" }, 400);
    }

    // Get user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update password using Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return c.json({ error: updateError.message || "Failed to reset password" }, 400);
    }

    // Delete OTP after successful password reset
    await kv.del(otpKey);

    console.log(`Password reset successfully for ${email}`);
    return c.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error('Error in reset-password endpoint:', error);
    return c.json({ error: `Failed to reset password: ${error.message}` }, 500);
  }
});

// Get user orders (by email from customer info)
app.get("/make-server-e222e178/user/orders", async (c) => {
  try {
    console.log('Fetching user orders...');
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });

    const fetchOrders = async () => {
      try {
        const ordersList = await kv.get("orders:list") || [];
        console.log(`Found ${ordersList.length} orders in list`);
        
        if (!Array.isArray(ordersList)) {
          console.warn('orders:list is not an array, returning empty array');
          return [];
        }
        
        const orders = [];
        
        // Fetch orders in parallel for better performance
        const orderPromises = ordersList.map(orderId => 
          kv.get(`order:${orderId}`).catch(err => {
            console.error(`Error fetching order ${orderId}:`, err.message);
            return null;
          })
        );
        
        const fetchedOrders = await Promise.all(orderPromises);
        
        for (const order of fetchedOrders) {
          if (order) {
            orders.push(order);
          }
        }
        
        console.log(`Successfully fetched ${orders.length} orders`);
        return orders;
      } catch (error) {
        console.error('Error in fetchOrders:', error.message);
        throw error;
      }
    };

    const orders = await Promise.race([fetchOrders(), timeoutPromise]);
    return c.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    
    // Return empty orders array instead of failing completely
    if (error.message && error.message.includes('timeout')) {
      return c.json({ 
        success: true, 
        orders: [], 
        warning: 'Database timeout - please refresh to try again' 
      });
    }
    
    return c.json({ 
      success: true, 
      orders: [], 
      error: `Failed to fetch orders: ${error.message}` 
    });
  }
});

// Get Razorpay configuration (only returns public key_id, not secret)
app.get("/make-server-e222e178/payment/config", (c) => {
  if (!razorpay || !razorpayKeyId) {
    return c.json({ 
      success: false,
      configured: false,
      message: "Payment gateway coming soon. Razorpay will be activated once credentials are configured."
    });
  }

  return c.json({ 
    success: true, 
    configured: true,
    keyId: razorpayKeyId 
  });
});

// Contact form endpoint
app.post("/make-server-e222e178/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !phone || !subject || !message) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      // If Resend is not configured, just log the message
      console.log(`Contact form submission:\nFrom: ${name} (${email}, ${phone})\nSubject: ${subject}\nMessage: ${message}`);
      return c.json({ 
        success: true, 
        message: "Message received (email service not configured)"
      });
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Contact Form <onboarding@resend.dev>', // Resend's test sender
        to: 'vastram.pune2026@gmail.com',
        reply_to: email,
        subject: `Contact Form: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log(`Contact form email sent successfully to vastram.pune2026@gmail.com`);

    // Send SMS notification to owner
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const ownerPhone = '+917387618655'; // Owner's phone number
        const smsBody = `New Contact Form Message!\n\nFrom: ${name}\nPhone: ${phone}\nSubject: ${subject}\n\nMessage: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;

        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuthToken}`),
            },
            body: new URLSearchParams({
              To: ownerPhone,
              From: twilioPhoneNumber,
              Body: smsBody,
            }),
          }
        );

        if (smsResponse.ok) {
          console.log(`Contact form SMS notification sent to owner: ${ownerPhone}`);
        } else {
          const smsError = await smsResponse.json();
          console.error('Twilio SMS error for contact form:', smsError);
        }
      } catch (smsError) {
        console.error('Error sending contact form SMS:', smsError);
        // Don't fail the whole request if SMS fails
      }
    }

    return c.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return c.json({ error: `Failed to send message: ${error.message}` }, 500);
  }
});

// Create Razorpay order
app.post("/make-server-e222e178/payment/create-order", async (c) => {
  if (!razorpay) {
    return c.json({ error: "Razorpay is not initialized. Payment features are disabled." }, 500);
  }

  try {
    const body = await c.req.json();
    const { amount, currency = "INR", receipt } = body;

    if (!amount || !receipt) {
      return c.json({ error: "Missing required fields: amount, receipt" }, 400);
    }

    console.log(`Creating Razorpay order - Amount: ₹${amount}, Receipt: ${receipt}`);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (smallest currency unit)
      currency,
      receipt,
      notes: {
        order_id: receipt,
      },
    });

    console.log(`✅ Razorpay order created successfully: ${razorpayOrder.id}`);
    return c.json({ 
      success: true, 
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Handle different error formats
    let errorMessage = 'Failed to create payment order';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    } else if (error.description) {
      errorMessage = error.description;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    return c.json({ error: `Failed to create payment order: ${errorMessage}` }, 500);
  }
});

// Verify Razorpay payment
app.post("/make-server-e222e178/payment/verify", async (c) => {
  if (!razorpay) {
    return c.json({ error: "Razorpay is not initialized. Payment features are disabled." }, 500);
  }

  try {
    const body = await c.req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, orderData } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return c.json({ error: "Missing payment verification details" }, 400);
    }

    // Verify signature
    const crypto = await import("node:crypto");
    const hmac = crypto.createHmac("sha256", Deno.env.get('RAZORPAY_KEY_SECRET') ?? '');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("Payment signature verification failed");
      return c.json({ error: "Payment verification failed", success: false }, 400);
    }

    // Payment verified successfully - Now create the order in database
    if (!orderData || !orderData.items || !orderData.customerInfo || !orderData.total) {
      return c.json({ error: "Missing order data for creating order", success: false }, 400);
    }

    // Create order object
    const order = {
      orderId,
      items: orderData.items,
      customerInfo: orderData.customerInfo,
      total: orderData.total,
      status: "processing",
      paymentId: razorpay_payment_id,
      paymentStatus: "paid",
      trackingNumber: null,
      trackingUrl: null,
      trackingEvents: [
        {
          status: "Order Placed",
          location: "Pune, Maharashtra",
          timestamp: new Date().toISOString(),
          description: "Your order has been successfully placed and payment confirmed."
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store order in KV store
    await kv.set(`order:${orderId}`, order);
    
    // Add to orders list for easy retrieval
    const ordersList = await kv.get("orders:list") || [];
    ordersList.push(orderId);
    await kv.set("orders:list", ordersList);

    console.log(`✅ Payment verified and order created: ${orderId} - Status: PROCESSING (payment confirmed)`);

    // Send SMS notifications after successful payment
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    const customerPhone = order.customerInfo.phone;
    const orderTotal = order.total;

      // Format phone number to include +91 if not already present
      const formattedCustomerPhone = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
      const ownerPhone = '+917387618655';

      // Send SMS to customer
      const customerMessage = `Dear ${order.customerInfo.firstName}, your order ${orderId} has been placed successfully! Thank you for shopping with VASTRAM. Track your order at vastram.com`;
      await sendSMS(formattedCustomerPhone, customerMessage);

      // Send SMS to owner
      const ownerMessage = `New order received! Customer: ${customerName} (${customerPhone}) has placed an order of ₹${orderTotal}. Order ID: ${orderId}`;
      await sendSMS(ownerPhone, ownerMessage);

    // Send email notifications after successful payment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const { items, customerInfo, total } = order;
          
          // Generate items list HTML for email
          const itemsListHTML = items.map((item: any) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('');

          // Send email to customer (sent to owner due to Resend limitations)
          const customerEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'VASTRAM <onboarding@resend.dev>',
              to: 'vastram.pune2026@gmail.com',
              subject: `💰 Payment Received - ${orderId} - ₹${total.toFixed(2)} PAID`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background: linear-gradient(to right, #16a34a, #22c55e); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">💰 PAYMENT RECEIVED</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">VASTRAM Admin</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #dcfce7; border: 3px solid #16a34a;">
                    <h2 style="color: #166534; margin-top: 0;">Payment Successful! 🎉</h2>
                    
                    <div style="background-color: #ffffff; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
                      <p style="margin: 5px 0 0 0; color: #166534; font-size: 20px; font-weight: bold; font-family: monospace;">${orderId}</p>
                    </div>

                    <div style="background-color: #ffffff; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Payment ID</p>
                      <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 16px; font-weight: bold; font-family: monospace;">${razorpay_payment_id}</p>
                    </div>

                    <div style="background-color: #dcfce7; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0; color: #166534; font-size: 14px;">Amount Received</p>
                      <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 32px; font-weight: bold;">₹${total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div style="padding: 30px;">
                    <h3 style="color: #166534; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Customer Information</h3>
                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>👤 Name:</strong> ${customerInfo.firstName} ${customerInfo.lastName}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📧 Email:</strong> ${customerInfo.email}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📱 Phone:</strong> ${customerInfo.phone}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📍 Address:</strong> ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}</p>
                    </div>

                    <h3 style="color: #166534; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-top: 30px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <thead>
                        <tr style="background-color: #d1fae5;">
                          <th style="padding: 10px; text-align: left; color: #166534;">Product</th>
                          <th style="padding: 10px; text-align: center; color: #166534;">Qty</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Price</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">Grand Total:</td>
                          <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">₹${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e;"><strong>⚡ Action Required</strong></p>
                      <p style="margin: 5px 0 0 0; color: #92400e;">Payment confirmed! Process this order and update tracking info.</p>
                    </div>
                  </div>

                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 3px solid #16a34a;">
                    <p style="color: #16a34a; font-weight: bold; margin: 0 0 10px 0;">VASTRAM Admin System</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Automated payment notification</p>
                  </div>
                </div>
              `,
            }),
          });

          const customerEmailData = await customerEmailResponse.json();
          if (!customerEmailResponse.ok) {
            console.error('Failed to send customer payment confirmation email:', customerEmailData);
          } else {
            console.log(`✅ Payment confirmation email sent for customer: ${customerInfo.email}`);
          }

          // Send email to admin
          const adminEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'VASTRAM <onboarding@resend.dev>',
              to: 'sk.39648215@gmail.com',
              subject: `💰 Payment Received - ${orderId} - ₹${total.toFixed(2)} PAID`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background: linear-gradient(to right, #16a34a, #22c55e); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">💰 PAYMENT RECEIVED</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">VASTRAM Admin</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #dcfce7; border: 3px solid #16a34a;">
                    <h2 style="color: #166534; margin-top: 0;">Payment Successful! 🎉</h2>
                    
                    <div style="background-color: #ffffff; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
                      <p style="margin: 5px 0 0 0; color: #166534; font-size: 20px; font-weight: bold; font-family: monospace;">${orderId}</p>
                    </div>

                    <div style="background-color: #ffffff; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Payment ID</p>
                      <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 16px; font-weight: bold; font-family: monospace;">${razorpay_payment_id}</p>
                    </div>

                    <div style="background-color: #dcfce7; border: 2px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0; color: #166534; font-size: 14px;">Amount Received</p>
                      <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 32px; font-weight: bold;">₹${total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div style="padding: 30px;">
                    <h3 style="color: #166534; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Customer Information</h3>
                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>👤 Name:</strong> ${customerInfo.firstName} ${customerInfo.lastName}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📧 Email:</strong> ${customerInfo.email}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📱 Phone:</strong> ${customerInfo.phone}</p>
                      <p style="margin: 5px 0; color: #1e3a8a;"><strong>📍 Address:</strong> ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}</p>
                    </div>

                    <h3 style="color: #166534; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-top: 30px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <thead>
                        <tr style="background-color: #d1fae5;">
                          <th style="padding: 10px; text-align: left; color: #166534;">Product</th>
                          <th style="padding: 10px; text-align: center; color: #166534;">Qty</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Price</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">Grand Total:</td>
                          <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">₹${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e;"><strong>⚡ Action Required</strong></p>
                      <p style="margin: 5px 0 0 0; color: #92400e;">Payment confirmed! Process this order and update tracking info.</p>
                    </div>
                  </div>

                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 3px solid #16a34a;">
                    <p style="color: #16a34a; font-weight: bold; margin: 0 0 10px 0;">VASTRAM Admin System</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Automated payment notification</p>
                  </div>
                </div>
              `,
            }),
          });

          const adminEmailData = await adminEmailResponse.json();
          if (!adminEmailResponse.ok) {
            console.error('Failed to send admin payment notification:', adminEmailData);
          } else {
            console.log(`✅ Payment notification sent to admin`);
          }

      } catch (emailError) {
        console.error('Error sending payment confirmation emails:', emailError);
      }
    }

    console.log(`Payment verified successfully for order: ${orderId}`);
    return c.json({ success: true, verified: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return c.json({ error: `Failed to verify payment: ${error.message}` }, 500);
  }
});

// Create order without payment (used when Razorpay is not configured)
app.post("/make-server-e222e178/orders/create-without-payment", async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, items, customerInfo, total } = body;

    if (!orderId || !items || !customerInfo || !total) {
      return c.json({ error: "Missing required fields: orderId, items, customerInfo, total" }, 400);
    }
    
    // Create order object
    const order = {
      orderId,
      items,
      customerInfo,
      total,
      status: "processing",
      paymentStatus: "pending",
      trackingNumber: null,
      trackingUrl: null,
      trackingEvents: [
        {
          status: "Order Placed",
          location: "Pune, Maharashtra",
          timestamp: new Date().toISOString(),
          description: "Your order has been successfully placed and is being prepared."
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store order in KV store
    await kv.set(`order:${orderId}`, order);
    
    // Add to orders list for easy retrieval
    const ordersList = await kv.get("orders:list") || [];
    ordersList.push(orderId);
    await kv.set("orders:list", ordersList);

    console.log(`Order created successfully: ${orderId} - Status: PROCESSING (no payment gateway configured)`);
    
    // Send SMS notifications
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    const customerPhone = order.customerInfo.phone;
    const orderTotal = order.total;

    // Format phone number to include +91 if not already present
    const formattedCustomerPhone = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
    const ownerPhone = '+917387618655';

    // Send SMS to customer
    const customerMessage = `Dear ${order.customerInfo.firstName}, your order ${orderId} has been placed successfully! Thank you for shopping with VASTRAM. Track your order at vastram.com`;
    await sendSMS(formattedCustomerPhone, customerMessage);

    // Send SMS to owner
    const ownerMessage = `New order received! Customer: ${customerName} (${customerPhone}) has placed an order of ₹${orderTotal}. Order ID: ${orderId}`;
    await sendSMS(ownerPhone, ownerMessage);

    return c.json({ success: true, orderId, order });
  } catch (error) {
    console.error("Error creating order:", error);
    return c.json({ error: `Failed to create order: ${error.message}` }, 500);
  }
});

// Send SMS notification for order (can be called separately after order creation)
app.post("/make-server-e222e178/orders/:orderId/send-sms", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    const customerPhone = order.customerInfo.phone;
    const orderTotal = order.total;

    // Format phone number to include +91 if not already present
    const formattedCustomerPhone = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
    const ownerPhone = '+917387618655';

    // Send SMS to customer
    const customerMessage = `Dear ${order.customerInfo.firstName}, your order ${orderId} has been placed successfully! Thank you for shopping with VASTRAM. Track your order at vastram.com`;
    const customerResult = await sendSMS(formattedCustomerPhone, customerMessage);

    // Send SMS to owner
    const ownerMessage = `New order received! Customer: ${customerName} (${customerPhone}) has placed an order of ₹${orderTotal}. Order ID: ${orderId}`;
    const ownerResult = await sendSMS(ownerPhone, ownerMessage);

    console.log(`SMS notifications sent for order: ${orderId}`);
    return c.json({ 
      success: true, 
      customerSMS: customerResult,
      ownerSMS: ownerResult
    });
  } catch (error) {
    console.error("Error sending SMS notifications:", error);
    return c.json({ error: `Failed to send SMS: ${error.message}` }, 500);
  }
});

// Get order by ID
app.get("/make-server-e222e178/orders/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return c.json({ error: `Failed to fetch order: ${error.message}` }, 500);
  }
});

// Get all orders
app.get("/make-server-e222e178/orders", async (c) => {
  try {
    const ordersList = await kv.get("orders:list") || [];
    const orders = [];

    for (const orderId of ordersList) {
      const order = await kv.get(`order:${orderId}`);
      if (order) {
        orders.push(order);
      }
    }

    return c.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: `Failed to fetch orders: ${error.message}` }, 500);
  }
});

// Update order status and tracking
app.put("/make-server-e222e178/orders/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const body = await c.req.json();
    const { status, trackingNumber, trackingUrl } = body;

    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Check if status is changing to "delivered"
    const wasNotDelivered = order.status !== 'delivered';
    const isNowDelivered = status === 'delivered';

    // Update order
    const updatedOrder = {
      ...order,
      status: status || order.status,
      trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
      trackingUrl: trackingUrl !== undefined ? trackingUrl : order.trackingUrl,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, updatedOrder);

    // Send delivery email if status changed to "delivered"
    if (wasNotDelivered && isNowDelivered) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (resendApiKey) {
        try {
          // Generate items list HTML for email
          const itemsListHTML = order.items.map((item: any) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('');

          // Send delivery email to customer
          const deliveryEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'VASTRAM <onboarding@resend.dev>',
              to: order.customerInfo.email,
              subject: `🎉 Your Order Has Been Delivered! - VASTRAM`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background: linear-gradient(to right, #16a34a, #22c55e); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 DELIVERED!</h1>
                    <p style="color: #dcfce7; margin: 10px 0 0 0;">Your VASTRAM Order Has Arrived</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #dcfce7; border: 3px solid #16a34a;">
                    <h2 style="color: #166534; margin-top: 0;">Order Successfully Delivered! 🎊</h2>
                    <p style="font-size: 16px; color: #374151;">Dear ${order.customerInfo.firstName} ${order.customerInfo.lastName},</p>
                    <p style="font-size: 16px; color: #374151;">
                      Great news! Your order has been successfully delivered. We hope you love your purchase!
                    </p>
                  </div>

                  <div style="padding: 30px;">
                    <h3 style="color: #16a34a; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <thead>
                        <tr style="background-color: #dcfce7;">
                          <th style="padding: 10px; text-align: left; color: #166534;">Product</th>
                          <th style="padding: 10px; text-align: center; color: #166534;">Qty</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Price</th>
                          <th style="padding: 10px; text-align: right; color: #166534;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">Total Paid:</td>
                          <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">₹${order.total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e;"><strong>💖 Thank You for Shopping with VASTRAM!</strong></p>
                      <p style="margin: 5px 0 0 0; color: #92400e;">We appreciate your business and hope to serve you again soon. If you have any questions or concerns about your order, please don't hesitate to contact us.</p>
                    </div>

                    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #1e3a8a;"><strong>⭐ Love Your Purchase?</strong></p>
                      <p style="margin: 5px 0 0 0; color: #1e3a8a;">Share your experience with us! Your feedback helps us improve and serve you better.</p>
                    </div>
                  </div>

                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 3px solid #16a34a;">
                    <p style="color: #16a34a; font-weight: bold; margin: 0 0 10px 0;">Thank you for choosing VASTRAM!</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">Alandi road, Vishrawadi, near fish market, bus stop<br/>Pune (411015), Maharashtra</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">📞 9284631943 / 8669279635</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">✉️ sk.39648215@gmail.com</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0;">Business Hours: 9 AM - 10 PM Daily</p>
                  </div>
                </div>
              `,
            }),
          });

          const deliveryEmailData = await deliveryEmailResponse.json();
          if (!deliveryEmailResponse.ok) {
            console.error('Failed to send delivery email:', deliveryEmailData);
          } else {
            console.log(`✅ Delivery confirmation email sent to customer: ${order.customerInfo.email}`);
          }
        } catch (emailError) {
          console.error('Error sending delivery email:', emailError);
          // Don't fail the order update if email fails
        }
      }
    }

    console.log(`Order updated successfully: ${orderId}`);
    return c.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return c.json({ error: `Failed to update order: ${error.message}` }, 500);
  }
});

// Delete all orders (MUST come BEFORE /orders/:orderId to avoid route collision)
app.delete("/make-server-e222e178/orders/delete-all", async (c) => {
  try {
    const ordersList = await kv.get("orders:list") || [];
    let deletedCount = 0;

    // Delete each order from KV store
    for (const orderId of ordersList) {
      try {
        await kv.del(`order:${orderId}`);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete order ${orderId}:`, error);
      }
    }

    // Clear the orders list
    await kv.set("orders:list", []);

    console.log(`Successfully deleted ${deletedCount} orders`);
    return c.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} orders`,
      count: deletedCount 
    });
  } catch (error) {
    console.error("Error deleting all orders:", error);
    return c.json({ error: `Failed to delete all orders: ${error.message}` }, 500);
  }
});

// Delete order (single order delete - MUST come AFTER /orders/delete-all)
app.delete("/make-server-e222e178/orders/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    
    // Check if order exists
    const order = await kv.get(`order:${orderId}`);
    
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Delete order from KV store
    await kv.del(`order:${orderId}`);
    
    // Remove from orders list
    const ordersList = await kv.get("orders:list") || [];
    const updatedOrdersList = ordersList.filter((id: string) => id !== orderId);
    await kv.set("orders:list", updatedOrdersList);

    console.log(`Order deleted successfully: ${orderId}`);
    return c.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return c.json({ error: `Failed to delete order: ${error.message}` }, 500);
  }
});

// Mark order as successful
app.put("/make-server-e222e178/orders/:orderId/mark-successful", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const body = await c.req.json();
    const { orderSuccessful } = body;

    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Update order successful status
    const updatedOrder = {
      ...order,
      orderSuccessful: orderSuccessful,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, updatedOrder);

    console.log(`Order ${orderId} marked as ${orderSuccessful ? 'successful' : 'not successful'}`);
    return c.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error marking order as successful:", error);
    return c.json({ error: `Failed to update order: ${error.message}` }, 500);
  }
});

// Add tracking event to order
app.post("/make-server-e222e178/orders/:orderId/tracking", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const body = await c.req.json();
    const { status, location, description } = body;

    if (!status || !location || !description) {
      return c.json({ error: "Missing required fields: status, location, description" }, 400);
    }

    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Add new tracking event
    const newEvent = {
      status,
      location,
      timestamp: new Date().toISOString(),
      description,
    };

    const updatedOrder = {
      ...order,
      trackingEvents: [newEvent, ...(order.trackingEvents || [])],
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, updatedOrder);

    console.log(`Tracking event added successfully to order: ${orderId}`);
    return c.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error adding tracking event:", error);
    return c.json({ error: `Failed to add tracking event: ${error.message}` }, 500);
  }
});

// Export orders to CSV (Excel-compatible format)
app.get("/make-server-e222e178/orders/export/csv", async (c) => {
  try {
    const ordersList = await kv.get("orders:list") || [];
    const orders = [];

    for (const orderId of ordersList) {
      const order = await kv.get(`order:${orderId}`);
      if (order) {
        orders.push(order);
      }
    }

    // Create CSV content
    let csv = "Order ID,Customer Name,Email,Phone,Address,City,State,ZIP,Items,Total,Status,Tracking Number,Tracking URL,Created At\n";
    
    orders.forEach((order) => {
      const itemsList = order.items.map((item: any) => 
        `${item.name} (${item.size || 'N/A'}) x${item.quantity}`
      ).join("; ");
      
      const row = [
        order.orderId,
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
        order.customerInfo.email,
        order.customerInfo.phone,
        order.customerInfo.address,
        order.customerInfo.city,
        order.customerInfo.state,
        order.customerInfo.zipCode,
        `"${itemsList}"`,
        order.total,
        order.status,
        order.trackingNumber || 'N/A',
        order.trackingUrl || 'N/A',
        order.createdAt,
      ].join(",");
      
      csv += row + "\n";
    });

    // Return CSV file
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return c.json({ error: `Failed to export orders: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);