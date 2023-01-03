import { printRoman } from "./constants.mjs"

export class Effect {
    constructor() {
        this.name = false
        this.signals = []
        this.overloads = []
    }

    /**
     * Is called when an attack is giving the effect to the object.
     * @param object
     */
    enable(object) {
        const name = this.name || this.constructor.name
        object.effects.trigger(name.replace("Effect", ""))
    }

    /**
     * Returns either False or the status's description
     * @returns {boolean|string}
     */
    getText() { return "" }
    getImage() { return "" }

    /**
     * Is called when an attack on an object with this effect is used. Changes accuracy object in place.
     * @param acc - Accuracy object (has Base accuracy and Defense)
     */
    processAccuracy(acc) {}

    /**
     * Is called when an attack tries to place a new effect to position this one uses.
     * @param new_eff - The attempted effect
     */
    update(new_eff) {}

    /**
     * Is called at the end of each turns.
     * @returns {boolean} - whether the effect should stay on the cog. True = stays, False = removed
     */
    cleanup() {
        return true
    }
}

export class EffectManager {
    constructor(parent) {
        this.statuses = {}
        this.parent = parent
    }

    add(effect) {
        const name = effect.name || effect.constructor.name
        if (this.statuses[name])
            this.statuses[name].update(effect)
        else {
            this.statuses[name] = effect
            effect.parent = this.parent
            effect.enable(this.parent)
        }
    }

    /**
     * Finds an effect with specific name
     * @param name
     * @returns {Effect|boolean}
     */
    find(name) {
        const x = this.statuses[`Effect${name}`]
        return x && !x.inactive ? x : false
    }

    /**
     * Removes an effect with specific name
     * @param name
     */
    remove(name) {
        if (!this.statuses[name]) return
        this.statuses[name].cleanup()
        delete this.statuses[name]
    }

    /**
     * Gets all effects
     * @returns {Effect[]}
     */
    getAll() {
        return Object.values(this.statuses)
    }

    /**
     * Gets the accuracy of attacks targeting the effect owner
     * @param base
     * @returns {{stuns: number, defense: number, base: number}}
     */
    getAccuracy(base) {
        const accuracy = { defense: this.parent.defense, base, stuns: 0 }
        for (const i of Object.values(this.statuses))
            i.processAccuracy(accuracy)
        return accuracy
    }

    /**
     * Gets the list of all descriptions
     * @returns {{txt: string, img: string}[]}
     */
    getImages() {
        const texts = []
        for (const i of Object.values(this.statuses)) {
            const img = i.getImage()
            const txt = i.getText()
            if (txt)
                texts.push({ txt, img })
        }
        return texts
    }

    trigger(signal, data = false) {
        for (const i of Object.values(this.statuses))
            if (i.signals.indexOf(signal) > -1)
                i[`exec${signal}`](data)
    }

    getOverload(signal, data, context = {}) {
        for (const i of Object.values(this.statuses))
            if (i.overloads.indexOf(signal) > -1)
                data = i[`overload${signal}`](data, context)
        return data
    }

    cleanup() {
        for (const i of Object.keys(this.statuses)) {
            const answer = this.statuses[i].cleanup()
            if (!answer || this.statuses[i].inactive)
                delete this.statuses[i]
        }
    }
}

class EffectDazed extends Effect {
    constructor() {
        super()
        this.turns = 2
    }

    getText() { return `Dazed for ${this.turns} turns` }
    getImage() { return "stun" }

    processAccuracy(acc) {
        acc.defense = Math.max(acc.defense - 10, 0)
    }

    cleanup() {
        this.turns--
        return this.turns > 0
    }
}

export class EffectTrap extends Effect {
    constructor(damage) {
        super()
        this.signals = ["Lure"]
        this.damage = damage
        this.legal = true
    }

    update(new_effect) {
        this.damage = -1
    }

    execLure() {
        if (this.damage > 0) {
            const cog = this.parent
            cog.pushExtraDamage({ damage: this.damage })
            cog.explodeQueue()
            this.damage = 0
            cog.effects.trigger("UnLure")
            cog.effects.add(new EffectDazed())
        }
        this.legal = false
    }

    getText() {
        if (this.damage > 0)
            return `Trapped for ${this.damage} damage`
        if (this.damage === -1)
            return "Double Trapped"
        return false
    }

    getImage() {
        if (this.damage > 0)
            return "trap"
        if (this.damage === -1)
            return "blank"
        return false
    }

    cleanup() {
        return this.legal
    }
}

export class EffectLure extends Effect {
    constructor(turns, damage) {
        super()
        this.signals = ["LureAttack", "UnLure"]
        this.overloads = ["CanMove"]
        this.turns = turns
        this.knockback = damage
        this.inactive = false
    }

