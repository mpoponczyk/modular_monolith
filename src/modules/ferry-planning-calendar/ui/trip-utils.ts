import { HeatmapThreshold } from "@/modules/core-admin-settings/domain/heatmap-config"

// Calculate contrast (White or Black text)
export const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "")
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(c => c + c).join('')
    }
    const r = parseInt(hexcolor.substring(0, 2), 16)
    const g = parseInt(hexcolor.substring(2, 4), 16)
    const b = parseInt(hexcolor.substring(4, 6), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return (yiq >= 140) ? 'black' : 'white'
}

export const getTripColorStyle = (trip: any, heatmapConfig: HeatmapThreshold[]) => {
    const capacity = trip.ferry?.capacity_passengers || 0
    const booked = trip.booked_count || 0
    if (capacity === 0) return { backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }

    const occupancyPercent = (booked / capacity) * 100

    // Sort config by threshold descending to find the highest matching threshold
    const sortedConfig = [...heatmapConfig].sort((a, b) => b.threshold - a.threshold)
    const match = sortedConfig.find(item => occupancyPercent >= item.threshold)
    const bgColor = match ? match.color : "#ffffff"

    const textColor = getContrastYIQ(bgColor)

    return {
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${bgColor === '#ffffff' ? '#e2e8f0' : 'rgba(0,0,0,0.1)'}`
    }
}
