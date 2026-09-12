# Feature Specification: Customer Area — Plate Consultation & User Dashboard

**Feature Branch**: `025-customer-area-plate-dashboard`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Área do Cliente — Consulta de Placa e Painel do Usuário. Self-service plate consultation flow with customer registration, login, simulated payment, consultation history, and profile management."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Customer Registration & Login (Priority: P1)

A visitor interested in consulting a vehicle's history accesses the customer area and creates an account using their email and password or through Google sign-in. After registering, they are automatically logged in and can start using the platform immediately. Returning customers can log in with their existing credentials.

**Why this priority**: Without authentication, no other customer-facing feature can function. This is the foundational gate for all self-service flows.

**Independent Test**: Can be fully tested by visiting the registration page, completing the form, verifying login, and confirming the user can access the protected dashboard area.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they fill in all required fields (full name, email, phone, date of birth, password) and submit, **Then** the system creates their account and redirects them to the customer dashboard as a logged-in user.
2. **Given** a visitor on the login page, **When** they choose "Sign in with Google", **Then** the system authenticates them via Google OAuth and redirects to the customer dashboard.
3. **Given** a registered customer on the login page, **When** they enter valid email and password, **Then** the system authenticates them and redirects to the customer dashboard.
4. **Given** a visitor on the registration page, **When** they submit the form with missing required fields or an invalid email, **Then** the system displays specific validation error messages without submitting the form.
5. **Given** a visitor on the registration page, **When** they enter a password shorter than 8 characters, **Then** the system shows a password strength indicator and prevents submission.
6. **Given** an authenticated user, **When** their session expires naturally, **Then** the system renews the session automatically via secure cookie without interrupting the user.

---

### User Story 2 - Self-Service Plate Consultation with Simulated Payment (Priority: P1)

A customer wants to check the vehicle history of a motorcycle by its license plate. They visit the vehicle history page, enter the plate number, and are guided through a simulated payment flow before the consultation is processed. The result is stored for future access.

**Why this priority**: This is the core value proposition of the customer area — enabling self-service consultations removes the manual WhatsApp-based workflow and delivers immediate value.

**Independent Test**: Can be fully tested by entering a plate on the public page, completing login, going through simulated payment, and verifying the consultation result appears in the dashboard.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the vehicle history page, **When** they enter a valid plate number and submit, **Then** the system displays a consultation summary (plate, vehicle type, consultation price) and a "Pay and Consult" button.
2. **Given** a visitor (not logged in) on the vehicle history page, **When** they enter a plate and submit, **Then** the system prompts them to log in or register before proceeding.
3. **Given** a logged-in customer viewing the consultation summary, **When** they click "Pay and Consult", **Then** the system redirects them to the simulated payment page showing order details and payment method options (PIX, Credit Card, Boleto).
4. **Given** a customer on the simulated payment page, **When** they select a payment method and click "Confirm Payment", **Then** the system marks the consultation as paid, processes the plate lookup, and redirects to the consultation details page.
5. **Given** a customer consulting a plate that was previously consulted by any user, **When** the payment is confirmed, **Then** the system returns the cached result without consuming an external API credit.
6. **Given** a customer consulting a plate for the first time in the system, **When** the payment is confirmed, **Then** the system queries the external vehicle history API, stores the full result, and displays it to the customer.

---

### User Story 3 - Customer Dashboard (Priority: P2)

After logging in, the customer sees a personalized dashboard with a welcome message, a summary of their consultation activity, and quick-access links to start a new consultation, view history, or edit their profile.

**Why this priority**: The dashboard provides a central hub for orientation and navigation. Without it, users would lack a clear starting point after login.

**Independent Test**: Can be tested by logging in and verifying the dashboard shows the welcome message, consultation count, latest consultations, and navigation shortcuts.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with 5 previous consultations, **When** they access the dashboard, **Then** they see "Olá, [full name]", the total number of consultations (5), and the 3 most recent consultations with plate and date.
2. **Given** a newly registered customer with no consultations, **When** they access the dashboard, **Then** they see a welcome message and a prominent "New Consultation" call-to-action.
3. **Given** a logged-in customer on the dashboard, **When** they click "New Consultation", **Then** they are redirected to the vehicle history public page with their session preserved.

---

### User Story 4 - Consultation History & Details (Priority: P2)

A customer wants to review all of their past plate consultations. They navigate to the history page, see a paginated list of consultations, filter by plate, and click into any consultation to see the full vehicle data.

**Why this priority**: History and details enable customers to revisit previously purchased information, justifying the value of the paid consultation model.

**Independent Test**: Can be tested by creating multiple consultations, navigating to history, verifying pagination and filtering, and clicking into a detail page.

