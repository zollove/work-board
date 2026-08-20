import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
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

interface RawSeatItem {
  floor_cd: string;
  floor_nm: string;
  teebox_no: string;
  teebox_nm: string;
  use_status: string; // "0": 빈자리, "1": 이용중, "4": 대기/예약, "8": 점검중, "2": 스크린
  member_nm: string;
  remain_min: string;
  end_datetime: string;
  standby_cnt: number;
  zone_cd: string;
  zone_nm: string;
}

// GET /api/pastel/cron?token=YOUR_CRON_SECRET
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || req.headers.get("Authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.CRON_SECRET || "pastel_cron_secret_key_2026";

  if (token !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized cron token" }, { status: 401 });
  }

  const storeCd = req.nextUrl.searchParams.get("store_cd") || "B9001";

  try {
    // 1. Fetch live seat status directly from Xpartners API
    const res = await fetch(`https://xtouch.xpartners.co.kr/api/seatDashboard/getSeatList?store_cd=${storeCd}`, {
      headers: HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from pastel server", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const rawList: RawSeatItem[] = data.response || [];

    // 2. KST Date & Time Formatting
    const now = new Date();
    // Convert to KST (UTC+9)
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + kstOffset);

    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, "0");
    const day = String(kstDate.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const hours = String(kstDate.getHours()).padStart(2, "0");
    const minutes = String(kstDate.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}`;

    // 3. Extract Active Sessions
    const activeRows: Array<{
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      floor_cd: string;
      floor_nm: string;
      teebox_no: string;
      teebox_nm: string;
      member_name: string;
      gender: string;
      remain_min: number;
    }> = [];

    rawList.forEach((seat) => {
      const isUsing = seat.use_status === "1" || seat.use_status === "4";
      if (isUsing) {
        const rawMemberName = seat.member_nm ? seat.member_nm.trim() : "";
        const isGuest = !rawMemberName;
        const displayMemberName = isGuest ? "비회원/게스트" : rawMemberName;

        const endDatetime = seat.end_datetime || "";
        const endFormatted = endDatetime ? endDatetime.slice(11, 16) : "";

        const sessionId = `${todayStr}_T${seat.teebox_no}_${displayMemberName}_${endFormatted || endDatetime || "ACTIVE"}`;

        const genderResult = isGuest
          ? { gender: "미상" as const, confidence: 0 }
          : inferKoreanGender(displayMemberName);
        const remain = parseInt(seat.remain_min, 10) || 60;

        activeRows.push({
          id: sessionId,
          date: todayStr,
          start_time: currentTimeStr,
          end_time: endFormatted || currentTimeStr,
          floor_cd: seat.floor_cd,
          floor_nm: seat.floor_nm,
          teebox_no: seat.teebox_no,
          teebox_nm: seat.teebox_nm,
          member_name: displayMemberName,
          gender: genderResult.gender,
          remain_min: remain,
        });
      }
    });

    // 4. Upsert active sessions into Supabase DB
    if (activeRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("pastel_sessions")
        .upsert(activeRows, { onConflict: "id" });

      if (upsertError) {
        console.error("Cron Supabase upsert error:", upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: kstDate.toISOString(),
      date: todayStr,
      time: currentTimeStr,
      activeSeatsCount: activeRows.length,
      upsertedCount: activeRows.length,
    });
  } catch (err) {
    console.error("Cron execution error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
