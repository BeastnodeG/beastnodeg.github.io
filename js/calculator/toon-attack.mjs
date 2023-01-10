import { Turn } from "./interfaces.mjs"
import { damages, rounds, accuracies, sos_multipliers, names } from "./constants.mjs"
import {
    EffectTrap,
    EffectLure,
    EffectSoak,
    EffectStun,
    EffectDamageMultiplier,
    EffectTargetedMultiplier,
    EffectMarkedForLaugh
} from "./effects.mjs"

export class Track extends Turn {
    constructor(target, name = false, parameters = {}) {
        super(target, parameters)
        if (!this.parameters.level)
            this.parameters.level = 0
        this.base_accuracy = 1
        this.id = name || "Track"
        if (damages[this.id])
            this.damageValues = damages[this.id]
        if (rounds[this.id])
            this.turnCount = rounds[this.id]
        if (accuracies[this.id])
            this.accuracyValues = accuracies[this.id]
    }

    getBaseAccuracy(state) {
        if (state.cogs[this.target].queueExists())
            return 1
        return this.base_accuracy
    }

    priority(position) {
        return position + 10 * this.parameters.level + 10000 * this.base_priority
    }

    cleanup(state) {
        for (const i of state.cogs)
            i.clearQueue()
    }

    calculateAccuracy(state) {
        let base_acc = this.getBaseAccuracy(state)
        if (base_acc >= 1)
            return 1
        if (this.target !== -1) {
            if (state.cogs[this.target].queueExists()) return 1
            if (state.cogs[this.target].missed) return 0
            const cog = state.cogs[this.target]
            const accuracy = cog.effects.getAccuracy(base_acc)
            if (accuracy.base >= 1)
                return 1
            const stuns = state.globalStuns + accuracy.stuns
            return Math.max(0, Math.min(0.95, (state.max_level - 1) / 10 + accuracy.base - accuracy.defense / 100 + stuns / 5))
        } else {
            const acc = state.cogs.map(x => x.effects.getAccuracy(base_acc))
            if (acc.filter(x => x.base >= 1).length > 0)
                return 1
            const base = Math.max(...acc.map(x => x.base))
            const def = Math.max(...acc.map(x => x.defense))
            const stuns = state.globalStuns + state.localStuns + acc.reduce((x, y) => x + y.stuns, 0)
            return Math.max(0, Math.min(0.95, (state.max_level - 1) / 10 + base - def / 100 + stuns / 5))
        }
    }

    miss(state) {
        super.miss(state)
        if (this.target > -1 && state.cogs[this.target])
            state.cogs[this.target].missed = true
    }

    getTargets(state) {
        return this.getTargetsTemplate(state.cogs.length, this.parameters.prestige ? "O" : "X", "-", this.target)
    }

    getTargetsTemplate(length, sym1, sym2, target) {
        if (target >= length || target < -1) return "?"
        return sym2.repeat(length - target - 1) + sym1 + sym2.repeat(target)
    }

    getDamage(n, method = 1) {
        if (this.author)
            return this.author.effects.getOverload("DealDamage", n, { track: this.id, base_damage: n, method })
        else
            return n
    }
}

export class Sue extends Track {
    constructor(target, parameters) {
        super(target, "Sue", parameters)
        this.base_priority = 0.1
    }

    apply(state) {
        if (state.cogs[this.target].effects.getOverload("Sue", true))
            state.cogs[this.target].sue()
    }
}

export class Fire extends Track {
    constructor(target, parameters) {
        super(target, "Fire", parameters)
        this.base_priority = 0
    }

    apply(state) {
        if (state.cogs[this.target].effects.getOverload("Fire", true))
            state.cogs[this.target].fire()
    }
}

export class ProfessorPete extends Track {
    constructor(target, parameters) {
        super(target, names.Special[2], parameters)
        this.base_priority = 0.2
        this.parameters.targets_toons = true
        this.target_string = "all toons"
    }

    apply(state) {
        for (const i of state.toons)
            i.restock(8)
        state.globalStuns++
    }

    calculateAccuracy(state) {
        return 1
    }

    getTargets(state) {
        if (!state.toons) return "?"
        return "X".repeat(state.toons.length)
    }
}

export class Rain extends Track {
    constructor(target, parameters) {
        super(target, names.Special[3], parameters)
        this.base_priority = 0.4
        this.parameters.targets_toons = true
        this.target_string = "all toons"
    }

    apply(state) {
        for (const i of state.toons)
            i.effects.add(new EffectDamageMultiplier(1.05, 2))
        state.globalStuns++
    }

    calculateAccuracy(state) {
        return 1
    }

    getTargets(state) {
        if (!state.toons) return "?"
        return "X".repeat(state.toons.length)
    }
}

export class BoostSOS extends Track {
    constructor(target, parameters) {
        super(target, "BoostSOS", parameters)
        this.base_priority = 0.3
        this.parameters.targets_toons = true
        this.target_string = "all toons"
    }

    apply(state) {
        for (const i of state.toons)
            i.effects.add(new EffectTargetedMultiplier(sos_multipliers[this.parameters.track][this.parameters.level], this.parameters.track, 3))
        state.globalStuns++
    }

