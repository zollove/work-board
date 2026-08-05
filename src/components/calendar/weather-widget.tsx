"use client";

import { useEffect, useState } from "react";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  AlertTriangle, 
  Flame, 
  Snowflake, 
  Wind, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  MapPin, 
  ShieldAlert,
  Droplets,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DailyWeather {
  date: string;
  dayName: string;
  isToday: boolean;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeedMax: number;
}

interface HazardAlert {
  type: "heat" | "freeze" | "heavy_rain" | "heavy_snow" | "strong_wind";
  title: string;
  description: string;
  severity: "high" | "critical";
  targetDate: string;
  actions: string[];
}

export function WeatherWidget() {
  const [weatherList, setWeatherList] = useState<DailyWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hazards, setHazards] = useState<HazardAlert[]>([]);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [isActionsOpen, setIsActionsOpen] = useState(true);

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
        return {
          date: tStr,
          dayName,
          isToday: tStr === todayStr || idx === 0,
          weatherCode: data.daily.weathercode[idx],
          tempMax: Math.round(data.daily.temperature_2m_max[idx]),
          tempMin: Math.round(data.daily.temperature_2m_min[idx]),
          windSpeedMax: Math.round(data.daily.windspeed_10m_max[idx] || 0),
        };
      });

      setWeatherList(daily);

      // Evaluate Hazards for Building Management
      const detectedHazards: HazardAlert[] = [];

      daily.forEach((item) => {
        const dateShort = item.date.slice(5).replace("-", "/");

        // 1. 폭염 경보 (Max temp >= 33)
        if (item.tempMax >= 33) {
          detectedHazards.push({
            type: "heat",
            severity: item.tempMax >= 35 ? "critical" : "high",
            title: `☀️ [폭염 주의] 최고 기온 ${item.tempMax}°C 이상 고온 경보 (${dateShort})`,
            description: "냉방 설비 과부하 및 수배전반 화재/정전 위험이 높아집니다.",
            targetDate: dateShort,
            actions: [
              "❄️ 중앙 냉방 및 옥상 수조/냉각탑 온도 점검",
              "⚡ 전력 사용량 급증 대비 옥외 수배전반 발열 점검",
              "👷 옥외 작업자 수분 섭취 및 강제 휴식 시간 보장",
            ],
          });
        }

        // 2. 한파 / 동파 경보 (Min temp <= -5)
        if (item.tempMin <= -5) {
          detectedHazards.push({
            type: "freeze",
            severity: item.tempMin <= -10 ? "critical" : "high",
            title: `❄️ [동파 경보] 최저 기온 ${item.tempMin}°C 한파 및 동파 위험 (${dateShort})`,
            description: "수도 계량기, 노출 배관 동파 및 출입구/램프 결빙 위험이 있습니다.",
            targetDate: dateShort,
            actions: [
              "💧 복도/계단실 수도 계량기 및 외부 노출 배관 보온재/열선 점검",
              "🚪 공용부 창문 및 출입문 밀폐 닫힘 점검 (찬바람 차단)",
              "🧊 지하주차장 램프 구간 결빙 방지 염화칼슘 사전 살포",
            ],
          });
        }

        // 3. 폭우 / 호우 경보 (Rain codes: 63, 65, 81, 82, 95, 96, 99)
        if ([63, 65, 81, 82, 95, 96, 99].includes(item.weatherCode)) {
          detectedHazards.push({
            type: "heavy_rain",
            severity: "critical",
            title: `🌧️ [집중호우 경보] 강우 및 누수/침수 주의 (${dateShort})`,
            description: "지하주차장 침수 및 옥상 우수관 막힘, 외벽 누수 위험이 있습니다.",
            targetDate: dateShort,
            actions: [
              "🌊 지하주차장 차수판(차수막) 설치 준비 및 배수펌프 자동 가동 점검",
              "🧹 옥상 배수구 및 외부 우수관 낙엽/이물질 제거",
              "🪟 창틀 및 외벽 누수 위험 구역 사전에 닫힘 점검",
            ],
          });
        }

        // 4. 폭설 경보 (Snow codes: 73, 75, 86)
        if ([73, 75, 86].includes(item.weatherCode)) {
          detectedHazards.push({
            type: "heavy_snow",
            severity: "high",
            title: `☃️ [폭설 주의보] 강설 및 보행자 미끄럼 위험 (${dateShort})`,
            description: "건물 진입로 미끄럼 사고 및 캐노피/옥상 하중 위험이 있습니다.",
            targetDate: dateShort,
            actions: [
              "🧊 건물 주출입구 미끄럼 방지 매트 설치 및 경사로 제설제 사전 살포",
              "🧹 옥상 및 유리 캐노피 적설량 확인 및 과중량 예방 제설",
            ],
          });
        }

        // 5. 강풍 경보 (Wind speed >= 35 km/h)
        if (item.windSpeedMax >= 35) {
          detectedHazards.push({
            type: "strong_wind",
            severity: "high",
            title: `💨 [강풍 경보] 순간 최대풍속 ${item.windSpeedMax}km/h 돌풍 주의 (${dateShort})`,
            description: "옥상 부착물 낙하 및 창문/간판 파손 위험이 있습니다.",
            targetDate: dateShort,
            actions: [
              "🚩 옥상 간판, 현수막, 외벽 고정물 이탈 방지 조치",
              "🚪 옥상 출입문 및 공용 창문 결쇄 통제",
            ],
          });
        }
      });

      setHazards(detectedHazards);
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

  return (
    <div className="space-y-4">
      {/* 🚨 HAZARD ALERTS & ACTION CHECKLIST BANNER */}
      {hazards.length > 0 && (
        <Card className="border-2 border-red-500/60 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-background shadow-md">
          <CardHeader className="p-4 border-b border-red-500/20 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <CardTitle className="text-sm sm:text-base font-extrabold">
                🚨 [건물 관리 비상] 위협 날씨 경보 {hazards.length}건 발생
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              대응 액션 가이드 {isActionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardHeader>

          {isActionsOpen && (
            <CardContent className="p-4 space-y-4 text-xs sm:text-sm">
              {hazards.map((haz, hIdx) => (
                <div key={hIdx} className="space-y-2 p-3 rounded-lg bg-background/80 border border-red-200 dark:border-red-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-red-700 dark:text-red-300 text-xs sm:text-sm">{haz.title}</h4>
                    <Badge variant={haz.severity === "critical" ? "destructive" : "outline"} className="text-[10px]">
                      {haz.severity === "critical" ? "심각" : "경고"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{haz.description}</p>

                  {/* Actions Checklist */}
                  <div className="mt-2 space-y-1.5 bg-muted/30 p-2.5 rounded-md border">
                    <p className="font-semibold text-[11px] text-foreground mb-1">📋 건물 관리자 현장 대처 액션 체크리스트:</p>
                    {haz.actions.map((act, aIdx) => {
                      const key = `${hIdx}-${aIdx}`;
                      const isChecked = !!checkedActions[key];
                      return (
                        <div
                          key={aIdx}
                          onClick={() => toggleActionCheck(key)}
                          className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                            isChecked ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 line-through opacity-70" : "hover:bg-muted"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs">{act}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* ☀️ 7-DAY WEATHER BAR CARD */}
      <Card className="border bg-card/80 backdrop-blur shadow-sm">
        <CardHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold">대한민국 기상청 연동 일주일 날씨 예보</span>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              최고/최저 기온
            </Badge>
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
                const isDangerous = item.tempMax >= 33 || item.tempMin <= -5 || item.windSpeedMax >= 35;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      item.isToday
                        ? "bg-primary/10 border-primary ring-1 ring-primary/40 font-semibold"
                        : isDangerous
                        ? "bg-red-500/5 border-red-300 dark:border-red-800"
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
