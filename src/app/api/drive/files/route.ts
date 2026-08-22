import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: number;
  formattedSize: string;
  modifiedTime: string;
  formattedDate: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
}

export async function GET(req: NextRequest) {
  let token: string | undefined = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;

  if (!token && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) token = refreshed;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized", isConnected: false }, { status: 401 });
  }

  const folderId = req.nextUrl.searchParams.get("folderId") || "root";
  const searchQuery = req.nextUrl.searchParams.get("q") || "";

  try {
    let qString = "trashed = false";
    if (searchQuery.trim()) {
      qString += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
    } else if (folderId) {
      qString += ` and '${folderId}' in parents`;
    }

    const fields = "files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents)";
    const orderBy = "folder, modifiedTime desc";
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      qString
    )}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=100`;

    const driveRes = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!driveRes.ok) {
      if (driveRes.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          token = refreshed;
          return GET(req);
        }
      }
      const errData = await driveRes.json();
      return NextResponse.json({ error: "Failed to fetch drive files", detail: errData }, { status: driveRes.status });
    }

    const driveData = await driveRes.json();
    const rawFiles = driveData.files || [];

    const files: DriveFileItem[] = rawFiles.map((file: any) => {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const sizeBytes = file.size ? parseInt(file.size, 10) : undefined;

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        isFolder,
        size: sizeBytes,
        formattedSize: formatBytes(sizeBytes, isFolder),
        modifiedTime: file.modifiedTime || "",
        formattedDate: formatDate(file.modifiedTime),
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        parents: file.parents || [],
      };
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error("Drive files fetch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function formatBytes(bytes?: number, isFolder?: boolean): string {
  if (isFolder) return "폴더";
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(
      2,
      "0"
    )} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch (e) {
    return dateStr.slice(0, 10);
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (e) {
    return null;
  }
}
