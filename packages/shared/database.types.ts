export type Json = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: Json;
}
export interface JsonArray extends Array<Json> {}

export interface Database {
  [key: string]: unknown;
}
