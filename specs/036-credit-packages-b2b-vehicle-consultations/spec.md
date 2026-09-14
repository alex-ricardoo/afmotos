# Feature Specification: B2B Credit Packages for Vehicle Consultations

**Feature Branch**: `feat/credit-packages-b2b-consultations`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Pacotes B2B de Créditos para Consultas Veiculares"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin granting credit package (Priority: P1)

As an administrator, I want to find a customer and grant them a prepaid package of vehicle consultation credits so they can use them instead of Mercado Pago.

**Why this priority**: Essential to onboard B2B customers after closing a deal outside the platform.

**Independent Test**: Can be tested by searching for a customer in the admin panel and manually adding a package of credits, then verifying the customer's available balance is correctly updated in the database ledger.

**Acceptance Scenarios**:

1. **Given** an admin is on the customer list, **When** they search for "Alex" and grant 5 credits, **Then** a package is created, an audit log is recorded, and Alex's available credit balance increases by 5.
2. **Given** an admin tries to submit a grant twice rapidly, **When** they double click the submit button, **Then** only one grant of credits is recorded (idempotency).

---

### User Story 2 - Customer choosing to pay with credits (Priority: P1)

As a customer with available credits, I want to see the option to use 1 credit instead of paying via Mercado Pago when I enter a license plate to consult.

**Why this priority**: Core value proposition for the B2B user.

**Independent Test**: Can be fully tested by simulating a user with credits attempting to make a consultation and seeing the credit option, then clicking it and seeing the consultation begin processing.

**Acceptance Scenarios**:

1. **Given** a customer has 5 credits, **When** they type a plate and proceed to checkout, **Then** they see "Usar 1 crédito da plataforma" alongside the normal Mercado Pago option.
2. **Given** a customer has 0 credits, **When** they type a plate and proceed to checkout, **Then** they only see the Mercado Pago option.

---

### User Story 3 - Reserving and consuming a credit during successful delivery (Priority: P1)

As the system, I need to reserve the credit before contacting API Brasil, and only consume it permanently once the vehicle report is delivered successfully.

**Why this priority**: Prevents double-spending and ensures customers only pay for what they receive.

**Independent Test**: Test by initiating a consultation using a credit, verifying the balance is temporarily locked (reserved), and then checking that it moves to consumed once the mock/live delivery succeeds.

**Acceptance Scenarios**:

1. **Given** a customer starts a consultation with a credit, **When** the system processes it, **Then** 1 credit is moved from 'available' to 'reserved' atomically.
2. **Given** a consultation has a reserved credit, **When** the delivery job finishes successfully, **Then** the reservation is converted into a definitive 'consumption'.

---

### User Story 4 - Releasing credit upon definitive failure (Priority: P1)

As the system, if API Brasil fails definitively (e.g. invalid plate, offline provider after retries), I must release the reserved credit back to the customer's available balance.

**Why this priority**: Ensures fairness and avoids manual refunds.

**Independent Test**: Test by triggering a known definitive failure from API Brasil and verifying the customer's available balance returns to its prior state.

**Acceptance Scenarios**:

1. **Given** a consultation has a reserved credit, **When** the delivery job fails definitively, **Then** the credit is released back to the customer.
2. **Given** a consultation has a reserved credit, **When** the delivery job fails temporarily (retry scheduled), **Then** the credit remains in 'reserved' state.

---

### User Story 5 - Customer viewing credit usage history (Priority: P2)

As a customer, I want to view my credit balance, active packages, and a history of my credit usage.

**Why this priority**: Provides transparency and self-service support to the customer.

**Independent Test**: Log in as a customer who has used credits and verify the history table matches their ledger entries.

**Acceptance Scenarios**:

1. **Given** a customer is authenticated, **When** they visit "Meus Créditos", **Then** they see their available balance, reserved balance, and a ledger of past transactions.

---

### Edge Cases

- **Concurrency**: Two tabs/requests attempting to use the last available credit simultaneously. The system must use an atomic reservation via a database transaction (RPC) to prevent balance from going below 0.
- **Provider Failure**: API Brasil failure (temporary vs definitive). Temporary failures keep the credit reserved. Definitive failures release the credit.
- **Refund Prevention**: A consultation paid with a credit must never trigger a Mercado Pago refund, even if it fails definitively.
- **Mock in Production**: Delivering a mock response in production must not permanently consume a credit (unless explicitly intended by admin logic, but ideally released).
- **Admin Adjustments**: Admin adjusts balance while customer is consulting. The ledger approach ensures that adjustments are additive/subtractive transactions, avoiding race conditions.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow administrators to search for customers and view their credit balances, active packages, and history.
- **FR-002**: System MUST allow administrators to manually grant packages of credits to customers, logging the action, price (optional), payment channel, and notes.
- **FR-003**: System MUST allow administrators to add or remove credits from a customer's balance, requiring a reason and recording an audit log.
- **FR-004**: System MUST allow customers to view their available, reserved, and consumed credits, alongside an activity history.
- **FR-005**: System MUST display a mini landing page for credit packages explaining the benefits and directing users to a WhatsApp contact for negotiation.
- **FR-006**: System MUST present the choice between "Pay with Mercado Pago" and "Use 1 credit" when a customer with available credits initiates a consultation.
- **FR-007**: System MUST atomically reserve 1 credit before initiating any provider calls (API Brasil) for a consultation.
- **FR-008**: System MUST convert a reserved credit into a consumed credit only upon successful delivery of the vehicle report.
- **FR-009**: System MUST release a reserved credit back to the customer's available balance upon definitive delivery failure or manual cancellation.
- **FR-010**: System MUST integrate with the existing delivery flow, ensuring credit-paid consultations do not create Mercado Pago Preferences, Transactions, or Refunds.
- **FR-011**: System MUST prevent a customer's available credit balance from becoming negative under any circumstances.
- **FR-012**: System MUST restrict customers to viewing only their own credit balances, packages, and history (Row Level Security).
- **FR-013**: System MUST provide an admin dashboard to view credit usage, active packages, and reserved credits that have been pending for an unusually long time.
- **FR-014**: System MUST allow configuring the display properties (name, quantity, text) of the credit packages shown on the landing page.
- **FR-015**: System MUST generate structured audit logs for all credit-related actions (grants, reservations, consumptions, releases, adjustments).
- **FR-016**: System MUST enforce that only administrators can grant, remove, or suspend credits.

### Key Entities _(include if feature involves data)_

- **`customer_credit_packages`**: Represents a block of credits granted to a user after a commercial negotiation. Tracks original quantity, remaining quantity, price, and expiration.
- **`customer_credit_ledger`**: An immutable append-only ledger tracking all movements (grant, reserve, consume, release, adjustment) for every credit. Serves as the ultimate source of truth for balances.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: System never allows double-spending; the number of consumed/reserved credits must exactly match the number of ledger debit entries.
- **SC-002**: System successfully releases 100% of credits for consultations that fail definitively, returning them to the user's available balance.
- **SC-003**: Zero (0) Mercado Pago refunds are generated for consultations paid via credits.
- **SC-004**: System handles concurrent consultation requests from a single user without dropping the available credit balance below zero.

## Assumptions

- **Sales Process**: All commercial negotiations and actual payments for B2B credit packages occur outside the platform (e.g., via WhatsApp, Bank Transfer). The platform only tracks the granting and usage of these credits.
- **Credit Value**: Credits are non-refundable for cash through the platform. They are only valid for exchanging for vehicle consultations.
- **Currency**: The platform operates exclusively in BRL for any internal price tracking of these packages.
