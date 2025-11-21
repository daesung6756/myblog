import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function sendAdminEmail(payload: { name?: string | null; email: string; subject?: string | null; message: string }) {
  // Optional: send an email to admin when a new inquiry arrives using SendGrid.
  // Requires environment variables: SENDGRID_API_KEY and CONTACT_RECEIVER_EMAIL
  const key = process.env.SENDGRID_API_KEY;
  const to = process.env.CONTACT_RECEIVER_EMAIL;

  if (!key || !to) return;

  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: `(문의) ${payload.subject || "새 문의"}`,
      },
    ],
    from: { email: payload.email, name: payload.name || "문의 폼" },
    content: [
      {
        type: "text/plain",
        value: `From: ${payload.name || "익명"} <${payload.email}>
Subject: ${payload.subject || "(제목 없음)"}

${payload.message}`,
      },
    ],
  };

  try {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // ignore email errors
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, website } = body || {};

    // Honeypot anti-spam: bots often fill hidden 'website' fields
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!email || !message) {
      return NextResponse.json({ error: "이메일과 메시지는 필수입니다." }, { status: 400 });
    }

    const payload = {
      name: name || null,
      email,
      subject: subject || null,
      message,
      created_at: new Date().toISOString(),
    } as any;

    const { data, error } = await supabase.from("inquiries").insert([payload]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally notify admin
    sendAdminEmail({ name: payload.name, email: payload.email, subject: payload.subject, message: payload.message });

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, responded } = body || {};
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data, error } = await supabase.from("inquiries").update({ responded: !!responded }).eq("id", id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "서버 오류" }, { status: 500 });
  }
}
