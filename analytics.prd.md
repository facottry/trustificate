# Context
We are implementing a comprehensive analytics tracking infrastructure for our SaaS platform, "Trustificate" (React/Vite frontend, Node.js/Express backend). We are using Google Tag Manager (GTM/GA4) primarily for top-of-funnel traffic and marketing attribution, and Mixpanel for deep, event-driven product analytics. 

# Objective
Implement a phased analytics architecture using an abstraction utility. 
* **Phase 1 (Current Focus - 50% Coverage):** Instrument the core "happy path" locations (Landing Page, Auth, Dashboard, Issuance Wizard, Verification Portal) with essential high-level metrics (Signups, Template Created, Certificate Issued, Certificate Verified).
* **Phase 2 (Future Prep - 100% Coverage):** Architect the utility so it can easily be expanded later to track micro-interactions across all edge cases (e.g., settings toggles, individual template editor clicks, form validation errors, API timeouts).

# Positive Goals (What You MUST Do)
1. **Abstraction Layer:** Create a centralized analytics utility wrapper in the frontend. Components should call a generic `trackEvent(eventName, properties)` function, and the utility will determine whether to route that payload to Gtag, Mixpanel, or both.
2. **Identity Management:** Implement logic to securely tie user sessions together. When a user logs in or registers, call Mixpanel's `identify` and set the GA4 `user_id` using our database's anonymous UUID, ensuring pre-login marketing touchpoints connect to post-login product usage.
3. **Phase 1 Implementation:** Inject tracking calls into the primary application flows. Track standard page views automatically via React Router integrations, and manually track the core conversion events (e.g., submitting the multi-step certificate generator).
4. **Phase 2 Extensibility:** Structure the tracking utility using TypeScript enums or strict typing for event names to ensure the codebase remains clean when we scale to hundreds of granular events in Phase 2.

# Negative Goals (What You MUST NOT Do)
1. **No Specific File Names:** Do not suggest, generate, or output any specific file names, folder paths, or extensions in your response. Keep all instructions and code blocks generalized to the architectural concepts.
2. **No PII Transmission:** Do not send Personally Identifiable Information (PII) such as raw email addresses, plaintext names, or document contents to GA4 or Mixpanel. Pass only database UUIDs and aggregate property counts.
3. **No Synchronous Blocking:** Do not block the main UI thread or backend HTTP responses waiting for analytics networks to resolve. All tracking pushes must be asynchronous ("fire and forget").
4. **No Hardcoded API Keys:** Do not hardcode GTM container IDs or Mixpanel project tokens in the source code; they must be ingested via environment variables.

# Positive Test Cases (Expected Successes)
1. **Core Funnel Test (Phase 1):** A user completes the 4-step issuance wizard. A "Certificate Issued" event successfully fires to Mixpanel, containing properties for `templateType` and `recipientCount`, but excluding the recipient's actual email address.
2. **Identity Merging Test:** An anonymous visitor views the pricing page (tracked as anonymous), clicks sign up, registers, and the tracking utility successfully merges their anonymous session cookie with their newly minted database UUID.
3. **Architecture Scaling Test (Phase 2 Prep):** A developer adds a new granular event for "Dark Mode Toggled" to the TypeScript tracking enum, and the IDE correctly auto-completes the event name without requiring changes to the core tracking logic.

# Negative Test Cases (Expected Failures/Fallbacks)
1. **Adblocker Test:** If a user has an aggressive browser extension blocking GTM or Mixpanel network requests, the frontend tracking utility cleanly catches the network failure silently without throwing console errors or crashing the React application.
2. **Missing Token Test:** If the environment variables for the analytics providers are missing during local development, the tracking utility safely bypasses the network calls and instead outputs the planned payload to the local `console.log` for debugging.

# Execution Constraints
Please provide the implementation in logical steps: First, the centralized tracking utility (the abstraction layer and identity management). Second, examples of injecting Phase 1 core events into a React component. Third, the TypeScript structure preparing us for Phase 2 granular events.



# Context
We are architecting the analytics infrastructure for the React/Vite frontend of our SaaS platform, "Trustificate". To ensure maximum codebase scalability and separation of concerns, the entire Analytics system (handling GA4 and Mixpanel) must be built as an isolated "Addon Service" housed in its own dedicated directory.

# Objective
Implement a decoupled, Event-Driven Architecture (Pub/Sub mechanism) for frontend tracking. The core React application must NEVER import or interact with analytics SDKs directly. Instead, the core application will broadcast strictly-typed events to a centralized Event Bus. The isolated Analytics Service will listen to this bus and route the payloads to the appropriate third-party networks (GA4, Mixpanel).

# Positive Goals (What You MUST Do)
1. **The Event Bus:** Create a lightweight, centralized Event Bus (Pub/Sub or Event Emitter pattern) that allows components to publish events and services to subscribe to them.
2. **The Analytics Service:** Create an isolated service module that initializes on application boot. This module will subscribe to the Event Bus, listen for specific event types, and execute the actual API calls to Mixpanel and GA4.
3. **Strict Typing:** Define a TypeScript registry (enums/interfaces) for all allowed events and their expected payload structures (e.g., `CERTIFICATE_ISSUED` must include a `templateType` string). Both the publisher and subscriber must share these types.
4. **App Integration:** Update a core React component (like the Issuance Wizard form submission) to import ONLY the Event Bus and publish an event, completely ignorant of who is listening.

