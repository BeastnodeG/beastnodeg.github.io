import { Turn } from "./interfaces.mjs"
import { damages, rounds, accuracies, sos_damages, names } from "./constants.mjs"
import {
    EffectTrap,
    EffectLure,
    EffectSoak,
    EffectStun,
    EffectTargetedMultiplier,
    EffectEncore, EffectAdditiveIncrease, EffectCheer
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

    getMaxAccuracy() {
        return 0.95
    }

    getIgnoreQueue() {
        return false
    }

    calculateAccuracy(state) {
        let base_acc = this.getBaseAccuracy(state)
        if (base_acc >= 1)
            return 1
        if (this.target !== -1) {
            if (!this.getIgnoreQueue()) {
                if (state.cogs[this.target].queueExists()) return 1
                if (state.cogs[this.target].missed) return 0
            }
            const cog = state.cogs[this.target]
            const accuracy = cog.effects.getAccuracy(base_acc)
            if (accuracy.base >= 1)
                return 1
            let stuns = state.globalStuns + accuracy.stuns
            if (this.author)
                stuns = this.author.effects.getOverload("Stun", stuns, { track: this.id, base_stuns: stuns })
            return Math.max(0, Math.min(this.getMaxAccuracy(), (state.max_level - 1) / 10 + accuracy.base - accuracy.defense / 100 + stuns / 5))
        } else {
            const acc = state.cogs.map(x => x.effects.getAccuracy(base_acc))
            if (acc.filter(x => x.base >= 1).length > 0)
                return 1
            const base = Math.max(...acc.map(x => x.base))
            const def = Math.max(...acc.map(x => x.defense))
            let stuns = state.globalStuns + acc.reduce((x, y) => x + y.stuns, 0)
            if (this.author)
                stuns = this.author.effects.getOverload("Stun", stuns, { track: this.id, base_stuns: stuns })
            return Math.max(0, Math.min(this.getMaxAccuracy(), (state.max_level - 1) / 10 + base - def / 100 + stuns / 5))
        }
    }

    miss(state) {
        super.miss(state)
        if (this.target > -1 && state.cogs[this.target])
            state.cogs[this.target].missed = true
    }

    getTargets(state) {
        return this.getTargetsTemplate(state.cogs.length, "X", "-", this.target)
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

export class Rain extends Track {
    constructor(target, parameters) {
        super(target, names.Special[2], parameters)
        this.base_priority = 0.4
        this.parameters.targets_toons = true
        this.target_string = `toon ${target + 1}`
    }

    apply(state) {
        state.toons[this.target].effects.add(new EffectAdditiveIncrease(15, 1))
    }

    calculateAccuracy(state) {
        return 1
    }

    getTargets(state) {
        return this.getTargetsTemplate(state.toons.length, "X", "-", this.target)
    }
}

export class BoostSOS extends Track {
    constructor(target, parameters) {
        super(target, "BoostSOS", parameters)
        this.base_priority = 0.3
        this.parameters.targets_toons = true
        this.target_string = `toon ${target + 1}`
    }

    apply(state) {
        state.toons[this.target].effects.add(
            new EffectTargetedMultiplier(
                sos_damages[this.parameters.track], this.parameters.track, this.parameters.level))
        if (this.author && this.author !== state.toons[this.target])
            this.author.effects.add(
                new EffectTargetedMultiplier(
                    sos_damages[this.parameters.track], this.parameters.track, this.parameters.level))
    }

    calculateAccuracy(state) {
        return 1
    }

    getTargets(state) {
        return this.getTargetsTemplate(state.toons.length, "X", "-", this.target)
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
            this.author.heal(Math.ceil(n * 0.4))
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
        this.execute(state, Math.floor(this.damageValues[this.parameters.level] * 0.4))
    }

    apply(state) {
        this.execute(state, this.damageValues[this.parameters.level])
        if (this.parameters.level % 2 === 0)
            state.toons[this.target].effects.add(new EffectCheer())
        else
            for (const i of state.toons)
                i.effects.add(new EffectCheer())
    }

    getTargets(state) {
        if (!state.toons || state.toons.length <= 1) return "?"
        if (this.parameters.level % 2 === 1)
            return this.getTargetsTemplate(state.toons.length, "-", "X", this.author.position || this.author)
        else
            return this.getTargetsTemplate(state.toons.length, "X", "-", this.target)
    }
}

export class Trap extends Track {
    constructor(target, parameters) {
        super(target, "Trap", parameters)
        this.base_priority = 2
    }

    apply(state) {
        let damage = this.getDamage(this.damageValues[this.parameters.level])
        if (state.cogs[this.target].executive)
            damage *= 1.3
        if (this.parameters.prestige)
            damage *= 1.2
        state.cogs[this.target].effects.add(new EffectStun())
        state.cogs[this.target].effects.add(new EffectTrap(Math.ceil(damage)))
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
        const t = this.turnCount[this.parameters.level]
        let baseDamage = this.getDamage(this.damageValues[this.parameters.level])
        if (this.parameters.prestige) {
            if (this.parameters.level % 2 === 1)
                baseDamage *= 1.25
            else
                baseDamage *= 1.15
        }
        const damage = Math.ceil(baseDamage)
        if (this.target > -1) {
            state.cogs[this.target].effects.add(new EffectStun())
            state.cogs[this.target].effects.add(new EffectLure(t, damage))
            state.cogs[this.target].effects.trigger("Lure")
        } else {
            for (const i of state.cogs) {
                if (!i.effects.find("Lure")) {
                    i.effects.add(new EffectLure(t, damage))
                    i.effects.trigger("Lure")
                }
            }
            state.globalStuns++
        }
    }

    getTargets(state) {
        if (this.parameters.level % 2 === 1)
            return "X".repeat(state.cogs.length)
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
        for (const i of state.cogs) {
            i.effects.trigger("UnLure")
            const damage = Math.ceil(this.getDamage(this.damageValues[this.parameters.level]))
            i.pushDamage(damage, this.author, "Sound")
            if (this.author)
                this.author.effects.add(new EffectEncore(this.parameters.prestige ? 3 : 2))
        }
        state.globalStuns++
    }

    cleanup(state) {
        for (const i of state.cogs) {
            i.explodeQueue()
            i.clearQueue()
        }
    }

    getTargets(state) {
        return "X".repeat(state.cogs.length)
    }
}

export class Squirt extends Track {
    constructor(target, parameters) {
        super(target, "Squirt", parameters)
        this.base_priority = 5
        this.base_accuracy = 0.95
    }

    soak(cog, turns, allowDrenched = false) {
        const author = this.author.position === undefined ? false : this.author.position
        const drenched = allowDrenched && this.parameters.prestige
        if (!cog.effects.find("Soak"))
            cog.effects.trigger("Soak", author)
        cog.effects.add(new EffectSoak(turns, drenched))
    }

    apply(state) {
        this.soak(state.cogs[this.target], this.turnCount[this.parameters.level], true)
        if (this.parameters.level % 2 === 1) {
            if (state.cogs[this.target + 1])
                this.soak(state.cogs[this.target + 1], this.turnCount[this.parameters.level])
            if (state.cogs[this.target - 1])
                this.soak(state.cogs[this.target - 1], this.turnCount[this.parameters.level])
        }
        let damage = this.getDamage(this.damageValues[this.parameters.level])
        state.cogs[this.target].pushDamage(Math.ceil(damage), this.author, "Squirt")
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
        return 0.0001
    }

    apply(state) {
        let current_pos = this.target
        if (!state.cogs[current_pos].effects.find("Soak")) {
            state.cogs[current_pos].pushDamage(0, this.author, "Zap")
            state.cogs[current_pos].effects.trigger("UnLure")
            return
        }

        let damage = this.damageValues[this.parameters.level]
        let damage_pool = damage * (this.parameters.prestige ? 1.1 : 0.9)
        state.cogs[current_pos].pushDamage(damage, this.author, "Zap")
        state.cogs[current_pos].effects.trigger("UnLure")
        state.cogs[current_pos].effects.trigger("ReduceSoak", 1)

        let next_cog = state.cogs[current_pos + 1], direction = 1
        if (!next_cog || !next_cog.effects.find("Soak") || next_cog.health <= 0)
            [ next_cog, direction ] = [ state.cogs[current_pos - 1], -1 ]
        if (!next_cog || !next_cog.effects.find("Soak") || next_cog.health <= 0)
            return
        let cog_after = state.cogs[current_pos + 2 * direction]
        const cog_pool = (cog_after && cog_after.effects.find("Soak") && next_cog.health > 0)
            ? [ next_cog, cog_after ] : [ next_cog ]

        damage_pool = Math.ceil(this.getDamage(damage_pool / cog_pool.length))
        for (const i of cog_pool) {
            if (i.effects.find("Soak")) {
                i.pushDamage(damage_pool, this.author, "Zap")
                i.effects.trigger("ReduceSoak", 1)
                i.effects.trigger("UnLure")
            } else break
        }
    }

    cleanup(state) {
        for (const i of state.cogs) {
            i.explodeQueue()
            i.clearQueue()
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
        state.cogs[this.target].pushDamage(Math.ceil(this.getDamage(damage)), this.author, "Throw")
        state.cogs[this.target].effects.add(new EffectStun())
        if (this.parameters.prestige && this.author)
            this.author.heal(Math.ceil(damage / 5))
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

export class Drop extends Track {
    constructor(target, parameters) {
        super(target, "Drop", parameters)
        this.base_priority = 8
        this.base_accuracy = this.parameters.prestige ? 0.65 : 0.5
    }

    getIgnoreQueue() {
        return true
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
            state.cogs[this.target].pushDamage(this.getDamage(damage), this.author, "Drop")
        if (this.parameters.prestige)
            state.cogs[this.target].pres_drops++
        state.cogs[this.target].effects.add(new EffectStun())
    }

    cleanup(state) {
        for (const i of state.cogs) if (i.queueExists()) {
            const combo = 0.3  // 0.1 + 0.1 * i.damageQueue.length + 0.1 * i.pres_drops
            i.queueCombo(combo)
            i.explodeQueue()
            i.clearQueue()
            delete i.pres_drops
        }
    }
}