// -*- js-indent-level:4 -*-

"use strict"

function getCookie(name) {
    if (!document.cookie) return null
    const match = document.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(name + '='))
    return match ? decodeURIComponent(match.substring(name.length + 1)) : null
}

export async function r2labapi(method, path, {body, query} = {}) {
    let url = `/r2labapi/${path}`
    if (query) {
        const params = new URLSearchParams(query)
        url += `?${params}`
    }
    const options = {
        method,
        credentials: 'same-origin',
        headers: {},
    }
    const csrftoken = getCookie('csrftoken')
    if (csrftoken) {
        options.headers['X-CSRFToken'] = csrftoken
    }
    if (body) {
        options.headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
    }
    const resp = await fetch(url, options)
    const text = await resp.text()
    const data = text ? JSON.parse(text) : null
    if (!resp.ok) {
        let msg = (data && (data.detail || data.error)) || `API error ${resp.status}`
        if (typeof msg !== 'string') msg = JSON.stringify(msg)
        throw new Error(msg)
    }
    return data
}
