sidecar_debug = false;

class Sidecar {

    debug(...args) {
        let now = new Date();
        let nowstring = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        if (sidecar_debug) {
            console.log(`${nowstring} - sidecar`,...args);
        }
    }

    // see liveleases for an example of callbacks_map
    constructor(url, callbacks_map) {
        this.url = url;
        this.callbacks_map = callbacks_map;
        this.websocket = undefined;
    }

    get readyState() {
        return this.websocket.readyState;
    }

    // send a 'request' on one category
    request(category) {
        return this.websocket.send(
            JSON.stringify({
                category: category,
                action: 'request',
                message: 'please',
            }))
    }

    /*
     * in case of reconnections, we may receive events
     * relative to other connections, hence the
     * if (event.target != websocket) return;
     */

    connect(init_callback) {
        this.debug(`sidecar connecting to ${this.url}`);
        let websocket = new WebSocket(this.url);
        this.websocket = websocket;
        let sidecar = this;
        let status_changed = this.callbacks_map.status_changed;

        websocket.onopen = function(event) {
            if (event.target != websocket) {
                sidecar.debug("ignoring open");
                return;
            }
            status_changed && status_changed();
            // what to do when receiving news from sidecar
            websocket.onmessage = function(event) {
                if (event.target != websocket) {
                    sidecar.debug("")
                    return;
                }
                sidecar.debug("receiving message on websocket", event.target.url);
                sidecar.handle_incoming_json(event.data);
            };
            init_callback();
        }
        if (status_changed) {
            websocket.onclose = status_changed;
            websocket.onerror = status_changed;
        }
    }

    handle_incoming_json(json) {
        try {
            let umbrella = JSON.parse(json);
            this.debug(`sidecar: incoming umbrella`, umbrella)
            let category = umbrella.category;
            let action = umbrella.action;
            let infos = umbrella.message;
            // xxx somehow we get noise in the mix
            if (json == "" || json == null) {
                console.log(`sidecar json fragment is empty..`);
                return;
            }
            if (action != "info") {
                console.log(`sidecar action ${action} on category ${category} ignored`);
                return;
            }
            let callback = this.callbacks_map[category];
            if (callback == undefined) {
                // ignore categories not present in callbacks
                return;
            }
            this.debug(
                `*** ${new Date()} recv info about ${infos.length} ${category}`,
                infos);
            callback(infos);
        } catch(err) {
            console.log(`*** Could not handle news - ignored JSON is ${json.length} chars long`);
            console.log(json);
            console.log(err.stack);
            console.log("***");
        }
    }

}