**Acceptance Scenarios**:

1. **Given** a customer with 25 consultations, **When** they access the history page, **Then** they see the first 20 consultations with plate, date, and status, plus a pagination control to view the remaining 5.
2. **Given** a customer on the history page, **When** they type a partial plate in the filter field (e.g., "ABC"), **Then** the list updates to show only consultations whose plates contain "ABC".
3. **Given** a customer on the history page, **When** they click "View Details" on a consultation, **Then** they are taken to a details page showing full vehicle data (make, model, year, color, chassis, etc.), consultation status, and processing date.
4. **Given** a customer viewing another customer's consultation URL, **When** they try to access the details page, **Then** the system denies access and shows an authorization error.

---

### User Story 5 - Profile Management (Priority: P3)

A customer wants to update their personal information (name, phone, address) and upload a profile photo. They navigate to the profile page, edit the fields, upload an image, and save their changes.

**Why this priority**: Profile management is a supporting feature. Customers can use the platform fully without it, but it improves personalization and data completeness.

**Independent Test**: Can be tested by navigating to the profile page, editing fields, uploading a photo, saving, and verifying the changes persist after page reload.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the profile page, **When** they update their phone number and click "Save Changes", **Then** the system validates the input, saves it, and displays a success notification.
2. **Given** a customer on the profile page, **When** they upload a profile photo (JPG, PNG, or WebP under 5MB), **Then** the system uploads the image via the existing image hosting service and displays the new photo on their profile.
3. **Given** a customer on the profile page, **When** they enter an invalid email format, **Then** the system shows a validation error and prevents saving.
4. **Given** a customer on the profile page, **When** they fill in all address fields (street, number, complement, neighborhood, city, state, ZIP) and save, **Then** the address is persisted and displayed on reload.

---

### User Story 6 - Main Menu Integration & Logout (Priority: P3)

The site's main navigation menu (both desktop and mobile) includes a "Customer Area" / "My Account" link. Non-authenticated visitors see login options; authenticated customers see a link to their dashboard and a logout button.

**Why this priority**: Navigation integration is the entry point for discoverability but relies on the core features being built first.

**Independent Test**: Can be tested by checking the menu as a visitor (expects login link), logging in (expects dashboard link and logout), and clicking logout (expects session invalidation and redirect to home).

**Acceptance Scenarios**:

1. **Given** a visitor browsing the public site, **When** they open the main menu, **Then** they see an "Área do Cliente" link that navigates to the login page.
2. **Given** a logged-in customer, **When** they open the main menu, **Then** they see their name or avatar, a link to their dashboard, and a "Sair" (logout) button.
3. **Given** a logged-in customer, **When** they click "Sair", **Then** the system ends their session, clears authentication cookies, and redirects to the home page.

---

### Edge Cases

