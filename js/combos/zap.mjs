import {update, getMinLevel, getIterator, getDoubleMinLevel, convertToAOESquirt} from "./common.mjs"
import { Squirt, Zap } from "../calculator/toon-attack.mjs"
import { damages } from "../calculator/constants.mjs"
import { EffectSoak } from "../calculator/effects.mjs"

function getDefault() {
    return { cost: 1e8, strategy: false, accuracy: 0 }
}

function selectSquirt(state, alive, output, strategy) {
    if (alive.length <= 1 || (alive.length === 2 && (
        (alive[0].position + alive[1].position) % 2 === 0 || alive[0].position + alive[1].position === 3))) {
        state.loadState()

        if (alive.length === 0) {
            strategy.push(new Squirt(0, { level: 0, prestige: false }))
            strategy.push(new Squirt(Math.min(2, state.cogs.length - 1), { level: 1, prestige: false }))
            update(output, strategy, state.turn(strategy))
        } else if (alive.length === 1) {
            const x = alive[0].position
            if (x <= 1 && x >= state.cogs.length - 2) {
                let [ lv1, lv2 ] = getDoubleMinLevel(alive[0], "Squirt", "Squirt", 1.2)
                if (lv1 > -1) {
                    // lv1 is always less than lv2
                    if (lv2 % 2 === 0)
                        lv1 = convertToAOESquirt(lv1)
                    strategy.push(new Squirt(x, { level: lv1, prestige: false }))
                    strategy.push(new Squirt(x, { level: lv2, prestige: false }))
                    update(output, strategy, state.turn(strategy))
                }
            } else {
                let lv = getMinLevel("Squirt", alive[0])
                if (lv > -1) {
                    if (x !== 0 && x !== 3)
                        lv = convertToAOESquirt(lv)
                    strategy.push(new Squirt(x, { level: lv, prestige: false }))
                    strategy.push(new Squirt(Math.min(2 - x + 2 * (x % 2), state.cogs.length - 1), { level: 1, prestige: false }))
                    update(output, strategy, state.turn(strategy))
                }
            }
        } else {
            let lv1 = getMinLevel("Squirt", alive[0])
            let lv2 = getMinLevel("Squirt", alive[1])
            if (lv1 > -1 && lv2 > -1) {
                // check whether single-target squirt suffices
                if (alive[0].position + alive[1].position === 3) {
                    lv1 = convertToAOESquirt(lv1)
                    lv2 = convertToAOESquirt(lv2)
                } else {
                    if (lv1 === 0 || lv1 === state.cogs.length - 1)
                        lv2 = convertToAOESquirt(lv2)
                    else
                        lv1 = convertToAOESquirt(lv1)
                }
                strategy.push(new Squirt(alive[0].position, { level: lv1, prestige: false }))
                strategy.push(new Squirt(alive[1].position, { level: lv2, prestige: false }))
                update(output, strategy, state.turn(strategy))
            }
        }

        state.cleanup()
    }
}

function zapTest(state, parameters) {
    const output = getDefault()
    for (let first_target = 0; first_target < state.cogs.length; first_target++)
    for (let second_target = 0; second_target < state.cogs.length; second_target++)
    for (const i of getIterator(2, 0, 7)) {
        const strategy = [
            new Zap(second_target, { level: i[1], prestige: true }),
            new Zap(first_target, { level: i[0], prestige: true })
        ]

        for (const cog of state.cogs) cog.effects.add(new EffectSoak(2))
        state.turn(strategy)
        state.cleanup()
        const alive = state.cogs.filter(x => x.canAttack())
        selectSquirt(state, alive, output, strategy)

        state.loadState()
    }

    return output
}

function cringeZapTest(state, parameters) {
    const output = getDefault()
    for (let fired = 0; fired < state.cogs.length; fired++)
    for (let first_target = 0; first_target < state.cogs.length; first_target++)
    for (let second_target = 0; second_target < state.cogs.length; second_target++)
    for (const i of getIterator(2, 0, 7)) {
        const strategy = [
            new Zap(first_target, { level: i[1], prestige: true }),
            new Zap(second_target, { level: i[0], prestige: true })
        ]

        let start_h = state.cogs[fired].getHealth()
        if (fired === first_target)
            start_h -= damages.Zap[i[1]]
        for (const cog of state.cogs) cog.effects.add(new EffectSoak(2))
        state.turn(strategy)
        state.cogs[fired].fire()
        state.cleanup()
        const alive = state.cogs.filter(x => x.canAttack())
        state.loadState()
        if (start_h > 0) {
            const cog = state.cloneCog(state.cogs[fired])
            cog.damageQueue = []
            cog.health = start_h
            alive.push(cog)
        }

        selectSquirt(state, alive, output, strategy)

        state.loadState()
    }

    return output
}

export function fullZapTest(state, parameters) {
    const output1 = zapTest(state, parameters)
    const output2 = cringeZapTest(state, parameters)
    if (output1.cost <= output2.cost)
        return output1
    else
        return output2
}