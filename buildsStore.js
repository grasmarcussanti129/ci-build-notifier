// Simple in-memory ring buffer for builds
export class BuildsStore {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.items = [];
  }

  add(build) {
    this.items.push(build);
    if (this.items.length > this.maxSize) this.items.shift();
  }

  list(limit = 20) {
    return this.items.slice(-limit).reverse();
  }

  stats(limit = 20) {
    const recent = this.list(limit);
    const total = recent.length;
    const success = recent.filter(b => b.status === "success").length;
    const failure = recent.filter(b => b.status === "failure").length;
    const successRate = total ? Math.round((success / total) * 100) : 0;
    return { total, success, failure, successRate };
  }
}