    update(new_effect) {
        this.inactive = false
        this.knockback = Math.max(this.knockback, new_effect.knockback)
        this.turns = Math.max(this.turns, new_effect.turns)
    }

    enable() {
        const cog = this.parent
        this.turns = cog.effects.getOverload("LureRounds", this.turns)
        this.inactive = (this.turns === 0)
        if (this.turns > 0)
            cog.effects.trigger("Lure")
    }

    getText() {
        if (!this.inactive)
            return `Lured with ${this.knockback} knockback damage for ${this.turns} turns`
    }

    getImage() {
        if (this.inactive) return false
        return "lure"
    }

    processAccuracy(acc) {
        acc.base = 100
    }

    execLureAttack() {
        if (this.inactive) return
        const cog = this.parent
        for (let i = 0; i < cog.damageQueue.length; i++)
            cog.damageQueue[i].damage += this.knockback
        cog.effects.trigger("UnLure")
    }

    execUnLure() {
        this.inactive = true
    }

    cleanup() {
        this.turns--
        return this.turns > 0
    }

    overloadCanMove() {
        return false
    }
}

export class EffectSoak extends Effect {
    constructor(turns, drenched) {
        super()
        this.turns = turns
        this.drenched = drenched
        this.drenchedReduction = false
        this.signals = ["ReduceSoak"]
        this.overloads = ["DealDamage"]
    }

    getText() {
        const word = this.drenched ? "Drenched" : "Soaked"
        return `${word} for ${this.turns} turns`
    }
    getImage() { return this.drenched ? "presthrow" : "soak" }

    processAccuracy(acc) {
        const delta = this.drenched ? 20 : 15
        acc.defense = Math.max(acc.defense - delta, 0)
    }

    execReduceSoak(value) {
        if (this.drenched) {
            if (this.drenchedReduction) return
            this.drenchedReduction = true
            this.turns = Math.max(0, this.turns - 1)
        }
        else
            this.turns = 0
    }

    cleanup() {
        this.turns--
        this.drenchedReduction = false
        return this.turns >= 1
    }

    overloadDealDamage(data, context) {
        if (!this.drenched)
            return data
        return data * 0.85
    }

    update(new_eff) {
        this.turns = Math.max(this.turns, new_eff.turns)
        this.drenched ||= new_eff.drenched
    }
}

export class EffectSkip extends Effect {
    constructor(turns = 1) {
        super()
        this.overloads = ["CanMove"]
        this.turns = turns
    }

    getText() {
        if (this.turns === 1)
            return `Skips the next turn`
    }

    getImage() {
        if (this.turns === 1)
            return "skip"
    }

    cleanup() {
        this.turns--
        return this.turns === 0
    }

    overloadCanMove() {
        return false
    }
}

export class EffectAccuracy extends Effect {
    constructor(acc, turns) {
        super()
        this.overloads = ["GetAccuracy"]
        this.acc = acc
        this.turns = turns
    }

    getText() {
        return `${this.acc} more accuracy for ${this.turns} turns`
    }

    getImage() {
        return "lure"
    }

    cleanup() {
        this.turns--
        return this.turns === 0
    }

    overloadGetAccuracy(data) {
        return Math.min(0.95, data + this.acc)
    }
}

export class EffectSue extends Effect {
    constructor() {
        super()
        this.turns = 4
        this.overloads = ["CanMove"]
        this.signals = ["ExplodeQueue"]
    }

    getText() { return `Sued for ${this.turns} turns` }
    getImage() { return "sue" }

    cleanup() {
        const cog = this.parent
        this.turns--
        if (this.turns === 0) {
            cog.effects.add(new EffectSkip())
            return false
        }
        return true
    }

    overloadCanMove() {
        return false
    }

    execExplodeQueue(count) {
        if (this.turns < 5)  // might be needed for the debug sue usage
            this.turns = Math.min(5, this.turns + count)
    }
}

export class EffectStun extends Effect {
    constructor() {
        super()
        this.stuns = 1
    }

    getText() { return `Stunned ${this.stuns} times` }
    getImage() { return "stun" }

    processAccuracy(acc) {
        acc.stuns += this.stuns
    }

    update(new_effect) {
        this.stuns += new_effect.stuns
    }

    cleanup() {
        this.stuns = 0
        return false
    }
}

export class EffectDamageMultiplier extends Effect {
    constructor(n, turns = -1) {
        super()
        this.overloads = ["DealDamage"]
        this.mult = n
        this.turns = turns
    }

    overloadDealDamage(data, context) {
        if (context.method === 0)
            return data + context.base_damage * (this.mult - 1)
        return data * this.mult
    }

    getText() {
        if (this.turns === -1)
            return `Damage x${this.mult}`
        else
            return `Damage x${this.mult} for ${this.turns} turns`
    }

    getImage() {
        if (this.mult > 1.01)
            return "damage-up"
        else if (this.mult < 0.99)
            return "damage-down"
        else
            return "blank"
    }

