/**
 * 한국인 성명 기반 성별 추정 (Korean Name Gender Inference)
 */

const FEMALE_SYLLABLES = new Set([
  "숙", "혜", "은", "미", "희", "옥", "순", "경", "정", "주", "나", "란", "선", "림", "린",
  "영", "연", "아", "예", "지", "민", "서", "채", "하", "유", "인", "솔", "봄", "슬", "리",
  "다", "율", "가", "빈", "효", "진", "현", "수", "라", "애", "화", "자", "분", "임", "단",
]);

const MALE_SYLLABLES = new Set([
  "준", "훈", "범", "철", "식", "호", "환", "우", "혁", "석", "섭", "용", "태", "균", "욱",
  "웅", "찬", "성", "광", "구", "근", "기", "길", "남", "덕", "동", "만", "명", "모", "문",
  "병", "보", "봉", "부", "상", "선", "섭", "성", "세", "수", "승", "시", "신", "양", "열",
  "영", "오", "완", "용", "원", "월", "유", "윤", "율", "은", "을", "응", "익", "일", "임",
  "재", "전", "정", "제", "조", "종", "주", "중", "지", "진", "창", "채", "천", "철", "초",
  "태", "택", "판", "하", "학", "한", "해", "혁", "현", "형", "호", "홍", "화", "환", "회",
]);

// Strong distinctive female characters
const DISTINCT_FEMALE = new Set([
  "숙", "혜", "옥", "순", "란", "애", "자", "분", "임", "녀", "희", "나", "미", "영", "연", "예", "지", "채", "아",
]);

// Strong distinctive male characters
const DISTINCT_MALE = new Set([
  "호", "철", "훈", "범", "식", "혁", "석", "섭", "용", "태", "균", "욱", "웅", "찬", "성", "광", "구", "근", "기",
  "덕", "동", "만", "명", "병", "봉", "상", "승", "열", "완", "익", "일", "재", "종", "중", "창", "학", "한", "형",
]);

export interface GenderInferenceResult {
  gender: "남성" | "여성" | "미상";
  confidence: number;
}

export function inferKoreanGender(fullName: string): GenderInferenceResult {
  if (!fullName || typeof fullName !== "string") {
    return { gender: "미상", confidence: 0 };
  }

  const cleanName = fullName.replace(/[^가-힣]/g, "").trim();
  if (cleanName.length < 2) {
    return { gender: "미상", confidence: 0 };
  }

  // Usually first character is surname (성), rest is given name (이름)
  const givenName = cleanName.length >= 3 ? cleanName.slice(1) : cleanName;

  let maleScore = 0;
  let femaleScore = 0;

  for (let i = 0; i < givenName.length; i++) {
    const char = givenName[i];

    if (DISTINCT_FEMALE.has(char)) femaleScore += 3;
    else if (FEMALE_SYLLABLES.has(char)) femaleScore += 1;

    if (DISTINCT_MALE.has(char)) maleScore += 3;
    else if (MALE_SYLLABLES.has(char)) maleScore += 1;
  }

  if (femaleScore > maleScore) {
    return {
      gender: "여성",
      confidence: Math.min(0.95, 0.6 + (femaleScore - maleScore) * 0.1),
    };
  } else if (maleScore > femaleScore) {
    return {
      gender: "남성",
      confidence: Math.min(0.95, 0.6 + (maleScore - femaleScore) * 0.1),
    };
  }

  return { gender: "미상", confidence: 0.5 };
}

export function maskName(name: string): string {
  if (!name || name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}*${name.slice(2)}`;
}
