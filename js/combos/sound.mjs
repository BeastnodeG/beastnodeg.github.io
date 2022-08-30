import {getIterator, checkStrategy, update, getMinLevel, getDoubleMinLevel} from "./common.mjs"
import { Sound, Drop } from "../calculator/toon-attack.mjs"

function getDefault() {
    return { cost: 1e8, strategy: false, accuracy: 0 }
}

export function soundTest(state, parameters) {
    const output = getDefault()
    for (const i of getIterator(parameters.sound, 0, 7)) {
        let j = 0
        const strategy = i.map(x => new Sound(-1, { level: x, prestige: j++ < parameters.prestige_sound }))
        const accuracy = checkStrategy(state, strategy)
        if (accuracy)
            update(output, strategy, accuracy)
    }
    return output
}

export function soundDropTest(state, parameters) {
    const output = getDefault()
    for (const i of getIterator(3, 0, 7)) {
        let j = 0
        const strategy = i.map(x => new Sound(-1, { level: x, prestige: j++ < parameters.prestige_sound }))
        state.cleanup()
        const alive = state.cogs.filter(x => x.canAttack())
        if (alive.length === 1) {
            const drop_level = getMinLevel("Drop", alive[0].getHealth())
            if (drop_level > -1) {
                strategy.push(new Drop(alive[0].position, { level: drop_level, prestige: false }))
                state.loadState()
                update(output, strategy, state.turn(strategy))
                state.cleanup()
            }
        }
        state.loadState()
    }
    return output
}

export function soundDoubleDropTest(state, parameters) {
    const output = getDefault()
    for (const i of getIterator(2, 0, 7)) {
        let j = 0
        const strategy = i.map(x => new Sound(-1, { level: x, prestige: j++ < parameters.prestige_sound }))
        state.turn(strategy)
        state.cleanup()
        const alive = state.cogs.filter(x => x.canAttack())
        if (alive.length === 2) {
            const h = alive[0].getHealth(), h2 = alive[1].getHealth()
            const drop_level = getMinLevel("Drop", h), drop_level2 = getMinLevel("Drop", h2)
            if (drop_level > -1 && drop_level2 > -1) {
                strategy.push(new Drop(alive[0].position, { level: drop_level, prestige: false }))
                strategy.push(new Drop(alive[1].position, { level: drop_level2, prestige: false }))
                state.loadState()
                update(output, strategy, state.turn(strategy))
                state.cleanup()
            }
        } else if (alive.length === 1) {
            const h = Math.floor(alive[0].getHealth())
            const [ lv1, lv2 ] = getDoubleMinLevel(h, "Drop", "Drop", 1.3)
            if (lv1 > -1) {
                strategy.push(new Drop(alive[0].position, { level: lv1, prestige: false }))
                strategy.push(new Drop(alive[0].position, { level: lv2, prestige: false }))
                state.loadState()
                update(output, strategy, state.turn(strategy))
                state.cleanup()
            }
        }
        state.loadState()
    }
    return output
}