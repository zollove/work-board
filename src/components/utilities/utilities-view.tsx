"use client";

import { useState } from "react";
import { useUtilities } from "@/hooks/use-utilities";
import { useRentals } from "@/hooks/use-rentals";
import { InspectionItem, InventoryItem, PasscodeItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wrench, 
  Bell, 
  Package, 
  Key, 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Sparkles, 
  Building2, 
  Phone,
  Check
} from "lucide-react";

export function UtilitiesView() {
  const [activeTab, setActiveTab] = useState<"inspections" | "inventories" | "passcodes" | "expirations">("inspections");

  const {
    inspections,
    inventories,
    passcodes,
    addInspection,
    toggleInspectionDone,
    deleteInspection,
    addInventory,
    updateInventoryQty,
    deleteInventory,
    addPasscode,
    deletePasscode,
  } = useUtilities();

  const { rentals } = useRentals();

  // Modal Open States
  const [isInspModalOpen, setIsInspModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Form States
  const [inspTitle, setInspTitle] = useState("");
  const [inspDate, setInspDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspCycle, setInspCycle] = useState("월간");
  const [inspNotes, setInspNotes] = useState("");

  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState("5");
  const [invMinQty, setInvMinQty] = useState("2");
  const [invCategory, setInvCategory] = useState("전기/소모품");
  const [invNotes, setInvNotes] = useState("");

  const [passTitle, setPassTitle] = useState("");
  const [passCode, setPassCode] = useState("");
  const [passCategory, setPassCategory] = useState("공용현관");
  const [passNotes, setPassNotes] = useState("");

  // Passcode Masking State (record of id -> isRevealed)
  const [revealedPasscodes, setRevealedPasscodes] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasscodeReveal = (id: string) => {
    setRevealedPasscodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Handlers
  const handleInspSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspTitle.trim()) return;
    await addInspection({
      title: inspTitle.trim(),
      targetDate: inspDate,
      cycle: inspCycle,
      notes: inspNotes.trim(),
      isDone: false,
    });
    setIsInspModalOpen(false);
    setInspTitle("");
    setInspNotes("");
  };

  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;
    await addInventory({
      name: invName.trim(),
      quantity: Number(invQty) || 0,
      minQuantity: Number(invMinQty) || 0,
      category: invCategory,
      notes: invNotes.trim(),
    });
    setIsInvModalOpen(false);
    setInvName("");
    setInvNotes("");
  };

  const handlePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passTitle.trim() || !passCode.trim()) return;
    await addPasscode({
      title: passTitle.trim(),
      code: passCode.trim(),
      category: passCategory,
      notes: passNotes.trim(),
    });
    setIsPassModalOpen(false);
    setPassTitle("");
    setPassCode("");
    setPassNotes("");
  };

  // --- D-DAY HELPER ---
  const calculateDDay = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // --- EXPIRATIONS LOGIC FOR RENTALS ---
  const rentalsWithDDay = rentals.map((r) => {
    const dDay = calculateDDay(r.contractEnd);
    return { ...r, dDay };
  }).sort((a, b) => a.dDay - b.dDay);

  const urgentExpirations = rentalsWithDDay.filter((r) => r.dDay <= 90);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>건물 관리 업무 유틸리티 Hub</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              법정 점검 일정, 비품 재고, 비밀번호 보관함 및 임대 만기 D-90일 알림을 한곳에서 관리하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-muted/50 p-1.5 rounded-2xl border">
        <Button
          variant={activeTab === "inspections" ? "default" : "ghost"}
          onClick={() => setActiveTab("inspections")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>1. 법정 의무 점검</span>
          {inspections.filter((i) => !i.isDone && calculateDDay(i.targetDate) <= 15).length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
              {inspections.filter((i) => !i.isDone && calculateDDay(i.targetDate) <= 15).length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === "inventories" ? "default" : "ghost"}
          onClick={() => setActiveTab("inventories")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Package className="w-4 h-4 text-emerald-500" />
          <span>2. 비품/자재 재고</span>
          {inventories.filter((i) => i.quantity <= i.minQuantity).length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              부족 {inventories.filter((i) => i.quantity <= i.minQuantity).length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === "passcodes" ? "default" : "ghost"}
          onClick={() => setActiveTab("passcodes")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <Key className="w-4 h-4 text-indigo-500" />
          <span>3. 비번 보관함</span>
        </Button>

        <Button
          variant={activeTab === "expirations" ? "default" : "ghost"}
          onClick={() => setActiveTab("expirations")}
          className="gap-2 py-3 text-xs sm:text-sm font-semibold rounded-xl"
        >
          <CalendarClock className="w-4 h-4 text-rose-500" />
          <span>4. 만기 D-90일 알림</span>
          {urgentExpirations.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
              D-90 {urgentExpirations.length}건
            </Badge>
          )}
        </Button>
      </div>

      {/* TAB 1: 🔔 법정 의무 점검 D-Day 알림기 */}
      {activeTab === "inspections" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>법정 정기 점검 D-Day 관리 (승강기, 소방, 저수조 등)</span>
            </h2>
            <Button size="sm" onClick={() => setIsInspModalOpen(true)} className="gap-1 text-xs">
              <Plus className="w-4 h-4" /> 점검 항목 추가
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspections.map((item) => {
              const dDay = calculateDDay(item.targetDate);
              const isUrgent = !item.isDone && dDay <= 7;
              const isWarning = !item.isDone && dDay > 7 && dDay <= 15;

              return (
                <Card
                  key={item.id}
                  className={`border transition-all ${
                    item.isDone
                      ? "bg-muted/30 opacity-70"
                      : isUrgent
                      ? "border-red-500/80 bg-red-500/5 ring-1 ring-red-500/30"
                      : isWarning
                      ? "border-amber-500/80 bg-amber-500/5"
                      : "bg-card"
                  }`}
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleInspectionDone(item.id)} className="cursor-pointer">
                        {item.isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      <Badge variant="outline" className="text-[10px]">
                        {item.cycle}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isDone ? (
                        <Badge className="bg-emerald-600 text-white text-[10px]">점검 완료</Badge>
                      ) : dDay < 0 ? (
                        <Badge variant="destructive" className="text-[10px] animate-pulse">
                          🚨 D+{Math.abs(dDay)}일 경과
                        </Badge>
                      ) : dDay === 0 ? (
                        <Badge variant="destructive" className="text-[10px] animate-pulse">
                          🚨 오늘 점검일!
                        </Badge>
                      ) : isUrgent ? (
                        <Badge variant="destructive" className="text-[10px] animate-pulse">
                          🚨 D-{dDay}일 임박
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          D-{dDay}일
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInspection(item.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2">
                    <h3 className={`font-bold text-sm leading-snug ${item.isDone ? "line-through text-muted-foreground" : ""}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>예정일: {item.targetDate}</span>
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground/80 bg-muted/40 p-2 rounded-lg leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 🛠️ 유지보수 비품 & 자재 재고 관리기 */}
      {activeTab === "inventories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              <span>건물 유지보수 비품 & 자재 재고 관리</span>
            </h2>
            <Button size="sm" onClick={() => setIsInvModalOpen(true)} className="gap-1 text-xs">
              <Plus className="w-4 h-4" /> 새 비품 등록
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventories.map((item) => {
              const isLow = item.quantity <= item.minQuantity;

              return (
                <Card
                  key={item.id}
                  className={`border transition-all ${
                    isLow ? "border-red-400 bg-red-500/5 ring-1 ring-red-500/30" : "bg-card"
                  }`}
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {item.category}
                    </Badge>
                    {isLow ? (
                      <Badge variant="destructive" className="text-[10px] animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>재고 부족 (구매 필요)</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                        적정 재고
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm">{item.name}</h3>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>

                    {/* Quantity Control Buttons */}
                    <div className="flex items-center justify-between bg-muted/40 p-2 rounded-xl border">
                      <span className="text-xs text-muted-foreground font-semibold">
                        최소 기준: {item.minQuantity}개
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInventoryQty(item.id, -1)}
                          className="h-7 w-7 p-0 text-sm font-bold"
                        >
                          -
                        </Button>
                        <span className={`text-base font-extrabold px-2 ${isLow ? "text-red-500" : "text-emerald-600"}`}>
                          {item.quantity}개
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInventoryQty(item.id, 1)}
                          className="h-7 w-7 p-0 text-sm font-bold"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInventory(item.id)}
                        className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> 삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 🔑 공용 현관 & 공실 비밀번호 보관함 */}
      {activeTab === "passcodes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>공용 현관 & 공실 비밀번호 보관함</span>
            </h2>
            <Button size="sm" onClick={() => setIsPassModalOpen(true)} className="gap-1 text-xs">
              <Plus className="w-4 h-4" /> 비번 등록
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passcodes.map((item) => {
              const isRevealed = !!revealedPasscodes[item.id];
              const isCopied = copiedId === item.id;

              return (
                <Card key={item.id} className="border bg-card shadow-sm">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-400">
                      {item.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePasscode(item.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>

                    {/* Passcode Mask & Copy Box */}
                    <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-xl">
                      <div className="font-mono font-extrabold text-base tracking-widest">
                        {isRevealed ? item.code : "••••••••"}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePasscodeReveal(item.id)}
                          className="h-8 w-8 text-slate-300 hover:text-white"
                          title={isRevealed ? "비번 숨기기" : "비번 표시"}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.code, item.id)}
                          className="h-8 text-xs gap-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? "복사됨!" : "복사"}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 📋 임대 계약 만기 D-90일 알림 타임라인 */}
      {activeTab === "expirations" && (
        <div className="space-y-4">
          <div className="bg-rose-500/10 border border-rose-300 dark:border-rose-900 p-4 rounded-2xl space-y-1">
            <h2 className="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              <span>계약 만기 D-90일 임박 타임라인 (묵시적 갱신 예방)</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              주택/상가 임대차보호법상 만기 6개월~2개월 전 재계약 의사를 타진하지 않으면 묵시적 갱신이 됩니다. 만기 D-90일 임박 호실을 확인하고 사전에 연락하세요.
            </p>
          </div>

          <div className="space-y-3">
            {rentalsWithDDay.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                등록된 임대차 계약이 없습니다. [임대현황] 탭에서 계약을 등록해 보세요.
              </div>
            ) : (
              rentalsWithDDay.map((r) => {
                const isUrgent = r.dDay <= 90;
                const isVeryUrgent = r.dDay <= 30;

                return (
                  <Card
                    key={r.id}
                    className={`border transition-all ${
                      isVeryUrgent
                        ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/30"
                        : isUrgent
                        ? "border-rose-400 bg-rose-500/5 ring-1 ring-rose-400/30"
                        : "bg-card"
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-foreground">{r.building} {r.room}</span>
                          <span className="text-xs font-bold text-muted-foreground">({r.tenantName})</span>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              🚨 D-90일 묵시적 갱신 주의
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>보증금: {r.deposit}만원 / 월세: {r.rent}만원</span>
                          <span>|</span>
                          <span>계약 만기일: <b className="text-foreground">{r.contractEnd}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {r.contact && (
                          <a
                            href={`tel:${r.contact}`}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline bg-primary/10 px-2.5 py-1.5 rounded-lg"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{r.contact}</span>
                          </a>
                        )}

                        <Badge
                          variant={r.dDay <= 30 ? "destructive" : r.dDay <= 90 ? "default" : "secondary"}
                          className="text-xs font-extrabold px-3 py-1"
                        >
                          {r.dDay < 0
                            ? `만기 ${Math.abs(r.dDay)}일 지나침`
                            : r.dDay === 0
                            ? "오늘 만기!"
                            : `만기 D-${r.dDay}일`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 1. INSPECTION ADD MODAL */}
      <Dialog open={isInspModalOpen} onOpenChange={setIsInspModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>법정 정기 점검 항목 추가</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInspSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="insp-title">점검명</Label>
              <Input
                id="insp-title"
                required
                placeholder="예: 승강기 정기점검, 소방점검"
                value={inspTitle}
                onChange={(e) => setInspTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insp-date">다음 점검 예정일</Label>
              <Input
                id="insp-date"
                type="date"
                required
                value={inspDate}
                onChange={(e) => setInspDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insp-cycle">점검 주기</Label>
              <select
                id="insp-cycle"
                className="w-full h-10 rounded-md border px-3 py-2 text-sm bg-background"
                value={inspCycle}
                onChange={(e) => setInspCycle(e.target.value)}
              >
                <option value="월간">월간 (매월)</option>
                <option value="분기">분기 (3개월)</option>
                <option value="반기">반기 (6개월)</option>
                <option value="연간">연간 (1년)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insp-notes">비고 / 업체 메모</Label>
              <Textarea
                id="insp-notes"
                rows={2}
                placeholder="담당 검사원 연락처, 제출 서류 메모 등"
                value={inspNotes}
                onChange={(e) => setInspNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                점검 일정 추가
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsInspModalOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. INVENTORY ADD MODAL */}
      <Dialog open={isInvModalOpen} onOpenChange={setIsInvModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>유지보수 비품 등록</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inv-name">비품명</Label>
              <Input
                id="inv-name"
                required
                placeholder="예: 도어락 AA 건전지, LED 삼구 램프"
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-qty">현재 보유 수량</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  required
                  value={invQty}
                  onChange={(e) => setInvQty(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-min-qty">최소 유지 수량 (알림 기준)</Label>
                <Input
                  id="inv-min-qty"
                  type="number"
                  required
                  value={invMinQty}
                  onChange={(e) => setInvMinQty(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-cat">카테고리</Label>
              <select
                id="inv-cat"
                className="w-full h-10 rounded-md border px-3 py-2 text-sm bg-background"
                value={invCategory}
                onChange={(e) => setInvCategory(e.target.value)}
              >
                <option value="전기/소모품">전기/소모품</option>
                <option value="조명/전등">조명/전등</option>
                <option value="제설/안전">제설/안전</option>
                <option value="수도/배관">수도/배관</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-notes">메모 / 구매 링크</Label>
              <Textarea
                id="inv-notes"
                rows={2}
                placeholder="규격, 모델명, 구매 사이트 메모"
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                비품 저장
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsInvModalOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. PASSCODE ADD MODAL */}
      <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>비밀번호 보관함 등록</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePassSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pass-title">항목명 / 위치</Label>
              <Input
                id="pass-title"
                required
                placeholder="예: 1층 로비폰 비번, 201호 공실 비번"
                value={passTitle}
                onChange={(e) => setPassTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pass-code">비밀번호</Label>
              <Input
                id="pass-code"
                required
                placeholder="예: 1234*, 7788#"
                value={passCode}
                onChange={(e) => setPassCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pass-cat">분류</Label>
              <select
                id="pass-cat"
                className="w-full h-10 rounded-md border px-3 py-2 text-sm bg-background"
                value={passCategory}
                onChange={(e) => setPassCategory(e.target.value)}
              >
                <option value="공용현관">공용현관</option>
                <option value="공실도어락">공실도어락</option>
                <option value="기계실/옥상">기계실/옥상</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pass-notes">메모 (선택)</Label>
              <Textarea
                id="pass-notes"
                rows={2}
                placeholder="안내 대상, 변경 날짜 메모"
                value={passNotes}
                onChange={(e) => setPassNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                비번 저장
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsPassModalOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
