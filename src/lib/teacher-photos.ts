import teacherFemale01 from "@/assets/teachers/teacher-female-01.jpg";
import teacherFemale02 from "@/assets/teachers/teacher-female-02.jpg";
import teacherFemale03 from "@/assets/teachers/teacher-female-03.jpg";
import teacherMale01 from "@/assets/teachers/teacher-male-01.jpg";
import teacherMale02 from "@/assets/teachers/teacher-male-02.jpg";
import teacherTolstobokovOleg from "@/assets/teachers/teacher-tolstobokov-oleg.jpg";
import teacherZadneprovskayaLyudmila from "@/assets/teachers/teacher-zadneprovskaya-lyudmila.jpg";
import teacherKotovaVera from "@/assets/teachers/teacher-kotova-vera.jpg";
import teacherNovikovaSvetlana from "@/assets/teachers/teacher-novikova-svetlana.jpg";
import teacherOkushovaGulnafist from "@/assets/teachers/teacher-okushova-gulnafist.jpg";
import teacherRaykovaOksana from "@/assets/teachers/teacher-raykova-oksana.jpg";
import teacherShayahmetovaAlfiya from "@/assets/teachers/teacher-shayahmetova-alfiya.jpg";

const FEMALE_PHOTOS = [teacherFemale01, teacherFemale02, teacherFemale03];
const MALE_PHOTOS = [teacherMale01, teacherMale02];

const KNOWN_TEACHER_PHOTOS = new Map<string, string>([
  ["буева елена игоревна", teacherFemale01],
  ["волкова марина александровна", teacherFemale02],
  ["журавлева ирина александровна", teacherFemale03],
  ["заднепровская людмила владимировна", teacherZadneprovskayaLyudmila],
  ["котова вера александровна", teacherKotovaVera],
  ["новикова светлана ивановна", teacherNovikovaSvetlana],
  ["окушова гульнафист алтаевна", teacherOkushovaGulnafist],
  ["райкова оксана андреевна", teacherRaykovaOksana],
  ["толстобоков олег николаевич", teacherTolstobokovOleg],
  ["шаяхметова альфия камельевна", teacherShayahmetovaAlfiya],
]);

const KNOWN_TEACHER_GENDERS = new Map<string, "female" | "male">([
  ["буева елена игоревна", "female"],
  ["волкова марина александровна", "female"],
  ["журавлева ирина александровна", "female"],
  ["заднепровская людмила владимировна", "female"],
  ["котова вера александровна", "female"],
  ["новикова светлана ивановна", "female"],
  ["окушова гульнафист алтаевна", "female"],
  ["райкова оксана андреевна", "female"],
  ["толстобоков олег николаевич", "male"],
  ["шаяхметова альфия камельевна", "female"],
]);

const FEMALE_FIRST_NAMES = new Set([
  "алевтина",
  "александра",
  "алина",
  "альфия",
  "анастасия",
  "анна",
  "валентина",
  "валерия",
  "вера",
  "галина",
  "гульнафист",
  "дарья",
  "екатерина",
  "елена",
  "жанна",
  "зинаида",
  "зоя",
  "инна",
  "ирина",
  "ксения",
  "лариса",
  "людмила",
  "марина",
  "мария",
  "наталья",
  "нина",
  "оксана",
  "ольга",
  "светлана",
  "татьяна",
  "юлия",
]);

const MALE_FIRST_NAMES = new Set([
  "александр",
  "алексей",
  "андрей",
  "антон",
  "артем",
  "виктор",
  "владимир",
  "дмитрий",
  "евгений",
  "иван",
  "игорь",
  "константин",
  "максим",
  "михаил",
  "николай",
  "олег",
  "павел",
  "петр",
  "сергей",
  "юрий",
]);

function hashName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export function teacherPhotoFallback(name?: string | null, index = 0) {
  const knownPhoto = KNOWN_TEACHER_PHOTOS.get(normalizeName(name));
  if (knownPhoto) return knownPhoto;

  const photos = getTeacherGender(name) === "male" ? MALE_PHOTOS : FEMALE_PHOTOS;
  const photoIndex = name ? hashName(name) % photos.length : index % photos.length;
  return photos[photoIndex];
}

export function teacherDisplayPhoto(name?: string | null, photoUrl?: string | null, index = 0) {
  const knownPhoto = KNOWN_TEACHER_PHOTOS.get(normalizeName(name));
  return knownPhoto || photoUrl || teacherPhotoFallback(name, index);
}

function getTeacherGender(name?: string | null) {
  const normalizedName = normalizeName(name);
  const knownGender = KNOWN_TEACHER_GENDERS.get(normalizedName);
  if (knownGender) return knownGender;

  const parts = normalizedName.split(/\s+/);
  const firstName = parts[1] ?? parts[0] ?? "";
  const patronymic = parts[2] ?? "";
  const surname = parts[0] ?? "";

  if (/(вна|ична|кызы)$/.test(patronymic)) return "female";
  if (/(вич|оглы)$/.test(patronymic)) return "male";
  if (FEMALE_FIRST_NAMES.has(firstName)) return "female";
  if (MALE_FIRST_NAMES.has(firstName)) return "male";
  if (/(ова|ева|ёва|ина|ая|ская|цкая)$/.test(surname)) return "female";

  return "female";
}

function normalizeName(name?: string | null) {
  return name?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}
