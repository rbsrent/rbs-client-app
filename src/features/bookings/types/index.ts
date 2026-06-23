export interface Booking {
  id: string;
  boat_id: string | null;
  start_datetime: string;
  end_datetime: string;
  booking_status: string;
  total_price: number;
  prepayment_amount: number;
  remaining_amount: number;
  pier_name: string | null;
  pier_address: string | null;
  client_name: string;
  boats: {
    name: string;
    type: string;
    boat_images: { image_path: string; position: number }[];
  } | null;
}