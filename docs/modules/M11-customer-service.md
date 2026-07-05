# M11 — Customer Service (Module Spec)

**Status:** Draft for sign-off · **Stage:** 6
**Verdict (from foundation doc): integrate, don't build.**

## 1. Responsibility
Give users help: in-app chat support, escalation to human (you, at first), optional call
scheduling, and an FAQ deflection layer. Own only the *glue*: widget embedding, identity
handoff, and the escalation record. Building chat/telephony infrastructure from scratch
would burn months for zero differentiation.

## 2. Architecture (three tiers)
1. **Tier 0 — self-serve deflection:** searchable FAQ/help center (content in M8 as a
   `help` category — reuses the publishing workflow). Contextual "?" links per page.
2. **Tier 1 — AI assistant:** the existing `/api/chat` assistant, given a support system
   prompt + FAQ retrieval. Answers product questions; collects a structured ticket when
   it can't. (Later this becomes an S1 agent consumer.)
3. **Tier 2 — human:** provider-embedded live chat + ticketing. **Provider criteria
   (evaluate at build time, don't lock now):** free/cheap starter tier, WhatsApp channel
   support (India), email ticketing, JS widget with identity handoff, data export (no
   lock-in). Candidates meeting these today: Chatwoot (self-host or cloud), Crisp,
   Tawk.to. Phone support v1 = scheduled callback, not a live line — solo operator
   reality; a call center is a scaling decision.

## 3. Owned data (`021_support.sql` — thin by design)
`support_tickets` (account_id, source ai|widget|email, category, status, provider_ref,
created_at, resolved_at) — the provider holds transcripts; we hold the index + linkage so
DPDP export/delete can reach provider data via its API.

## 4. Contract
```ts
export interface SupportContract {
  openTicket(input: { category: TicketCategory; summary: string;
    context?: PageContext }): Promise<{ ticketId: string }>
  getMyTickets(): Promise<Ticket[]>
  deflect(query: string): Promise<FaqAnswer[]>     // Tier 0/1 before Tier 2
}
```

## 5. Events
Emits: `ticket.opened` · `ticket.resolved` (→ M12 confirmations, M10 ops dashboard)

## 6. DoD
- [ ] FAQ category live in M8 + contextual help links
- [ ] AI assistant support mode with ticket capture
- [ ] Provider selected per criteria, widget embedded with identity handoff
- [ ] Ticket index + DPDP export path verified
