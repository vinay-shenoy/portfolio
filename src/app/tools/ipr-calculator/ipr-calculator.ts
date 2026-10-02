import { OnInit, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, Plugin, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  imports: [RouterModule, CommonModule, FormsModule],
  selector: 'app-ipr-calculator',
  styleUrl: './ipr-calculator.css',
  templateUrl: './ipr-calculator.html',
})
export class IprCalculator implements OnInit {
  ngOnInit(): void {
   
  }
// Angular Lifecycle

  ngAfterViewInit(): void {
    // Generate initial chart using default values
     this.calculateIPR();
  }
  // Chart

  @ViewChild('iprChart')
  iprChart!: ElementRef<HTMLCanvasElement>;

  private iprChartInstance: Chart<'line', { x: number; y: number }[]> | null = null;

  // Input Parameters
  flowRegime = 'Pseudo-Steady State Flow';
  porosity = 0.19;
  permeability = 82;
  payThickness = 75;
  reservoirPressure = 3500;
  bubblePressure = 3150;
  oilFormationVolumeFactor = 1.1;
  viscosity = 1.7;
  compressibility = 0.0000129;
  drainageRadius = 600;
  wellRadius = 0.325;
  skin = 0;
  time = 12;
  timeUnit = 'hrs';

  // Output Parameters

  productivityIndex: number | null = null;
  qv: number | null = null;
  qb: number | null = null;

  

  // Time Unit Toggle

  toggleTimeUnit(): void {
    const units = ['hrs', 'minutes', 'seconds', 'years', 'months', 'weeks', 'days'];

    const currentIndex = units.indexOf(this.timeUnit);

    const nextIndex = (currentIndex + 1) % units.length;

    this.timeUnit = units[nextIndex];

    if (this.timeUnit === 'months') {
      alert('Assuming 1 month = 730 hrs');
    }
  }

  // Main IPR Calculation

  calculateIPR(): void {
    const o = this.porosity;
    const k = this.permeability;
    const h = this.payThickness;

    const P = this.reservoirPressure;
    const Pb = this.bubblePressure;

    const Bo = this.oilFormationVolumeFactor;
    const u = this.viscosity;
    const Ct = this.compressibility;

    const re = this.drainageRadius;
    const rw = this.wellRadius;

    const S = this.skin;

    let x = 0;
    let y = 0;
    let J = 0;

    let t = 0;

    // Transient Flow

    if (this.flowRegime === 'Transient Flow') {
      t = this.convertTimeToHours();

      x = k / (o * u * Ct * rw * rw);

      y = 162.6 * Bo * u * (Math.log10(t) + Math.log10(x) - 3.23);

      J = (k * h) / y;
    }

    // Steady State Flow
    else if (this.flowRegime === 'Steady State Flow') {
      x = re / rw;

      y = 141.2 * Bo * u * (Math.log(x) + S);

      J = (k * h) / y;
    }

    // Pseudo-Steady State Flow
    else if (this.flowRegime === 'Pseudo-Steady State Flow') {
      x = re / rw;

      y = 141.2 * Bo * u * (Math.log(x) - 0.75 + S);

      J = (k * h) / y;
    }

    // Production Calculations

    const qv = (J * Pb) / 1.8;
    const qb = J * (P - Pb);

    // Store Results

    this.productivityIndex = J;
    this.qv = qv;
    this.qb = qb;

    // console.log('Productivity Index J =', J, 'Pb =', Pb, 'qv =', qv, 'qb =', qb);

    // Generate Vogel IPR Curve

    const chartPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= 10; i++) {
      const yVal = (i * Pb) / 10;

      const normalizedPressure = i / 10;

      const xVal = qb + qv * (1 - 0.2 * normalizedPressure - 0.8 * Math.pow(normalizedPressure, 2));

      chartPoints.push({
        x: xVal,
        y: yVal,
      });
    }

    // ==========================================================
    // Endpoint
    // x = 0
    // y = Reservoir Pressure
    // ==========================================================

    chartPoints.push({
      x: 0,
      y: P,
    });

    // Sort by X
    chartPoints.sort((a, b) => a.x - b.x);

    // Chart Axis

    const maxX = this.roundToNearest1000(qb + qv + 500);

    const maxY = this.roundToNearest1000(P + 500);

