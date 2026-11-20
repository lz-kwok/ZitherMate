import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// 使用本地随包构建的 PDF.js worker，确保离线环境（如平板 App）秒开不依赖外网 CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface OriginalPageAsset {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * 将用户上传的 PDF 逐页渲染为高清原件图片（默认最长边 2000px，0.88 JPEG 质量）
 */
export async function convertPdfToOriginalPages(
  file: File,
  maxDim: number = 2000,
  quality: number = 0.88
): Promise<OriginalPageAsset[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageAssets: OriginalPageAsset[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const rawMaxDim = Math.max(unscaledViewport.width, unscaledViewport.height);
    const targetScale = Math.min(2.5, Math.max(1.0, maxDim / Math.max(1, rawMaxDim)));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext('2d');

    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      pageAssets.push({
        dataUrl: canvas.toDataURL('image/jpeg', quality),
        width: canvas.width,
        height: canvas.height,
      });
    }
  }

  return pageAssets;
}

/**
 * 对拍照或相册导入的图片执行白底平铺与高清约束（默认最长边 2000px，0.88 JPEG 质量）
 */
export async function compressImageToOriginalPage(
  file: File,
  maxDim: number = 2000,
  quality: number = 0.88
): Promise<OriginalPageAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const rawMax = Math.max(img.width, img.height);
        const scale = rawMax > maxDim ? maxDim / rawMax : 1.0;

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
          });
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', quality),
          width: canvas.width,
          height: canvas.height,
        });
      };
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 将高清原件 DataURL 按需降采样压缩后再发送给视觉大模型（防大图请求超时）
 */
export async function downscaleDataUrlForVision(
  dataUrl: string,
  maxDim: number = 1400,
  quality: number = 0.80
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const rawMax = Math.max(img.width, img.height);
      const scale = rawMax > maxDim ? maxDim / rawMax : 1.0;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * 向后兼容包装：转换 PDF 为图像 DataURL 列表
 */
export async function convertPdfToImages(file: File): Promise<string[]> {
  const assets = await convertPdfToOriginalPages(file, 1400, 0.82);
  return assets.map((a) => a.dataUrl);
}

/**
 * 向后兼容包装：压缩单张图片为 DataURL
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  const asset = await compressImageToOriginalPage(file, 1600, 0.82);
  return asset.dataUrl;
}
