import { ControlledState } from "./calculator/controlled-state.mjs"
import { Toon } from "./calculator/toon.mjs"
import { drawCog, makeGagCard, printEffects } from "./common.mjs"
import { Card, FunctionImage, Text, Title, Row, Col, Input, WFunction } from "./bootwrap.mjs"
import * as toon_attacks from "./calculator/toon-attack.mjs"
import { isMultiTarget, names, sos_names } from "./calculator/constants.mjs"

import { BattleController } from "./calculator/interfaces.mjs"
import { BattleControllerStandard } from "./calculator/controller.mjs"
import { BattleControllerDOPA } from "./calculator/special/dopa.mjs"
import { BattleControllerLitigation } from "./calculator/special/litigation.mjs"
import { BattleControllerMirrorwing } from "./calculator/special/mirrorwing.mjs"

import { ModifierCog } from "./calculator/cog.mjs"
import { DirectorOfPublicAffairs, DirectorOfLandDevelopment, DerrickHand } from "./calculator/special/dopa.mjs"
import { Litigator, Stenographer, CaseManager, Scapegoat } from "./calculator/special/litigation.mjs"

const controllers = {
    standard: () => new BattleControllerStandard(9, 15, 0.2),
    dopa: () => new BattleControllerDOPA(),
    mirrorwing: () => new BattleControllerMirrorwing(),
    litigation: () => new BattleControllerLitigation(prompt("pick your poison")),
    blank: () => new BattleController()
}

const cogs = {
    normal: () => {
        const attributes = { type: "normal" }
        attributes.executive = Math.random() < 0.25
        const level = 9 + Math.floor(Math.random() * 7)
        return new ModifierCog(level, attributes)
    },
    dopa: () => new DirectorOfPublicAffairs(),
    dold: () => new DirectorOfLandDevelopment(),
    dh: () => new DerrickHand(),
    gator: () => new Litigator(),
    steno: () => new Stenographer(),
    case: () => new CaseManager(),
    goat: () => new Scapegoat(),
}

const toon_presets = {
    standard: {
        max_health: 137,
        tracks: [0, 1, 2, 3, 4, 5, 6, 7],
        prestiges: [0, 1, 2, 3, 4, 5, 6, 7]
    }
}

let storageEnabled = true

const context = {
    state: false,
    turns: [],
    displayTurns: [],
    modalTarget: -1,
    modal: false,
    toonModal: false,
    level: false,
    unpack: false
}

const tracks = ["Toon-Up", "Trap", "Lure", "Sound", "Squirt", "Zap", "Throw", "Drop", "Special"]
let id = 0
function addAttack(i, j, target) {
    context.displayTurns[context.modalTarget] = { level: j, track_number: i, track: tracks[i], target: target, id: id++ }
    context.displayTurns[context.modalTarget].prestige = context.state.toons[context.modalTarget].prestiges.indexOf(i) > -1
    const turn_type = i === 8 ? names.Special[j].replace(" ", "") : tracks[i].replace("-", "")
    const turn = new toon_attacks[turn_type](target, context.displayTurns[context.modalTarget])
    turn.author = context.modalTarget
    context.turns.push(turn)
    context.modal.hide()
    context.modalTarget = -1
    redrawState()
}

function addSOSAttack(i, j) {
    context.displayTurns[context.modalTarget] = { level: j, track_number: i, track: tracks[i], id: id++, sos: true }
    const turn = new toon_attacks.BoostSOS(-1, context.displayTurns[context.modalTarget])
    turn.author = context.modalTarget
    context.turns.push(turn)
    context.modal.hide()
    context.modalTarget = -1
    redrawState()
}

function chooseAttack(i, j) {
    if (isMultiTarget(i, j))
        addAttack(i, j, -1)
    else {
        context.level = { i, j }
        context.modal.hide()
    }
}

