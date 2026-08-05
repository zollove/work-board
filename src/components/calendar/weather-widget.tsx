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
            title: `☀️ [폭염 경보] 최고 기온 ${tempMax}°C 고온 비상`,
            description: "강한 고온으로 인해 건물 냉방 설비 과부하, 옥상 수조/배관 발열, 전력 사용량 급증 및 수배전반 화재/정전 위험이 높아집니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "❄️ 중앙 냉방 설비 및 옥상 수조/냉각탑 운전 상태 점검",
              "⚡ 전력 사용량 급증 대비 옥외 수배전반 발열/변압기 상태 점검",
              "👷 옥외 건물 유지보수 작업자 수분 섭취 및 강제 휴식 시간 보장",
            ],
          };
        }
        // 2. 한파 / 동파 (Min temp <= -5)
        else if (tempMin <= -5) {
          hazard = {
            type: "freeze",
            severity: tempMin <= -10 ? "critical" : "high",
            title: `❄️ [동파 경보] 최저 기온 ${tempMin}°C 한파 비상`,
            description: "복도/계단실 수도 계량기 및 외부 노출 배관 동파, 출입구 및 주차장 램프 결빙 위험이 심각합니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "💧 복도/계단실 수도 계량기 및 외부 노출 배관 보온재/열선 가동 점검",
              "🚪 공용부 창문 및 출입문 밀폐 닫힘 점검 (찬바람 유입 차단)",
              "🧊 지하주차장 램프 구간 및 건물 진입로 결빙 방지 염화칼슘 사전 살포",
            ],
          };
        }
        // 3. 폭우 / 호우 (Rain codes: 63, 65, 81, 82, 95, 96, 99)
        else if ([63, 65, 81, 82, 95, 96, 99].includes(weatherCode)) {
          hazard = {
            type: "heavy_rain",
            severity: "critical",
            title: `🌧️ [집중호우 경보] 침수 및 누수 비상`,
            description: "지하주차장 침수 및 옥상 우수관 이물질 막힘, 외벽/창틀 누수 위험이 있습니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🌊 지하주차장 차수판(차수막) 설치 준비 및 집수정 배수펌프 자동 가동 점검",
              "🧹 옥상 배수구 및 외부 우수관 낙엽/이물질 사전 제거",
              "🪟 창틀 및 외벽 누수 위험 구역 닫힘 상태 사전 점검",
            ],
          };
        }
        // 4. 폭설 (Snow codes: 73, 75, 86)
        else if ([73, 75, 86].includes(weatherCode)) {
          hazard = {
            type: "heavy_snow",
            severity: "high",
            title: `☃️ [폭설 주의보] 강설 및 미끄럼 위험`,
            description: "건물 주출입구 미끄럼 사고 및 캐노피/옥상 구조물 적설 하중 위험이 있습니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🧊 건물 주출입구 미끄럼 방지 매트 설치 및 경사로 제설제 사전 살포",
              "🧹 옥상 및 유리 캐노피 적설량 확인 및 과중량 예방 제설",
            ],
          };
        }
        // 5. 강풍 (Wind speed >= 35 km/h)
        else if (windSpeedMax >= 35) {
          hazard = {
            type: "strong_wind",
            severity: "high",
            title: `💨 [강풍 경보] 최대풍속 ${windSpeedMax}km/h 돌풍 비상`,
            description: "옥상 부착물 낙하 및 창문/간판 파손 위험이 있습니다.",
            targetDate: dateShort,
            dayName,
            tempMax,
            tempMin,
            actions: [
              "🚩 옥상 간판, 현수막, 외벽 파라펫 고정물 이탈 방지 조치",
              "🚪 옥상 출입문 및 공용 창문 잠금 상태 점검",
            ],
          };
        }

        return {
          date: tStr,
          dayName,
          isToday: tStr === todayStr || idx === 0,
          weatherCode,
          tempMax,
          tempMin,
          windSpeedMax,
          hazard,
        };
      });

      setWeatherList(daily);
    } catch (err: any) {
      console.error(err);
      setError("날씨 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const toggleActionCheck = (key: string) => {
    setCheckedActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCardClick = (item: DailyWeather) => {
    if (item.hazard) {
      setSelectedHazard(item.hazard);
      setIsModalOpen(true);
    }
  };

  const getWeatherIconAndLabel = (code: number) => {
    switch (code) {
      case 0:
        return { icon: <Sun className="w-5 h-5 text-amber-500" />, label: "맑음" };
      case 1:
      case 2:
        return { icon: <CloudSun className="w-5 h-5 text-sky-400" />, label: "구름조금" };
      case 3:
        return { icon: <Cloud className="w-5 h-5 text-slate-400" />, label: "흐림" };
      case 45:
      case 48:
        return { icon: <Cloud className="w-5 h-5 text-slate-300" />, label: "안개" };
      case 51:
      case 53:
      case 55:
      case 61:
      case 63:
      case 65:
      case 80:
      case 81:
      case 82:
        return { icon: <CloudRain className="w-5 h-5 text-blue-500" />, label: "비" };
      case 71:
      case 73:
      case 75:
      case 77:
      case 85:
      case 86:
        return { icon: <CloudSnow className="w-5 h-5 text-indigo-300" />, label: "눈" };
      case 95:
      case 96:
      case 99:
        return { icon: <CloudLightning className="w-5 h-5 text-purple-500" />, label: "뇌우" };
      default:
        return { icon: <Sun className="w-5 h-5 text-amber-500" />, label: "맑음" };
    }
  };

  const hazardCount = weatherList.filter((w) => w.hazard).length;
  const todayWeather = weatherList.find((w) => w.isToday) || weatherList[0];
  const { icon: todayIcon, label: todayLabel } = todayWeather
    ? getWeatherIconAndLabel(todayWeather.weatherCode)
    : { icon: <Sun className="w-4 h-4 text-amber-500" />, label: "맑음" };

  return (
    <div className="space-y-3">
      {/* 📱 MOBILE COMPACT WEATHER BAR (Only visible on mobile screens `sm:hidden`) */}
      <div className="block sm:hidden">
        <Card className="border bg-card/90 backdrop-blur shadow-sm overflow-hidden">
          {/* Single Compact Header Line */}
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="shrink-0">{todayIcon}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span>오늘 날씨</span>
                  <span className="text-muted-foreground">({todayLabel})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <span className="text-red-500">{todayWeather?.tempMax}°</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-sky-500">{todayWeather?.tempMin}°</span>
                  {hazardCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1.5 py-0 ml-1 animate-pulse shrink-0"
                      onClick={() => {
                        const firstHaz = weatherList.find((w) => w.hazard)?.hazard;
                        if (firstHaz) {
                          setSelectedHazard(firstHaz);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      🚨 위협 경보 {hazardCount}건
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Toggle Button for 7-Day breakdown */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
              className="h-8 px-2.5 text-xs gap-1 shrink-0"
            >
              <span>주간 날씨</span>
              {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Expandable Horizontal Ribbon on Mobile */}
          {isMobileExpanded && (
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

              {/* Horizontal Scroll Ribbon for Mobile */}
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
                          ? "bg-red-500/10 border-red-400 font-bold ring-1 ring-red-500/40"
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

      {/* 💻 DESKTOP & TABLET WEATHER BAR CARD (Only visible on screens `hidden sm:block`) */}
      <div className="hidden sm:block">
        <Card className="border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold">대한민국 기상청 연동 일주일 날씨 예보</span>
              {hazardCount > 0 && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  🚨 위협 날씨 {hazardCount}건 (날짜 클릭시 대처 가이드)
                </Badge>
              )}
            </div>

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
          </CardHeader>

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

                      {/* Hazard Warning Badge on Card */}
                      {hasHazard && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0 mb-1 animate-pulse">
                          {item.hazard?.type === "heat" && "🚨 폭염주의"}
                          {item.hazard?.type === "freeze" && "❄️ 동파경보"}
                          {item.hazard?.type === "heavy_rain" && "🌧️ 폭우주의"}
                          {item.hazard?.type === "heavy_snow" && "☃️ 폭설주의"}
                          {item.hazard?.type === "strong_wind" && "💨 강풍주의"}
                        </Badge>
                      )}

                      <div className="my-1">{icon}</div>
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>

                      {/* Temp High / Low */}
                      <div className="flex items-center gap-1.5 text-xs font-extrabold mt-auto pt-1 border-t w-full justify-center">
                        <span className="text-red-500" title="최고 기온">
                          {item.tempMax}°
                        </span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-sky-500" title="최저 기온">
                          {item.tempMin}°
                        </span>
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
        </Card>
      </div>

      {/* 🚨 HAZARD POPUP DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg border-2 border-red-500 bg-background text-foreground">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base sm:text-lg font-extrabold">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span>{selectedHazard?.targetDate} ({selectedHazard?.dayName}) 건물 관리 비상 경보</span>
            </DialogTitle>
          </DialogHeader>

          {selectedHazard && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-300 dark:border-red-900 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-red-700 dark:text-red-300 text-sm sm:text-base">
                    {selectedHazard.title}
                  </h3>
                  <Badge variant={selectedHazard.severity === "critical" ? "destructive" : "outline"}>
                    {selectedHazard.severity === "critical" ? "심각" : "경고"}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-background/60 p-2 rounded-lg border">
                  <span>예상 기온:</span>
                  <span className="text-red-500 font-extrabold">최고 {selectedHazard.tempMax}°C</span>
                  <span>/</span>
                  <span className="text-sky-500 font-extrabold">최저 {selectedHazard.tempMin}°C</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{selectedHazard.description}</p>
              </div>

              {/* Action Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                  <span>📋 현장 건물 관리자 필수 대처 액션 체크리스트</span>
                </h4>

                <div className="space-y-2 bg-muted/30 p-3 rounded-xl border">
                  {selectedHazard.actions.map((actionText, aIdx) => {
                    const key = `${selectedHazard.targetDate}-${aIdx}`;
                    const isChecked = !!checkedActions[key];

                    return (
                      <div
                        key={aIdx}
                        onClick={() => toggleActionCheck(key)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
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
                        <span className="text-xs font-medium leading-tight">{actionText}</span>
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
