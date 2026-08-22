import { DriveView } from "@/components/drive/drive-view";

export const metadata = {
  title: "구글 드라이브 (Drive) | Work Board",
  description: "실시간 구글 드라이브 파일 탐색기, 업로드, 다운로드 및 스마트 스크랩",
};

export default function DrivePage() {
  return <DriveView />;
}
