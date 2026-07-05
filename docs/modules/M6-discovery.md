# M6 — Discovery (Module Spec)

**Status:** Draft for sign-off · **Stage:** 4 (growth)

## 1. Responsibility
Search and matching across the platform's supply: find a coach, (later) find a school,
browse content. Owns listings, search, and ranking. Distinct from M7 Community
(user-generated "looking-for" posts) — M6 is structured supply, M7 is social demand.

## 2. Owned data (`017_discovery.sql`)
- `listings` (kind coach|school|content, ref_id, searchable fields denormalized:
  subjects[], grades[], city, mode online|offline|hybrid, price_band, verified,
  activity_score, rating) — a read-model *projection*, rebuilt from owner modules via
  events; never hand-edited.
- `discovery_queries` (anonymized query log → S1 demand signals + ranking tuning).

## 3. Key decisions
1. **Postgres-only search at launch.** `tsvector` + trigram + filters covers tens of
   thousands of listings easily. Elasticsearch/Algolia is an extraction trigger, not a
   starting point (ADR-000 cost ceiling).
2. **Ranking = transparent formula, versioned in code:**
   `score = w1·text_match + w2·filter_fit + w3·verified + w4·activity_score + w5·rating`.
   Weights in a config file with a changelog. When tutors ask "why am I ranked low?"
   you need an answer — and SEO-style gaming resistance later.
3. **Projection sync via events:** `coach.profile_updated`, `enrollment.*` (activity
   score), `content.updated` → upsert listing rows. If events are missed (in-process bus,
   page refresh), a nightly reconcile job rebuilds — projections must be rebuildable by
   definition.

## 4. Contract
```ts
export interface DiscoveryContract {
  search(q: { text?: string; kind?: ListingKind; subjects?: string[]; grade?: Grade;
    city?: string; mode?: Mode; priceBand?: PriceBand; cursor?: string }): Promise<SearchPage>
  getListing(id: string): Promise<ListingDetail>
  similar(listingId: string): Promise<Listing[]>   // v1: same subject+grade+city heuristic
}
```

## 5. Events
Consumes: `coach.profile_updated` · `enrollment.*` · `content.updated`
Emits: `discovery.search_performed` (anonymized)

## 6. DoD
- [ ] Migration 017 + projection builders + nightly reconcile
- [ ] TutorMarketplace rebuilt on `search()` with filters (subject/grade/city/mode/price)
- [ ] Ranking config + changelog; verified coaches visibly boosted