function updateModal() {
    const tbl = document.querySelector("#gag-panel-tbl")
    tbl.textContent = ""
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("tr")
        row.classList.add(`tr-${tracks[i]}`)
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("td")
            cell.classList.add("gag-panel-cell")
            const blk = document.createElement("div")
            blk.classList.add("gag-panel-cell-block", "gag-panel-cell-block-gag")
            blk.setAttribute("style", `background-position: ${-64 * j}px ${-64 * i}px`)

            const count = context.state.toons[context.modalTarget].gags[i][j]
            if (count > 0) {
                const x = document.createElement("span")
                x.innerHTML = count
                blk.append(x)
                blk.addEventListener("click", () => chooseAttack(i, j))
            } else blk.classList.add("gag-panel-cell-disabled")
            cell.append(blk)
            row.append(cell)
        }

        const pres_cell = document.createElement("td")
        pres_cell.classList.add("gag-prestige-cell")
        if (context.state.toons[context.modalTarget].prestiges.indexOf(i) > -1)
            pres_cell.classList.add("gag-prestige-cell-active")
        row.append(pres_cell)

        for (let j = 0; j < 3; j++) {
            const cell = document.createElement("td")
            cell.classList.add("gag-panel-cell")
            const blk = document.createElement("div")
            blk.classList.add("gag-panel-cell-block", "gag-panel-cell-block-sos")
            blk.setAttribute("style", `background-position: ${-64 * j}px ${-64 * i}px`)
            blk.addEventListener("click", () => addSOSAttack(i, j))
            cell.append(blk)
            row.append(cell)
        }

        tbl.append(row)
    }
    const row = document.createElement("tr")
    row.classList.add("gag-special")

    const fire_cell = document.createElement("td")
    fire_cell.setAttribute("id", "gag-fire-cell")
    fire_cell.addEventListener("click", () => chooseAttack(8, 0))
    row.append(fire_cell)

    const sue_cell = document.createElement("td")
    sue_cell.setAttribute("id", "gag-sue-cell")
    sue_cell.addEventListener("click", () => chooseAttack(8, 1))
    row.append(sue_cell)

    const pete_cell = document.createElement("td")
    pete_cell.setAttribute("id", "gag-pete-cell")
    pete_cell.addEventListener("click", () => chooseAttack(8, 2))
    row.append(pete_cell)

    const rain_cell = document.createElement("td")
    rain_cell.setAttribute("id", "gag-rain-cell")
    rain_cell.addEventListener("click", () => chooseAttack(8, 3))
    row.append(rain_cell)

    tbl.append(row)
}

function cogButton(position) {
    if (!context.level || context.level.i === 0) return
    addAttack(context.level.i, context.level.j, position)
    context.level = false
    context.modalTarget = -1
}

function toonButton(position) {
    if (context.level.i === 0) {
        if (position !== context.modalTarget) {
            addAttack(context.level.i, context.level.j, position)
            context.modalTarget = -1
        }
        else
            context.modal.show()
        context.level = false
    } else if (context.displayTurns[position]) {
        context.displayTurns[position] = false
        context.turns = context.turns.filter(x => x.author !== position)
    } else if (context.modalTarget !== position) {
        context.modalTarget = position
        updateModal()
        context.modal.show()
    } else {
        context.modalTarget = -1
        context.modal.hide()
    }
    redrawState()
}

function updateLog() {
    const log = document.querySelector("#log")
    for (let j = log.children.length; j < context.state.log.length; j++) {
        const i = context.state.log[j]
        const element = document.createElement("div")

        if (i instanceof toon_attacks.Track) {
            const target = i.target_string || (i.parameters.target === -1 ? "all cogs" : context.state.cogs[i.parameters.target].display)
            const name_tgt = i.parameters.sos ? sos_names : names
            element.innerHTML = `<b>Toon ${i.author.position + 1}</b> used <i>${name_tgt[i.parameters.track][i.parameters.level]}</i> on <b>${target}</b>`
        } else {
            const target = i.target_string || (i.target === -1 ? "all toons" : `Toon ${i.target + 1}`)
            element.innerHTML = `<b>${i.author.display}</b> used <i>${i.name || (i.parameters ? i.parameters.name : "???")}</i> on <b>${target}</b>`
        }

        if (i.missed)
            element.innerHTML += ` <span class="text-danger">(${i.missed})</span>`

        log.append(element)
    }
}

