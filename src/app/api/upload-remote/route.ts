import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;
    if (!url) {
      return NextResponse.json({ success: 0, error: "No URL provided" }, { status: 400 });
    }

    const fetched = await fetch(url);
    if (!fetched.ok) {
      return NextResponse.json({ success: 0, error: "Failed to fetch remote image" }, { status: 400 });
    }

    const arrayBuffer = await fetched.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // compress/convert to WebP at 60% quality
    const compressedBuffer = await sharp(buffer).webp({ quality: 60 }).toBuffer();

    // derive a filename from timestamp + original name (if any)
    let originalName = "remote-image";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        originalName = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
      }
    } catch (e) {}

    const timestamp = Date.now();
    const fileName = `${timestamp}-${originalName}.webp`;

    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, compressedBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ success: 0, error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("blog-images").getPublicUrl(fileName);

    return NextResponse.json({ success: 1, file: { url: publicData.publicUrl } });
  } catch (err: any) {
    console.error("upload-remote error:", err);
    return NextResponse.json({ success: 0, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
