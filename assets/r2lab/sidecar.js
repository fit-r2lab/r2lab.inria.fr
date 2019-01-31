// designed as a singleton, so as to share the connection
// amongst all widgets
// this means we don't export this class

/*global sidecar_url*/

// inspired from
// https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect

let sidecar_debug = false;

function debug(...args) {
    if(sidecar_debug) {
        let now = new Date();
        let nowstring = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        console.log(`${nowstring} - sidecar`,...args);
    }
}


class WebSocketReconnectable {

    constructor(url) {
        this.url = url;
        this.number = 0;                        // Message number
        this.autoReconnectInterval = 5*1000;    // ms
        this.websocket = null;
    }

    open() {
        if (this.websocket !== null)
            return;
        let reconnectable = this;
        this.websocket = new WebSocket(this.url);
        this.websocket.onopen =
            function() { reconnectable.onopen()
            };
        this.websocket.onmessage =
            function(data, flags) {
                reconnectable.number ++;
                reconnectable.onmessage(data, flags, this.number);
            };
        this.websocket.onclose =
            function(event) {
                switch (event.code) {
                case 1000:      // CLOSE_NORMAL
                    debug("WebSocket: closed normally - stopping");
                    break;
                default:
                    debug("WebSocket: abnormal close - reconnecting");
                    reconnectable.reconnect(event);
                    break;
                }
                reconnectable.onclose(event);
            };
        this.websocket.onerror =
            function(event) {
                switch (event.code){
                case 'ECONNREFUSED':
                    reconnectable.reconnect(event);
                    break;
                default:
                    reconnectable.onerror(event);
                    break;
                }
            };
    }

    send(data, option) {
        try {
            this.websocket.send(data, option);
        } catch (event) {
            console.log('OOPS', event);
            this.websocket.emit('error', event);
        }
    }

    reconnect(event){
        let reconnectable = this;
        console.log(`websocket retry ${this.url} in ${this.autoReconnectInterval}ms`);
        debug(event);
        // this.websocket.removeAllListeners();
        setTimeout(
            function(){
                debug("WebSocketClient: reconnecting...");
                reconnectable.open(reconnectable.url);
            },
            reconnectable.autoReconnectInterval);
    }

    // overwrite on instances to suit your needs
    onopen(event) {
        console.log(`websocket open`, event);
    }
    onmessage(data, flags, number) {
        console.log(`websocket: message`, data, flags, number);
    }
    onerror(event) {
        console.log(`websocket: error`, event);
    }
    onclose(event) {
        console.log(`websocket: closed`, event);
    }
}


class SidecarImplementation {


    // see liveleases for an example of callbacks_map
    constructor() {
        this.url = sidecar_url;
        this.callbacks_map = {};
        this.categories = [];
        this.reconnectable = undefined;
    }

    // <key> is typically a sidecar category, which
    // means reacting on the 'info' events on that category
    // special key 'status-changed' triggers when something
    // happens to the connection
    register_callback(key, callback) {
        if (! (key in this.callbacks_map)) {
            this.callbacks_map[key] = [];
        }
        this.callbacks_map[key].push(callback);
    }

    // same but from a key -> callback map
    register_callbacks_map(callbacks_map) {
        for (let key in callbacks_map) {
            this.register_callback(key, callbacks_map[key])
        }
    }

    register_categories(categories) {
        for (let category of categories) {
            if (this.ready()) {
                this.request(category);
            } else if (! (category in this.categories)) {
                this.categories.push(category);
            }
        }
    }

    // send a 'request' on one category
    request(category) {
        return this.reconnectable.send(
            JSON.stringify({
                category: category,
                action: 'request',
                message: 'please',
            }))
    }

    state() {
        try {
            return this.reconnectable.websocket.readyState;
        } catch(e) {
            return WebSocket.CONNECTING;
        }
    }

    ready() {
        return this.state() == WebSocket.OPEN ;
    }

    /*
     * in case of reconnections, we may receive events
     * relative to other connections, hence the
     * if (event.target != websocket) return;
     */

    open() {
        let reconnectable = new WebSocketReconnectable(this.url);
        reconnectable.onmessage =
            ((event, flags, number) => this.handle_incoming_json(event.data, number));
        reconnectable.onopen = ((event) => this.handle_connection_open(event));
        reconnectable.onerror = ((event) => this.handle_connection_error(event));
        reconnectable.onclose = ((event) => this.handle_status_changed(event));
        reconnectable.open(this.url);
        this.reconnectable = reconnectable;
    }

    handle_status_changed() {
        let status_changed_list = this.callbacks_map.status_changed;
        if (status_changed_list)
            for (let status_changed of status_changed_list)
                status_changed(this.state());
    }

    handle_connection_open() {
        console.log(`websocket opened to ${this.url}`);
        for (let category of this.categories) {
            this.request(category);
        }
        this.handle_status_changed();
    }

    handle_connection_error() {
        console.log(`websocket error on ${this.url}`);
        this.handle_status_changed();
    }

    handle_connection_close(event) {
        console.log(`websocket close on ${this.url}`);
        debug(`close event`, event);
        this.handle_status_changed();
    }

    handle_incoming_json(json, number) {
        try {
            let umbrella = JSON.parse(json);
            debug(`sidecar [${number}]: incoming umbrella`, umbrella)
            let category = umbrella.category;
            let action = umbrella.action;
            let infos = umbrella.message;
            // xxx somehow we get noise in the mix
            if (json == "" || json == null) {
                console.log(`sidecar json fragment is empty..`);
                return;
            }
            if (action != "info") {
                debug(`sidecar action ${action} on category ${category} ignored`);
                return;
            }
            debug(`*** recv info about ${infos.length} ${category}`, infos);
            let callbacks = this.callbacks_map[category];
            if (callbacks == undefined) {
                // ignore categories not present in callbacks
                return;
            }
            for (let callback of callbacks)
                callback(infos);
        } catch(err) {
            console.log(`*** Could not handle news - ignored JSON is ${json.length} chars long`);
            console.log(json);
            console.log(err.stack);
            console.log("***");
        }
    }

}

let sidecar_singleton = null;

export function Sidecar() {
    if (sidecar_singleton === null) {
        sidecar_singleton = new SidecarImplementation();
    }
    return sidecar_singleton;
}
