interface FrameHost {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}
const browserFrames: FrameHost = {
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
};

// Um único quadro pendente, mesmo se redimensionamento e animação pedirem juntos.
export function createFrameScheduler(draw: FrameRequestCallback, host: FrameHost = browserFrames) {
  let pending: number | null = null;
  return {
    request() {
      if (pending !== null) return;
      pending = host.request(time => {
        pending = null;
        draw(time);
      });
    },
    cancel() {
      if (pending !== null) host.cancel(pending);
      pending = null;
    },
  };
}
