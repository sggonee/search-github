'use client';

import { useEffect, useRef } from 'react';

// --- JavaScript 기반 아바타 필터 ---
// WebAssembly 대신, HTML5 Canvas API 만으로 간단한 필터를 적용합니다.
// - 원형 마스크는 draw 단계에서 처리
// - 여기에선 픽셀 레벨에서 약간의 그레이톤 + 밝기 보정 정도만 적용
function applyAvatarFilterWithCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  // 간단한 그레이톤 + 살짝 밝기 보정 필터
  // (성능에 크게 부담되지 않는 수준의 JS-only 처리)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = (r + g + b) / 3;
    const mix = 0.6; // 0이면 원본, 1이면 완전 회색
    let nr = r * (1 - mix) + gray * mix;
    let ng = g * (1 - mix) + gray * mix;
    let nb = b * (1 - mix) + gray * mix;

    // 살짝 밝게
    const boost = 1.05;
    nr = Math.min(255, nr * boost);
    ng = Math.min(255, ng * boost);
    nb = Math.min(255, nb * boost);

    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }

  ctx.putImageData(imageData, 0, 0);
}

interface Props {
  url: string;
}

export default function User({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const d = canvas.width;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      // 원형 아바타 마스크
      ctx.beginPath();
      ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, sx, sy, size, size, 0, 0, d, d);
      ctx.restore();

      // JavaScript 기반 Canvas 필터 적용
      applyAvatarFilterWithCanvas(canvas);
    };
  }, [url]);

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
      {/* 
        Canvas 엘리먼트: 
        - data-avatar-src 에 GitHub avatar_url 을 담아두고
        - 클라이언트에서 WebAssembly 모듈이 이 값을 읽어 Canvas 에 랜더링하도록 구성할 수 있습니다.
      */}
      <canvas
        ref={canvasRef}
        width={40}
        height={40}
        data-avatar-src={url}
        className="w-full h-full block bg-slate-100"
      />
    </div>
  );
}
