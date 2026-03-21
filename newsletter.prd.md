# Context
We are expanding the Admin Dashboard for our SaaS platform, "Trustificate" (Node.js/Express backend, React frontend, MongoDB database). We have already established a backend AI service and a unified HTML email templating system. We now need to build a comprehensive Newsletter/Broadcast system that allows admins to manually compose, AI-refine, and send branded updates to all subscribed users.

# Objective
Implement an end-to-end Newsletter Management feature. By default, all users are opted-in to receive updates. The admin interface must allow the composition of a newsletter, feature an "AI Polish" button to articulate the draft better, and maintain a historical log of all sent newsletters. The final email must be wrapped in our established promotional HTML template.

# Positive Goals (What You MUST Do)
1. **Database Schema:** Create a new database collection to store the newsletter history. It should track the subject line, the raw content, the sender (admin ID), the timestamp, and the total number of recipients. Ensure the primary user schema includes a default-true subscription boolean.
2. **Backend AI Integration:** Create a dedicated backend endpoint that accepts a rough text draft from the admin and uses our existing OpenAI service to return a polished, professional, and grammatically correct version of that text. The AI prompt should instruct the model to adopt a "calm, institutional, and trustworthy" tone.
3. **Admin UI Composition:** Build a React interface for admins containing a table of past newsletters. Include a "Compose" view with inputs for the Subject and Body. 
4. **AI Polish UI Flow:** Add a prominent "AI Polish" button in the Compose view. When clicked, it calls the backend AI endpoint, shows a loading state, and replaces the textarea content with the AI-refined draft for final admin review before sending.
5. **Batch Sending Logic:** Create a backend endpoint to handle the actual sending. It must fetch all users where the subscription boolean is true, inject the final text into our established promotional HTML template, and dispatch the emails asynchronously so as not to block the HTTP response.

# Negative Goals (What You MUST NOT Do)
1. **No Specific File Names:** Do not suggest, generate, or output any specific file names, folder paths, or extensions in your response. Keep all instructions and code blocks generalized to the architectural concepts (e.g., "the React component", "the Express controller").
2. **No Frontend AI Calls:** Do not import or call the OpenAI SDK directly from the React frontend. All AI logic must be securely routed through the backend.
3. **No Synchronous Batching:** Do not use a basic synchronous loop to send emails to the entire user base within the main request thread. Use an asynchronous approach (like Promise.allSettled in batches) to prevent server timeouts.
4. **No Raw HTML Input:** Do not force the admin to write raw HTML. The admin should only write the text/markdown, and the backend must inject that text securely into the pre-built, branded HTML template structure.

# Positive Test Cases (Expected Successes)
1. **AI Refinement Test:** The admin types "we fixed the pdf bug it works now". They click "AI Polish", and the text is successfully replaced with "We are pleased to announce that the recent issue affecting PDF generation has been fully resolved."
2. **History Log Test:** After a newsletter is successfully dispatched, the admin dashboard table immediately updates to show the new broadcast, its timestamp, and the recipient count.
3. **Formatting Test:** The recipient receives the email, and the AI-polished text is perfectly nested inside the Trustificate-branded white card layout with the unsubscribe footer attached.

# Negative Test Cases (Expected Failures/Fallbacks)
1. **AI Timeout Test:** If the OpenAI API is down or takes too long, the frontend gracefully stops the loading spinner and displays a toast error (e.g., "AI assistance currently unavailable. Please send your draft as-is"), without crashing the page.
2. **Empty Draft Test:** If the admin clicks "AI Polish" or "Send" while the body text area is empty, the frontend form validation prevents the action and alerts the user.

# Execution Constraints
Please provide the implementation in logical phases: Start with the database schema updates, move to the backend API controllers (handling both the AI refinement and the batch sending), and conclude with the React frontend implementation for the dashboard and compose views.