# Context
We are officially rebranding the application. The older name for this project was "Documint". The new, permanent name is "Trustificate".

# Objective
Please perform a comprehensive, project-wide refactoring to replace all instances of the old name with the new name across both the frontend and backend codebases. 

# Execution Steps
1. **Global Text Replacement:** - Replace "Documint" with "Trustificate" (Match Case)
   - Replace "documint" with "trustificate" (Match Case)
   - Replace "DOCUMINT" with "TRUSTIFICATE" (Match Case)

2. **Frontend Updates (React/Vite):**
   - Update the `<title>` tag in `index.html`.
   - Update all UI text copy: Navbar headers, landing page hero text, footer text, About Us page, Terms/Privacy pages, and dashboard headings.
   - Update any hardcoded image `alt` tags or logo references.

3. **Backend Updates (Node.js/Express/MongoDB):**
   - Update any database connection strings or database names (e.g., changing the MongoDB URI from `mongodb://.../documint` to `mongodb://.../trustificate`).
   - Update email templates (subject lines and body text) used for sending certificates or password resets.

4. **Configuration Files:**
   - Update the `name` field in both the frontend and backend `package.json` files.
   - Update `README.md` to reflect the new name.
   - Update `.env.example` files if the old name was used in any placeholder variables.

# Constraints
Please provide a summary of the files and specific areas you are updating. If there are any folder names or file names that include the word "documint", please rename those files and update their respective imports as well.