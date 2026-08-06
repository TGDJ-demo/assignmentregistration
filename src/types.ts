export type TesterType = 'web' | 'mobile';

export interface DateAvailability {
  date: string; // YYYY-MM-DD
  webBooked: number;
  webMax: number; // 10
  mobileBooked: number;
  mobileMax: number; // 10
}

export interface Registration {
  id: string;
  name: string;
  email: string;
  testerType: TesterType;
  date: string;
  createdAt: string;
  ticketCode: string;
}

export interface RegistrationRequest {
  name: string;
  email: string;
  testerType: TesterType;
  date: string;
}

export interface GoogleSheetsConfig {
  webhookUrl?: string;
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncTime?: string;
}

export interface EventInfo {
  title: string;
  subtitle: string;
  location: string;
  description: string;
  availableDates: string[];
}
