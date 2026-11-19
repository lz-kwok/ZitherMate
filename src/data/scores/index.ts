import { SheetMusic } from '../../types/music';
import { tangshiScore } from './tangshi';
import { canghaiScore } from './canghai';
import { zhantaifengScore } from './zhantaifeng';
import { yuzhouScore } from './yuzhou';
import { qinghuaciScore } from './qinghuaci';

export const builtInScores: SheetMusic[] = [
  tangshiScore,
  canghaiScore,
  zhantaifengScore,
  yuzhouScore,
  qinghuaciScore,
];

export {
  tangshiScore,
  canghaiScore,
  zhantaifengScore,
  yuzhouScore,
  qinghuaciScore,
};
