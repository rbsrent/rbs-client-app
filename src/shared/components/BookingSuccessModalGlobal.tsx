import { useBookingSuccess } from "@/shared/context/BookingSuccessContext";
import { BookingSuccessModal } from "@/features/booking/components/BookingSuccessModal";

export function BookingSuccessModalGlobal() {
  const { data, hide } = useBookingSuccess();
  return (
    <BookingSuccessModal
      visible={!!data}
      data={data}
      onClose={hide}
    />
  );
}
