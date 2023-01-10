import {update, getMinLevel, getDoubleMinLevel, getIterator} from "./common.mjs"
import { Sound, Squirt, Zap, Drop } from "../calculator/toon-attack.mjs"

function getDefault() {
    return { cost: 1e8, strategy: false, accuracy: 0 }
}

function findSquirtDrop(output, strategy, state, squirt_level, drop_level, squirt_pos, drop_pos) {
    strategy.shift()
    strategy.push(new Squirt(squirt_pos, { level: squirt_level, prestige: true }))
    strategy.push(new Drop(drop_pos, { level: drop_level, prestige: false }))
    state.loadState()
    update(output, strategy, state.turn(strategy))
    state.cleanup()
}

export function syphonTest(state, parameters) {
    const output = getDefault()

    for (let soak_position = 0; soak_position < state.cogs.length; soak_position++)
        for (let zap_position = Math.max(0, soak_position - 1); zap_position < Math.min(state.cogs.length, soak_position + 2); zap_position++)
            for (let sound_level = 0; sound_level < 8; sound_level++)
                for (let zap_level = 0; zap_level < 8; zap_level++) {
                    const strategy = [
                        new Squirt(soak_position, { level: 0, prestige: true }),
                        new Sound(-1, { level: sound_level, prestige: parameters.prestige_sound }),
                        new Zap(zap_position, { level: zap_level, prestige: true })
                    ]
                    state.turn(strategy)
                    state.cleanup()
                    const alive = state.cogs.filter(x => x.canAttack())
                    if (alive.length === 1 || alive.length === 2) {
                        if (alive.length === 1 && alive[0].position !== soak_position) {
                            const h = alive[0].getHealth()
                            const drop_level = getMinLevel("Drop", h)
                            if (drop_level > -1) {
                                strategy.push(new Drop(alive[0].position, { level: drop_level, prestige: false }))
                                state.loadState()
                                update(output, strategy, state.turn(strategy))
                                state.cleanup()
                            }
                        } else if (alive.length === 2 && (alive[0].position === soak_position || alive[1].position === soak_position)) {
                            if (alive[0].position !== soak_position)
                                alive.reverse()
                            const squirt_level = getMinLevel("Squirt", alive[0].getHealth() + 4)
                            const drop_level = getMinLevel("Drop", alive[1].getHealth())
                            if (drop_level > -1 && squirt_level > -1)
                                findSquirtDrop(output, strategy, state, squirt_level, drop_level, alive[0].position, alive[1].position)
                        } else if (alive.length === 1) {
                            const [ squirt_level, drop_level ] = getDoubleMinLevel(alive[0].getHealth() + 4, "Squirt", "Drop")
                            if (squirt_level > -1)
                                findSquirtDrop(output, strategy, state, squirt_level, drop_level, alive[0].position, alive[0].position)
                        }
                    }
                    state.loadState()
                }
    return output
}

export function soundZapTest(state, parameters) {
    const output = getDefault()

    for (const sound_levels of getIterator(2, 0, 8)) {
        let j = 0
        const micro_strategy = sound_levels.map(x => new Sound(-1, { level: x, prestige: j++ < parameters.prestige_sound }))
        state.turn(micro_strategy)
        state.cleanup()
        const bad = state.cogs.filter(x => x.canAttack()).length === 0
        state.loadState()
        if (bad)
            continue

        for (let soak_position = 0; soak_position < state.cogs.length; soak_position++)
        for (let zap_position = Math.max(0, soak_position - 1); zap_position < Math.min(state.cogs.length, soak_position + 2); zap_position++)
        for (let zap_level = 0; zap_level < 8; zap_level++) {
            let j = 0
            const strategy = sound_levels.map(x => new Sound(-1, { level: x, prestige: j++ < parameters.prestige_sound }))
            strategy.push(new Squirt(soak_position, { level: 0, prestige: true }))
            strategy.push(new Zap(zap_position, { level: zap_level, prestige: true }))
            const accuracy = state.turn(strategy)
            state.cleanup()
            const alive = state.cogs.filter(x => x.canAttack())
            if ((alive.length === 1 && alive[0].position === soak_position) || alive.length === 0) {
                if (alive.length === 0)
                    update(output, strategy, accuracy)
                else {
                    const health = alive[0].getHealth() + 4
                    const level = getMinLevel("Squirt", health)
                    if (level > -1) {
                        strategy.splice(2, 1)
                        strategy.push(new Squirt(alive[0].position, { level, prestige: true }))
                        state.loadState()
                        update(output, strategy, state.turn(strategy))
                        state.cleanup()
                    }
                }
            }

            state.loadState()
        }
    }
    return output
}