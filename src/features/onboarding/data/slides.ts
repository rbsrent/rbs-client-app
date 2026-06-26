export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Аренда катеров\nи яхт в СПб',
    subtitle: 'Широкий выбор судов для любого случая',
  },
  {
    id: '2',
    title: 'Бронируй онлайн —\nбыстро и удобно',
    subtitle: 'Выбери дату, время и подтверди за минуту',
  },
  {
    id: '3',
    title: 'Отдыхай\nна воде',
    subtitle: 'Лучшие маршруты по рекам и каналам СПб',
  },
  {
    id: '4',
    title: 'Скидки и\nспецпредложения',
    subtitle: 'Выгодные акции каждую неделю — только в приложении',
  },
];
