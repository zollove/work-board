"use client";

import { useEffect, useState } from "react";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  RefreshCw, 
  MapPin, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DailyWeather {
  date: string;
  dayName: string;
  isToday: boolean;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeedMax: number;
  hazard?: HazardAlert;
}

interface HazardAlert {
  type: "heat" | "freeze" | "heavy_rain" | "heavy_snow" | "strong_wind";
  title: string;
  description: string;
  severity: "high" | "critical";
  targetDate: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  actions: string[];
}

export function WeatherWidget() {
  const [weatherList, setWeatherList] = useState<DailyWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // Widget Level Collapsible Toggle State
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);

  // Mobile Drawer Toggle
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Modal State for Selected Date Hazard Alert
  const [selectedHazard, setSelectedHazard] = useState<HazardAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Seoul / Korea coordinates (37.5665, 126.9780)
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Asia%2FTokyo"
      );
      if (!res.ok) throw new Error("날씨 정보를 불러오지 못했습니다.");
      const data = await res.json();

      const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
      const todayStr = new Date().toISOString().split("T")[0];

      const daily: DailyWeather[] = data.daily.time.map((tStr: string, idx: number) => {
        const d = new Date(tStr);
        const dayName = daysOfWeek[d.getDay()];
        const tempMax = Math.round(data.daily.temperature_2m_max[idx]);
        const tempMin = Math.round(data.daily.temperature_2m_min[idx]);
        const windSpeedMax = Math.round(data.daily.windspeed_10m_max[idx] || 0);
        const weatherCode = data.daily.weathercode[idx];

        const dateShort = tStr.slice(5).replace("-", "/");

        // Evaluate Hazard for this specific day
        let hazard: HazardAlert | undefined = undefined;

        // 1. 폭염 (Max temp >= 33)
        if (tempMax >= 33) {
          hazard = {
            type: "heat",
            severity: tempMax >= 35 ? "critical" : "high",
            title: `☀️ [폭염 비상 경보] 최고 기온 ${tempMax}°C 고온 비상`,
            description: "강한 고온으로 인해 건물 냉방 설비 과부하, 옥상 수조/배관 발열, 전력 사용량 급증 및 수배전반 화재/정전 위험이 심각해집니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "❄️ 중앙 냉방 기계실 및 옥상 수조/냉각탑 운전 상태 점검",
              "⚡ 전력 사용량 급증 대비 옥외 수배전반 발열/변압기 온도 체크",
              "🚿 옥상 열차단 스프링클러/수원 공급 가동 점검",
              "🚨 전기실 24시간 에어컨/환기팬 가동 확인 (오작동 시 정전 위험)",
              "👷 옥외 건물 유지보수 작업자 수분 섭취 및 강제 휴식 시간 보장",
              "📢 입주민 안내: 에어컨 수시 청소 및 실외기 주변 화기 제거 문자 발송",
            ],
          };
        }
        // 2. 한파 / 동파 (Min temp <= -5)
        else if (tempMin <= -5) {
          hazard = {
            type: "freeze",
            severity: tempMin <= -10 ? "critical" : "high",
            title: `❄️ [한파/동파 비상 경보] 최저 기온 ${tempMin}°C 동파 위험`,
            description: "복도/계단실 수도 계량기 파손, 외부 노출 배관 동파, 출입구 및 주차장 램프 결빙 사고 위험이 심각합니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "💧 복도/계단실 수도 계량기함 보온재(헌옷/스티로폼) 밀폐 장착 점검",
              "🔥 외부 노출 수도관 및 동파 우려 배관 열선 가동 전원 점검",
              "🚪 공용부 계단/복도 창문 닫힘 상태 확인 (찬바람 유입 차단 안내문)",
              "🧊 지하주차장 램프 구간 및 건물 진입로 결빙 방지 염화칼슘 사전 살포",
              "🚨 수중 배수펌프 밸브 유빙/동결 방지 작동 상태 확인",
              "📢 입주민 안내: 야간 약하게 수도 틀어놓기 및 보일러 외출모드 유지 문자 발송",
            ],
          };
        }
        // 3. 폭우 / 호우 (Rain codes: 63, 65, 81, 82, 95, 96, 99)
        else if ([63, 65, 81, 82, 95, 96, 99].includes(weatherCode)) {
          hazard = {
            type: "heavy_rain",
            severity: "critical",
            title: `🌧️ [집중호우 비상 경보] 건물 침수 및 누수 비상`,
            description: "지하주차장 침수, 옥상 우수관 낙엽 막힘으로 인한 옥상 트렌치 범람, 외벽/창틀 침수 위험이 심각합니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🌊 지하주차장 진입로 수동/자동 차수판(물막이판) 및 샌드백 보관 상태 확인",
              "🧹 옥상 배수구 및 외부 우수관 낙엽/이물질 긴급 청소 및 막힘 점검",
              "⚡ 지하 집수정 수중 배수펌프 자동 가동 및 비상 전원 테스트",
              "🪟 창틀, 외벽, 기계실 틈새 누수 위험 구역 밀폐 및 닫힘 점검",
              "🚨 지하 엘리베이터 피트(Pit) 침수 대비 비상 정지 수순 숙지",
              "📢 입주민 안내: 지하주차장 침수 시 즉시 차량 이동 안내 방송 준비",
            ],
          };
        }
        // 4. 폭설 (Snow codes: 73, 75, 86)
        else if ([73, 75, 86].includes(weatherCode)) {
          hazard = {
            type: "heavy_snow",
            severity: "high",
            title: `☃️ [폭설/빙판 비상 경보] 강설 및 미끄럼 사고 주의`,
            description: "건물 주출입구 미끄럼 사고 및 캐노피/옥상 구조물 적설 하중, 주차장 램프 결빙 위험이 심각합니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🧂 건물 정문, 경사로, 주차장 램프 제설용 염화칼슘/모래함 사전 비치",
              "👟 현관 로비 및 계단 미끄럼 방지 전용 고무 매트 설치",
              "🧹 제설 장비(삽, 너래, 블로워) 동작 점검 및 제설 담당자 전담 조 배치",
              "⚠️ 옥상 캐노피 및 외벽 둔턱 대형 나뭇가지/낙설 위험 지역 통제",
            ],
          };
        }
        // 5. 강풍 (Wind >= 35km/h)
        else if (windSpeedMax >= 35) {
          hazard = {
            type: "strong_wind",
            severity: "high",
            title: `💨 [강풍 비상 경보] 최대 풍속 ${windSpeedMax}km/h 돌풍`,
            description: "옥상 간판, 외벽 부착물 낙하, 창문 파손 및 낙뢰/전선 단선 위험이 증가합니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🪧 옥상 간판, 돌출 간판, 입간판 고정 상태 점검 및 안전 조치",
              "🪴 옥상 및 베란다 화분, 낙하 위험 비품 실내 이동 조치",
              "🚪 건물 공용 출입문 및 옥상문 강풍 고정 장치 점검",
              "⚡ 외벽 전선 및 현수막 고정 상태 확인",
            ],
          };
        }

        return {
          date: tStr,
          dayName,
          isToday: tStr === todayStr,
          weatherCode,
          tempMax,
          tempMin,
          windSpeedMax,
          hazard,
        };
      });

      setWeatherList(daily);
    } catch (err: any) {
      setError(err.message || "날씨 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIconAndLabel = (code: number) => {
    if (code === 0) return { icon: <Sun className="w-5 h-5 text-amber-500" />, label: "맑음" };
    if ([1, 2].includes(code)) return { icon: <CloudSun className="w-5 h-5 text-amber-400" />, label: "구름조금" };
    if (code === 3) return { icon: <Cloud className="w-5 h-5 text-slate-400" />, label: "흐림" };
    if ([45, 48].includes(code)) return { icon: <Cloud className="w-5 h-5 text-slate-400" />, label: "안개" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
      return { icon: <CloudRain className="w-5 h-5 text-sky-500" />, label: "비" };
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return { icon: <CloudSnow className="w-5 h-5 text-indigo-300" />, label: "눈" };
    if ([95, 96, 99].includes(code))
      return { icon: <CloudLightning className="w-5 h-5 text-purple-500" />, label: "뇌우" };
    return { icon: <Sun className="w-5 h-5 text-amber-500" />, label: "맑음" };
  };

  const handleCardClick = (item: DailyWeather) => {
    if (item.hazard) {
      setSelectedHazard(item.hazard);
      setIsModalOpen(true);
    }
  };

  const toggleActionCheck = (key: string) => {
    setCheckedActions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hazardCount = weatherList.filter((item) => !!item.hazard).length;
  const todayWeather = weatherList.find((w) => w.isToday) || weatherList[0];

  return (
    <div className="space-y-2">
      {/* 📱 MOBILE COMPACT BAR (sm:hidden) */}
      <div className="sm:hidden">
        <Card className="border bg-card shadow-sm overflow-hidden">
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold truncate">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {todayWeather ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">오늘 ({todayWeather.dayName})</span>
                  {getWeatherIconAndLabel(todayWeather.weatherCode).icon}
                  <span className="text-red-500 font-extrabold">{todayWeather.tempMax}°</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sky-500 font-extrabold">{todayWeather.tempMin}°</span>
                  {hazardCount > 0 && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 animate-pulse shrink-0">
                      🚨 위협경보
                    </Badge>
                  )}
                </div>
              ) : (
                <span>날씨 로딩 중...</span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <span>{isWidgetCollapsed ? "펼치기" : "접기"}</span>
                {isWidgetCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Expandable Horizontal Ribbon on Mobile when NOT widget-collapsed */}
          {!isWidgetCollapsed && (
            <div className="p-3 pt-0 border-t bg-muted/20">
              <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                <span>일주일 날씨 예보 (터치 시 대처가이드)</span>
                <button
                  onClick={fetchWeather}
                  disabled={loading}
                  className="text-primary hover:underline text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  갱신
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {weatherList.map((item, idx) => {
                  const dateShort = item.date.slice(5).replace("-", "/");
                  const { icon, label } = getWeatherIconAndLabel(item.weatherCode);
                  const hasHazard = !!item.hazard;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCardClick(item)}
                      className={`shrink-0 w-20 p-2 rounded-lg border text-center transition-all ${
                        hasHazard
                          ? "bg-red-500/10 border-red-400 font-bold ring-1 ring-red-500/40 cursor-pointer"
                          : item.isToday
                          ? "bg-primary/10 border-primary font-bold"
                          : "bg-background border-border"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        {dateShort}({item.dayName})
                      </div>
                      <div className="my-1 flex justify-center">{icon}</div>
                      <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold">
                        <span className="text-red-500">{item.tempMax}°</span>
                        <span className="text-sky-500">{item.tempMin}°</span>
                      </div>
                      {hasHazard && (
                        <div className="text-[9px] text-red-600 font-bold mt-0.5 truncate">
                          🚨 경보
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 💻 DESKTOP & TABLET WEATHER BAR CARD (hidden sm:block) */}
      <div className="hidden sm:block">
        <Card className="border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold">대한민국 기상청 연동 7일 날씨 예보</span>
              {hazardCount > 0 && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  🚨 위협 날씨 {hazardCount}건 (클릭 시 풍성한 대처 가이드)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchWeather}
                disabled={loading}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                갱신
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <span>{isWidgetCollapsed ? "날씨 펼치기 🔽" : "날씨 접기 🔼"}</span>
              </Button>
            </div>
          </CardHeader>

          {!isWidgetCollapsed && (
            <CardContent className="p-3 sm:p-4">
              {loading && (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  날씨 정보를 불러오는 중입니다...
                </div>
              )}

              {error && (
                <div className="text-center py-4 text-xs text-red-500">{error}</div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {weatherList.map((item, idx) => {
                    const dateShort = item.date.slice(5).replace("-", "/");
                    const { icon, label } = getWeatherIconAndLabel(item.weatherCode);
                    const hasHazard = !!item.hazard;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleCardClick(item)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                          hasHazard
                            ? "cursor-pointer bg-red-500/10 border-red-400 hover:border-red-600 hover:scale-105 shadow-md ring-2 ring-red-500/30"
                            : item.isToday
                            ? "bg-primary/10 border-primary ring-1 ring-primary/40 font-semibold"
                            : "bg-background border-border/70 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground mb-1">
                          <span>{dateShort}</span>
                          <span>({item.dayName})</span>
                        </div>

                        {item.isToday && (
                          <Badge className="text-[9px] px-1 py-0 bg-primary text-primary-foreground mb-1">
                            오늘
                          </Badge>
                        )}

                        {hasHazard && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 mb-1 animate-pulse">
                            {item.hazard?.type === "heat" && "🚨 폭염경보"}
                            {item.hazard?.type === "freeze" && "❄️ 동파경보"}
                            {item.hazard?.type === "heavy_rain" && "🌧️ 폭우경보"}
                            {item.hazard?.type === "heavy_snow" && "☃️ 폭설주의"}
                            {item.hazard?.type === "strong_wind" && "💨 강풍경보"}
                          </Badge>
                        )}

                        <div className="my-1">{icon}</div>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>

                        <div className="flex items-center gap-1.5 text-xs font-extrabold mt-auto pt-1 border-t w-full justify-center">
                          <span className="text-red-500" title="최고 기온">{item.tempMax}°</span>
                          <span className="text-muted-foreground/40">/</span>
                          <span className="text-sky-500" title="최저 기온">{item.tempMin}°</span>
                        </div>

                        {hasHazard && (
                          <span className="text-[9px] text-red-600 font-bold mt-1.5 underline">
                            대처 가이드 팝업 ➔
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* 🚨 HAZARD POPUP DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl border-2 border-red-500 bg-background text-foreground">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base sm:text-lg font-extrabold">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span>{selectedHazard?.targetDate} ({selectedHazard?.dayName}) 건물 관리 비상 경보 대처 가이드</span>
            </DialogTitle>
          </DialogHeader>

          {selectedHazard && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-300 dark:border-red-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-red-700 dark:text-red-300 text-base">
                    {selectedHazard.title}
                  </h3>
                  <Badge variant={selectedHazard.severity === "critical" ? "destructive" : "outline"}>
                    {selectedHazard.severity === "critical" ? "심각 비상" : "경고"}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-background/80 p-2.5 rounded-lg border">
                  <span>예상 기온:</span>
                  <span className="text-red-500 font-extrabold text-sm">최고 {selectedHazard.tempMax}°C</span>
                  <span>/</span>
                  <span className="text-sky-500 font-extrabold text-sm">최저 {selectedHazard.tempMin}°C</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {selectedHazard.description}
                </p>
              </div>

              {/* Enhanced Rich Action Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center justify-between">
                  <span>📋 현장 건물 관리자 필수 대처 액션 체크리스트</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    (체크 시 완료 처리)
                  </span>
                </h4>

                <div className="space-y-2 bg-muted/30 p-3 rounded-xl border max-h-[320px] overflow-y-auto">
                  {selectedHazard.actions.map((actionText, aIdx) => {
                    const key = `${selectedHazard.targetDate}-${aIdx}`;
                    const isChecked = !!checkedActions[key];

                    return (
                      <div
                        key={aIdx}
                        onClick={() => toggleActionCheck(key)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 line-through opacity-75 border border-emerald-500/30"
                            : "bg-background border border-border hover:border-primary/50 shadow-sm"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs font-semibold leading-relaxed">{actionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
