export class Turn {
    constructor(target, parameters = {}) {
        this.base_priority = -1
        this.target = target
        this.parameters = parameters
        this.id = "Turn"
        this.author = false
    }

    priority(position) {
        return position + 100 * this.base_priority
    }

    /**
     * Gets the total accuracy
     * @param state
     * @returns {number}
     */
    calculateAccuracy(state) {
        return 1
    }

    /**
     * Cleans up the state after all attacks of this type have been used
     * @param state
     */
    cleanup(state) {}

    /**
     * Applies an attack to the State
     * @param state
     */
    apply(state) {
        throw new Error("Apply() not implemented")
    }

    /**
     * Called when the attack misses
     * @param state
     */
    miss(state) {
        this.missed = "missed"
    }

    getDamage(n, method = 1) {
        if (this.author)
            return this.author.effects.getOverload("DealDamage", n, { base_damage: n, method })
        else
            return n
    }

    setTarget(state) {}
}

export class BattleController {
    setState(state) {
        this.state = state
    }

    /**
     * Called when a new state is created
     */
    initialize() {}

    /**
     * Returns the cogs' turns played before the toons' turn ends
     * @returns {array}
     */
    getIntermission() {
        const answer = []
        for (const i of this.state.cogs)
            if (i.getIntermission) {
                const j = i.getIntermission(this.state)
                if (j) answer.push(j)
            }
        return answer
    }

    /**
     * Returns the cogs' normal turns
     * @returns {array}
     */
    getTurns() {
        const answer = []
        for (const i of this.state.cogs)
            if (i.chooseAttack && i.effects.getOverload("CanMove", true))
                answer.push(i.chooseAttack())
        for (const i of this.state.cogs)
            if (i.getExtras && i.effects.getOverload("CanMove", true)) {
                const e = i.getExtras(this.state)
                for (const j of e) answer.push(j)
            }
        for (const i of answer)
            i.setTarget(this.state)
        return answer
    }

    /**
     * Called after cogs' turns are finished. Can be used to spawn new cogs, add effects, etc.
     */
    cleanup() {}
}