    calculateAccuracy(state) {
        return 1
    }

    getTargets(state) {
        if (!state.toons) return "?"
        return "X".repeat(state.toons.length)
    }
}

export class ToonUp extends Track {
    constructor(target, parameters) {
        super(target, "Toon-Up", parameters)
        this.base_priority = 1
        this.parameters.targets_toons = true
        this.target_string = parameters.level % 2 === 1 ? "all toons" : `toon ${target + 1}`
    }

    calculateAccuracy(state) {
        return 0.95
    }

    execute(state, n) {
        if (!state.toons || state.toons.length <= 1) return
        n = Math.ceil(this.getDamage(n))
        if (this.parameters.prestige)
            this.author.heal(Math.ceil(n / 2))
        if (this.parameters.level % 2 === 1) {
            n = Math.ceil(n / (state.toons.length - 1))
            for (const i of state.toons)
                if (i.position !== this.author.position)
                    i.heal(n)
        } else if (state.toons[this.target])
            state.toons[this.target].heal(n)
    }

    miss(state) {
        this.missed = "missed"
        this.execute(state, Math.floor(this.damageValues[this.parameters.level] / 5))
    }

    apply(state) {
        this.execute(state, this.damageValues[this.parameters.level])
        if (this.parameters.level % 2 === 1)
            state.globalStuns++
        else
            state.localStuns++
    }

    getTargets(state) {
        if (!state.toons || state.toons.length <= 1) return "?"
        if (this.parameters.level % 2 === 1)
            return this.getTargetsTemplate(state.toons.length, "-", this.parameters.prestige ? "O" : "X", this.author.position || this.author)
        else
            return this.getTargetsTemplate(state.toons.length, this.parameters.prestige ? "O" : "X", "-", this.target)
    }
}

export class Trap extends Track {
    constructor(target, parameters) {
        super(target, "Trap", parameters)
        this.base_priority = 2
    }

    apply(state) {
        let damage = this.damageValues[this.parameters.level]
        if (state.cogs[this.target].executive)
            damage *= 1.3
        if (this.parameters.prestige && state.cogs[this.target].max_health <= 2 * state.cogs[this.target].health)
            damage *= 1.2 // TODO: check whether the prestige works this way or it calculates damage during the lure
        state.cogs[this.target].effects.add(new EffectStun())
        state.cogs[this.target].effects.add(new EffectTrap(this.getDamage(damage)))
    }

    cleanup(state) {
        const trap = state.cogs[this.target].effects.find("Trap")
        if (trap && trap.damage === -1)
            state.cogs[this.target].effects.remove("Trap")
    }
}

export class Lure extends Track {
    constructor(target, parameters) {
        super(target, "Lure", parameters)
        this.base_priority = 3
    }

    getBaseAccuracy(state) {
        if (this.target > -1) {
            return this.accuracyValues[this.parameters.level]
        } else {
            for (const i of state.cogs)
                if (i.queueExists()) return 1
            return this.accuracyValues[this.parameters.level]
        }
    }

    apply(state) {
        const t = Math.ceil(this.getDamage(this.turnCount[this.parameters.level]))
        if (this.target > -1) {
            state.cogs[this.target].pushDamage(0, this.author)
            state.cogs[this.target].effects.add(new EffectStun())
            state.cogs[this.target].effects.add(new EffectLure(t, this.parameters.prestige))
        } else {
            for (const i of state.cogs) {
                i.pushDamage(0, this.author)
                if (!i.effects.find("Lure")) {
                    i.effects.add(new EffectLure(t, this.parameters.prestige, (this.parameters.prestige ? 0.65 : 0.5) + this.getDamage(1, 0) - 1))
                    i.effects.trigger("Lure")
                }
            }
            state.globalStuns++
        }
    }

    getTargets(state) {
        if (this.parameters.level % 2 === 1)
            return (this.parameters.prestige ? "O" : "X").repeat(state.cogs.length)
        else
            return super.getTargets(state)
    }
}

export class Sound extends Track {
    constructor(target, parameters) {
        super(target, "Sound", parameters)
        this.base_priority = 4
        this.base_accuracy = 0.95
    }

    getBaseAccuracy(state) {
        for (const i of state.cogs)
            if (i.queueExists())
                return 1
        return this.base_accuracy
    }

    apply(state) {
        const max_level = Math.ceil(Math.max(...state.cogs.map(x => x.level)) / 2)
        for (const i of state.cogs) {
            i.effects.trigger("UnLure")
            const damage = this.damageValues[this.parameters.level] + (this.parameters.prestige ? max_level : 0)
            i.pushDamage(this.getDamage(damage), this.author)
        }
        state.globalStuns++
    }

    cleanup(state) {
        for (const i of state.cogs) {
            i.queueCombo()
            i.explodeQueue()
            i.clearQueue()
        }
    }

    getTargets(state) {
        return (this.parameters.prestige ? "O" : "X").repeat(state.cogs.length)
    }
}

