export interface CityConfig {
  slug: string;
  name: string;
  nameIn: string; // в родительном падеже "в Москве"
  region: string;
}

export const CITIES: CityConfig[] = [
  { slug: "moscow", name: "Москва", nameIn: "в Москве", region: "Московская область" },
  { slug: "spb", name: "Санкт-Петербург", nameIn: "в Санкт-Петербурге", region: "Ленинградская область" },
  { slug: "novosibirsk", name: "Новосибирск", nameIn: "в Новосибирске", region: "Новосибирская область" },
  { slug: "ekaterinburg", name: "Екатеринбург", nameIn: "в Екатеринбурге", region: "Свердловская область" },
  { slug: "kazan", name: "Казань", nameIn: "в Казани", region: "Республика Татарстан" },
  { slug: "chelyabinsk", name: "Челябинск", nameIn: "в Челябинске", region: "Челябинская область" },
  { slug: "omsk", name: "Омск", nameIn: "в Омске", region: "Омская область" },
  { slug: "samara", name: "Самара", nameIn: "в Самаре", region: "Самарская область" },
  { slug: "rostov", name: "Ростов-на-Дону", nameIn: "в Ростове-на-Дону", region: "Ростовская область" },
  { slug: "ufa", name: "Уфа", nameIn: "в Уфе", region: "Республика Башкортостан" },
  { slug: "krasnoyarsk", name: "Красноярск", nameIn: "в Красноярске", region: "Красноярский край" },
  { slug: "voronezh", name: "Воронеж", nameIn: "в Воронеже", region: "Воронежская область" },
  { slug: "perm", name: "Пермь", nameIn: "в Перми", region: "Пермский край" },
  { slug: "volgograd", name: "Волгоград", nameIn: "в Волгограде", region: "Волгоградская область" },
  { slug: "krasnodar", name: "Краснодар", nameIn: "в Краснодаре", region: "Краснодарский край" },
  { slug: "tyumen", name: "Тюмень", nameIn: "в Тюмени", region: "Тюменская область" },
  { slug: "saratov", name: "Саратов", nameIn: "в Саратове", region: "Саратовская область" },
  { slug: "tolyatti", name: "Тольятти", nameIn: "в Тольятти", region: "Самарская область" },
  { slug: "izhevsk", name: "Ижевск", nameIn: "в Ижевске", region: "Республика Удмуртия" },
  { slug: "barnaul", name: "Барнаул", nameIn: "в Барнауле", region: "Алтайский край" },
];

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find((c) => c.slug === slug);
}
