import { BattleController } from "../interfaces.mjs"
import { ControlledCog } from "../cog.mjs"
import { CogCheat, CogAttackAll, CogAttackSingle } from "../cog-attack.mjs"
import { Effect, EffectDamageMultiplier, EffectVulnerable } from "../effects.mjs"
import { printRoman } from "../constants.mjs"

export class BattleControllerMirrorwing extends BattleController {
    initialize() {
        const rw = new RealWing()
        const vw = new VirtualWing()
        rw.setOther(vw)
        vw.setOther(rw)
        this.state.spawnCog(rw)
        this.state.spawnCog(vw)

        this.state.executions = 0
        this.state.exploded = []
    }

    getTurns() {
        const t = super.getTurns()
        for (const i of this.state.cogs)
            if (i instanceof Wing) {
                if (i.effects.getOverload("CanMove", true)) {
                    for (const j of i.getCheats(this.state))
                        t.push(j)
                    if (i.effects.find("Resurrection").saved)
                        for (const j of i.other.getCheats(this.state))
                            t.push(j)
                } else
                    i.other.reflect += 80
            }
        return t
    }
}

class Reflection extends ControlledCog {
    constructor(state, level, exe, brittle) {
        super(level, { executive: exe, type: "normal" })
        this.display = `Lv ${level}${exe ? ".exe" : ""} Reflection`
        this.coeff = exe ? level + 7 : level
        this.image = "sprites/cogs/reflection.png"
        this.attacks = [
            new CogAttackSingle(this,
                { damage: this.coeff * 2, accuracy: Math.min(0.95, level * 0.05 + 0.1), frequency: 1, name: "Mumbo Jumbo" }),
            new CogAttackSingle(this,
                { damage: Math.floor(this.coeff * 2.3), accuracy: Math.min(0.95, level * 0.05), frequency: 1, name: "Liquidate" }),
            new CogAttackAll(this,
                { damage: this.coeff * 2 - 1, accuracy: Math.min(0.95, level * 0.05 + 0.05), frequency: 1, name: "Paradigm Shift" }),
        ]
        this.effects.add(new EffectBrittle(brittle))
        this.state = state
    }

    fire() { return false }
}

class EffectBrittle extends Effect {
    constructor(turns = 2) {
        super()
        this.turns = turns
    }

    getText() {
        return `Disappears after ${this.turns} turns`
    }

    getImage() {
        return "stun"
    }

    cleanup() {
        this.turns--
        if (this.turns <= 0 && this.parent.health >= 0) {
            this.parent.health = 0
            this.parent.state.exploded.push(this.parent.level)
            for (const i of this.parent.state.toons) {
                i.dealDamage(Math.random() * 1.5 * this.parent.level)
                i.effects.add(new EffectVulnerable(1 + 0.01 * this.parent.coeff, 3))
            }
            for (const i of this.parent.state.cogs) {
                const lure = i.effects.find("Lure")
                if (lure)
                    lure.turns--
            }
            this.parent.state.log.push(new BrittleAttack(this.parent))
        }
        return this.turns > 0
    }
}

class BrittleAttack extends CogCheat {
    constructor(author) {
        super()
        this.author = author
        this.name = "Brittle Expulsion"
    }
}

class Wing extends ControlledCog {
    constructor(level) {
        super(level, { executive: 1, type: "normal" })
        this.effects.add(new EffectResurrection())
        this.reflect = 0
        this.rages = 0
    }

    setOther(a) {
        this.other = a
    }

    dealDamage(n) {
        super.dealDamage(n)
        if (this.other)
            this.other.reflect += n
    }

    cleanup() {
        if (this.health <= 0) {
            const effect = this.effects.find("Resurrection")
            if (!effect.saved) {
                effect.saved = true
                this.health = Math.floor(this.max_health * 0.35)
            }
        }

        if (this.health <= 0)
            this.other.other = this.other
        super.cleanup()
    }

    getCheats(state) {
        const threshold = 700 - state.turns * 20 + this.rages * 60
        if (this.reflect > threshold) {
            const ans = this.magic(this.reflect + state.turns * 20 + this.rages * 30, state)
            this.reflect = 0
            this.rages++
            return ans
        }

        return []
    }

    magic(reflect, state) {
        return []
    }

    fire() { return false }
    sue() { return false }
}

class EffectResurrection extends Effect {
    constructor() {
        super()
        this.saved = false
        this.overloads = ["LureRounds"]
    }

    overloadLureRounds(data) {
        return Math.min(data, 3)
    }

    getText() {
        if (this.saved)
            return "This cog can use the abilities of other manager when that one is lured"
        else
            return "This cog will resurrect with increased powers once"
    }

    getImage() {
        if (this.saved)
            return "enrage"
        else
            return "insurance"
    }
}

class RealWing extends Wing {
    constructor() {
        super(28)
        this.health = this.max_health = 1534
        this.display = "Reality Wing Lv28"
        this.image = "sprites/cogs/realwing.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 24, accuracy: 0.95, frequency: 2, name: "Pecking Order" }),
            new CogAttackSingle(this, { damage: 32, accuracy: 0.9, frequency: 3, name: "Hot Air" }),
            new CogAttackAll(this, { damage: 29, accuracy: 0.95, frequency: 1, name: "Power Trip" }),
        ]
    }

    magic(reflect, state) {
        const answer = []
        answer.push(new CogAttackAll(this, { damage: 19, accuracy: 0.8, frequency: 1, name: "Quake" }))
        if (reflect >= 400)
            answer.push(new RealityShake(this))
        if (reflect >= 700)
            answer.push(new ReflectiveSynergy(this, (reflect - 280) / 24))
        if (reflect >= 1000)
            answer.push(new RealityRipple(this))
        if (reflect >= 1300) {
            answer.push(new Execution(this, state.executions))
            state.executions++
        }
        return answer
    }
}