- What happens when a customer tries to register with an email that already exists? → The system displays a clear error message suggesting login instead.
- What happens when the external plate consultation API is unavailable during a paid consultation? → The system marks the consultation as "pending processing", notifies the customer, and retries automatically when the API becomes available. The customer is not charged again.
- What happens when a customer navigates directly to a protected page (e.g., `/cliente/consultas`) without being logged in? → The system redirects to the login page with a return URL, and after successful login, redirects back to the originally requested page.
- What happens if the Google OAuth flow fails mid-process? → The system displays a friendly error message and offers the option to try again or register with email/password instead.
- What happens when a customer's session cookie expires while they are filling out the payment form? → The system preserves the consultation intent (plate number) and, after re-authentication, resumes the payment flow without requiring the customer to re-enter the plate.
- What happens when a customer tries to consult an invalid plate format? → The system validates the plate format (both old Brazilian format and Mercosul format) before proceeding and shows a format hint.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow visitors to create customer accounts using email/password with required fields: full name, email, phone (WhatsApp), date of birth, and password (minimum 8 characters).
- **FR-002**: System MUST allow visitors to create customer accounts and log in using Google OAuth as an alternative to email/password.
- **FR-003**: System MUST automatically log in the customer immediately after successful registration.
- **FR-004**: System MUST validate all registration fields: email format, phone format (Brazilian mobile), date of birth (must be in the past), and password strength (minimum 8 characters).
- **FR-005**: System MUST maintain persistent, secure sessions for authenticated customers with automatic renewal.
- **FR-006**: System MUST display a "Customer Area" link in the main navigation menu for both desktop and mobile layouts.
- **FR-007**: System MUST redirect unauthenticated visitors to the login page when they attempt to access any protected customer route, preserving the original destination as a return URL.
- **FR-008**: System MUST present a personalized dashboard to authenticated customers showing: welcome message with name, total consultations count, the 3 most recent consultations, and navigation shortcuts.
- **FR-009**: System MUST allow authenticated customers to initiate a plate consultation from the public vehicle history page by entering a plate number.
- **FR-010**: System MUST prompt unauthenticated visitors to log in or register when they attempt to submit a plate consultation from the public page.
- **FR-011**: System MUST display a consultation summary (plate, vehicle type, price) after plate entry and before payment.
- **FR-012**: System MUST provide a simulated payment page with three payment method options (PIX, Credit Card, Boleto) and a confirmation button.
- **FR-013**: System MUST process the plate consultation only after the simulated payment is confirmed, updating the consultation status accordingly.
- **FR-014**: System MUST check for existing consultation results for a given plate before querying the external API. If a cached result exists and is less than 24 hours old, return it without consuming an API credit.
- **FR-015**: System MUST store the full consultation result (vehicle data snapshot) linked to both the plate and the customer for future retrieval.
- **FR-016**: System MUST provide a paginated consultation history page (20 items per page) showing plate, date, status, and a "View Details" link for each consultation.
- **FR-017**: System MUST support partial plate text search in the history page filter.
- **FR-018**: System MUST display a consultation detail page with complete vehicle data, consultation status, and processing date.
- **FR-019**: System MUST enforce data isolation: customers can only view, create, and edit their own data (profile and consultations).
- **FR-020**: System MUST provide a profile editing page where customers can update: name, email, phone, date of birth, address fields, and profile photo.
- **FR-021**: System MUST support profile photo upload using the existing image hosting integration (same pattern used in other features).
- **FR-022**: System MUST allow authenticated customers to log out, invalidating their session and redirecting to the home page.
- **FR-023**: System MUST record all simulated payment transactions for audit purposes, including payment method, amount, status, and timestamps.
- **FR-024**: System MUST maintain full compatibility with the existing administrative plate consultation workflow — admin users continue using the admin panel independently.

### Key Entities

- **Customer Profile**: Represents a registered customer with personal information (name, email, phone, date of birth), address details, and profile photo. One profile per authenticated user. Extends the base authentication identity.
- **Customer Plate Consultation**: Represents a customer's plate consultation request, including the plate searched, the vehicle data snapshot, payment status, processing status, and timestamps. Linked to the customer who initiated it. Unique per customer-plate combination (a customer cannot have duplicate consultations for the same plate).
- **Payment Simulation**: An audit record of a simulated payment transaction, linked to a specific consultation and customer. Records payment method, amount, status transitions, and confirmation timestamps.
- **Vehicle Plate Consultation (existing)**: The existing system-wide consultation cache. Used to look up previously fetched plate data to avoid redundant external API calls.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Customers can complete the full journey (registration → plate entry → payment → consultation result) in under 5 minutes.
- **SC-002**: Returning customers can log in, enter a plate, pay, and see results in under 2 minutes.
- **SC-003**: 95% of customers successfully complete registration on their first attempt.
- **SC-004**: Repeated consultations for the same plate return results instantly (under 1 second) without consuming external API credits.
- **SC-005**: The customer dashboard loads in under 2 seconds on a standard mobile connection.
- **SC-006**: 100% of customer data is isolated — no customer can access another customer's consultations or profile data.
- **SC-007**: The customer area is fully usable on mobile devices (screen widths from 320px upward) with no horizontal scrolling or overlapping elements.
- **SC-008**: The existing administrative consultation workflow continues to function without any regression.
- **SC-009**: All simulated payment transactions are recorded for audit, with no lost transactions.

## Assumptions

- The existing Supabase Auth infrastructure and Row Level Security policies are available and operational.
- The existing external plate consultation API integration (used in the admin panel) can be reused for customer-facing consultations with the same data format.
- The existing image hosting service integration (ImgBB) used in other features is available for profile photo uploads.
- Password recovery (forgot password) is explicitly out of scope for this initial release and will be addressed in a follow-up specification.
- The "Delete Account" functionality is explicitly out of scope for this initial release.
- Consultation result sharing (public link to vehicle report) is explicitly out of scope and will be addressed in a follow-up specification.
- The simulated payment does not integrate with any real payment gateway — it is a UI-only simulation for flow validation. Real payment integration (Mercado Pago, Stripe, etc.) will be addressed in a separate specification.
- Google OAuth provider configuration in Supabase is either already set up or will be configured as part of this feature's implementation.
- The consultation price is a fixed value defined in the application configuration (not dynamically priced).
- Cached consultation results are considered valid for 24 hours. After this period, a new external API call is made if the plate is consulted again.
- The "Customer Area" label and Portuguese language are used for the Brazilian audience, consistent with the rest of the site.
