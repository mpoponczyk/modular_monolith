export interface HeatmapThreshold {
    threshold: number
    color: string
}

export const DEFAULT_HEATMAP_CONFIG: HeatmapThreshold[] = [
    { threshold: 0, color: "#86efac" }, // Light Green
    { threshold: 25, color: "#bef264" }, // Lime Green
    { threshold: 50, color: "#fef08a" }, // Yellow
    { threshold: 60, color: "#fde047" }, // More Yellow
    { threshold: 70, color: "#fb923c" }, // Orange
    { threshold: 80, color: "#ef4444" }, // Red
    { threshold: 90, color: "#991b1b" }  // Intensive Red
]
