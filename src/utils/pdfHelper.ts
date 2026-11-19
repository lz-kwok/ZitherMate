import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * 将用户上传的 PDF 渲染转换为适合视觉大模型的高清精简 JPEG Base64 图像
 * 优化尺寸至最长边 1400px，既保留音符与指法超高清晰度，又将体积控制在 150KB 左右，防止网络上传超时导致的 Failed to fetch
 * @param file 用户选取的 PDF 文件
 * @returns 每一页对应的 JPEG base64 DataURL 数组
 */
export async function convertPdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageImages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // 计算适宜的缩放比例（保证清晰且体积轻量）
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const maxDim = Math.max(unscaledViewport.width, unscaledViewport.height);
    // 目标最长边约 1400px
    const targetScale = Math.min(2.0, Math.max(1.0, 1400 / maxDim));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (context) {
      // 铺白底（防止 PDF 透明背景渲染成黑色）
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // 导出为 0.82 质量的 JPEG，体积小且字迹与符号极度锐利
      pageImages.push(canvas.toDataURL('image/jpeg', 0.82));
    }
  }

  return pageImages;
}

/**
 * 针对普通手机拍照或截图，同样进行白底平铺与适度压缩（防超大原图导致 fetch 失败）
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = Math.max(img.width, img.height);
        const scale = maxDim > 1600 ? 1600 / maxDim : 1.0;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
