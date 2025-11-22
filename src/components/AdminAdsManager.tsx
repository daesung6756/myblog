"use client";
import React, { useEffect, useState } from "react";

const DEFAULT_AD_CODE_1 = `<div class="ad-contact-banner" style="display:block; width:100%; box-sizing:border-box; padding: clamp(12px, 4vw, 20px); border-radius:12px; background: linear-gradient(90deg, #06b6d4, #3b82f6); color:#fff; text-align:center;">\n  <p style="margin:0 0 8px 0; font-size:clamp(14px,3.5vw,16px); font-weight:700;">블로그에 광고 배너를 게재</p>\n  <p style="margin:0 0 12px 0; font-size:clamp(12px,3vw,14px); opacity:0.95;">문의는 아래 버튼으로!</p>\n  <a href="/contact?topic=advertise" style="display:inline-block; background:#fff; color:#0369a1; padding:8px 16px; border-radius:8px; font-weight:700; text-decoration:none; font-size:clamp(12px,3vw,14px);">광고 문의하기</a>\n</div>`;

const DEFAULT_AD_CODE_2 = `<a href="https://dutch-pay-lemon.vercel.app/" target="_blank" rel="noopener noreferrer" style="display: block;">\n  <picture>\n    <!-- 데스크톱(large)에서 노출할 이미지 -->\n    <source\n      media="(min-width: 1024px)"\n      srcset="https://clgeftofunbnvcfhcgkx.supabase.co/storage/v1/object/public/blog-images/1763692630466-Gemini_Generated_Image_9lk4ll9lk4ll9lk4.webp"\n    />\n    <!-- 그 외(모바일)에서 노출할 이미지 -->\n    <img\n      src="https://clgeftofunbnvcfhcgkx.supabase.co/storage/v1/object/public/blog-images/1763693482502-Gemini_Generated_Image_w4p41tw4p41tw4p4.webp"\n      alt="광고 배너"\n      loading="lazy"\n      style="width: 100%; height: auto; max-height: 350px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block;"\n    />\n  </picture>\n</a>`;

export default function AdminAdsManager() {
  const [ad1, setAd1] = useState("");
  const [ad2, setAd2] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored1 = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode1") : null;
    const stored2 = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode2") : null;
    setAd1(stored1 ?? DEFAULT_AD_CODE_1);
    setAd2(stored2 ?? DEFAULT_AD_CODE_2);
  }, []);

  const resetAd1 = () => setAd1(DEFAULT_AD_CODE_1);
  const resetAd2 = () => setAd2(DEFAULT_AD_CODE_2);

  const save = (which: 1 | 2) => {
    try {
      if (which === 1) {
        localStorage.setItem("admin:defaultAdCode1", ad1);
      } else {
        localStorage.setItem("admin:defaultAdCode2", ad2);
      }
      setStatus("저장되었습니다.");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) {
      setStatus("저장에 실패했습니다.");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("클립보드에 복사되었습니다.");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) {
      setStatus("복사에 실패했습니다.");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">광고 코드 1 (모바일 상단)</h2>
        <p className="text-sm text-gray-600 mb-2">모바일 상단에 노출되는 기본 광고 코드입니다. 포스트 작성 시 초기값으로 사용됩니다.</p>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={resetAd1} className="px-3 py-1 rounded border">초기화</button>
          <button type="button" onClick={() => copyToClipboard(ad1)} className="px-3 py-1 rounded border">복사</button>
          <button type="button" onClick={() => save(1)} className="px-3 py-1 rounded bg-linear-to-r from-blue-600 to-pink-500 text-white">저장</button>
        </div>
        <textarea value={ad1} onChange={(e) => setAd1(e.target.value)} rows={8} className="w-full p-3 border rounded font-mono text-xs" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">광고 코드 2 (모바일 하단)</h2>
        <p className="text-sm text-gray-600 mb-2">모바일 하단에 노출되는 기본 광고 이미지 코드입니다.</p>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={resetAd2} className="px-3 py-1 rounded border">초기화</button>
          <button type="button" onClick={() => copyToClipboard(ad2)} className="px-3 py-1 rounded border">복사</button>
          <button type="button" onClick={() => save(2)} className="px-3 py-1 rounded bg-linear-to-r from-blue-600 to-pink-500 text-white">저장</button>
        </div>
        <textarea value={ad2} onChange={(e) => setAd2(e.target.value)} rows={10} className="w-full p-3 border rounded font-mono text-xs" />
      </div>

      {status && <div className="text-sm text-green-600">{status}</div>}
    </div>
  );
}
