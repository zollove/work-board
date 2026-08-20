import { NextRequest, NextResponse } from "next/server";
import { inferKoreanGender } from "@/lib/korean-gender";

export const dynamic = "force-dynamic";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://xtouch.xpartners.co.kr/teebox/B9001",
  "X-Requested-With": "XMLHttpRequest",
};

export interface RawSeatItem {
  floor_cd: string;
  floor_nm: string;
  teebox_no: string;
  teebox_nm: string;
  use_status: string; // "0": 빈자리, "1": 이용중, "4": 대기/예약이용, "8": 점검중, "2": 스크린룸
  member_nm: string;
  remain_min: string;
  end_datetime: string;
  standby_cnt: number;
  zone_cd: string;
  zone_nm: string;
}

export interface PastelSeatStats {
  total_cnt: number;
  standby_cnt: number;
  using_cnt: number;
  possible_cnt: number;
  end_time: string;
}

export async function GET(req: NextRequest) {
  const storeCd = req.nextUrl.searchParams.get("store_cd") || "B9001";

  try {
    const [statsRes, listRes] = await Promise.all([
      fetch(`https://xtouch.xpartners.co.kr/api/seatDashboard/getSeatStats?store_cd=${storeCd}`, {
        headers: HEADERS,
        cache: "no-store",
      }),
      fetch(`https://xtouch.xpartners.co.kr/api/seatDashboard/getSeatList?store_cd=${storeCd}`, {
        headers: HEADERS,
        cache: "no-store",
      }),
    ]);

    if (!statsRes.ok || !listRes.ok) {
      return NextResponse.json({ error: "Failed to fetch from pastel server" }, { status: 502 });
    }

    const statsData = await statsRes.json();
    const listData = await listRes.json();

    const stats: PastelSeatStats = statsData.response || {
      total_cnt: 79,
      standby_cnt: 0,
      using_cnt: 0,
      possible_cnt: 0,
      end_time: "22:00",
    };

    const rawList: RawSeatItem[] = listData.response || [];

    // Tag each seat with inferred gender
    const seats = rawList.map((item) => {
      const genderInfo = item.member_nm ? inferKoreanGender(item.member_nm) : { gender: "미상" as const, confidence: 0 };
      return {
        ...item,
        gender: genderInfo.gender,
        genderConfidence: genderInfo.confidence,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      seats,
    });
  } catch (err) {
    console.error("Pastel proxy error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
