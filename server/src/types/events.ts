export interface BusinessEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}
