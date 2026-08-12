export function normalizeUzbekSTT(raw: string | null | undefined): string {
  if (!raw) return "";

  let text = raw.toLowerCase().normalize("NFC");

  // 1) Apostrof variantlarini birlashtirish (oʻ / o' / o` / o' → bitta shaklga)
  text = text.replace(/[ʻ‘’`ʼ]/g, "'");

  // 2) Kirillcha chiqsa — lotinga o'girish (ba'zi STT provayderlari kirillcha qaytaradi)
  const CYR_TO_LAT: Record<string, string> = {
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh",
    "з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o",
    "п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts",
    "ч":"ch","ш":"sh","ъ":"'","ь":"","э":"e","ю":"yu","я":"ya",
    "ў":"o'","ғ":"g'","қ":"q","ҳ":"h",
  };
  text = text.split("").map((ch) => CYR_TO_LAT[ch] || ch).join("");

  // 3) Buyruqqa ta'sir qilmaydigan to'ldiruvchi so'zlarni olib tashlash
  text = text.replace(/\b(iltimos|marhamat|aka|uka|opa|xo'p|xop|xo'sh|xosh|davay|qani|endi)\b/g, " ");

  // 4) Tadqiqotda qayd etilgan ATTESTED_STT_ERROR / COMMON_ORTHOGRAPHIC_VARIANT tuzatishlari
  text = text
    .replace(/\bkil(ing|vor|di|gin)?\b/g, (m) => m.replace(/^kil/, "qil"))
    .replace(/\bkoy\b/g, "qo'y")
    .replace(/\botkas\b/g, "o'tkaz")
    .replace(/\botkaz(?!\')/g, "o'tkaz")
    .replace(/\bkotar\b/g, "ko'tar")
    .replace(/\bkaytar\b/g, "qaytar")
    .replace(/\bochir\b/g, "o'chir")
    .replace(/\bochirib\b/g, "o'chirib")
    .replace(/\btoxtat/g, "to'xtat")
    .replace(/\btuxtat/g, "to'xtat")
    .replace(/\bposa\b/g, "pauza")
    .replace(/\bpref\b/g, "prev")
    .replace(/\bnasad\b/g, "nazad")
    .replace(/\bristart\b/g, "restart")
    .replace(/\bsqorost/g, "skorost")
    .replace(/\bteslik/g, "tezlik")
    .replace(/\btulik\b/g, "to'liq")
    .replace(/\bnex\b/g, "next")
    .replace(/\bawalgi\b/g, "avvalgi")
    .replace(/\bbosidan\b/g, "boshidan")
    .replace(/\bkaitadan\b/g, "qaytadan")
    .replace(/\btezlastir\b/g, "tezlashtir")
    .replace(/\bfpered\b/g, "vpered")
    .replace(/\borkaga\b/g, "orqaga")
    .replace(/\babozini\b/g, "ovozini");

  // 5) So'z bilan aytilgan sonlarni raqamga o'girish ("o'n sekund" → "10 sekund")
  const NUMBER_WORDS: Record<string, number> = {
    "bir": 1, "ikki": 2, "uch": 3, "to'rt": 4, "besh": 5,
    "olti": 6, "yetti": 7, "sakkiz": 8, "to'qqiz": 9, "o'n": 10,
    "yigirma": 20, "o'ttiz": 30, "qirq": 40, "ellik": 50,
  };
  Object.keys(NUMBER_WORDS).forEach((word) => {
    // Escape possible apostrophes in the word keys, if they existed
    text = text.replace(new RegExp(`\\b${word.replace(/'/g, "'")}\\b`, "g"), NUMBER_WORDS[word].toString());
  });

  return text.replace(/\s+/g, " ").trim();
}
