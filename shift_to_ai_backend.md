# Context
We are continuing the development of our SaaS platform, "Trustificate", which uses a React/Vite frontend and a Node.js/Express backend with MongoDB. Currently, there are OpenAI API calls being made directly from the frontend. 

# Objective
For security reasons, I need to completely remove all OpenAI API calls and the OpenAI SDK from the frontend React application and shift this communication entirely to the Node.js backend. The `OPENAI_API_KEY` is already configured in the backend's `.env` file.

# Step 1: Backend Implementation (Node.js/Express)
1. **Install Dependencies:** Ensure the `openai` package is installed in the backend workspace.
2. **Initialize OpenAI:** Create a service file (e.g., `services/openaiService.ts`) that initializes the OpenAI client using `process.env.OPENAI_API_KEY`.
3. **Create Controllers:** Create a new controller (e.g., `controllers/aiController.ts`) to handle the specific AI tasks our application performs (like generating template copy, analyzing text, etc.). 
4. **Create Routes:** Set up an Express route (e.g., `POST /api/ai/generate`) that routes requests to this controller. 
5. **Security:** Ensure this new route is protected by our existing JWT authentication middleware so only logged-in users can trigger AI generations. Include basic rate limiting or error handling for OpenAI API limits.

# Step 2: Frontend Refactoring (React/Vite)
1. **Remove SDK:** Remove the `openai` npm package from the frontend `package.json` and delete any direct imports of it.
2. **Update API Calls:** Refactor the frontend components that were previously calling OpenAI directly. They should now make standard HTTP POST requests (via Axios or fetch) to our new `/api/ai/...` backend endpoints.
3. **State Management:** Ensure the frontend correctly handles the loading states and potential errors returned by our backend proxy.

# Execution Constraints
* Please show me the backend implementation first (the service, controller, and route setup).
* Once the backend code looks good, provide the updated frontend component code showing how it calls the new backend API.
* Ensure all code is written in clean, strongly-typed TypeScript.