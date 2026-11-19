export class AutoScroller {
  private lastScrolledLineTop: number = -1;
  private isAutoScrolling: boolean = false;

  constructor() {}

  // 视平线自动对齐：根据当前激活的音符，平滑将曲谱滚动到黄金视线区
  public scrollToActiveNote(noteId: string) {
    const el = document.getElementById(`note-${noteId}`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // 黄金视平线区域：屏幕垂直方向 25% ~ 55%
    // 当弹奏位置进入屏幕后半段 (超过55%高度) 时，触发平滑上移
    const thresholdY = windowHeight * 0.55;

    if (rect.top > thresholdY) {
      // 避免同一行微小位移重复触发
      const lineEstimate = Math.floor(rect.top / 80);
      if (lineEstimate === this.lastScrolledLineTop && this.isAutoScrolling) {
        return;
      }
      this.lastScrolledLineTop = lineEstimate;
      this.isAutoScrolling = true;

      // 目标：将当前行平滑滚到屏幕上方 30% 位置，留出下方至少 70% 视野供预读
      const targetScreenY = windowHeight * 0.28;
      const scrollOffset = rect.top - targetScreenY;

      window.scrollBy({
        top: scrollOffset,
        behavior: 'smooth',
      });

      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 350);
    }
  }

  // 重置滚动位置到顶部
  public resetToTop() {
    this.lastScrolledLineTop = -1;
    this.isAutoScrolling = false;
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

export const autoScroller = new AutoScroller();
