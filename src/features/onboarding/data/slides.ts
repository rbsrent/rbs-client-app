import { COLORS } from '@/shared/colors';

export const SLIDES = [
  {
    id: '1',
    headline: 'Добро пожаловать\nв RBS.RENT!',
    subtitle: 'Аренда катеров и яхт в Санкт-Петербурге с 2015 года',
    icon: 'sailboat' as const,
    iconBg: '#D0F2FB',
    iconColor: COLORS.brandCyan,
  },
  {
    id: '2',
    headline: 'Маршруты\nпо рекам и каналам',
    subtitle: 'Исследуйте Северную столицу с воды на любом судне',
    icon: 'anchor' as const,
    iconBg: '#E8E3FF',
    iconColor: COLORS.brandViolet,
  },
  {
    id: '3',
    headline: 'Быстрое\nбронирование',
    subtitle: 'Выберите катер, дату и время — за несколько касаний',
    icon: 'calendar' as const,
    iconBg: '#FAE3F5',
    iconColor: '#D45CA8',
  },
  {
    id: '4',
    headline: 'Удобная\nоплата',
    subtitle: 'YooKassa, карты, сертификаты — платите как удобно',
    icon: 'credit-card' as const,
    iconBg: '#D6EAFF',
    iconColor: COLORS.brandBlue,
  },
  {
    id: '5',
    headline: 'Подарочные\nсертификаты',
    subtitle: 'Подарите незабываемую прогулку по воде своим близким',
    icon: 'gift' as const,
    iconBg: '#FFF0D6',
    iconColor: '#E88A2B',
  },
] as const;

export type Slide = (typeof SLIDES)[number];
