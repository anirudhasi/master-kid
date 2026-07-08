// modules/customer-service/contracts.ts — M11 Customer Service (spec §4)
// Thin by design: Tier 0 lives in M8 (help category), Tier 1 in /api/chat support
// mode, Tier 2 in the embedded provider. This module owns the glue + ticket index.

export type TicketSource = 'ai' | 'widget' | 'email' | 'callback'
export type TicketCategory =
  | 'onboarding' | 'payments' | 'subscription' | 'coach' | 'school'
  | 'content' | 'technical' | 'data_request' | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Ticket {
  id: string
  source: TicketSource
  category: TicketCategory
  summary: string
  status: TicketStatus
  createdAt: string
  resolvedAt?: string
}

export interface FaqAnswer {
  id: string                   // M8 content item id (kind 'help')
  title: string
  body: string
}

export interface PageContext {
  route: string
  childId?: string             // ids only — never names/PII in ticket context
}

export interface SupportContract {
  /** Tier 0/1 first: search help content, then AI support mode, before any ticket. */
  deflect(query: string): Promise<FaqAnswer[]>
  openTicket(input: { source: TicketSource; category: TicketCategory;
    summary: string; context?: PageContext }): Promise<{ ticketId: string }>
  getMyTickets(): Promise<Ticket[]>
  /** Scheduled-callback request (phone support v1 — no live line). */
  requestCallback(input: { category: TicketCategory; summary: string;
    preferredSlot: string }): Promise<{ ticketId: string }>
}
