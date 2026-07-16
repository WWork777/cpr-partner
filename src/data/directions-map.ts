// Mapping from direction slug (semantics) to course category slugs in DB.
// One direction can map to several categories (or none, for cross-cutting topics).
export const DIRECTION_TO_CATEGORIES: Record<string, string[]> = {
  "ohrana-truda": ["okhrana-truda"],
  "raboty-na-vysote": ["tselevoe-naznachenie"],
  "okazanie-pervoy-pomoschi": ["okhrana-truda"],
  "povyshenie-kvalifikacii-obschee": ["administrativnyy-personal", "bukhgalteriya-i-ekonomika"],
  "elektrobezopasnost": ["attestatsiya-po-elektrobezopasnosti"],
  "promyshlennaya-bezopasnost": ["attestatsiya-po-prombezopasnosti"],
  "pozharnaya-bezopasnost": ["pozharnaya-bezopasnost"],
  "svarschik": ["rabochie-professii"],
  "voditel-pogruzchika": ["samokhodnye-mashiny"],
  "ekologicheskaya-bezopasnost": ["ekologiya"],
  "radiacionnaya-bezopasnost": ["ekologiya"],
  "bdd-i-transportnaya-bezopasnost": ["transportnaya-bezopasnost"],
  "traktorist-mashinist": ["samokhodnye-mashiny"],
  "perepodgotovka-buhgalter": ["bukhgalteriya-i-ekonomika"],
  "goszakupki-i-antikorrupciya": ["administrativnyy-personal"],
  "mashinist-ekskavatora": ["samokhodnye-mashiny"],
  "stropalschik": ["rabochie-professii"],
};
