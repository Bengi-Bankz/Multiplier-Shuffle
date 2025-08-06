// Multiplier shuffle game mathematics

/**
 * Calculate multiplier based on puck position and speed
 * @param {number} position - Current puck position
 * @param {number} speed - Current puck speed
 * @returns {number} - Calculated multiplier
 */
export function calculateMultiplier(position, speed) {
    // Basic multiplier calculation - can be enhanced
    const baseMultiplier = 1.0;
    const speedBonus = speed * 0.1;
    const positionBonus = Math.abs(position) * 0.01;
    
    return Math.max(baseMultiplier, baseMultiplier + speedBonus + positionBonus);
}

/**
 * Calculate shuffle outcome based on physics
 * @param {number} force - Initial force applied
 * @param {number} angle - Angle of the shuffle
 * @returns {object} - Result with final position and multiplier
 */
export function calculateShuffleOutcome(force, angle = 0) {
    // Simple physics simulation
    const friction = 0.95;
    const gravity = 0.1;
    
    let velocity = force;
    let position = 0;
    let time = 0;
    
    // Simulate movement until puck stops
    while (velocity > 0.1 && time < 100) {
        position += velocity;
        velocity *= friction;
        velocity -= gravity;
        time++;
    }
    
    const multiplier = calculateMultiplier(position, force);
    
    return {
        finalPosition: position,
        multiplier: Math.round(multiplier * 100) / 100,
        time: time
    };
}

/**
 * Generate random multiplier for demo purposes
 * @returns {number} - Random multiplier between 1x and 5x
 */
export function generateRandomMultiplier() {
    return Math.round((1 + Math.random() * 4) * 100) / 100;
}