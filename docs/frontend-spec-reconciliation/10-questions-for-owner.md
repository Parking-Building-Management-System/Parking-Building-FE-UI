# 10 - Questions for Owner

| Priority | Question                                                                     | Why It Matters                                                                   | Blocks Which Task             |
| -------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| P0       | Frontend should keep shadcn/ui + Tailwind 4 as the UI convention?            | Existing code is built around copied shadcn primitives.                          | All UI tasks                  |
| P0       | Do we need to preserve the current visual design and dark theme?             | Prevents agents from redesigning the app.                                        | Layout/navigation, CRUD pages |
| P0       | Should Admin, Manager, and Staff share the same dashboard shell?             | Staff kiosk likely needs a different UX from admin/manager sidebar.              | Layout task, staff UI         |
| P0       | Should Staff kiosk be desktop-only or responsive?                            | Kiosk/bốt gác controls can be dense and shortcut-driven.                         | Staff entry/exit/live monitor |
| P0       | Does PWA user live in this same Next.js repo or a separate app?              | Determines route group, manifest, auth, build/deploy.                            | PWA Phase 4                   |
| P0       | Should access token stay memory-only and refresh token stay HttpOnly cookie? | Affects auth bootstrap and security posture.                                     | Auth guard/bootstrap          |
| P0       | What is the staff username format?                                           | Current login input is email type, but spec says internal username/mã nhân viên. | Login, staff creation         |
| P0       | How should device fingerprint be generated in frontend?                      | Current UUID/localStorage is basic; backend may require stronger device ID.      | Device binding                |
| P1       | What backend error code means unknown/untrusted device?                      | Needed to show "Thiết bị lạ" instead of generic toast.                           | Auth/device approval          |
| P1       | What endpoint creates a pending device permission request?                   | Needed for "Gửi yêu cầu cấp quyền".                                              | Device unknown screen         |
| P1       | Is approve temporary exactly 8h backend-owned or frontend-sent?              | Avoids client-controlled trust duration.                                         | Device approval               |
| P1       | Does manager create tenant manager with email, username, or both?            | Current tenant contract only has `managerEmail`.                                 | Tenant management             |
| P1       | Are parking create/edit APIs planned?                                        | Current manager API has list/toggle only for parkings.                           | Manager facility CRUD         |
| P1       | Are single slot create/edit/delete APIs planned?                             | Current slot UI has list/import/bulk status only.                                | Slot CRUD                     |
| P1       | Is camera required in phase đầu or is upload ảnh giả lập enough?             | Real webcam introduces permission/device testing complexity.                     | Staff entry/exit              |
| P1       | Is QR/VietQR real integration needed now or mock?                            | Payment affects contracts, polling, gateway callbacks.                           | Billing/PWA                   |
| P1       | Are charts real immediately or placeholder acceptable?                       | Determines analytics API and chart work.                                         | Admin/Manager analytics       |
| P2       | Is drag/drop slot map needed now or table CRUD first?                        | Visual mapping is much more complex than CRUD.                                   | Facility visual mapping       |
| P2       | Is Excel slot import required now?                                           | Import exists in current code, but UX/template may need hardening.               | Slot import                   |
| P2       | Is floor plan upload required now?                                           | Requires file storage/preview contract.                                          | Floor plan upload             |
| P2       | Is Vietnamese/English i18n required?                                         | Current UI text is mostly English.                                               | All user-facing UI            |
| P2       | Is dark mode required?                                                       | Theme provider and toggle exist.                                                 | Layout/design                 |
