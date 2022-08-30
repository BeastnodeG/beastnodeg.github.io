import { ReversibleState } from "./reversible-state.mjs"
import { CogAttack } from "./cog-attack.mjs"

export class SimulationState extends ReversibleState {
    constructor(delay = 1800, max_level = 8) {
        super(max_level)
        this.delay = delay
    }

    simulationTurn(arr, f = false) {
        this.singleTurn(arr, 0)
        const used = arr.shift()
        if (arr.length > 0)
            setTimeout(() => this.simulationTurn(arr, f), this.delay)
        else {
            if (!f) {
                for (let i = 0; i < this.cogs.length; i++)
                    this.cogs[i].cleanup()
                setTimeout(() => document.dispatchEvent(new CustomEvent("simulation-finish")), this.delay)
            } else
                setTimeout(f, this.delay)
        }
        if (used && used instanceof CogAttack)
            document.dispatchEvent(new CustomEvent("simulation-turn", { detail: used.author }))
        else if (used)
            document.dispatchEvent(new CustomEvent("simulation-turn", { detail: used.parameters.id }))
        else
            document.dispatchEvent(new CustomEvent("simulation-turn", { detail: false }))
    }

    simulate(picks, f = false) {
        if (picks.length === 0) {
            f()
            return
        }

        let k = picks.map((el, index) => ({ el, index }))
        k.sort((x, y) => x.el.priority(x.index) - y.el.priority(y.index))
        k = k.map(x => x.el)
        this.simulationTurn(k, f)
    }
}