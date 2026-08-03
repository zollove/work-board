import { ContactTable } from "@/components/contacts/contact-table";

export default function ContactsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">업체 연락처 관리</h1>
        <p className="text-muted-foreground mt-2">
          협력 업체 및 거래처 연락처를 관리합니다.
        </p>
      </div>
      <ContactTable />
    </div>
  );
}
