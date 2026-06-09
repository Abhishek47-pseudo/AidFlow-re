import User from '../models/User.js';

/**
 * Notification Service
 * Handles multi-channel notifications (SMS, Email, App)
 * Currently simulated/logging-based, ready for provider integration (Twilio/SendGrid)
 */
class NotificationService {
    constructor() {
        this.smsProvider = process.env.SMS_PROVIDER || 'mock';
        this.emailProvider = process.env.EMAIL_PROVIDER || 'mock';
    }

    /**
     * Send an urgent alert (SMS + App).
     * @param {string|Object} userId - MongoDB ObjectId (string) or pre-resolved contact object
     *   with { phone, email } fields.
     */
    async sendAlert(userId, message, context = {}) {
        console.log(`🚨 ALERT to user ${userId}: ${message}`);

        // Resolve contact details from the DB so we don’t pass an ObjectId as a phone number.
        const contact = await this.resolveContact(userId);

        await Promise.all([
            contact.phone
                ? this.sendSMS(contact.phone, message)
                : Promise.resolve(console.warn(`⚠️  No phone number for user ${userId} — SMS skipped`)),
            this.sendAppNotification(userId, 'Emergency Alert', message, context)
        ]);

        return true;
    }

    /**
     * Resolve a user’s contact details from the database.
     * Returns { phone, email } or empty strings if not found.
     */
    async resolveContact(userId) {
        try {
            const user = await User.findById(userId).select('phone email').lean();
            if (!user) {
                console.warn(`⚠️  resolveContact: No user found for id ${userId}`);
                return { phone: null, email: null };
            }
            return { phone: user.phone || null, email: user.email || null };
        } catch (err) {
            console.warn(`⚠️  resolveContact failed for ${userId}:`, err.message);
            return { phone: null, email: null };
        }
    }

    /**
     * Send an SMS
     */
    async sendSMS(phoneNumber, message) {
        // Integration point for Twilio/SNS
        console.log(`📱 [SMS] To ${phoneNumber}: ${message}`);
        // if (this.smsProvider === 'twilio') { ... }
        return { success: true, provider: 'mock' };
    }

    /**
     * Send an Email
     */
    async sendEmail(email, subject, body) {
        // Integration point for SendGrid/SES
        console.log(`📧 [EMAIL] To ${email} | Subject: ${subject}`);
        console.log(`   Body: ${body.substring(0, 50)}...`);
        return { success: true, provider: 'mock' };
    }

    /**
     * Send In-App Notification (WebSocket/Push)
     */
    async sendAppNotification(userId, title, body, data = {}) {
        console.log(`🔔 [APP] To ${userId} | ${title}: ${body}`);
        // This could emit a WebSocket event if we had the socket instance here
        return { success: true, delivered: true };
    }

    /**
     * Notify response team of a dispatch
     */
    async notifyDispatchTeam(dispatchPlan) {
        const teamMessage = `New Dispatch: Priority ${dispatchPlan.priority.toUpperCase()}. ${dispatchPlan.resourceAllocations.length} items allocated. ETA: ${dispatchPlan.estimatedResponseTime.minutes} mins.`;

        // In a real app, this would query the team's contact info
        await this.sendSMS('TEAM_LEAD', teamMessage);
        await this.sendEmail('dispatch@aidflow.org', `Dispatch Manifest - ${new Date().toISOString()}`, JSON.stringify(dispatchPlan, null, 2));
    }
}

export default new NotificationService();
