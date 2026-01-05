import { init } from './lib/ts/test';

const app = document.getElementById('app')!;
app.innerHTML = `
  <style>
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #1a1a2e;
      font-family: system-ui, sans-serif;
      color: #eee;
    }
    canvas {
      background: #0f0f1a;
      border: 1px solid #333;
      cursor: grab;
    }
    canvas:active { cursor: grabbing; }
    .info { margin-top: 1rem; font-size: 0.875rem; color: #888; }
    h1 { margin-bottom: 1rem; font-weight: 300; }
  </style>
  <h1>Quaternion Rotation + Perspective Projection</h1>
  <canvas id="canvas" width="600" height="600"></canvas>
  <div class="info">Drag to rotate • No gimbal lock</div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
init(canvas);
