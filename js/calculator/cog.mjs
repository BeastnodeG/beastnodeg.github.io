import { EffectManager, EffectSue, EffectSkip, EffectDamageMultiplier } from "./effects.mjs"
import { weightedRandom } from "./constants.mjs"

export class Cog {
    constructor(level, executive = false) {
        this.level = level
        this.health = this.max_health = (level + 1) * (level + 2) * (executive ? 1.5 : 1)
        this.defense = (level === 1 && !executive) ? 2 : ((level > 14 ? 65 : level * 5 - 5) + (executive ? 5 : 0))
        this.executive = executive
        this.effects = new EffectManager(this)
        this.damageQueue = []
        this.extraQueue = []
        this.display = "Cog"
        this.image = "sprites/cogs/normal.png"
        this.missed = false
        this.targeted_damage = []
        this.indirect_damage = 0
    }

    fire() {
        this.health = 0
    }

    sue() {
        this.effects.add(new EffectSue())
    }

    canAttack() {
        return !this.effects.find("Sue")
    }

    /**
     *
     * @param n
     * @param {Toon|number} author
     */
    pushDamage(n, author = 0) {
        if (author)
            author.dealt_damage += n
        this.damageQueue.push({ damage: Math.ceil(n), author: author.position === undefined ? author : author.position })
        if (this.effects.find("Sue"))
            this.sue()
    }

    pushExtraDamage(n) {
        this.indirect_damage += n.damage
        this.extraQueue.push(n)
    }

    getHealth() {
        return this.health - this.damageQueue.concat(this.extraQueue).reduce((x, y) => x + y.damage, 0)
    }

    queueCombo(m = 0.2) {
        if (this.damageQueue.length > 1) {
            let s = this.damageQueue.reduce((x, y) => x + y.damage, 0)
            this.pushExtraDamage({ damage: Math.ceil(s * m) })
        }
    }

    queueExists() {
        return this.damageQueue.length > 0 || this.extraQueue.length > 0
    }

    dealDamage(i) {
        this.health -= Math.ceil(this.effects.getOverload("TakeDamage", i))
    }

    explodeQueue() {
        for (const i of this.damageQueue) {
            this.dealDamage(i.damage)
            this.targeted_damage[i.author] += i.damage
        }
        for (const i of this.extraQueue)
            this.dealDamage(i.damage)
    }

    clearQueue() {
        this.damageQueue = []
        this.extraQueue = []
        this.missed = false
    }

    cleanup() {
        this.effects.cleanup()
        this.missed = false
    }
}

export class ModifierCog extends Cog {
    constructor(level, attributes) {
        const { executive, type, v2 } = attributes
        super(level, executive)
        this.cog_type = type
        this.cog_exe = executive ? ".exe" : ""
        this.cog_v2 = v2 ? "v2" : ""
        this.image = `sprites/cogs/${this.cog_type}${this.cog_exe}.png`

        this.display = `Lv${level}${this.cog_exe} ${type} cog ${this.cog_v2}`

        if (type === "defense") {
            this.defense += 10
            this.health = this.max_health = (level + 2) * (level + 3) - 2
        } else if (type === "attack") {
            this.defense -= 10
            this.health = this.max_health = level * (level + 1) + 1
        }
        if (executive && (type === "defense" || type === "attack"))
            this.health = this.max_health = Math.floor(this.health * 1.5)
    }

    dealDamage(i) {
        super.dealDamage(i)
        if (this.cog_v2 === "v2" && this.health <= 0) {
            this.cog_v2 = "vs"
            this.health = Math.floor(this.max_health / 2)
            this.effects.add(new EffectSkip())
            this.effects.add(new EffectDamageMultiplier(1.5))
        }
    }
}

export class ControlledCog extends ModifierCog {
    chooseAttack() {
        const map = this.attacks.map(x => ({ attack: x, frequency: x.parameters.frequency }))
        const choice = weightedRandom(map, "frequency")
        return choice.attack
    }
}