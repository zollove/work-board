import { RentalTable } from "@/components/rentals/rental-table";

export default function RentalsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">임대현황</h1>
        <p className="text-muted-foreground mt-2">
          건물/호수별 임대 및 수납 상태를 한눈에 파악하세요.
        </p>
      </div>
      <RentalTable />
    </div>
  );
}
