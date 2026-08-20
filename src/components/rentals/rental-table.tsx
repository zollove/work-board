"use client";

import { useState } from "react";
import { useRentals } from "@/hooks/use-rentals";
import { Rental } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RentalTable() {
  const { rentals, addRental, updateRental, deleteRental } = useRentals();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editRental, setEditRental] = useState<Rental | null>(null);

  const [formData, setFormData] = useState({
    building: "",
    room: "",
    tenantName: "",
    contact: "",
    deposit: 0,
    rent: 0,
    leasedArea: "",
    exclusiveArea: "",
    contractStart: "",
    contractEnd: "",
    notes: "",
  });

  const filteredRentals = rentals.filter((r) => {
    return r.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editRental) {
      updateRental(editRental.id, formData);
    } else {
      addRental(formData);
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      building: "",
      room: "",
      tenantName: "",
      contact: "",
      deposit: 0,
      rent: 0,
      leasedArea: "",
      exclusiveArea: "",
      contractStart: "",
      contractEnd: "",
      notes: "",
    });
    setEditRental(null);
  };

  const openEdit = (rental: Rental) => {
    setEditRental(rental);
    setFormData({
      building: rental.building,
      room: rental.room,
      tenantName: rental.tenantName,
      contact: rental.contact,
      deposit: rental.deposit,
      rent: rental.rent,
      leasedArea: rental.leasedArea || "",
      exclusiveArea: rental.exclusiveArea || "",
      contractStart: rental.contractStart,
      contractEnd: rental.contractEnd,
      notes: rental.notes || "",
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="건물명 또는 임차인 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[250px]"
          />
        </div>
        
        <Button onClick={() => { resetForm(); setIsOpen(true); }}>+ 임대 정보 추가</Button>
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsOpen(open);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editRental ? "임대 정보 수정" : "새 임대 정보 추가"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">건물명</Label>
                <Input
                  id="building"
                  required
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">호수</Label>
                <Input
                  id="room"
                  required
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantName">임차인 이름</Label>
                <Input
                  id="tenantName"
                  required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">연락처</Label>
                <Input
                  id="contact"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">보증금 (원)</Label>
                <Input
                  id="deposit"
                  type="number"
                  required
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent">월세 (원)</Label>
                <Input
                  id="rent"
                  type="number"
                  required
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leasedArea">임대면적</Label>
                <Input
                  id="leasedArea"
                  placeholder="예: 120㎡ (36평)"
                  value={formData.leasedArea}
                  onChange={(e) => setFormData({ ...formData, leasedArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusiveArea">전용면적</Label>
                <Input
                  id="exclusiveArea"
                  placeholder="예: 85㎡ (25평)"
                  value={formData.exclusiveArea}
                  onChange={(e) => setFormData({ ...formData, exclusiveArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractStart">계약 시작일</Label>
                <Input
                  id="contractStart"
                  type="date"
                  required
                  value={formData.contractStart}
                  onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractEnd">계약 종료일</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  required
                  value={formData.contractEnd}
                  onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">비고 (특이사항)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Button type="submit" className="w-full">
                  {editRental ? "수정하기" : "저장하기"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>건물/호수</TableHead>
              <TableHead>임차인</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>보증금/월세</TableHead>
              <TableHead>임대/전용면적</TableHead>
              <TableHead>계약 기간</TableHead>
              <TableHead>비고</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  등록된 임대 정보가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">{rental.building} / {rental.room}</TableCell>
                  <TableCell>{rental.tenantName}</TableCell>
                  <TableCell>{rental.contact}</TableCell>
                  <TableCell>
                    {rental.deposit.toLocaleString()} / {rental.rent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rental.leasedArea || rental.exclusiveArea ? (
                      <span>
                        {rental.leasedArea || "-"} / {rental.exclusiveArea || "-"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rental.contractStart} ~ {rental.contractEnd}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap max-w-[200px]">
                    {rental.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(rental)}>
                      수정
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteRental(rental.id)}>
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
