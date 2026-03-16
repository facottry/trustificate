Product Requirements Document: CLI Sitemap Manager
1. Executive Summary
Objective: Improve and maintain SEO for the trustificate.clicktory.in domain by implementing an automated Sitemap Manager.
Scope: A standalone CLI script that dynamically compiles all static marketing pages and public-facing dynamic routes (like verified certificates) into a valid XML sitemap. The script will output this XML directly into the frontend's public asset directory so it is instantly served at the root level upon deployment.

2. Functional Requirements
Database Aggregation: The script must establish a temporary, read-only connection to the MongoDB database to query dynamic slugs (e.g., active templates, issued and publicly verifiable certificates).

Static Route Merging: The script must maintain a hardcoded array of core static routes (e.g., Home, About, Pricing, Contact, Terms, Privacy, Verify) to merge with the dynamic data.

Direct File System Write: Upon compiling the XML tree, the script must write the output directly into the frontend workspace's public directory, overwriting any older version of the sitemap.

CLI Execution: The script must be fully executable via a simple terminal command so it can be triggered manually by a developer or automatically by a CI/CD pipeline.

3. Route Generation & SEO Logic
The script must assign appropriate SEO metadata (priority, change frequency) based on the route type to guide search engine crawlers effectively:

3.1 Static Routes (Marketing & Legal)
Targets: Base domain, pricing page, about page, contact page.

Metadata: Priority 0.8 to 1.0. Change frequency: weekly.

3.2 Dynamic Routes (Certificates & Registry)
Targets: Public verification pages for individual credentials.

Filter Rule: The script MUST ONLY query and include certificates where the status is strictly set to issued or public. Draft, revoked, or private certificates must never be indexed.

Metadata: Priority 0.5. Change frequency: monthly or never (since historical certificates rarely change once issued).

4. Technical Architecture (Node.js)
Environment Context: The script must utilize the existing backend environment variables to connect to the database. It should also read the frontend domain variable (trustificate.clicktory.in) so the base URL isn't hardcoded.

Memory Management: Because Trustificate may eventually host millions of certificates, the script should utilize database cursors or pagination (e.g., fetching records in batches of 1,000) rather than loading the entire database into memory at once.

XML Construction: Utilize a robust XML builder or a dedicated sitemap npm package to ensure the generated XML strictly adheres to standard sitemap protocol (xmlns="http://www.sitemaps.org/schemas/sitemap/0.9").

5. Automation & Developer Experience (DX)
Logging: The script must output clear, color-coded terminal logs detailing the execution process (e.g., "Connected to DB", "Fetched 450 certificates", "Sitemap successfully written to public directory").

Pipeline Readiness: The script must exit with a clean 0 status code on success, and a 1 on failure, ensuring it can safely be added as a prebuild step in the project's deployment configuration.