import { BRAND } from '@plcc/brand/brand';

export const church = {
  name: BRAND.fullName,
  shortName: BRAND.name,
  place: BRAND.subline,
  address: 'Kira-Kitukutwe Trading Center, Wakiso District, Uganda',
  landmark: 'Opposite Outspark Education Centre',
  coordinates: { latitude: 0.4384206, longitude: 32.6554589 },
  mapsUrl: 'https://www.google.com/maps/place/PROMISED+LAND+CHRISTIAN+CENTRE+(PLCC)/data=!4m6!3m5!1s0x177db70047ce7357:0x213f70c9abd08b85!8m2!3d0.4384206!4d32.6554589!16s%2Fg%2F11w3633qjb',
  phones: [
    { label: '+256 744 836 784', href: 'tel:+256744836784' },
    { label: '+256 780 914 274', href: 'tel:+256780914274' },
  ],
  email: 'promisedlandchc@gmail.com',
  whatsapp: 'https://wa.me/256780914274',
  youtube: 'https://www.youtube.com/@PLCCGRACELOVE',
  youtubeLabel: '@PLCCGRACELOVE',
  tiktok: 'https://www.tiktok.com/@gracelovehiire',
  tiktokLabel: '@gracelovehiire',
  /** Add the church's page links here to show their icons. */
  facebook: '',
  instagram: '',
  pastor: 'Pastor GraceLove Hiire, Senior Pastor',
  /**
   * Baptisms, child dedications, weddings and counselling: who members contact (footer "Book" card).
   * PLACEHOLDER: put the person's name here once the church confirms it. While `name` is empty the
   * footer shows "Name coming soon". Phone and WhatsApp use the church line until then.
   */
  bookingContact: {
    name: '',
    phone: { label: '+256 780 914 274', href: 'tel:+256780914274' },
    whatsappNumber: '256780914274',
  },
};