class VirtualWing extends Wing {
    constructor() {
        super(27)
        this.health = this.max_health = 1302
        this.display = "Virtuality Wing Lv27"
        this.image = "sprites/cogs/virtualwing.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 38, accuracy: 0.9, frequency: 2, name: "Cigar Smoke" }),
            new CogAttackSingle(this, { damage: 32, accuracy: 0.95, frequency: 3, name: "Fountain Pen" }),
            new CogAttackAll(this, { damage: 35, accuracy: 0.95, frequency: 1, name: "Guilt Trip" }),
        ]
    }

    magic(reflect, state) {
        const answer = []
        answer.push(new CogAttackAll(this, { damage: 16, accuracy: 0.8, frequency: 1, name: "Tremor" }))
        if (reflect >= 400)
            answer.push(new VirtualEvaluation(this))
        if (reflect >= 700)
            answer.push(new ReflectiveSynergy(this, (reflect - 280) / 28))
        if (reflect >= 1000)
            answer.push(new VirtualFlood(this))
        if (reflect >= 1300) {
            answer.push(new Execution(this, state.executions))
            state.executions++
        }
        return answer
    }
}

class Weak extends CogCheat {
    apply(state) {
        state.spawnCog(new Reflection(state, 12, false, 2))
    }
}

class RealityShake extends Weak {
    constructor(author) {
        super()
        this.author = author
        this.name = "Reality Shake"
    }

    apply(state) {
        super.apply(state)
        for (const i of state.cogs) {
            i.effects.remove("Sue")
            i.effects.add(new EffectDamageMultiplier(1.15, 3))
        }
    }
}

class VirtualEvaluation extends Weak {
    constructor(author) {
        super()
        this.author = author
        this.name = "Virtual Evaluation"
    }

    apply(state) {
        super.apply(state)
        for (const i of state.toons)
            i.effects.add(new EffectDamageMultiplier(0.85, 3))
    }
}

class RealityRipple extends CogCheat {
    constructor(author) {
        super()
        this.author = author
        this.name = "Reality Ripple"
    }

    apply(state) {
        for (const i of state.toons) {
            i.dealDamage(this.author.effects.getOverload("DealDamage", 20))
            i.effects.add(new EffectAntiRestock())
            for (const track of i.gags)
                for (let a = 7, b = 3; a >= 0 && b >= 0; a--) {
                    const sub = Math.min(b, track[a])
                    b -= sub
                    track[a] -= sub
                }
        }
    }
}

class EffectAntiRestock extends Effect {
    constructor() {
        super()
        this.coeff = 1
        this.turns = 4
        this.overloads = ["Restock"]
    }

    update(new_eff) {
        this.coeff += new_eff.coeff
        this.turns = Math.max(this.turns, new_eff.turns)
    }

    getText() {
        return `Restock Lock ${printRoman(this.coeff)} for ${this.turns} turns`
    }

    getImage() {
        return "unauthorized"
    }

    overloadRestock(data) {
        return data - 1
    }

    cleanup() {
        this.turns--
        return this.turns > 0
    }
}

class VirtualFlood extends CogCheat {
    constructor(author) {
        super()
        this.author = author
        this.name = "Virtual Flood"
    }

    apply(state) {
        state.spawnCog(new Reflection(state, 12, false, 3))
        for (const i of state.exploded)
            state.spawnCog(new Reflection(state, i + 2, true, 4))
    }
}

class ReflectiveSynergy extends CogCheat {
    constructor(author, damage) {
        super()
        this.author = author
        this.damage = Math.floor(damage)
        this.name = `Reflective Synergy for ${this.damage}`
    }

    apply(state) {
        let misses = []
        if (state.toons.filter(x => x.canBeAttacked(2)).length === 0) {
            this.missed = "skipped"
            return
        }

        let dmg = 0
        for (const i of state.toons)
            if (i.canBeAttacked(2) && Math.random() > 0.1) {
                const sdmg = this.author.effects.getOverload("DealDamage", this.damage)
                i.dealDamage(sdmg)
                dmg += sdmg
            }
            else
                misses.push(i.position + 1)

        this.author.health += Math.floor(dmg * state.toons.length *
            (this.author.max_health / (this.author.max_health + this.author.health)) / 2)
        if (misses.length > 0)
            this.missed = "missed on " + misses.join(", ")
    }
}

class Execution extends CogCheat {
    constructor(author, runs) {
        super()
        this.author = author
        this.runs = runs
        this.name = `Reflective Execution ${printRoman(runs + 1)}`
    }

    apply(state) {
        state.spawnCog(new Reflection(state, 13 + 3 * this.runs, true, this.runs * 2 + 4))
        state.spawnCog(new Reflection(state, 14 + 3 * this.runs, true, this.runs * 2 + 3))
        if (this.author.health < this.author.max_health)
            this.author.health = Math.floor((this.author.health + this.author.max_health) / 2)
        this.author.effects.find("Resurrection").saved = false
        if (this.author.other.health < this.author.other.max_health)
            this.author.other.health = Math.floor((this.author.other.health + this.author.other.max_health) / 2)
        this.author.other.effects.find("Resurrection").saved = false
        for (const i of state.toons)
            i.dealDamage(this.author.effects.getOverload("DealDamage", this.runs * 8 + 20))
    }
}