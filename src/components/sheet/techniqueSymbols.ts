import { GuzhengTechnique } from '../../types/music';

// 将古筝指法转换为古筝考级与专业曲谱规范图形符号（绝对不用汉字）
export interface TechniqueSymbol {
  type: 'svg' | 'text';
  name: string;
  char?: string;
  svgPath?: string;
  viewBox?: string;
  strokeWidth?: number;
}

export function getTechniqueSymbol(tech?: GuzhengTechnique): TechniqueSymbol | null {
  if (!tech) return null;

  switch (tech) {
    case '托':
      // 托: 古筝考级标准记号 𠃊 (大拇指由外向内，直角折线)
      return {
        type: 'svg',
        name: '托',
        svgPath: 'M 4,3 L 4,13 L 13,13',
        viewBox: '0 0 16 16',
        strokeWidth: 2.4,
      };

    case '抹':
      // 抹: 古筝考级标准记号 / (食指由外向内，标准右上至左下斜线/撇)
      // 在出版谱和考级谱中，抹标记为斜线（如用户曲谱中的标准撇斜杠）
      return {
        type: 'svg',
        name: '抹',
        svgPath: 'M 4,13 L 12,3',
        viewBox: '0 0 16 16',
        strokeWidth: 2.4,
      };

    case '勾':
      // 勾: 古筝考级标准记号 ⌒ (中指由外向内勾弦，下凸圆弧)
      return {
        type: 'svg',
        name: '勾',
        svgPath: 'M 2,12 Q 8,2 14,12',
        viewBox: '0 0 16 16',
        strokeWidth: 2.2,
      };

    case '打':
      // 打: 古筝标准记号 𠃌 (无名指向内弹)
      return {
        type: 'svg',
        name: '打',
        svgPath: 'M 3,4 L 13,4 L 13,13',
        viewBox: '0 0 16 16',
        strokeWidth: 2.4,
      };

    case '大撮':
      // 大撮: 拇指与中指同时向内八度抓弹 (标准方形门字拱形 ⊓)
      return {
        type: 'svg',
        name: '大撮',
        svgPath: 'M 3,14 L 3,3 L 13,3 L 13,14',
        viewBox: '0 0 16 16',
        strokeWidth: 2.4,
      };

    case '小撮':
      // 小撮: 拇指与食指三度抓弹 (稍窄拱形 ㄇ)
      return {
        type: 'svg',
        name: '小撮',
        svgPath: 'M 4,14 L 4,5 L 12,5 L 12,14',
        viewBox: '0 0 16 16',
        strokeWidth: 2.2,
      };

    case '摇指':
      // 摇指: 快速连续双劈托符号 彡
      return {
        type: 'svg',
        name: '摇指',
        svgPath: 'M 4,5 L 12,2 M 4,9 L 12,6 M 4,13 L 12,10',
        viewBox: '0 0 16 16',
        strokeWidth: 2.0,
      };

    case '花指':
      // 花指: 连抹扫弦波浪线 ≈
      return {
        type: 'svg',
        name: '花指',
        svgPath: 'M 2,9 Q 5,4 8,9 T 14,9',
        viewBox: '0 0 16 16',
        strokeWidth: 2.2,
      };

    case '颤音':
      // 颤音: 揉弦波动 ～
      return {
        type: 'text',
        name: '颤音',
        char: '～',
      };

    case '上滑音':
      return {
        type: 'svg',
        name: '上滑音',
        svgPath: 'M 2,12 Q 10,12 13,3 M 8,3 L 13,3 L 13,8',
        viewBox: '0 0 16 16',
        strokeWidth: 2.0,
      };

    case '下滑音':
      return {
        type: 'svg',
        name: '下滑音',
        svgPath: 'M 2,3 Q 10,3 13,12 M 8,12 L 13,12 L 13,7',
        viewBox: '0 0 16 16',
        strokeWidth: 2.0,
      };

    default:
      return null;
  }
}