    update(new_effect) {
        if (new_effect.turns === -1)
            this.turns = -1
        else if (new_effect.turns > this.turns && this.turns !== -1)
            this.turns = new_effect.turns
    }

    cleanup() {
        if (this.turns > 0) {
            this.turns--
            return this.turns > 0
        }
        return true
    }
}

export class EffectTargetedMultiplier extends Effect {
    constructor(values, track, level) {
        super()
        this.overloads = ["DealDamage"]
        this.values = values
        this.turns = [0, 0, 0]
        this.turns[level] = 3 - level

        this.track = track
        this.name = `TargetedMultiplier${track}`
    }

    overloadDealDamage(data, context) {
        // Attempt to use the highest value from ones with nonzero turns
        if (context.track !== this.track)
            return data

        for (let i = this.turns.length - 1; i >= 0; i--)
            if (this.turns[i] > 0) {
                this.turns[i] -= 1
                return data + this.values[i]
            }
        return data
    }

    getText() {
        for (let i = this.turns.length - 1; i >= 0; i--)
            if (this.turns[i] > 0)
                return `${this.track} Damage +${this.values[i]} (${this.turns[i]} more times)`
        return "IOU (ran out)"
    }

    getImage() {
        for (let i = this.turns.length - 1; i >= 0; i--)
            if (this.turns[i] > 0)
                return "damage-up"
        return "blank"
    }

    update(new_effect) {
        for (let i = this.turns.length - 1; i >= 0; i--)
            this.turns[i] = Math.max(this.turns[i], new_effect.turns[i])
    }

    cleanup() {
        for (let i = this.turns.length - 1; i >= 0; i--)
            if (this.turns[i] > 0)
                return true

        return false
    }
}

export class EffectAdditiveIncrease extends Effect {
    constructor(n, turns = 1) {
        super()
        this.overloads = ["DealDamage"]
        this.value = n
        this.turns = turns
        this.name = "AdditiveIncrease"
    }

    overloadDealDamage(data, context) {
        this.turns -= 1
        return data + this.value
    }

    getText() {
        return `Damage +${this.value} (${this.turns} more times}`
    }

    getImage() {
        if (this.value > 1.01)
            return "damage-up"
        else if (this.value < 0.99)
            return "damage-down"
        else
            return "blank"
    }

    update(new_effect) {
        // This is not valid, sadly, but this is the fate of having this cringe effect system
        this.turns += new_effect.turns
    }

    cleanup() {
        return this.turns > 0
    }
}

export class EffectVulnerable extends Effect {
    constructor(n, turns = -1) {
        super()
        this.overloads = ["TakeDamage"]
        this.mult = n
        this.turns = turns
    }

    overloadTakeDamage(data) {
        return data * this.mult
    }

    getText() {
        if (this.turns === -1)
            return `Damage taken x${this.mult}`
        else
            return `Damage taken x${this.mult} for ${this.turns} turns`
    }

    getImage() {
        return "vulnerable"
    }

    update(new_effect) {
        this.mult *= new_effect.mult
        this.turns = Math.max(this.turns, new_effect.turns)
    }

    cleanup() {
        if (this.turns > 0) {
            this.turns--
            return this.turns > 0
        }
        return true
    }
}

export class EffectEncore extends Effect {
    constructor(turns) {
        super()
        this.overloads = ["DealDamage"]
        this.turns = this.maxTurns = turns
        this.winded = this.windedPending = false
    }

    overloadDealDamage(data, context) {
        if (this.turns < this.maxTurns) {
            if (context.track === "Sound") {
                if (this.winded) {
                    this.turns = 2
                    return data * 0.25
                }
                this.windedPending = true
            }
            return data * 1.15
        }
        return data
    }

    getText() {
        return `Encore - ${this.turns} turns`
    }

    getImage() {
        if (!this.winded)
            return "presthrow"
        return "punishment"
    }

    update(new_effect) {
        if (!this.winded)
            this.turns = new_effect.maxTurns
    }

    cleanup() {
        if (this.windedPending) {
            this.winded = true
            this.windedPending = false
            this.turns = 2
            return true
        }
        this.turns--
        return this.turns > 0
    }
}

export class EffectCheer extends Effect {
    constructor() {
        super()
        this.overloads = ["Stuns"]
    }

    overloadStuns(data) {
        return data + 1
    }

    getText() {
        return "Cheered"
    }

    getImage() {
        return "insurance"
    }

    cleanup() {
        return false
    }
}

export class EffectFakeEncore extends Effect {
    constructor() {
        super()
        this.overloads = ["TakeDamage"]
    }

    overloadTakeDamage(data, context) {
        return data * 1.15
    }

    getText() {
        return "Toons have Encore"
    }

    getImage() {
        return "presthrow"
    }

    cleanup() {
        return true
    }
}
