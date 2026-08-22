import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// GET /api/pastel/tracker?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
  }

  try {
    let allRows: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore && page < 20) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("pastel_sessions")
        .select("*")
        .eq("date", date)
        .range(from, to)
        .order("start_time", { ascending: true });

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Map database snake_case columns to camelCase
    const sessions = allRows.map((row: any) => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time || "",
      floorCd: row.floor_cd,
      floorNm: row.floor_nm,
      teeboxNo: row.teebox_no,
      teeboxNm: row.teebox_nm,
      memberName: row.member_name,
      gender: row.gender || "미상",
      remainMin: row.remain_min || 60,
    }));

    return NextResponse.json({ success: true, date, sessions });
  } catch (err) {
    console.error("Tracker GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/pastel/tracker
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessions = body.sessions || [];

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Map camelCase to database snake_case
    const rows = sessions.map((s: any) => ({
      id: s.id,
      date: s.date,
      start_time: s.startTime,
      end_time: s.endTime || "",
      floor_cd: s.floorCd,
      floor_nm: s.floorNm,
      teebox_no: s.teeboxNo,
      teebox_nm: s.teeboxNm,
      member_name: s.memberName,
      gender: s.gender || "미상",
      remain_min: s.remainMin || 60,
    }));

    const { error } = await supabase.from("pastel_sessions").upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Tracker POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
