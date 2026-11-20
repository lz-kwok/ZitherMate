import { Measure, Note, ScorePart, SheetMusic } from '../../types/music';
import {
  DetectedSystem,
  normalizeSystem,
  splitSystemEqually,
} from '../../engine/ScoreLayoutDetector';

export interface VisionConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const VISION_PROVIDER_PRESETS = [
  { key: 'deepseek', label: '🤖 DeepSeek', short: 'v4-flash-vision', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-v4-flash-vision-exp' },
  { key: 'aliyun', label: '🇨🇳 通义千问', short: 'qwen-vl-max', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-max' },
  { key: 'zhipu', label: '🇨🇳 智谱 AI', short: 'glm-4v-plus', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-plus' },
  { key: 'siliconflow', label: '⚡ 硅基流动', short: 'Qwen2-VL-72B', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2-VL-72B-Instruct' },
  { key: 'openai', label: '🌐 OpenAI', short: 'gpt-4o', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
] as const;

export interface VisionLayoutResult {
  title?: string;
  subtitle?: string;
  author?: string;
  key?: string;
  timeSignature?: [number, number];
  defaultBpm?: number;
  isDuet?: boolean;
  systems: DetectedSystem[];
}

export const GUZHENG_ANCHOR_LAYOUT_PROMPT = `你是一个资深的古筝乐谱排版分析与视觉定位（Grounding）专家。请分析用户提供的古筝曲谱图片，定位图上每一个实际演奏“乐行（System）”及各“小节线（Barline）”的精确位置，并提取基础元信息。

严格输出纯 JSON（不要输出任何额外解释文字），Schema 如下：
{
  "title": "曲谱标题",
  "subtitle": "副标题（可选）",
  "author": "作曲/改编者（可选）",
  "key": "1=D",
  "timeSignature": [4, 4],
  "defaultBpm": 78,
  "isDuet": false,
  "systems": [
    {
      "yTop": 185,
      "yBottom": 265,
      "xLeft": 72,
      "xRight": 930,
      "measureCount": 4,
      "barlines": [72, 286, 501, 715, 930]
    }
  ]
}

【核心定位规则】：
1. 坐标系采用 0~1000 归一化整数坐标（左上角为 0,0，右下角为 1000,1000）。
2. 忽略顶部大标题、作曲者、左下/右下页码及空白边距，只框选真正的演奏乐行。
3. 每个 system 必须包含该行音符、高低音点、减时线、指法符号与对应歌词的完整垂直高度 [yTop, yBottom]。
4. 若图片存在大括号“{”或竖线连起来的“双手/重奏上下两行”（例如古筝 I 与古筝 II 合奏、右手与左手大谱表），请将上下两行合并为【同一个 system】（从上行顶端到下行底端）。
5. barlines 为该乐行内从左到右所有小节分隔竖线（含起首与收尾线）的 X 坐标，数组长度必须等于 measureCount + 1，且严格递增。
6. 若图中有调号（如 1=D、1=G）、拍号（如 2/4、4/4、3/4）、速度（如 ♩=78），请精确读取填入。`;

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

async function requestVisionJson(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  config: VisionConfig
): Promise<any> {
  const url = normalizeApiUrl(config.baseUrl);

  const formattedImageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const payload = {
    model: config.model || 'deepseek-v4-flash-vision-exp',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
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
  const timeoutId = setTimeout(() => controller.abort(), 90000);

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

  return extractJsonFromText(rawContent);
}

/**
 * 调用大模型视觉识谱接口（数字化全谱转换备用通道）
 */
export async function parseSheetWithVision(
  imageBase64: string,
  config: VisionConfig
): Promise<SheetMusic> {
  const parsedData = (await requestVisionJson(
    GUZHENG_OMR_PROMPT,
    '请将这张古筝简谱精确识别为标准的乐谱结构 JSON。',
    imageBase64,
    config
  )) as SheetMusic;

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

/**
 * 调用视觉大模型对原件曲谱进行乐行与小节线视觉定位（Grounding）并读取元信息
 */
export async function detectAnchorLayoutWithVision(
  imageBase64: string,
  config: VisionConfig
): Promise<VisionLayoutResult> {
  const parsed = await requestVisionJson(
    GUZHENG_ANCHOR_LAYOUT_PROMPT,
    '请定位这张古筝曲谱中所有演奏乐行与小节线的归一化坐标，并提取调号、拍号、速度等元数据。',
    imageBase64,
    config
  );

  const rawSystems = Array.isArray(parsed?.systems) ? parsed.systems : [];
  let usesThousandScale = false;
  for (const s of rawSystems) {
    const nums = [
      Number(s?.yTop),
      Number(s?.yBottom),
      Number(s?.xLeft),
      Number(s?.xRight),
      ...(Array.isArray(s?.barlines) ? s.barlines.map((b: unknown) => Number(b)) : []),
    ];
    if (nums.some((n) => Number.isFinite(n) && n > 1.5)) {
      usesThousandScale = true;
      break;
    }
  }
  const scale = usesThousandScale ? 1000 : 1;

  const normalizedSystems: DetectedSystem[] = [];
  for (let i = 0; i < rawSystems.length; i++) {
    const s = rawSystems[i];
    const yTop = Number(s?.yTop) / scale;
    const yBottom = Number(s?.yBottom) / scale;
    const xLeft = Number(s?.xLeft) / scale;
    const xRight = Number(s?.xRight) / scale;
    if (![yTop, yBottom, xLeft, xRight].every((n) => Number.isFinite(n))) {
      continue;
    }

    const rawBars = Array.isArray(s?.barlines)
      ? s.barlines
          .map((b: unknown) => Number(b) / scale)
          .filter((b: number) => Number.isFinite(b))
      : [];

    const mCount = Math.round(Number(s?.measureCount) || 0);
    const baseSys: DetectedSystem = {
      id: `ai-sys-${Date.now().toString(36)}-${i + 1}`,
      yTop,
      yBottom,
      xLeft,
      xRight,
      barlines: rawBars.length >= 2 ? rawBars : [xLeft, xRight],
      confidence: 'ai',
    };

    let finalSys = normalizeSystem(baseSys);
    const actualMeasures = finalSys.barlines.length - 1;
    if (mCount >= 1 && (rawBars.length < 2 || actualMeasures < 1)) {
      finalSys = {
        ...splitSystemEqually(finalSys, mCount),
        confidence: 'ai',
      };
    } else {
      finalSys.confidence = 'ai';
    }

    normalizedSystems.push(finalSys);
  }

  let parsedTimeSig: [number, number] | undefined;
  if (Array.isArray(parsed?.timeSignature) && parsed.timeSignature.length === 2) {
    const top = Math.round(Number(parsed.timeSignature[0]) || 0);
    const bot = Math.round(Number(parsed.timeSignature[1]) || 0);
    if (top >= 1 && bot >= 1) {
      parsedTimeSig = [top, bot];
    }
  }

  const parsedBpm = Number(parsed?.defaultBpm);

  return {
    title: typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title.trim() : undefined,
    subtitle: typeof parsed?.subtitle === 'string' && parsed.subtitle.trim() ? parsed.subtitle.trim() : undefined,
    author: typeof parsed?.author === 'string' && parsed.author.trim() ? parsed.author.trim() : undefined,
    key: typeof parsed?.key === 'string' && parsed.key.trim() ? parsed.key.trim() : undefined,
    timeSignature: parsedTimeSig,
    defaultBpm: Number.isFinite(parsedBpm) && parsedBpm >= 30 && parsedBpm <= 240 ? Math.round(parsedBpm) : undefined,
    isDuet: typeof parsed?.isDuet === 'boolean' ? parsed.isDuet : undefined,
    systems: normalizedSystems,
  };
}

function sanitizeMeasureSequence(
  rawMeasures: Measure[],
  idPrefix: string,
  targetCount: number,
  beatsPerMeasure: number
): Measure[] {
  const result: Measure[] = [];

  for (let i = 0; i < rawMeasures.length; i++) {
    const rawM = rawMeasures[i];
    const measureNum = i + 1;
    const rawNotes = Array.isArray(rawM?.notes) ? rawM.notes : [];

    const cleanNotes: Note[] = rawNotes.map((n, nIdx) => {
      const pitchInt = Math.round(Number(n?.pitch) || 0);
      const safePitch = pitchInt >= 1 && pitchInt <= 7 ? pitchInt : 0;
      const safeOct = Math.max(-2, Math.min(2, Math.round(Number(n?.octave) || 0)));
      const rawDur = Number(n?.duration);
      const safeDur = Number.isFinite(rawDur) && rawDur > 0 ? Math.round(rawDur * 100) / 100 : 1;

      const cleanChord =
        Array.isArray(n?.chord) && n.chord.length > 0
          ? n.chord
              .map((c) => {
                const cp = Math.round(Number(c?.pitch) || 0);
                return {
                  pitch: cp >= 1 && cp <= 7 ? cp : 0,
                  octave: Math.max(-2, Math.min(2, Math.round(Number(c?.octave) || 0))),
                };
              })
              .filter((c) => c.pitch >= 1 && c.pitch <= 7)
          : undefined;

      return {
        ...n,
        id: `${idPrefix}_m${measureNum}_n${nIdx + 1}`,
        pitch: safePitch,
        octave: safeOct,
        duration: safeDur,
        chord: cleanChord && cleanChord.length > 0 ? cleanChord : undefined,
      };
    });

    if (cleanNotes.length === 0) {
      cleanNotes.push({
        id: `${idPrefix}_m${measureNum}_n1`,
        pitch: 0,
        octave: 0,
        duration: beatsPerMeasure,
      });
    }

    result.push({
      measureNumber: measureNum,
      showBoxNumber: rawM?.showBoxNumber ?? (measureNum === 1 || measureNum % 5 === 0),
      timeSignature: rawM?.timeSignature,
      notes: cleanNotes,
    });
  }

  while (targetCount > 0 && result.length < targetCount) {
    const nextNum = result.length + 1;
    result.push({
      measureNumber: nextNum,
      showBoxNumber: nextNum === 1 || nextNum % 5 === 0,
      notes: [
        {
          id: `${idPrefix}_m${nextNum}_n1`,
          pitch: 0,
          octave: 0,
          duration: beatsPerMeasure,
        },
      ],
    });
  }

  return result;
}

/**
 * 将视觉大模型按页转义的简谱 JSON 清洗合并，并与原件埋点小节数量对齐
 */
export function normalizeTranscribedMeasures(
  pageResults: SheetMusic[],
  targetMeasureCount: number,
  fallbackTimeSignature: [number, number]
): { measures: Measure[]; parts?: ScorePart[] } {
  const safeFallbackBeats = Math.max(1, fallbackTimeSignature?.[0] || 4);
  const rawMain = pageResults.flatMap((r) => (Array.isArray(r?.measures) ? r.measures : []));

  const partBuckets = new Map<string, { name: string; isMain?: boolean; measures: Measure[] }>();
  for (const res of pageResults) {
    if (!Array.isArray(res?.parts)) continue;
    for (const p of res.parts) {
      if (!p?.id) continue;
      let entry = partBuckets.get(p.id);
      if (!entry) {
        entry = { name: p.name || p.id, isMain: p.isMain, measures: [] };
        partBuckets.set(p.id, entry);
      }
      if (Array.isArray(p.measures)) {
        entry.measures.push(...p.measures);
      }
    }
  }

  let normalizedParts: ScorePart[] | undefined;
  if (partBuckets.size > 0) {
    const finalTargetCount = Math.max(targetMeasureCount, rawMain.length);
    normalizedParts = Array.from(partBuckets.entries()).map(([partId, bucket]) => ({
      id: partId,
      name: bucket.name,
      isMain: bucket.isMain,
      measures: sanitizeMeasureSequence(bucket.measures, `tr_${partId}`, finalTargetCount, safeFallbackBeats),
    }));
  }

  const finalMeasures =
    rawMain.length > 0
      ? sanitizeMeasureSequence(rawMain, 'tr', targetMeasureCount, safeFallbackBeats)
      : normalizedParts?.[0]?.measures
      ? sanitizeMeasureSequence(normalizedParts[0].measures, 'tr', targetMeasureCount, safeFallbackBeats)
      : sanitizeMeasureSequence([], 'tr', targetMeasureCount, safeFallbackBeats);

  return {
    measures: finalMeasures,
    parts: normalizedParts,
  };
}
