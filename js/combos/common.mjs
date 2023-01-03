import { damages } from "../calculator/constants.mjs"

export function* getIterator(count, min, max) {
    if (count <= 0) return
    const arr = []
    for (let i = min; i <= max; i++) {
        arr[0] = i
        yield* traverseSingle(arr, min, 0, count)
    }
}

function* traverseSingle(arr, minNumber, depth, maxDepth) {
    if (depth === maxDepth - 1)
        yield arr.slice(0)
    else
        for (let i = minNumber; i <= arr[depth]; i++) {
            arr[depth + 1] = i
            yield* traverseSingle(arr, minNumber, depth + 1, maxDepth)
        }
}

export function checkStrategy(state, strategy) {
    const rv = state.turn(strategy)
    state.cleanup()
    const complete = state.cogs.filter(x => x.canAttack()).length === 0
    state.loadState()
    return complete ? rv : 0
}

export function update(output, strategy, accuracy) {
    const cost = Math.ceil(getCost(strategy) / Math.max(accuracy, 0.1))
    if (cost < output.cost) {
        output.cost = cost
        output.strategy = strategy.map(x => ({ id: x.id, level: x.parameters.level, target: x.target, prestige: x.parameters.prestige }))
        output.accuracy = Math.round(accuracy * 1e4) / 1e2
        output.description = ""
    }
}

export function getMinLevel(track, cog) {
    const damage = cog.getHealth()
    if (!damages[track])
        return -1
    const context = { track }
    for (let i = 0; i < damages[track].length; i++) {
        const dmg1 = Math.ceil(cog.effects.getOverload("TakeDamage", damages[track][i], context))
        if (dmg1 >= damage)
            return i
    }
    return -1
}

export function getDoubleMinLevel(cog, track1, track2, multiplier = 1) {
    const damage = cog.getHealth()
    if (!damages[track1] || !damages[track2])
        return [ -1, -1 ]

    let minimum = 1e8
    let minimum_arr = [ -1, -1 ]
    for (let i = 0; i < damages[track1].length; i++)
        for (let j = 0; j < damages[track2].length; j++) {
            const dmg1 = Math.ceil(cog.effects.getOverload("TakeDamage", damages[track1][i], {track: track1}))
            const dmg2 = Math.ceil(cog.effects.getOverload("TakeDamage", damages[track2][j], {track: track2}))
            if (Math.ceil(multiplier * (dmg1 + dmg2)) >= damage &&
                track_costs[track1] * level_costs[i] + track_costs[track2] * level_costs[j] < minimum) {
                minimum = track_costs[track1] * level_costs[i] + track_costs[track2] * level_costs[j]
                minimum_arr = [ i, j ]
            }
        }

    return minimum_arr
}

const track_costs = {
    "Toon-Up": 0.1, "Trap": 4, "Lure": 2, "Sound": 8,
    "Squirt": 6, "Zap": 12, "Throw": 2, "Drop": 3,
    "Special": 50
}
const level_costs = [1, 2, 3, 5, 8, 30, 80, 135]
export function getCost(strategy) {
    return strategy.reduce((x, y) => x + track_costs[y.id] * level_costs[y.parameters.level], 0)
}

export function convertToAOESquirt(val) {
    return val  // + 1 - val % 2
}