export interface Ride {
  departure_location: string;
  destination: string;
  departure_time: string;
  departure_date: string;
  available_seats: number;
  price: number;
  additional_info?: string;
}