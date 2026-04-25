# Security Specification - Up Torque Networks

## Data Invariants
1. A **User** must have a unique UID matching their auth profile.
2. A **Lead** must always be associated with a valid `partnerId`.
3. Only **Admins** can change the status of a Lead (except creation) and set financial values.
4. **Partners** can only read their own Leads and Invoices.
5. **PII Isolation**: Users can only read their own private profile data (CPF, Phone).

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than the authenticated user.
2. **Privilege Escalation**: A Partner attempting to update their own `role` to 'ADMIN'.
3. **Data Tampering**: A Partner attempting to update the `commissionValue` of a Lead they created.
4. **Orphaned Lead**: Creating a Lead with a `partnerId` that does not exist in the `users` collection.
5. **Shadow Update**: Adding a field `isVerified: true` to a User profile during update.
6. **Query Scraping**: Attempting to list all Leads without filtering by `partnerId`.
7. **Status Jumping**: A Partner attempting to change a Lead status from 'PENDING' to 'COMPLETED'.
8. **Resource Poisoning**: Attaching a 2MB string to the `clientName` field.
9. **Email Spoofing**: Accessing Admin data using an unverified email matching the admin email.
10. **Financial Injection**: Creating an Invoice for oneself with a custom `totalAmount`.
11. **Settings Hijacking**: A Partner attempting to change the `primaryColor` in `settings/app_config`.
12. **Cross-User Access**: Partner A attempting to `get()` an Invoice belonging to Partner B.

## Security Rules Strategy
- **Master Gate**: All Lead and Invoice access is tied to the `partnerId` or `userId`.
- **Action-Based Updates**: Split Lead updates into 'Admin Processing' and 'Partner Viewing'.
- **Validation Helpers**: `isValidUser`, `isValidLead`, `isValidInvoice`.
