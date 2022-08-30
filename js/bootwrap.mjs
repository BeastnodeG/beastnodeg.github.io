export function Card(...objects) {
    const col = document.createElement("div")
    const card = document.createElement("div")
    card.classList.add("card")
    for (const i of objects) if (i)
        card.append(i)
    col.append(card)
    return col
}

export function Image(src) {
    const img = document.createElement("img")
    img.classList.add("card-img-top")
    img.setAttribute("src", src)
    return img
}

export function WFunction(obj, func) {
    const btn = document.createElement("a")
    btn.setAttribute("href", "#")
    btn.addEventListener("click", func)
    btn.append(obj)
    return btn
}

export function FunctionImage(src, func) { return WFunction(Image(src), func) }

export function Text(text) {
    const body = document.createElement("div")
    body.classList.add("card-body")
    body.innerHTML = text
    return body
}

export function Title(title) {
    const ttl = document.createElement("h5")
    ttl.classList.add("card-title")
    ttl.innerHTML = title
    return ttl
}

export function Toast(title, text) {
    const container = document.createElement("div")
    container.classList.add("position-fixed", "bottom-0", "end-0", "p-3")
    container.setAttribute("style", "z-index:5")
    const toast = document.createElement("div")
    toast.classList.add("toast", "hide")
    const header = document.createElement("div")
    const strong = document.createElement("strong")
    strong.classList.add("me-auto")
    strong.innerHTML = title
    const btn = document.createElement("button")
    btn.classList.add("btn-close")
    btn.setAttribute("data-bs-dismiss", "toast")
    header.append(strong)
    header.append(btn)
    toast.append(header)
    const body = document.createElement("div")
    body.classList.add("toast-body")
    body.innerHTML = text
    toast.append(body)
    container.append(toast)
    document.body.append(container)

    const toast_obj = new bootstrap.Toast(toast)
    toast_obj.show()
}

export function Row(...objects) {
    const row = document.createElement("div")
    row.classList.add("row")
    for (const i of objects)
        row.append(i)
    return row
}

export function Col(n, ...objects) {
    const col = document.createElement("div")
    col.classList.add(`col-${n}`)
    for (const i of objects)
        col.append(i)
    return col
}

export function Input(type, name, value, func) {
    const input = document.createElement("input")
    input.classList.add("form-control")
    input.type = type
    input.placeholder = name
    input.value = value
    input.addEventListener("change", func)
    return input
}