    this.renderChart(chartPoints, maxX, maxY);
  }

  // ============================================================
  // Convert Time to Hours
  // ============================================================

  private convertTimeToHours(): number {
    switch (this.timeUnit) {
      case 'years':
        return this.time * 8760;

      case 'months':
        return this.time * 730;

      case 'days':
        return this.time * 24;

      case 'weeks':
        return this.time * 168;

      case 'hrs':
        return this.time;

      case 'minutes':
        return this.time / 60;

      case 'seconds':
        return this.time / 3600;

      default:
        return this.time;
    }
  }

  // Round Axis

  private roundToNearest1000(value: number): number {
    return Math.max(1000, Math.round(value / 1000) * 1000);
  }

  // ============================================================
  // Chart Rendering
  // ============================================================

  private renderChart(points: { x: number; y: number }[], maxX: number, maxY: number): void {
    if (!this.iprChart) {
      return;
    }

    // Destroy previous chart
    if (this.iprChartInstance) {
      this.iprChartInstance.destroy();

      this.iprChartInstance = null;
    }

    const canvas = this.iprChart.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // ==========================================================
    // Equal X/Y Axis Range
    // ==========================================================

    const step = 1000;

    const maxPoint = Math.ceil(Math.max(maxX, maxY) / step) * step;

    // Chart Configuration

    const config: ChartConfiguration<'line', { x: number; y: number }[]> = {
      type: 'line',

      data: {
        datasets: [
          {
            label: 'IPR Curve',

            data: points,

            showLine: true,

            borderColor: '#2563eb',

            backgroundColor: '#eb3225',

            borderWidth: 2,

            pointRadius: 3.5,

            pointHoverRadius: 6,

            pointBackgroundColor: '#eb3225',

            pointBorderColor: '#000000',

            pointBorderWidth: 1,

            tension: 0.1,
          },
        ],
      },

      plugins: [this.millimeterGridPlugin, this.pointValuePlugin],

      options: {
        responsive: true,

        maintainAspectRatio: true,

        aspectRatio: 1,

        plugins: {
          tooltip: {
            callbacks: {
              title: () => '',

              label: (context) => {
                const point = context.raw as {
                  x: number;
                  y: number;
                };

                return [
                  `q: ${Math.round(point.x * 100) / 100} STB/day`,

                  `Pwf: ${Math.round(point.y * 100) / 100} psi`,
                ];
              },
            },
          },
        },

        scales: {
          x: {
            type: 'linear',

            position: 'bottom',

            min: 0,

            max: maxPoint,

            title: {
              display: true,

              text: 'Flow Rate q (STB/day)',

              font: {
                size: 12,
                weight: 'bold',
              },
            },

            grid: {
              color: '#25baeb',
              lineWidth: 1,
            },

            ticks: {
              maxRotation: 45,

              minRotation: 0,

              stepSize: step,
            },
          },

          y: {
            type: 'linear',

            min: 0,

            max: maxPoint,

            ticks: {
              stepSize: step,
            },

            title: {
              display: true,

              text: 'Bottomhole Pressure Pwf (psi)',

              font: {
                size: 12,
                weight: 'bold',
              },
            },

            grid: {
              color: '#25baeb',
              lineWidth: 1,
            },
          },
        },
      },
    };

    this.iprChartInstance = new Chart(ctx, config);
  }

  // Point Value Plugin

  private pointValuePlugin: Plugin<'line'> = {
    id: 'pointValuePlugin',

    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;

      const width = chart.width;

      const fontSize = width < 450 ? 8 : 10;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);

        meta.data.forEach((point, index) => {
          const data = dataset.data[index] as { x: number; y: number } | undefined;

          if (!data || data.x === undefined || data.y === undefined) {
            return;
          }
          const x = point.x;
          const y = point.y;
          ctx.save();
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#1e293b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = `(${Math.round(data.x)}, ${Math.round(data.y)})`;
          ctx.fillText(label, x + 35, y);
          ctx.restore();
        });
      });
    },
  };

  // Minor Grid Plugin

  private millimeterGridPlugin: Plugin<'line'> = {
    id: 'millimeterGridPlugin',

    beforeDraw: (chart) => {
      const { ctx, chartArea, scales } = chart;

      const xScale = scales['x'];

      const yScale = scales['y'];

      if (!xScale || !yScale || !chartArea) {
        return;
      }

      ctx.save();

      ctx.lineWidth = 0.5;

      ctx.strokeStyle = 'rgba(37, 63, 235, 0.32)';

      // Minor vertical lines
      const xStep = 100;

      for (let xVal = xScale.min; xVal <= xScale.max; xVal += xStep) {
        if (xVal % 1000 === 0) {
          continue;
        }

        const xPixel = xScale.getPixelForValue(xVal);

        ctx.beginPath();

        ctx.moveTo(xPixel, chartArea.top);

        ctx.lineTo(xPixel, chartArea.bottom);

        ctx.stroke();
      }

      // Minor horizontal lines
      const yStep = 100;

      for (let yVal = yScale.min; yVal <= yScale.max; yVal += yStep) {
        if (yVal % 1000 === 0) {
          continue;
        }

        const yPixel = yScale.getPixelForValue(yVal);

        ctx.beginPath();

        ctx.moveTo(chartArea.left, yPixel);

        ctx.lineTo(chartArea.right, yPixel);

        ctx.stroke();
      }

      ctx.restore();
    },
  };

  // ============================================================
  // Save Chart as PNG
  // ============================================================

  saveIPRChart(): void {
    if (!this.iprChartInstance) {
      alert('Please generate the IPR chart first.');

      return;
    }

    const chartImage = new Image();

    chartImage.onload = () => {
      const padding = 40;

      const exportCanvas = document.createElement('canvas');

      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) {
        return;
      }

      exportCanvas.width = chartImage.width + padding * 2;

      exportCanvas.height = chartImage.height + padding * 2;

      // White background
      exportCtx.fillStyle = '#ffffff';

      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw chart
      exportCtx.drawImage(chartImage, padding, padding);

      // Download
      const link = document.createElement('a');

      link.href = exportCanvas.toDataURL('image/png');

      link.download = 'IPR_Chart.png';

      link.click();
    };

    chartImage.src = this.iprChartInstance.toBase64Image();
  }
}
