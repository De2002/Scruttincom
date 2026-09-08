/**
 * Country ISO mapping & silhouette map URLs for user profiles
 * mapsicon provides clean silhouettes for countries worldwide
 */

export const COUNTRY_ISO: Record<string, string> = {
  Nigeria: 'ng',
  Brazil: 'br',
  UK: 'gb',
  'United Kingdom': 'gb',
  Ghana: 'gh',
  Japan: 'jp',
  Italy: 'it',
  India: 'in',
  Mexico: 'mx',
  Morocco: 'ma',
  Germany: 'de',
  USA: 'us',
  'United States': 'us',
  China: 'cn',
  France: 'fr',
  Spain: 'es',
  Canada: 'ca',
  Australia: 'au',
  Argentina: 'ar',
  'South Africa': 'za',
  Kenya: 'ke',
  Egypt: 'eg',
  Turkey: 'tr',
  Indonesia: 'id',
  Pakistan: 'pk',
  Bangladesh: 'bd',
  Philippines: 'ph',
  Vietnam: 'vn',
  Iran: 'ir',
  Thailand: 'th',
  Ethiopia: 'et',
  Tanzania: 'tz',
  Colombia: 'co',
  Chile: 'cl',
  Peru: 'pe',
  Venezuela: 've',
  Ecuador: 'ec',
  Bolivia: 'bo',
  Sweden: 'se',
  Norway: 'no',
  Denmark: 'dk',
  Finland: 'fi',
  Netherlands: 'nl',
  Belgium: 'be',
  Switzerland: 'ch',
  Austria: 'at',
  Poland: 'pl',
  Portugal: 'pt',
  Greece: 'gr',
  Ukraine: 'ua',
  Russia: 'ru',
  'South Korea': 'kr',
  'Saudi Arabia': 'sa',
  Iraq: 'iq',
  Syria: 'sy',
  Jordan: 'jo',
  Lebanon: 'lb',
  Israel: 'il',
  UAE: 'ae',
  'United Arab Emirates': 'ae',
  Qatar: 'qa',
  Kuwait: 'kw',
  Oman: 'om',
  Yemen: 'ye',
  Uganda: 'ug',
  Rwanda: 'rw',
  'Ivory Coast': 'ci',
  Senegal: 'sn',
  Cameroon: 'cm',
  Ireland: 'ie',
  'New Zealand': 'nz',
  Singapore: 'sg',
  Malaysia: 'my',
  Jamaica: 'jm',
};

export const COMMON_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'India',
  'Japan',
  'Germany',
  'France',
  'Brazil',
  'Mexico',
  'Italy',
  'Spain',
  'Indonesia',
  'Philippines',
  'Egypt',
  'Turkey',
  'South Korea',
  'Netherlands',
  'Sweden',
  'Norway',
  'Switzerland',
  'Ireland',
  'New Zealand',
  'Singapore',
  'Argentina',
  'Colombia',
];

export function getCountryIso(country?: string | null): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (COUNTRY_ISO[trimmed]) return COUNTRY_ISO[trimmed];

  // Case-insensitive lookup
  const lower = trimmed.toLowerCase();
  for (const [name, iso] of Object.entries(COUNTRY_ISO)) {
    if (name.toLowerCase() === lower) return iso;
  }
  return null;
}

export function getMapUrl(country?: string | null): string | null {
  const iso = getCountryIso(country);
  return iso ? `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${iso}/256.png` : null;
}
