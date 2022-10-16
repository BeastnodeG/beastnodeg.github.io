import { update, getMinLevel, getIterator, getDoubleMinLevel } from "./common.mjs"
import { Squirt, Zap } from "../calculator/toon-attack.mjs"
import { damages } from "../calculator/constants.mjs"
import { EffectSoak } from "../calculator/effects.mjs"

function getDefault() {
    return { cost: 1e8, strategy: false, accuracy: 0 }
}

function selectSquirt(state, alive, output, strategy, parameters) {
    if (alive.length <= 1 || (alive.length === 2 && (
        (alive[0].position + alive[1].position) % 2 === 0 || (parameters.double_squirt && alive[0].position + alive[1].position === 3)))) {
        state.loadState()

        if (alive.length === 0) {
            strategy.push(new Squirt(0, { level: 0, prestige: false }))
            strategy.push(new Squirt(Math.min(2, state.cogs.length - 1), { level: 0, prestige: true }))
            update(output, strategy, state.turn(strategy))
        } else if (alive.length === 1) {
            const x  = alive[0].position
            if (x <= 1 && x >= state.cogs.length - 2) {
                const [ lv1, lv2 ] = getDoubleMinLevel(alive[0].getHealth(), "Squirt", "Squirt", 1.2)
                if (lv1 > -1) {
                    strategy.push(new Squirt(x, { level: lv1, prestige: true }))
                    strategy.push(new Squirt(x, { level: lv2, prestige: true }))
                    update(output, strategy, state.turn(strategy))
                }
            } else {
                const lv = getMinLevel("Squirt", alive[0].getHealth())
                if (lv > -1) {
                    strategy.push(new Squirt(x, { level: lv, prestige: true }))
                    strategy.push(new Squirt(Math.min(2 - x + 2 * (x % 2), state.cogs.length - 1), { level: 0, prestige: true }))
                    update(output, strategy, state.turn(strategy))
                }
            }
        } else {
            const lv1 = getMinLevel("Squirt", alive[0].getHealth())
            const lv2 = getMinLevel("Squirt", alive[1].getHealth())
            if (lv1 > -1 && lv2 > -1) {
                strategy.push(new Squirt(alive[0].position, { level: lv1, prestige: true }))
                strategy.push(new Squirt(alive[1].position, { level: lv2, prestige: true }))
                update(output, strategy, state.turn(strategy))
            }
        }

        state.cleanup()
    }
}

function getCrossDescription(state, output) {
    if (output.strategy && output.strategy[0].target !== output.strategy[1].target) {
        if (output.strategy[0].level === output.strategy[1].level) {
            const strategy_2 = [
                new Zap(output.strategy[1].target, { level: output.strategy[1].level, prestige: output.strategy[1].prestige }),
                new Zap(output.strategy[0].target, { level: output.strategy[0].level, prestige: output.strategy[0].prestige }),
                new Squirt(output.strategy[2].target, { level: output.strategy[2].level, prestige: output.strategy[2].prestige }),
                new Squirt(output.strategy[3].target, { level: output.strategy[3].level, prestige: output.strategy[3].prestige }),
            ]
            state.turn(strategy_2)
            state.cleanup()
            const cross_right = state.cogs.filter(x => x.canAttack()).length > 0
            state.loadState()

            if (cross_right) {
                if (output.strategy[0].target < output.strategy[1].target)
                    output.description = "no cross"
                else if (output.strategy[0].target > output.strategy[1].target)
                    output.description = "cross"
            } else output.description = " "
        } else output.description = " "
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
        selectSquirt(state, alive, output, strategy, parameters)

        state.loadState()
    }

    getCrossDescription(state, output)
    return output
}

function cringeZapTest(state, parameters) {
    const output = getDefault()
    for (let fired = 0; fired < state.cogs.length; fired++)
    for (let first_target = 0; first_target < state.cogs.length; first_target++)
    for (let second_target = 0; second_target < state.cogs.length; second_target++)
    for (const i of getIterator(2, 0, 7)) {
        const strategy = [
            new Zap(first_target, { level: i[1], prestige: false }),
            new Zap(second_target, { level: i[0], prestige: false })
        ]

        let start_h = state.cogs[fired].getHealth()
        if (fired === first_target)
            start_h -= 3 * damages.Zap[i[1]]
        state.cogs[fired].fire()
        for (const cog of state.cogs) cog.effects.add(new EffectSoak(2))
        state.turn(strategy)
        state.cleanup()
        const alive = state.cogs.filter(x => x.canAttack())
        state.loadState()
        if (start_h > 0) {
            const cog = state.cloneCog(state.cogs[fired])
            cog.damageQueue = []
            cog.health = start_h
            alive.push(cog)
        }

        selectSquirt(state, alive, output, strategy, parameters)

        state.loadState()
    }

    getCrossDescription(state, output)

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
