import { useSharePreview } from "@/shared/context/SharePreviewContext";
import { SharePreviewModal } from "@/shared/components/SharePreviewModal";

export function SharePreviewModalGlobal() {
  const { target, hide } = useSharePreview();
  return (
    <SharePreviewModal
      visible={!!target}
      target={target}
      onClose={hide}
    />
  );
}
