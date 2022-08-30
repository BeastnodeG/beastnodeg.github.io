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
    constructor(turns, prestige, multiplier = false) {
        super()
        this.signals = ["LureAttack", "UnLure"]
        this.overloads = ["CanMove"]
        this.turns = turns
        this.knockback = multiplier || (prestige ? 0.65 : 0.5)
        this.decay = prestige ? 105 : 100
        this.inactive = false
    }

    update(new_effect) {
        this.inactive = false
        this.knockback = Math.max(this.knockback, new_effect.knockback)
        this.turns = Math.max(this.turns, new_effect.turns)
        this.decay = Math.max(this.decay, new_effect.decay)
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
            return `Lured with x${this.knockback} knockback for ${this.turns} turns`
    }

    getImage() {
        if (this.inactive) return false
        if (this.knockback > 0.55) return "prestige-lure"
        return "lure"
    }

    processAccuracy(acc) {
        acc.base = Math.min(100, Math.max(acc.base, this.decay))
    }

    execLureAttack() {
        if (this.inactive) return
        const cog = this.parent
        const sum = cog.damageQueue.reduce((x, y) => x + y.damage, 0)
        cog.pushExtraDamage({ damage: Math.ceil(this.knockback * sum) })
        cog.effects.trigger("UnLure")
    }

    execUnLure() {
        this.inactive = true
    }

    cleanup() {
        this.turns--
        this.decay -= 5
        return this.turns > 0
    }

    overloadCanMove() {
        return false
    }
}

export class EffectSoak extends Effect {
    constructor(turns) {
        super()
        this.signals = ["ReduceSoak"]
        this.turns = turns + 1
    }

    getText() { return `Soaked for ${this.turns - 1} turns` }
    getImage() { return "soak" }

    processAccuracy(acc) {
        acc.defense = Math.max(acc.defense - 15, 0)
    }

    execReduceSoak() {
        this.turns -= 1
    }

    cleanup() {
        this.turns--
        return this.turns > 1
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
        this.turns = 5
        this.overloads = ["CanMove"]
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
    constructor(n, track, turns = -1) {
        super()
        this.overloads = ["DealDamage"]
        this.mult = n
        this.track = track
        this.turns = turns
        this.name = `TargetedMultiplier${track}`
    }

    overloadDealDamage(data, context) {
        if (context.track === this.track) {
            if (context.method === 0)
                return data + context.base_damage * (this.mult - 1)
            return data * this.mult
        }
        return data
    }

    getText() {
        if (this.turns === -1)
            return `${this.track} Damage x${this.mult}`
        else
            return `${this.track} Damage x${this.mult} for ${this.turns} turns`
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
        this.mult = Math.max(this.mult, new_effect.mult)
    }

    cleanup() {
        if (this.turns > 0) {
            this.turns--
            return this.turns > 0
        }
        return true
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

export class EffectMarkedForLaugh extends Effect {
    constructor(number_of_throws) {
        super()
        this.overloads = ["TakeDamage"]
        this.num = number_of_throws
        this.mult = 1.04 + 0.04 * number_of_throws
        this.turns = 2
    }

    overloadTakeDamage(data) {
        return data * this.mult
    }

    getText() {
        return `Marked for Laugh ${printRoman(this.num)} - ${this.turns} turns`
    }

    getImage() {
        return "presthrow"
    }

    update(new_effect) {
        if (this.mult >= new_effect.mult)
            return
        this.mult = new_effect.mult
        this.num = new_effect.num
        this.turns = 2
    }

    cleanup() {
        this.turns--
        return this.turns > 0
    }
}
