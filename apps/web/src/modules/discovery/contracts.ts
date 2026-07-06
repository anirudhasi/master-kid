// modules/discovery/contracts.ts — M6 Discovery (spec §4)

export type ListingKind = 'coach' | 'school' | 'content'
export type Mode = 'online' | 'offline' | 'hybrid'
export type PriceBand = 'free' | 'budget' | 'standard' | 'premium'

export interface Listing {
  id: string
  kind: ListingKind
  refId: string
  title: string
  summary?: string
  subjects: string[]
  grades: string[]
  city?: string
  mode?: Mode
  priceBand?: PriceBand
  verified: boolean
  activityScore: number
  rating?: number
}

export interface SearchQuery {
  text?: string
  kind?: ListingKind
  subject?: string
  grade?: string
  city?: string
  mode?: Mode
  priceBand?: PriceBand
  limit?: number
  offset?: number
}

export interface SearchPage {
  items: Listing[]
  hasMore: boolean
}

export interface DiscoveryContract {
  /** RPC search_listings; also logs an anonymized discovery_queries row. */
  search(q: SearchQuery): Promise<SearchPage>
  getListing(id: string): Promise<Listing | null>
  /** v1 heuristic: same subject + grade + city. */
  similar(listingId: string): Promise<Listing[]>
}
