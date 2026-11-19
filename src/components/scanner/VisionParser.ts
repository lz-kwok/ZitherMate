import { SheetMusic } from '../../types/music';

export interface VisionConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const GUZHENG_OMR_PROMPT = `你是一个资深的古筝演奏家与民乐简谱数字化专家。请仔细阅读用户提供的古筝曲谱图片，将其转换为结构化JSON数据。

严格按照以下 JSON Schema 输出纯 JSON（包含在一对大括号内，不要输出任何非JSON的额外解释）：
{
  "id": "generated-score-timestamp",
  "title": "曲谱标题",
  "subtitle": "副标题",
  "key": "1=D",
  "timeSignature": [2, 4],
  "defaultBpm": 78,
  "measures": [
    {
      "measureNumber": 1,
      "notes": [
        {
          "id": "m1_n1",
          "pitch": 5,
          "octave": 0,
          "duration": 1,
          "dot": false,
          "technique": "托",
          "chord": []
        }
      ]
    }
  ]
}

【古筝与简谱解析规则】：
1. pitch: 0为休止符，1到7分别对应 do re mi fa sol la si。
2. octave: 中音为0；上方有1个点为高音(1)，2个点为倍高音(2)；下方有1个点为低音(-1)，2个点为倍低音(-2)。
3. duration: 拍数以四分音符为1拍。减时线1条为半拍(0.5)，减时线2条为1/4拍(0.25)；附点音符增加半倍时值（如四分附点为1.5拍）；二分音符(带横线)为2拍，全音符为4拍。每小节拍数需满足拍号。
4. technique: 识别音符上方的古筝专业图形指法标记：
   - 𠃊 (直角折线) 对应 '托'
   - / 或 \\ (撇/斜线) 对应 '抹'
   - ⌒ (下凸圆弧) 对应 '勾'
   - ⊓ (方形拱门/两音八度跨连) 对应 '大撮'
   - ㄇ (小拱门) 对应 '小撮'
   - 彡 (三条斜波纹) 对应 '摇指'
   - ≈ (波浪线) 对应 '花指'
   - ～ 对应 '颤音'
5. chord: 遇到古筝经典八度大撮或双音（如两个音垂直叠排，如中音5与高音5叠排），请在 chord 数组中存放对应的 { pitch, octave }，并在外层标注 technique: '大撮'。`;

/**
 * 智能规范化 API 请求地址，解决地址少写 https://、多写或漏写 /v1 或 /chat/completions 的问题
 */
export function normalizeApiUrl(baseUrl: string): string {
  let clean = (baseUrl || '').trim();
  if (!clean) {
    clean = 'https://api.deepseek.com/v1';
  }

  // 1. 自动补齐协议
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }

  // 2. 去除末尾斜杠
  clean = clean.replace(/\/+$/, '');

  // 3. 避免 /chat/completions 重复拼接
  if (clean.endsWith('/chat/completions')) {
    return clean;
  }

  return `${clean}/chat/completions`;
}

function extractJsonFromText(raw: string): any {
  // 1. 尝试直接解析
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. 匹配 ```json ... ``` 块
  const matchFence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (matchFence && matchFence[1]) {
    try {
      return JSON.parse(matchFence[1].trim());
    } catch {}
  }

  // 3. 寻找最外层的 { 和 }
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = raw.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSub);
    } catch {}
  }

  throw new Error('未能在模型回复中提取到有效的曲谱 JSON 数据：\n' + raw.slice(0, 300));
}

/**
 * 快速测试 API 连通性
 */
export async function testApiConnection(config: VisionConfig): Promise<{ ok: boolean; status?: number; message: string }> {
  const url = normalizeApiUrl(config.baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12秒快速检测

  try {
    const payload = {
      model: config.model || 'deepseek-v4-flash-vision-exp',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { ok: true, status: response.status, message: `✅ 连接成功！(HTTP ${response.status}) 网关与 Key 均有效。` };
    } else {
      const errText = await response.text();
      return { ok: false, status: response.status, message: `⚠️ 服务器返回状态码 [${response.status}]：${errText.slice(0, 150)}` };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { ok: false, message: `❌ 连接超时 (12s)。请求目标地址：${url}` };
    }
    return {
      ok: false,
      message: `❌ 网络连接失败 (${err.message || 'Failed to fetch'})。请求目标地址：${url}。请检查平板 Wi-Fi 或网址拼写。`,
    };
  }
}

/**
 * 调用大模型视觉识谱接口
 */
export async function parseSheetWithVision(
  imageBase64: string,
  config: VisionConfig
): Promise<SheetMusic> {
  const url = normalizeApiUrl(config.baseUrl);

  // 确保 base64 前缀正确
  const formattedImageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const payload = {
    model: config.model || 'deepseek-v4-flash-vision-exp',
    messages: [
      {
        role: 'system',
        content: GUZHENG_OMR_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请将这张古筝简谱精确识别为标准的乐谱结构 JSON。',
          },
          {
            type: 'image_url',
            image_url: {
              url: formattedImageUrl,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 秒识图等待

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`识谱请求超时 (90秒)，请检查网络或更换更快的视觉模型。请求地址: ${url}`);
    }
    throw new Error(
      `网络请求失败 (${err.message || 'Failed to fetch'})\n` +
      `请求目标地址：${url}\n` +
      `排查建议：\n` +
      `1. 检查设备是否连接 Wi-Fi，且能访问外网；\n` +
      `2. 检查 API Base URL 格式（推荐直接点击“一键预设”按钮填入）；\n` +
      `3. 点击右侧“测试连通性”按钮排查原因。`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`识谱 API 请求返回错误 [${response.status}]：${errorText}`);
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('未获取到模型识别结果，返回数据为空');
  }

  const parsedData = extractJsonFromText(rawContent) as SheetMusic;

  // 保证每个小节与音符具备唯一 ID 和完整字段
  parsedData.measures.forEach((m, mIdx) => {
    m.measureNumber = m.measureNumber || (mIdx + 1);
    m.notes.forEach((n, nIdx) => {
      if (!n.id) {
        n.id = `m${m.measureNumber}_n${nIdx + 1}`;
      }
    });
  });

  return parsedData;
}
