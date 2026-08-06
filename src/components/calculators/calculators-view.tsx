"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  Scaling, 
  DollarSign, 
  ArrowRightLeft, 
  Sparkles,
  Percent,
  Clock
} from "lucide-react";

// Helper: Format string with thousand separators (e.g. 1000000 -> 1,000,000)
function formatCommaInput(val: string): string {
  if (!val) return "";
  // Keep minus sign if present
  const isNegative = val.startsWith("-");
  const cleanStr = val.replace(/[^0-9.]/g, "");
  const parts = cleanStr.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const result = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  return isNegative ? `-${result}` : result;
}

// Helper: Parse raw number from comma-formatted string
function parseRawNum(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/,/g, "");
  return parseFloat(clean) || 0;
}

export function CalculatorsView() {
  const [activeTab, setActiveTab] = useState<"rate" | "area" | "margin" | "late">("rate");

  // 1. 증감률 계산기 State (comma formatted)
  const [oldVal, setOldVal] = useState<string>("1,000,000");
  const [newVal, setNewVal] = useState<string>("1,200,000");

  const [baseAmount, setBaseAmount] = useState<string>("1,000,000");
  const [targetRate, setTargetRate] = useState<string>("5");

  // 2. 평 <-> m2 단위환산 State
  const [pyeongVal, setPyeongVal] = useState<string>("30");
  const [m2Val, setM2Val] = useState<string>("99.17");

  // 3. 매익률 계산기 State (comma formatted)
  const [salesVal, setSalesVal] = useState<string>("1,000,000");
  const [costVal, setCostVal] = useState<string>("700,000");

  const [targetMarginCost, setTargetMarginCost] = useState<string>("700,000");
  const [targetMarginRate, setTargetMarginRate] = useState<string>("30");

  // 4. 연체료 계산기 State (comma formatted)
  const [rentAmount, setRentAmount] = useState<string>("1,000,000");
  const [lateDays, setLateDays] = useState<string>("15");
  const [lateRateAnnual, setLateRateAnnual] = useState<string>("6");

  // --- CALCULATION LOGIC ---

  // 1-A. 증감률 계산
  const numOld = parseRawNum(oldVal);
  const numNew = parseRawNum(newVal);
  const diffAmount = numNew - numOld;
  const rateChange = numOld !== 0 ? ((numNew - numOld) / Math.abs(numOld)) * 100 : 0;

  // 1-B. 목표 증감률 적용 금액 계산
  const numBase = parseRawNum(baseAmount);
  const numTargetRate = parseFloat(targetRate) || 0;
  const calculatedNewAmount = Math.round(numBase * (1 + numTargetRate / 100));

  // 2. 평 <-> m2 환산
  const handlePyeongChange = (valStr: string) => {
    setPyeongVal(valStr);
    const p = parseFloat(valStr);
    if (!isNaN(p)) {
      setM2Val((p * 3.305785).toFixed(2));
    } else {
      setM2Val("");
    }
  };

  const handleM2Change = (valStr: string) => {
    setM2Val(valStr);
    const m = parseFloat(valStr);
    if (!isNaN(m)) {
      setPyeongVal((m / 3.305785).toFixed(2));
    } else {
      setPyeongVal("");
    }
  };

  const applyPyeongPreset = (p: number) => {
    setPyeongVal(p.toString());
    setM2Val((p * 3.305785).toFixed(2));
  };

  const applyM2Preset = (m: number) => {
    setM2Val(m.toString());
    setPyeongVal((m / 3.305785).toFixed(2));
  };

  // 3-A. 매익률 계산
  const numSales = parseRawNum(salesVal);
  const numCost = parseRawNum(costVal);
  const profitAmount = numSales - numCost;
  const profitMarginPercent = numSales !== 0 ? (profitAmount / numSales) * 100 : 0;
  const markupPercent = numCost !== 0 ? (profitAmount / numCost) * 100 : 0;

  // 3-B. 목표 매익률 기반 권장 판매가 역산
  const numTargetCost = parseRawNum(targetMarginCost);
  const numTargetMarginPercent = parseFloat(targetMarginRate) || 0;
  const recommendedSalesPrice =
    numTargetMarginPercent < 100
      ? Math.round(numTargetCost / (1 - numTargetMarginPercent / 100))
      : 0;

  // 4. 연체료 계산
  const numRent = parseRawNum(rentAmount);
  const numDays = parseFloat(lateDays) || 0;
  const numAnnualRate = parseFloat(lateRateAnnual) || 0;
  const lateFeeAmount = Math.round((numRent * (numAnnualRate / 100) * numDays) / 365);

  const formatKrw = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(num));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>계산기</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              임대료 증감률, 면적 단위환산(평 ↔ m²), 매익률/마진율 및 연체 이자를 계산합니다. (숫자 입력 시 천단위 콤마 자동 적용)
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-1.5 rounded-2xl border">
        <Button
          variant={activeTab === "rate" ? "default" : "ghost"}
          onClick={() => setActiveTab("rate")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span>1. 증감률 계산기</span>
        </Button>

        <Button
          variant={activeTab === "area" ? "default" : "ghost"}
          onClick={() => setActiveTab("area")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Scaling className="w-4 h-4 text-emerald-500" />
          <span>2. 평 ↔ m² 단위환산</span>
        </Button>

        <Button
          variant={activeTab === "margin" ? "default" : "ghost"}
          onClick={() => setActiveTab("margin")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Percent className="w-4 h-4 text-purple-500" />
          <span>3. 매익률 계산기</span>
        </Button>

        <Button
          variant={activeTab === "late" ? "default" : "ghost"}
          onClick={() => setActiveTab("late")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>4. 연체료 계산기</span>
        </Button>
      </div>

      {/* TAB 1: 증감률 계산기 */}
      {activeTab === "rate" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode A: 이전값 -> 이후값 증감률 */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>이전 vs 변경후 금액 증감률 계산</span>
              </CardTitle>
              <CardDescription className="text-xs">
                임대료 상승/인하율 또는 매출 변동 폭을 계산합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-val" className="text-xs">이전 금액 (원)</Label>
                <Input
                  id="old-val"
                  type="text"
                  value={oldVal}
                  onChange={(e) => setOldVal(formatCommaInput(e.target.value))}
                  placeholder="예: 1,000,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-val" className="text-xs">변경 후 금액 (원)</Label>
                <Input
                  id="new-val"
                  type="text"
                  value={newVal}
                  onChange={(e) => setNewVal(formatCommaInput(e.target.value))}
                  placeholder="예: 1,200,000"
                />
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-900 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>증감 금액</span>
                  <span className="font-bold text-foreground">{formatKrw(diffAmount)} 원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">증감률 (%)</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={rateChange > 0 ? "destructive" : rateChange < 0 ? "default" : "outline"}
                      className="text-sm font-extrabold px-2 py-0.5"
                    >
                      {rateChange > 0 ? `🔺 +${rateChange.toFixed(2)}%` : rateChange < 0 ? `🔻 ${rateChange.toFixed(2)}%` : "0% (변동없음)"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode B: 목표 증감률 적용 후 금액 계산 */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-500" />
                <span>목표 증감률(%) 적용 후 금액 예측</span>
              </CardTitle>
              <CardDescription className="text-xs">
                기준 금액에 %를 인상/인하했을 때 최종 금액을 계산합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base-amount" className="text-xs">기준 금액 (원)</Label>
                <Input
                  id="base-amount"
                  type="text"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(formatCommaInput(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-rate" className="text-xs">목표 증감률 (%) (예: 5%, -3%)</Label>
                <Input
                  id="target-rate"
                  type="number"
                  step="0.1"
                  value={targetRate}
                  onChange={(e) => setTargetRate(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-900 space-y-1.5 mt-4">
                <span className="text-xs text-muted-foreground block">적용 후 예상 금액</span>
                <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatKrw(calculatedNewAmount)} 원
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  (변동액: {formatKrw(calculatedNewAmount - numBase)} 원)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: 평 <-> m2 단위환산 계산기 */}
      {activeTab === "area" && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 sm:p-6 border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scaling className="w-5 h-5 text-emerald-500" />
              <span>평 ↔ m² (제곱미터) 단위 양방향 환산기</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              기준: 1평 = 3.305785 m² / 1 m² = 0.3025평
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">자주 쓰는 면적 퀵 선택:</span>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" onClick={() => applyPyeongPreset(10)} className="h-7 text-xs">
                  10평 (33.1 m²)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPyeongPreset(20)} className="h-7 text-xs">
                  20평 (66.1 m²)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPyeongPreset(30)} className="h-7 text-xs">
                  30평 (99.2 m²)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPyeongPreset(50)} className="h-7 text-xs">
                  50평 (165.3 m²)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyM2Preset(59)} className="h-7 text-xs border-emerald-500/40">
                  59 m² (17.8평)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyM2Preset(84)} className="h-7 text-xs border-emerald-500/40">
                  84 m² (25.4평 - 국민평형)
                </Button>
              </div>
            </div>

            {/* Converter Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-emerald-500/5 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-950">
              {/* Pyeong Input */}
              <div className="space-y-2">
                <Label htmlFor="pyeong-input" className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  평 (Pyeong)
                </Label>
                <div className="relative">
                  <Input
                    id="pyeong-input"
                    type="number"
                    step="0.01"
                    className="text-lg font-bold h-12 bg-background border-emerald-300 dark:border-emerald-800 pr-12"
                    value={pyeongVal}
                    onChange={(e) => handlePyeongChange(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    평
                  </span>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="hidden md:flex justify-center text-emerald-500">
                <ArrowRightLeft className="w-6 h-6" />
              </div>

              {/* m2 Input */}
              <div className="space-y-2">
                <Label htmlFor="m2-input" className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  m² (제곱미터)
                </Label>
                <div className="relative">
                  <Input
                    id="m2-input"
                    type="number"
                    step="0.01"
                    className="text-lg font-bold h-12 bg-background border-emerald-300 dark:border-emerald-800 pr-12"
                    value={m2Val}
                    onChange={(e) => handleM2Change(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    m²
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: 매익률(매출 이익률 / 마진율) 계산기 */}
      {activeTab === "margin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode A: 매출액 & 원가 -> 매익률 */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-500" />
                <span>매출액 & 원가 기준 매익률 계산</span>
              </CardTitle>
              <CardDescription className="text-xs">
                매출액과 비용(원가)을 기반으로 매익률과 마진율을 산출합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sales-val" className="text-xs">매출액 / 총 판매가 (원)</Label>
                <Input
                  id="sales-val"
                  type="text"
                  value={salesVal}
                  onChange={(e) => setSalesVal(formatCommaInput(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost-val" className="text-xs">원가 / 총 매입 비용 (원)</Label>
                <Input
                  id="cost-val"
                  type="text"
                  value={costVal}
                  onChange={(e) => setCostVal(formatCommaInput(e.target.value))}
                />
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-200 dark:border-purple-900 space-y-2.5 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">매출이익 (순이익)</span>
                  <span className="font-bold text-foreground text-sm">{formatKrw(profitAmount)} 원</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">매익률 (이익/매출)</span>
                  <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                    {profitMarginPercent.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>마진율 (이익/원가)</span>
                  <span className="font-semibold">{markupPercent.toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode B: 목표 매익률 기준 판매가 역산 */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                <span>목표 매익률(%) 기준 권장 판매가 역산</span>
              </CardTitle>
              <CardDescription className="text-xs">
                원가와 남기고 싶은 매익률(%)을 정했을 때 적정 판매가를 계산합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-cost" className="text-xs">매입 원가 (원)</Label>
                <Input
                  id="target-cost"
                  type="text"
                  value={targetMarginCost}
                  onChange={(e) => setTargetMarginCost(formatCommaInput(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-margin-rate" className="text-xs">목표 매익률 (%) (예: 30%)</Label>
                <Input
                  id="target-margin-rate"
                  type="number"
                  value={targetMarginRate}
                  onChange={(e) => setTargetMarginRate(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-200 dark:border-purple-900 space-y-1.5 mt-4">
                <span className="text-xs text-muted-foreground block">권장 판매 가격 (매가)</span>
                <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                  {formatKrw(recommendedSalesPrice)} 원
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  (예상 이익: {formatKrw(recommendedSalesPrice - numTargetCost)} 원)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: 임대료 연체료 계산기 (Bonus) */}
      {activeTab === "late" && (
        <Card className="border shadow-sm max-w-2xl mx-auto">
          <CardHeader className="p-4 sm:p-6 border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>임대료 연체료 (연체 이자) 계산기</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              월 임대료 미납 시 연체 일수 및 연이율 기준 이자를 계산합니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent-amount" className="text-xs">월 임대료 (원)</Label>
                <Input
                  id="rent-amount"
                  type="text"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(formatCommaInput(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="late-days" className="text-xs">연체 일수 (일)</Label>
                <Input
                  id="late-days"
                  type="number"
                  value={lateDays}
                  onChange={(e) => setLateDays(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="late-rate" className="text-xs">연체 이율 (연 %)</Label>
                <Input
                  id="late-rate"
                  type="number"
                  step="0.5"
                  value={lateRateAnnual}
                  onChange={(e) => setLateRateAnnual(e.target.value)}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-900 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">계산된 연체 이자금액</span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  +{formatKrw(lateFeeAmount)} 원
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-sm font-bold">
                <span>총 납부할 금액 (임대료 + 연체료)</span>
                <span className="text-lg font-extrabold text-foreground">
                  {formatKrw(numRent + lateFeeAmount)} 원
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
