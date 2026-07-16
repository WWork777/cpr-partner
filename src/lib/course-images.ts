import trainingHero from "@/assets/site/training-hero.png";
import safetyTraining from "@/assets/site/safety-training.png";
import machineryTraining from "@/assets/site/machinery-training.png";
import electricalTraining from "@/assets/site/electrical-training.png";
import scheduleDesk from "@/assets/site/schedule-desk.png";
import accountingTraining from "@/assets/site/categories/accounting-training.jpg";
import adminTraining from "@/assets/site/categories/admin-training.jpg";
import corporateTraining from "@/assets/site/categories/corporate-training.jpg";
import ecologyTraining from "@/assets/site/categories/ecology-training.jpg";
import electricalSafetyTraining from "@/assets/site/categories/electrical-safety-training.jpg";
import fireSafetyTraining from "@/assets/site/categories/fire-safety-training.jpg";
import industrialSafetyTraining from "@/assets/site/categories/industrial-safety-training.jpg";
import machineryOperatorTraining from "@/assets/site/categories/machinery-operator-training.jpg";
import occupationalSafetyTraining from "@/assets/site/categories/okhrana-truda-training.jpg";
import skilledTradesTraining from "@/assets/site/categories/skilled-trades-training.jpg";
import transportSafetyTraining from "@/assets/site/categories/transport-safety-training.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  "administrativnyy-personal": adminTraining,
  "attestatsiya-po-elektrobezopasnosti": electricalSafetyTraining,
  "attestatsiya-po-prombezopasnosti": industrialSafetyTraining,
  "bukhgalteriya-i-ekonomika": accountingTraining,
  "ekologiya": ecologyTraining,
  "gostekhnadzor-traktoristy": machineryOperatorTraining,
  "okhrana-truda": occupationalSafetyTraining,
  "pozharnaya-bezopasnost": fireSafetyTraining,
  "rabochie-professii": skilledTradesTraining,
  "samokhodnye-mashiny": machineryOperatorTraining,
  "transportnaya-bezopasnost": transportSafetyTraining,
  "tselevoe-naznachenie": corporateTraining,
};

const ROTATION = [
  occupationalSafetyTraining,
  electricalSafetyTraining,
  industrialSafetyTraining,
  fireSafetyTraining,
  skilledTradesTraining,
  machineryOperatorTraining,
  adminTraining,
  accountingTraining,
  ecologyTraining,
  transportSafetyTraining,
  corporateTraining,
  trainingHero,
  safetyTraining,
  electricalTraining,
  machineryTraining,
  scheduleDesk,
];

export const siteImages = {
  trainingHero,
  safetyTraining,
  machineryTraining,
  electricalTraining,
  scheduleDesk,
  accountingTraining,
  adminTraining,
  corporateTraining,
  ecologyTraining,
  electricalSafetyTraining,
  fireSafetyTraining,
  industrialSafetyTraining,
  machineryOperatorTraining,
  occupationalSafetyTraining,
  skilledTradesTraining,
  transportSafetyTraining,
};

export function courseImageWithFallback(imageUrl?: string | null, fallback = trainingHero) {
  return imageUrl ? `url(${imageUrl}), url(${fallback})` : `url(${fallback})`;
}

export function categoryImage(slug?: string | null, index = 0) {
  if (slug && CATEGORY_IMAGES[slug]) return CATEGORY_IMAGES[slug];
  return ROTATION[index % ROTATION.length];
}
