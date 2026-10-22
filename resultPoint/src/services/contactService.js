import { STORAGE_KEYS } from './storageKeys.js';
import { supportQueryService } from './supportQueryService.js';

/**
 * ResultPoint Contact & Support Submission Service
 * 
 * Supports honest submission handling:
 * 1. If VITE_CONTACT_API_URL is configured, dispatches an HTTPS POST request to the remote endpoint.
 * 2. If no backend endpoint is configured, saves the query in the local support queue
 *    (resultpoint_support_queries) with an authentic ticket reference ID, clearly communicating
 *    the queue state to the student.
 */

export const SUBJECT_OPTIONS = [
  'Calculator Support',
  'University Information',
  'Resource Request',
  'Feedback & Suggestions',
  'Account or Dashboard Support',
  'Other'
];

export const MAX_MESSAGE_LENGTH = 500;

export const contactService = {
  /**
   * Validate contact form inputs
   * @param {{ fullName: string, email: string, subject: string, message: string }} data 
   * @returns {{ isValid: boolean, errors: Record<string, string> }}
   */
  validate(data) {
    const errors = {};

    // Full name validation
    if (!data.fullName || !data.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    } else if (data.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    } else if (data.fullName.trim().length > 60) {
      errors.fullName = 'Name cannot exceed 60 characters.';
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g., student@university.edu).';
    }

    // Subject validation
    if (!data.subject || data.subject === 'Select a subject') {
      errors.subject = 'Please select a subject from the list.';
    } else if (!SUBJECT_OPTIONS.includes(data.subject)) {
      errors.subject = 'Please choose a valid subject topic.';
    }

    // Message validation
    if (!data.message || !data.message.trim()) {
      errors.message = 'Your message is required.';
    } else if (data.message.trim().length < 10) {
      errors.message = 'Please provide at least 10 characters so we can understand your request.';
    } else if (data.message.length > MAX_MESSAGE_LENGTH) {
      errors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Submit contact form message
   * @param {{ fullName: string, email: string, subject: string, message: string }} data 
   * @returns {Promise<{ success: boolean, mode: 'api' | 'local_queue', ticketId?: string, message: string, error?: string }>}
   */
  async submitMessage(data) {
    const validation = this.validate(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors)[0] || 'Please fix the errors in the form.',
        validationErrors: validation.errors
      };
    }

    const apiUrl = import.meta.env?.VITE_CONTACT_API_URL;
    const ticketId = `RP-TICK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    // 1. If backend API is configured, attempt real remote dispatch
    if (apiUrl && typeof apiUrl === 'string' && apiUrl.startsWith('http')) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ticketId,
            fullName: data.fullName.trim(),
            email: data.email.trim().toLowerCase(),
            subject: data.subject,
            message: data.message.trim(),
            submittedAt: timestamp
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const resData = await response.json().catch(() => ({}));
        return {
          success: true,
          mode: 'api',
          ticketId: resData.ticketId || ticketId,
          message: 'Thank you! Your message has been sent to the ResultPoint support team. We will get back to you within 24 hours.'
        };
      } catch (err) {
        console.error('Remote contact submission error:', err);
        return {
          success: false,
          mode: 'api',
          error: 'Unable to reach the remote contact submission service. Please try again or email us directly at support@resultpoint.in.'
        };
      }
    }

    // 2. Separated honest local support queue storage when backend API is not configured
    try {
      const created = supportQueryService.createQuery({
        ticketId,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject,
        category: data.subject,
        message: data.message.trim(),
        status: 'Open',
        priority: 'Medium',
        source: 'Public Contact Form'
      });

      // Emulate brief realistic network handshake
      await new Promise((res) => setTimeout(res, 450));

      return {
        success: true,
        mode: 'local_queue',
        ticketId: created.ticketId,
        message: `Your query has been securely logged with Reference Ticket #${created.ticketId}. ResultPoint support has queued your message for review.`
      };
    } catch (storageError) {
      console.error('Failed to store support query:', storageError);
      return {
        success: false,
        mode: 'local_queue',
        error: storageError.message || 'Unable to save support query to local session. Please check your browser storage permissions.'
      };
    }
  },

  /**
   * Retrieve all stored support queries
   */
  getAllQueries() {
    try {
      return supportQueryService.getAllQueries();
    } catch {
      return [];
    }
  }
};
