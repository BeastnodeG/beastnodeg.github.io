import { Turn } from "./interfaces.mjs"
import { weightedRandom } from "./constants.mjs"

export class CogAttack extends Turn {
    constructor(origin, parameters = {}) {
        super(-1, parameters)
        this.author = origin
        this.id = "CogAttack"
    }

    calculateAccuracy(state) {
        return this.accuracy || 1
    }

    setTarget(state) {
        this.target = -1
    }
}

export class CogCheat extends CogAttack {
    constructor() {
        super(false, {})
    }

    calculateAccuracy(state) {
        return 1
    }
}

export class CogAttackSingle extends CogAttack {
    constructor(origin, parameters = {}) {
        super(origin, parameters)
        this.id = "CogAttackSingle"
    }

    setTarget(state) {
        const td = this.author.targeted_damage.map((el, index) => ({ el, index }))
            .filter(x => state.toons[x.index] && state.toons[x.index].canBeAttacked(1))
        if (td.length === 0)
            this.target = -1
        else
            this.target = weightedRandom(td, "el").index
    }

    apply(state) {
        this.setTarget(state)
        if (!state.toons[this.target])
            this.missed = "skipped"
        else
            state.toons[this.target].dealDamage(this.getDamage(this.parameters.damage))
    }
}

export class CogAttackAll extends CogAttack {
    constructor(origin, parameters = {}) {
        super(origin, parameters)
        this.id = "CogAttackAll"
    }

    calculateAccuracy(state) {
        return 1
    }

    apply(state) {
        let misses = []
        if (state.toons.filter(x => x.canBeAttacked(1)).length === 0) {
            this.missed = "skipped"
            return
        }

        for (const i of state.toons)
            if (i.canBeAttacked(1) && Math.random() < this.parameters.accuracy)
                i.dealDamage(this.getDamage(this.parameters.damage))
            else
                misses.push(i.position + 1)
        if (misses.length > 0)
            this.missed = "missed on " + misses.join(", ")
    }
}