---
title: SSO login loop on Safari
visibility: PUBLIC
published: true
category: Technical
---

Safari Intelligent Tracking Prevention can loop SSO. Clear website data for the identity provider and for ZenFlow, then retry. For a test, disable Prevent Cross-Site Tracking and try again.

If it still loops, copy the last redirect URL into the ticket. Nova cites this article; a human takes over if redirects keep cycling after those steps.
