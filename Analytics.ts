export type MetricAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
}

export interface AggregatedMetric {
  name: string;
  aggregation: MetricAggregation;
  value: number;
  period: { from: Date; to: Date };
}

export class Analytics {
  id: string;
  name: string;
  metrics: Map<string, MetricPoint[]>;
  retentionDays: number;
  createdAt: Date;

  constructor(id: string, name: string, retentionDays = 90) {
    this.id = id;
    this.name = name;
    this.metrics = new Map();
    this.retentionDays = retentionDays;
    this.createdAt = new Date();
  }

  track(metricName: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.metrics.has(metricName)) this.metrics.set(metricName, []);
    this.metrics.get(metricName)!.push({ timestamp: new Date(), value, labels });
    this.purgeExpired(metricName);
  }

  purgeExpired(metricName: string): void {
    const cutoff = new Date(Date.now() - this.retentionDays * 86_400_000);
    const points = this.metrics.get(metricName);
    if (points) {
      this.metrics.set(metricName, points.filter(p => p.timestamp >= cutoff));
    }
  }

  aggregate(metricName: string, aggregation: MetricAggregation, from: Date, to: Date): AggregatedMetric {
    const points = (this.metrics.get(metricName) ?? []).filter(p => p.timestamp >= from && p.timestamp <= to);
    if (points.length === 0) return { name: metricName, aggregation, value: 0, period: { from, to } };
    const values = points.map(p => p.value);
    let value: number;
    switch (aggregation) {
      case 'sum': value = values.reduce((a, b) => a + b, 0); break;
      case 'avg': value = values.reduce((a, b) => a + b, 0) / values.length; break;
      case 'min': value = Math.min(...values); break;
      case 'max': value = Math.max(...values); break;
      case 'count': value = values.length; break;
    }
    return { name: metricName, aggregation, value: parseFloat(value.toFixed(4)), period: { from, to } };
  }

  timeSeries(metricName: string, from: Date, to: Date, bucketMinutes = 60): { bucket: Date; value: number }[] {
    const points = (this.metrics.get(metricName) ?? []).filter(p => p.timestamp >= from && p.timestamp <= to);
    const bucketMs = bucketMinutes * 60_000;
    const buckets = new Map<number, number[]>();
    for (const p of points) {
      const key = Math.floor(p.timestamp.getTime() / bucketMs) * bucketMs;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p.value);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .map(([ts, vals]) => ({ bucket: new Date(ts), value: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4)) }));
  }

  topLabels(metricName: string, labelKey: string, limit = 5): { label: string; count: number }[] {
    const points = this.metrics.get(metricName) ?? [];
    const counts = new Map<string, number>();
    for (const p of points) {
      const label = p.labels[labelKey] ?? 'unknown';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, count]) => ({ label, count }));
  }

  metricNames(): string[] {
    return [...this.metrics.keys()].sort();
  }

  toString(): string {
    return `Analytics(${this.id}, "${this.name}", ${this.metrics.size} metrics)`;
  }
}
