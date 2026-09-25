export interface User {
  id: string;
  email: string;
  full_name: string;
  account_id: string;
}

export interface HostedZone {
  id: string;
  name: string;
  comment: string;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneList {
  items: HostedZone[];
  total: number;
  page: number;
  page_size: number;
}

export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number] | "SOA";

export interface DnsRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  record_type: string;
  ttl: number;
  values: string[];
  routing_policy: string;
  alias: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordList {
  items: DnsRecord[];
  total: number;
  page: number;
  page_size: number;
}
