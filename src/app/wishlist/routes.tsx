import { Redirect } from 'expo-router';
import { ROUTES_GROUP_ID } from '@/shared/wishlist';

export default function RoutesRedirect() {
  return <Redirect href={`/wishlist/route/${ROUTES_GROUP_ID}` as any} />;
}