function redrawState() {
    document.querySelectorAll(".tooltip").forEach(x => x.remove())
    document.querySelectorAll("#no-controller").forEach(x => x.remove())

    document.querySelectorAll(".cog").forEach(x => x.remove())
    for (let j = context.state.cogs.length - 1; j >= 0; j--)
        drawCog(context.state.cogs[j], j, cogButton)

    document.querySelectorAll(".toon").forEach(x => x.remove())
    const toon_panel = document.querySelector("#toon-panel")
    for (let j = context.state.toons.length - 1; j >= 0; j--) {
        const i = context.state.toons[j]

        const turn = context.displayTurns[j] ? context.turns.filter(x => x.author === j || x.author.position === j)[0] : false
        const arr = context.displayTurns[j]
            ? makeGagCard(context.displayTurns[j], turn.getTargets(context.state), () => toonButton(j))
            : [FunctionImage("sprites/toon.png", () => toonButton(j)), Title("Gag not chosen")]
        if (context.displayTurns[j]) arr[0].classList.add(context.displayTurns[j].sos ? "toon-sos" : "toon-gag")
        const element = Card(
            ...arr,
            Text(`${i.getHealth()} / ${i.max_health}`),
            // Text(i.getEffectLine()),
            printEffects(i.effects))
        if (context.displayTurns[j] && context.displayTurns[j].played) element.classList.add("played-gag")
        element.classList.add("toon")
        toon_panel.append(element)
    }

    updateLog()
}

function setController(name) {
    const rng = document.querySelector("#control-rng").checked
    context.state = new ControlledState(controllers[name](), rng)
    document.querySelector("#log").textContent = ""
    redrawState()
}

function spawnCog(name) {
    if (!context.state) return
    context.state.spawnCog(cogs[name]())
    redrawState()
}

function createToon(settings) {
    if (!context.state) return
    context.state.spawnToon(new Toon(settings))
    context.turns = []
    context.displayTurns = context.state.toons.map(() => false)
    redrawState()
}

function play(movie = false) {
    for (let i = 0; i < context.displayTurns.length; i++) {
        const j = context.displayTurns[i]
        if (j && j.track_number < 8)
            context.state.toons[i].gags[j.track_number][j.level]--
    }
    if (movie)
        context.state.turnCycleMovie(context.turns)
    else {
        context.state.turnCycle(context.turns)
        context.turns = []
        context.displayTurns = []
    }
    redrawState()
}

function simulationTurn(e) {
    for (const i of context.displayTurns)
        if (i && i.id === e.detail)
            i.played = true
    for (const i of context.state.cogs)
        if (i === e.detail)
            i.played = true
    redrawState()
}

function addToon(id) {
    if (toon_presets[id]) return
    context.unpack[id] = {
        name: "Toon Name",
        max_health: 137,
        tracks: [0, 1, 2, 3, 4, 5, 6, 7],
        prestiges: [0, 1, 2, 3, 4, 5, 6, 7]
    }
    localStorage.setItem("toon-presets", JSON.stringify(context.unpack))
    reloadPresets()
}

function updatePreset(id, row) {
    const a = context.unpack[id]
    a.name = row.children[1].firstChild.value
    a.max_health = row.children[2].firstChild.value
    localStorage.setItem("toon-presets", JSON.stringify(context.unpack))
    reloadPresets()
}

function incrementPreset(id, j) {
    const a = context.unpack[id]
    if (a.tracks.indexOf(j) === -1)
        a.tracks.push(j)
    else if (a.prestiges.indexOf(j) === -1)
        a.prestiges.push(j)
    else {
        a.tracks = a.tracks.filter(k => j !== k)
        a.prestiges = a.prestiges.filter(k => j !== k)
    }
    localStorage.setItem("toon-presets", JSON.stringify(context.unpack))
    reloadPresets()
}

