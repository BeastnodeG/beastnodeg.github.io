import { SimulationState } from "./simulation-state.mjs"

function makeArray(n) {
    const arr = []
    for (let i = 0; i < n; i++)
        arr.push(1)
    return arr
}

export class ControlledState extends SimulationState {
    constructor(controller, use_rng, delay = 1000, max_level = 8) {
        super(delay, max_level)
        this.toons = []
        this.toons_copy = {}
        this.turn_counters = {}
        this.use_rng = use_rng
        controller.setState(this)
        controller.initialize()
        this.controller = controller
        this.turns = 0
        this.log = []
    }

    spawnCog(cog) {
        super.spawnCog(cog)
        cog.targeted_damage = makeArray(this.toons.length)
    }

    spawnToon(toon) {
        toon.position = this.toons.length
        this.toons.push(toon)
        this.log = []
        for (const i of this.cogs)
            i.targeted_damage.push(1)
    }

    saveState(id = 0) {
        super.saveState(id)
        this.toons_copy[id] = this.toons.map(x => this.cloneCog(x))
        this.turn_counters[id] = this.turns
    }

    loadState(id = 0) {
        super.loadState(id)
        if (this.toons_copy[id])
            this.toons = this.toons_copy[id].map(x => this.cloneCog(x))
        this.turns = this.turn_counters[id]
        this.log = []
    }

    singleTurn(k, i) {
        if (!k[i]) return
        this.log.push(k[i])
        if (!this.use_rng)
            return super.singleTurn(k, i)

        const accuracy = k[i].calculateAccuracy(this)
        if (Math.random() < accuracy)
            k[i].apply(this)
        else
            k[i].miss(this)
        if (i === k.length - 1 || k[i].id !== k[i + 1].id)
            k[i].cleanup(this)
    }

    cleanupToons() {
        for (let i = 0; i < this.toons.length; i++) {
            this.toons[i].cleanup()
            if (this.toons[i].health <= 0) {
                this.toons.splice(i, 1)
                i--
            }
        }
        for (let i = 0; i < this.toons.length; i++)
            this.toons[i].position = i
    }

    turnCycle(picks) {
        const start = this.controller.getIntermission()
        this.turn(start)
        this.turn(picks)
        this.cleanup()
        const end = this.controller.getTurns()
        this.turn(end)
        this.cleanupToons()
        this.controller.cleanup()
        this.turns++
    }

    turnCycleMovie(picks) {
        picks.sort((x, y) => x.author - y.author)
        for (const i of picks)
            i.author = this.toons[i.author] || false
        const start = this.controller.getIntermission()
        this.simulate(start, () => {
            this.simulate(picks, () => {
                this.cleanup()
                const end = this.controller.getTurns()
                this.simulate(end, () => {
                    this.cleanupToons()
                    this.controller.cleanup()
                    this.turns++
                    document.dispatchEvent(new CustomEvent("simulation-finish"))
                })
            })
        })
    }

    unite(n) {
        for (const i of this.toons) {
            const m = i.effects.getOverload("Unite", n)
            i.unites.push(m)
        }
    }

    restock(n) {
        for (const i of this.toons)
            i.restock(n)
    }
}