# Negative Goals (What You MUST NOT Do)
1. **No Specific File Names:** Do not suggest, generate, or output any specific file names, folder paths, or file extensions in your response. Keep all instructions and code blocks generalized to the architectural components.
2. **No Direct Analytics Imports:** Do not import `mixpanel-browser`, `react-ga4`, or the Analytics Service itself into any UI components or application business logic.
3. **No Synchronous Coupling:** Ensure the Event Bus publishes asynchronously so that a slow execution in the Analytics listener does not block the React render cycle or UI thread.
4. **No Unhandled Network Errors:** If an ad-blocker blocks the Mixpanel request inside the isolated service, it must fail silently or log to a secure error tracker without bubbling up and crashing the Event Bus or the UI.

# Positive Test Cases (Expected Successes)
1. **Decoupling Test:** A developer needs to swap Mixpanel for PostHog. They make the change entirely within the isolated Analytics Service directory without altering a single line of React component code.
2. **Broadcast Test:** A user clicks "Generate". The React component successfully broadcasts the `CERTIFICATE_ISSUED` event. The Analytics Service detects the broadcast, extracts the payload, and successfully pushes to GA4.
3. **Type Safety Test:** If a developer attempts to broadcast a `USER_SIGNED_UP` event but forgets to include the required `userId` in the payload, TypeScript throws a compilation error.

# Negative Test Cases (Expected Failures/Fallbacks)
1. **Service Failure Test:** If the Analytics Service fails to initialize (e.g., missing API keys), the core application still functions perfectly because the React components are merely broadcasting events into the Event Bus, unconcerned if there are zero active listeners.
2. **Ghost Event Test:** If a component broadcasts an event that the Analytics Service has not been programmed to listen for yet, the system safely ignores it without throwing runtime errors.

# Execution Constraints
Please provide the implementation in three distinct phases:
1. The Centralized Event Bus utility and the TypeScript Event Registry.
2. The isolated Analytics Service (showing the setup of the listeners).
3. An example React component demonstrating how to publish an event to the bus.



# Context
We are refining the analytics architecture for our SaaS platform, "Trustificate" (React/Vite). We are adopting a strict Data Layer architecture. The React application will NOT import GA4 or Mixpanel SDKs. Instead, the application will push strictly-typed events to the `window.dataLayer`. Google Tag Manager (GTM) will act as the sole listener and dispatcher, forwarding these events to GA4 and Mixpanel via its own cloud configurations.

# Objective
Implement a centralized, strongly-typed Analytics Utility that safely pushes event payloads and user identity data to the GTM `dataLayer`. 

# Positive Goals (What You MUST Do)
1. **DataLayer Initialization:** Ensure the utility safely checks for or initializes the `window.dataLayer` array so that events can be queued even if the external GTM script loads asynchronously or late.
2. **Type Safety:** Define a strict TypeScript interface for the `dataLayer` payload. Every tracking push must include an `event` string (the trigger name) and an optional `properties` object.
3. **Identity Management Method:** Create a dedicated function (e.g., `identifyUser(userId, traits)`) that pushes the user's database UUID into the `dataLayer`. This is critical so GTM can forward this ID to Mixpanel's identity resolution endpoints.
4. **App Integration:** Update a core React component to use this utility, demonstrating how to push a business event (like completing a step in the wizard) to the `dataLayer`.

# Negative Goals (What You MUST NOT Do)
1. **No Specific File Names:** Do not suggest, generate, or output any specific file names, folder paths, or file extensions. Keep instructions generalized to the module's purpose.
2. **No Direct SDK Imports:** Do not import or install `mixpanel-browser`, `react-ga4`, or any third-party tracking libraries into the React codebase. 
3. **No PII in the Data Layer:** Do not push plaintext email addresses or sensitive document contents into the `dataLayer`. Use database UUIDs and aggregate counts only.
4. **No Server-Side Crashing:** If this utility is ever executed in a Server-Side Rendering (SSR) context where `window` is undefined, it must fail silently rather than throwing a reference error.

# Positive Test Cases (Expected Successes)
1. **Queueing Test:** The React app calls the tracking utility immediately on boot before the GTM network script finishes downloading. The utility successfully pushes the event into the `window.dataLayer` array, queuing it for GTM to process once ready.
2. **Identity Test:** A user logs in. The utility successfully pushes `{ event: 'user_login', userId: '123-uuid' }` to the `dataLayer`, providing GTM the exact payload it needs to trigger Mixpanel's identity merge.
3. **Type Enforcement Test:** A developer tries to push `{ action: 'click' }` instead of `{ event: 'click' }` to the utility. TypeScript flags this as an error, enforcing the GTM standard payload structure.

# Negative Test Cases (Expected Failures/Fallbacks)
1. **Window Undefined Test:** The utility is accidentally triggered in a non-browser environment. It detects the missing `window` object and safely aborts the push without crashing the application thread.
2. **Adblocker Test:** If an adblocker prevents the GTM script from loading, the React app continues to push events to the local `dataLayer` array in browser memory without experiencing any performance degradation or throwing console errors.

# Execution Constraints
Please provide the implementation in two phases:
1. The TypeScript definitions and the core `dataLayer` utility functions (tracking events and setting identity).
2. A brief example of a React component importing and firing the utility on a button click.