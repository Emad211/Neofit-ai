"use client";

import * as React from "react";
import { Camera, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function FoodCameraLookup() {
  const [permission, setPermission] = React.useState<boolean | null>(null);
  const [captured, setCaptured] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Camera access failed", error);
      setPermission(false);
    }
  }, []);

  React.useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCaptured(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div dir="rtl" className="space-y-4">
      {!permission && (
        <Button onClick={startCamera} className="w-full"><Camera className="ml-2 h-5 w-5" />فعال‌کردن دوربین</Button>
      )}

      {permission === false && (
        <Alert variant="destructive"><AlertTitle>دسترسی دوربین فعال نیست</AlertTitle><AlertDescription>مجوز دوربین را در مرورگر فعال کن یا از بخش جست‌وجوی غذا استفاده کن.</AlertDescription></Alert>
      )}

      {permission && !captured && (
        <Card className="overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full bg-black object-cover" />
          <CardContent className="p-4"><Button onClick={capture} className="w-full"><Camera className="ml-2 h-5 w-5" />ثبت تصویر</Button></CardContent>
        </Card>
      )}

      {captured && (
        <Card className="overflow-hidden">
          <img src={captured} alt="تصویر ثبت‌شدهٔ غذا" className="aspect-video w-full object-cover" />
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />تصویر آماده است</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">در این نسخه تصویر فقط روی دستگاه نمایش داده می‌شود و به سرویس خارجی ارسال نمی‌شود. اتصال تحلیل تصویر در مرحلهٔ مجزای AvalAI انجام خواهد شد.</p>
            <Button variant="outline" onClick={() => setCaptured(null)}><RefreshCw className="ml-2 h-4 w-4" />گرفتن تصویر جدید</Button>
          </CardContent>
        </Card>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