function deletePreset(id) {
    delete context.unpack[id]
    localStorage.setItem("toon-presets", JSON.stringify(context.unpack))
    reloadPresets()
}

function reloadPresets() {
    for (const i of Object.keys(toon_presets))
        if (i !== "standard")
            delete toon_presets[i]

    document.querySelectorAll(".toon-controller").forEach(x => x.remove())
    const rows = document.querySelector("#toon-list")
    rows.textContent = ""

    const dd = document.querySelector("#dropdown-add-toon")
    for (const id of Object.keys(context.unpack)) {
        const i = context.unpack[id]
        toon_presets[id] = i

        const btn = document.createElement("button")
        btn.classList.add("dropdown-item", "toon-controller")
        btn.innerHTML = `${i.name} (${i.max_health} HP)`
        btn.addEventListener("click", () => createToon(toon_presets[id]))
        dd.prepend(btn)

        const row = Row(Col(3, Text(`ID: ${id}`)))
        row.append(Col(5, Input("text", "Toon Name", i.name, () => updatePreset(id, row))))
        row.append(Col(2, Input("number", "Max Laff", i.max_health, () => updatePreset(id, row))))
        row.append(Col(2, WFunction(Text("x"), () => deletePreset(id))))

        const subrow = document.createElement("div")
        for (let j = 0; j < 8; j++) {
            const blk = document.createElement("div")
            blk.classList.add("gag-panel-cell-block", "gag-panel-cell-block-gag")

            blk.setAttribute("style", `display:inline-block;background-position: 0 ${-64 * j}px`)
            blk.addEventListener("click", () => incrementPreset(id, j))

            if (i.tracks.indexOf(j) === -1)
                blk.classList.add("gag-panel-cell-disabled")
            else if (i.prestiges.indexOf(j) > -1)
                blk.classList.add("gag-panel-cell-prestiged")
            else
                blk.classList.add("gag-panel-cell-existing")
            subrow.append(blk)
        }
        row.append(subrow)

        rows.prepend(row)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    context.modal = new bootstrap.Modal(document.querySelector("#modal-gag-panel-extended"))
    context.toonModal = new bootstrap.Modal(document.querySelector("#modal-toon-choice"))
    document.querySelectorAll(".cog-controller").forEach(x => {
        x.addEventListener("click", () => setController(x.dataset.control))
    })
    document.querySelectorAll(".unite-controller").forEach(x => {
        x.addEventListener("click", () => {
            if (!context.state) return
            context.state.unite(parseInt(x.innerHTML))
            redrawState()
        })
    })
    document.querySelectorAll(".cog-spawn").forEach(x => {
        x.addEventListener("click", () => spawnCog(x.dataset.control))
    })
    document.querySelector("#control-play").addEventListener("click", () => play(true))
    document.querySelector("#control-restock-unite").addEventListener("click", () => {
        if (!context.state) return
        context.state.restock(7)
        redrawState()
    })
    document.addEventListener("simulation-turn", simulationTurn)
    document.addEventListener("simulation-finish", () => {
        context.turns = []
        context.displayTurns = []
        for (const i of context.state.cogs)
            delete i.played
        setTimeout(redrawState, 0)
    })
    document.querySelector("#control-rng").addEventListener("change", () => {
        if (context.state)
            context.state.use_rng = document.querySelector("#control-rng").checked
    })

    document.querySelector("#control-toon-modal").addEventListener("click", () => context.toonModal.toggle())
    document.querySelector("#toon-controller-standard").addEventListener("click", () => createToon(toon_presets.standard))
    document.querySelector("#add-toon").addEventListener("click", () => addToon(prompt("Enter the toon id")))

    try {
        const data = localStorage.getItem("toon-presets") || "{}"
        context.unpack = JSON.parse(data)
        reloadPresets()
    } catch (e) {
        alert("Error while unpacking toon presets")
        console.log(e)
        storageEnabled = false
    }
})