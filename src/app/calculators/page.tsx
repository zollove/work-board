import { CalculatorsView } from "@/components/calculators/calculators-view";

export const metadata = {
  title: "부동산 및 업무 계산기 | 업무 관리 시스템",
  description: "증감률 계산기, 평/m2 단위환산, 매익률/마진율 및 임대료 연체료 계산기",
};

export default function CalculatorsPage() {
  return <CalculatorsView />;
}
