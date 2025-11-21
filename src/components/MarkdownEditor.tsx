"use client";
import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import imageCompression from "browser-image-compression";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });
import "easymde/dist/easymde.min.css";

export default function MarkdownEditor({
  value: initial = "",
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const editorRef = useRef<any>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '💪', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐',
    '💯', '🔥', '💥', '✨', '🌟', '💫', '⚡', '💡', '❤️', '💙',
    '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  ];

  const insertText = (text: string) => {
    const textarea = document.querySelector(".EasyMDEContainer .CodeMirror") as any;
    if (!textarea?.CodeMirror) return;

    const cm = textarea.CodeMirror;
    const doc = cm.getDoc();
    doc.replaceSelection(text);
    cm.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 이미지 압축 옵션 (더 강한 압축)
      const options = {
        maxSizeMB: 0.5, // 최대 파일 크기 500KB
        maxWidthOrHeight: 1280, // 최대 해상도 낮춤
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.6, // 품질 60%
      };

      // 이미지 압축
      const compressedFile = await imageCompression(file, options);
      
      // 압축 후에도 너무 크면 추가 압축
      let finalFile = compressedFile;
      if (compressedFile.size > 500 * 1024) {
        const options2 = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.5,
        };
        finalFile = await imageCompression(compressedFile, options2);
      }
      
      console.log('원본 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('압축 후 크기:', (finalFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', finalFile);

      // API 라우트를 통해 업로드
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '업로드 실패');
      }

      const data = await response.json();
      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다. 파일 크기를 확인해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      insertText(`<img src="${imageUrl}" alt="${imageAlt}" />`);
      setImageUrl("");
      setImageAlt("");
      setImageDialogOpen(false);
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      insertText(`<a href="${linkUrl}">${linkText || linkUrl}</a>`);
      setLinkUrl("");
      setLinkText("");
      setLinkDialogOpen(false);
    }
  };

  const insertLineBreak = () => {
    insertText('<br />\n');
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    setEmojiDialogOpen(false);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background mb-2 flex justify-between items-center pb-2 border-b">
        <div className="flex gap-2">
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🖼️ 이미지 삽입
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>이미지 삽입</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-file">이미지 파일 업로드</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {isUploading && (
                    <p className="text-sm text-muted-foreground mt-1">업로드 중...</p>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">또는</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-url">이미지 URL</Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-alt">대체 텍스트</Label>
                  <Input
                    id="image-alt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="이미지 설명"
                  />
                </div>
                <Button 
                  onClick={handleInsertImage} 
                  className="w-full"
                  disabled={!imageUrl || isUploading}
                >
                  삽입
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔗 링크
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>링크 삽입</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-url">링크 URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-text">링크 텍스트</Label>
                  <Input
                    id="link-text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="링크 텍스트"
                  />
                </div>
                <Button onClick={handleInsertLink} className="w-full">
                  삽입
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertLineBreak}
            className="text-xs"
          >
            ↵ 줄바꿈
          </Button>
        </div>
        
        <Dialog open={emojiDialogOpen} onOpenChange={setEmojiDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              😀
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>이모지 선택</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* @ts-ignore */}
      <SimpleMDE
        ref={editorRef}
        value={value}
        onChange={(v: string) => {
          setValue(v);
          onChange?.(v);
        }}
      />
    </div>
  );
}
