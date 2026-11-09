import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export function EChart({
  option,
  height = 260,
}: {
  option: EChartsOption;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option);
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}

const AXIS = {
  axisLine: { lineStyle: { color: '#2e3742' } },
  axisLabel: { color: '#8396a8', fontSize: 11 },
  splitLine: { lineStyle: { color: '#1d232a' } },
};

export const DARK_TEXT = '#f5f6f7';
export const DARK_MUTED = '#8396a8';

export function trendOption(labels: string[], values: number[]): EChartsOption {
  return {
    backgroundColor: 'transparent',
    grid: { left: 42, right: 16, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis', backgroundColor: '#242c36', borderColor: '#2e3742', textStyle: { color: '#f5f6f7' } },
    xAxis: { type: 'category', data: labels, ...AXIS, boundaryGap: false },
    yAxis: { type: 'value', ...AXIS },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#4db1ff', width: 2 },
        itemStyle: { color: '#4db1ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(77,177,255,0.28)' },
            { offset: 1, color: 'rgba(77,177,255,0)' },
          ]),
        },
      },
    ],
  };
}

export function donutOption(data: { name: string; value: number }[], centerText: string): EChartsOption {
  const colors = ['#4db1ff', '#ffdf72', '#a9b4be', '#5b6b7b'];
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#242c36', borderColor: '#2e3742', textStyle: { color: '#f5f6f7' } },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: '#8396a8', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#0b0f16', borderWidth: 2 },
        label: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
        emphasis: { scale: false },
      },
    ],
    title: {
      text: centerText,
      subtext: '总计',
      left: '28%',
      top: '42%',
      textAlign: 'center',
      textStyle: { color: '#f5f6f7', fontSize: 22, fontWeight: 700 },
      subtextStyle: { color: '#8396a8', fontSize: 11 },
    },
  };
}

export function barOption(labels: string[], values: number[], color = '#4db1ff'): EChartsOption {
  return {
    backgroundColor: 'transparent',
    grid: { left: 42, right: 16, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis', backgroundColor: '#242c36', borderColor: '#2e3742', textStyle: { color: '#f5f6f7' } },
    xAxis: { type: 'category', data: labels, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 22,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

export function sparklineOption(values: number[], color = '#4db1ff'): EChartsOption {
  return {
    backgroundColor: 'transparent',
    grid: { left: 2, right: 2, top: 4, bottom: 2 },
    xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 1.5 },
        areaStyle: { color: 'transparent' },
      },
    ],
  };
}
