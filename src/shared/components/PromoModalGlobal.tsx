import { usePromo } from "@/shared/context/PromoContext";
import { PromoModal } from "@/shared/components/PromoModal";

export function PromoModalGlobal() {
  const { data, hide } = usePromo();
  return <PromoModal visible={!!data} data={data} onClose={hide} />;
}
