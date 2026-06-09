/**
 * Geospatial utility functions.
 * Single source of truth — import from here instead of copy-pasting the Haversine formula.
 */

/**
 * Calculate the great-circle distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Origin latitude in decimal degrees
 * @param {number} lon1 - Origin longitude in decimal degrees
 * @param {number} lat2 - Destination latitude in decimal degrees
 * @param {number} lon2 - Destination longitude in decimal degrees
 * @returns {number} Distance in kilometres
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's mean radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
