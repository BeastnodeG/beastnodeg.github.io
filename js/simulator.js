import { SimulationState } from "./calculator/simulation-state.mjs"
import * as common from "./common.mjs"
import * as toon_attacks from "./calculator/toon-attack.mjs"

const context = {
    modal: false,
    attacks: [],
    client_attacks: [],
    state: new SimulationState(),
    cog_button: createAttack
}

function createAttack(x) {
    const target = document.querySelector("#modal-gag-panel-target")
    target.innerHTML = x
    context.modal.toggle()
}

function simulationTurn(e) {
    for (const i of context.client_attacks)
        if (i.id === e.detail)
            i.played = true
    common.redrawState(context)
}

let lock = false
function simulate() {
    if (lock)
        return

    lock = true
    context.state.saveState()
    context.state.simulate(context.attacks)
}

const tracks = ["Toon-Up", "Trap", "Lure", "Sound", "Squirt", "Zap", "Throw", "Drop", "Special"]
function initGagPanel() {
    const tbl = document.querySelector("#gag-panel-tbl")
    for (let i = 1; i < 8; i++) {
        const row = document.createElement("tr")
        row.classList.add(`tr-${tracks[i]}`)
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("td")
            cell.classList.add("gag-panel-cell")
            const blk = document.createElement("div")
            blk.classList.add("gag-panel-cell-block", "gag-panel-cell-block-gag")
            blk.setAttribute("style", `background-position: ${-64 * j}px ${-64 * i}px`)
            blk.addEventListener("click", () => attackDOM(i, j))
            cell.append(blk)
            row.append(cell)
        }
        tbl.append(row)
    }
    const row = document.createElement("tr")
    row.classList.add("gag-special")

    const pres_cell = document.createElement("td")
    pres_cell.classList.add("gag-prestige-cell")
    pres_cell.addEventListener("click", () => flipPrestige(pres_cell))
    row.append(pres_cell)

    const fire_cell = document.createElement("td")
    fire_cell.setAttribute("id", "gag-fire-cell")
    fire_cell.addEventListener("click", () => fireDOM(context))
    row.append(fire_cell)

    const sue_cell = document.createElement("td")
    sue_cell.setAttribute("id", "gag-sue-cell")
    sue_cell.addEventListener("click", () => sueDOM(context))
    row.append(sue_cell)

    tbl.append(row)
}

let id = 0
export function attackDOM(track_number, level) {
    const { attacks, client_attacks, modal } = context
    const track = tracks[track_number]
    let target = parseInt(document.querySelector("#modal-gag-panel-target").innerHTML),
        prestige = document.querySelector(".gag-prestige-cell").classList.contains("gag-prestige-cell-active")
    if (isNaN(target) || track === "Sound" || (track === "Lure" && level % 2 === 1))
        target = -1
    attacks.push(new toon_attacks[track](target, { level, prestige, id }))
    client_attacks.push({ track, level, target, prestige, track_number, id: id++ })
    common.redrawState(context)
    modal.toggle()
}

function fireDOM(context) {
    const { attacks, client_attacks, modal } = context
    let target = parseInt(document.querySelector("#modal-gag-panel-target").innerHTML)
    attacks.push(new toon_attacks.Fire(target, { level: 0, prestige: false, id: id }))
    client_attacks.push({ track: "Special", level: 0, target, prestige: false, track_number: 8, id: id++ })
    common.redrawState(context)
    modal.toggle()
}

function sueDOM(context) {
    const { attacks, client_attacks, modal } = context
    let target = parseInt(document.querySelector("#modal-gag-panel-target").innerHTML)
    attacks.push(new toon_attacks.Sue(target, { level: 0, prestige: false, id: id }))
    client_attacks.push({ track: "Special", level: 1, target, prestige: false, track_number: 8, id: id++ })
    common.redrawState(context)
    modal.toggle()
}

function flipPrestige(obj) {
    const is_active = obj.classList.contains("gag-prestige-cell-active")
    if (is_active)
        obj.classList.remove("gag-prestige-cell-active")
    else
        obj.classList.add("gag-prestige-cell-active")
}

function restart() {
    context.attacks = []
    context.client_attacks = []
    context.state.loadState()
    lock = false
    common.redrawState(context)
}

document.addEventListener("DOMContentLoaded", () => {
    context.modal = new bootstrap.Modal(document.querySelector("#modal-gag-panel"))
    common.initialize(context)
    document.querySelector("#control-run").addEventListener("click", simulate)
    document.querySelector("#control-clear").addEventListener("click", restart)
    document.addEventListener("simulation-turn", simulationTurn)
    initGagPanel()
})
