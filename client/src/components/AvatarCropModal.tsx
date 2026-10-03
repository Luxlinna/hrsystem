import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface AvatarCropModalProps {
  imageSrc: string | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
  onError?: (message: string) => void;
}

// Loads an <img> from a src (object URL or data URL) so it can be drawn to canvas.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the selected image."));
    img.src = src;
  });
}

// Draws the cropped region of `image` onto `canvas`, scaled so the longest
// side is at most `maxSize` px (keeps previews/avatars small and fast).
function drawCroppedImage(
  image: HTMLImageElement,
  pixelCrop: Area,
  canvas: HTMLCanvasElement,
  maxSize: number
) {
  const scale = Math.min(1, maxSize / Math.max(pixelCrop.width, pixelCrop.height));
  const width = Math.max(1, Math.round(pixelCrop.width * scale));
  const height = Math.max(1, Math.round(pixelCrop.height * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );
}

// Crops the source image to `pixelCrop`, downscaling to at most 512px on the
// longest side so avatars stay small in storage.
async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  drawCroppedImage(image, pixelCrop, canvas, 512);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not generate the cropped image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function AvatarCropModal({ imageSrc, saving, onCancel, onConfirm, onError }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const confirmedRef = useRef(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset crop state whenever a new image is opened.
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    confirmedRef.current = false;
  }, [imageSrc]);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Live preview: redraw the small thumbnail whenever the crop changes.
  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const image = await loadImage(imageSrc);
        if (cancelled || !previewCanvasRef.current) return;
        drawCroppedImage(image, croppedAreaPixels, previewCanvasRef.current, 128);
      } catch {
        // Preview is best-effort; ignore draw failures.
      }
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageSrc, croppedAreaPixels]);

  // Only render when there is actually an image to crop — otherwise the modal
  // overlay would permanently cover the page and block all clicks.
  if (!imageSrc) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels || saving || confirmedRef.current) return;
    confirmedRef.current = true;
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (err: any) {
      confirmedRef.current = false;
      onError?.(err.message || "Could not crop the image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60" onClick={saving ? undefined : onCancel}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Crop Profile Photo</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Drag to reposition, use the slider to zoom, then save</p>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Crop area + live preview */}
        <div className="flex gap-4 p-4 bg-[#0F172A]">
          <div className="relative flex-1 h-72 min-w-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                className="rounded-full"
                style={{ width: 80, height: 80 }}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Preview</span>
          </div>
        </div>

        {/* Zoom + actions */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <i className="ri-zoom-out-line text-gray-400 text-sm" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={saving}
              className="flex-1 accent-[#253C7D] cursor-pointer"
            />
            <i className="ri-zoom-in-line text-gray-400 text-sm" />
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 cursor-pointer"
            >
              {saving ? "Uploading..." : "Save Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