export class Squirt extends Track {
    constructor(target, parameters) {
        super(target, "Squirt", parameters)
        this.base_priority = 5
        this.base_accuracy = 0.95
    }

    soak(cog, turns) {
        if (!cog.effects.find("Soak"))
            cog.effects.trigger("Soak", this.author.position === undefined ? false : this.author.position)
        cog.effects.add(new EffectSoak(turns))
    }

    apply(state) {
        this.soak(state.cogs[this.target], this.turnCount[this.parameters.level])
        if (this.parameters.prestige) {
            if (state.cogs[this.target + 1])
                this.soak(state.cogs[this.target + 1], this.turnCount[this.parameters.level])
            if (state.cogs[this.target - 1])
                this.soak(state.cogs[this.target - 1], this.turnCount[this.parameters.level])
        }
        const damage = this.damageValues[this.parameters.level]
        state.cogs[this.target].pushDamage(this.getDamage(damage), this.author)
        state.cogs[this.target].effects.add(new EffectStun())
    }

    cleanup(state) {
        for (const i of state.cogs) if (i.queueExists()) {
            i.effects.trigger("LureAttack")
            i.queueCombo()
            i.explodeQueue()
            i.clearQueue()
        }
    }
}

export class Zap extends Track {
    constructor(target, parameters) {
        super(target, "Zap", parameters)
        this.base_priority = 6
    }

    getBaseAccuracy(state) {
        if (state.cogs[this.target].effects.find("Soak"))
            return 1
        return 0.3
    }

    apply(state) {
        const pos_iterator = [0, +1, +2, -1, -2]
        const falloff = this.parameters.prestige ? 0.5 : 0.75
        let current_pos = this.target
        const damage = this.damageValues[this.parameters.level]
        if (!state.cogs[current_pos].effects.find("Soak")) {
            state.cogs[current_pos].pushDamage(damage)
            state.cogs[current_pos].effects.trigger("UnLure")
        } else
            for (let current_turn = 0; current_turn < 3; current_turn++)
                for (const i of pos_iterator)
                    if (state.cogs[current_pos + i] && state.cogs[current_pos + i].effects.find("Soak") &&
                        (current_turn === 0 || i !== 0) &&
                        (
                            (!state.cogs[current_pos + i].is_jumped && state.cogs[current_pos + i].getHealth() > 0 && current_pos + i !== this.target) ||
                            current_turn === 0
                        )
                    ) {
                        current_pos += i
                        const cog = state.cogs[current_pos]
                        if (current_turn > 0)
                            cog.is_jumped = true
                        cog.pushDamage(Math.ceil((3 - falloff * current_turn) * this.getDamage(damage)), this.author)
                        cog.effects.trigger("ReduceSoak")
                        cog.effects.trigger("UnLure")
                        cog.effects.add(new EffectStun())
                        break
                    }
    }

    cleanup(state) {
        for (const i of state.cogs) {
            i.explodeQueue()
            i.clearQueue()
            delete i.is_jumped
        }
    }
}

export class Throw extends Track {
    constructor(target, parameters) {
        super(target, "Throw", parameters)
        this.base_priority = 7
        this.base_accuracy = 0.75
    }

    apply(state) {
        let damage = this.damageValues[this.parameters.level]
        state.cogs[this.target].pushDamage(this.getDamage(damage), this.author)
        state.cogs[this.target].effects.add(new EffectStun())
        if (!state.cogs[this.target].pres_throws)
            state.cogs[this.target].pres_throws = 0
        if (this.parameters.prestige)
            state.cogs[this.target].pres_throws++
    }

    cleanup(state) {
        for (const i of state.cogs) if (i.queueExists()) {
            i.effects.trigger("LureAttack")
            i.queueCombo()
            i.explodeQueue()
            i.clearQueue()

            if (i.pres_throws)
                i.effects.add(new EffectMarkedForLaugh(i.pres_throws))
            delete i.pres_throws
        }
    }
}

export class Drop extends Track {
    constructor(target, parameters) {
        super(target, "Drop", parameters)
        this.base_priority = 8
        // TODO: increased accuracy when hitting one cog with prestige drop (currently impossible to do)
        this.base_accuracy = 0.5
    }

    getBaseAccuracy(state) {
        if (state.cogs[this.target].effects.find("Lure"))
            return 0
        return this.base_accuracy
    }

    apply(state) {
        const damage = this.damageValues[this.parameters.level]
        if (!state.cogs[this.target].pres_drops)
            state.cogs[this.target].pres_drops = 0
        if (!state.cogs[this.target].effects.find("Lure"))
            state.cogs[this.target].pushDamage(this.getDamage(damage), this.author)
        if (this.parameters.prestige)
            state.cogs[this.target].pres_drops++
        state.cogs[this.target].effects.add(new EffectStun())
    }

    cleanup(state) {
        for (const i of state.cogs) if (i.queueExists()) {
            const combo = 0.1 * i.damageQueue.length + 0.1 * i.pres_drops
            i.queueCombo(combo)
            i.explodeQueue()
            i.clearQueue()
            delete i.pres_drops
        }
    }
}