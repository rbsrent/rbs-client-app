import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { FadeScreen } from '@/shared/components/FadeScreen';

export default function IndexTab() {
  return <FadeScreen><HomeScreen /></FadeScreen>;
}
