
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const playClicked = writable(0);

    const score = writable(0);

    /* src\components\PlayButton.svelte generated by Svelte v3.49.0 */
    const file = "src\\components\\PlayButton.svelte";

    // (16:0) {#if ready}
    function create_if_block(ctx) {
    	let button;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Jouer";
    			attr_dev(button, "class", "button is-danger is-rounded main-font-family svelte-2x1m8l");
    			add_location(button, file, 16, 2, 295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*startGame*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, { duration: 1500 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, { duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:0) {#if ready}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*ready*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ready*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $playClicked;
    	validate_store(playClicked, 'playClicked');
    	component_subscribe($$self, playClicked, $$value => $$invalidate(2, $playClicked = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PlayButton', slots, []);
    	let ready;

    	const startGame = () => {
    		set_store_value(playClicked, $playClicked = 1, $playClicked);
    	};

    	onMount(() => {
    		$$invalidate(0, ready = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		slide,
    		playClicked,
    		ready,
    		startGame,
    		$playClicked
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(0, ready = $$props.ready);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ready, startGame];
    }

    class PlayButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayButton",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\StartGameTitle.svelte generated by Svelte v3.49.0 */
    const file$1 = "src\\components\\StartGameTitle.svelte";

    // (11:0) {#if ready}
    function create_if_block$1(ctx) {
    	let h10;
    	let h10_intro;
    	let h10_outro;
    	let t1;
    	let h11;
    	let h11_intro;
    	let h11_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			h10.textContent = "Scavenger";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Hunt";
    			attr_dev(h10, "class", "big-text left  svelte-1yjgmul");
    			add_location(h10, file$1, 11, 2, 193);
    			attr_dev(h11, "class", "big-text right svelte-1yjgmul");
    			add_location(h11, file$1, 18, 2, 339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h11, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (h10_outro) h10_outro.end(1);
    				h10_intro = create_in_transition(h10, fly, { x: -80, duration: 1500 });
    				h10_intro.start();
    			});

    			add_render_callback(() => {
    				if (h11_outro) h11_outro.end(1);
    				h11_intro = create_in_transition(h11, fly, { x: 80, duration: 1500 });
    				h11_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (h10_intro) h10_intro.invalidate();
    			h10_outro = create_out_transition(h10, fly, { x: 80, duration: 1500 });
    			if (h11_intro) h11_intro.invalidate();
    			h11_outro = create_out_transition(h11, fly, { x: -80, duration: 1500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching && h10_outro) h10_outro.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h11);
    			if (detaching && h11_outro) h11_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(11:0) {#if ready}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*ready*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ready*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*ready*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartGameTitle', slots, []);
    	let ready;

    	onMount(() => {
    		$$invalidate(0, ready = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartGameTitle> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, fade, fly, slide, ready });

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(0, ready = $$props.ready);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ready];
    }

    class StartGameTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartGameTitle",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\components\modals\ModalWithCharacter.svelte generated by Svelte v3.49.0 */
    const file$2 = "src\\components\\modals\\ModalWithCharacter.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (39:6) {#each text as p}
    function create_each_block(ctx) {
    	let p;
    	let t_value = /*p*/ ctx[7] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file$2, 39, 8, 961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:6) {#each text as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div5;
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t0;
    	let div4;
    	let img;
    	let img_src_value;
    	let t1;
    	let div3;
    	let t2;
    	let div2;
    	let div1;
    	let t4;
    	let button;
    	let div5_intro;
    	let div5_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*text*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			img = element("img");
    			t1 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "ok...";
    			t4 = space();
    			button = element("button");
    			attr_dev(div0, "class", "modal-background svelte-1nak1xm");
    			add_location(div0, file$2, 29, 2, 652);
    			if (!src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[2][/*character*/ ctx[0]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "character");
    			attr_dev(img, "class", "svelte-1nak1xm");
    			add_location(img, file$2, 36, 4, 833);
    			attr_dev(div1, "class", "is-30-percent is-clickable svelte-1nak1xm");
    			add_location(div1, file$2, 42, 8, 1032);
    			attr_dev(div2, "class", "has-text-right");
    			add_location(div2, file$2, 41, 6, 994);
    			attr_dev(div3, "class", "card has-text-left svelte-1nak1xm");
    			add_location(div3, file$2, 37, 4, 894);
    			attr_dev(div4, "class", "modal-content svelte-1nak1xm");
    			toggle_class(div4, "has-text-right", /*character*/ ctx[0] == 2);
    			add_location(div4, file$2, 35, 2, 762);
    			attr_dev(button, "class", "modal-close is-large");
    			attr_dev(button, "aria-label", "close");
    			add_location(button, file$2, 46, 2, 1144);
    			attr_dev(div5, "class", "modal is-active");
    			add_location(div5, file$2, 28, 0, 576);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			append_dev(div4, t1);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div5, t4);
    			append_dev(div5, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*close*/ ctx[4], false, false, false),
    					listen_dev(div1, "click", /*okClicked*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*character*/ 1 && !src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[2][/*character*/ ctx[0]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*text*/ 2) {
    				each_value = /*text*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*character*/ 1) {
    				toggle_class(div4, "has-text-right", /*character*/ ctx[0] == 2);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				div0_intro = create_in_transition(div0, fade, { delay: 100 });
    				div0_intro.start();
    			});

    			add_render_callback(() => {
    				if (div5_outro) div5_outro.end(1);
    				div5_intro = create_in_transition(div5, fly, { x: 50, duration: 500 });
    				div5_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, {});
    			if (div5_intro) div5_intro.invalidate();
    			div5_outro = create_out_transition(div5, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching && div0_outro) div0_outro.end();
    			destroy_each(each_blocks, detaching);
    			if (detaching && div5_outro) div5_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ModalWithCharacter', slots, []);
    	let { message } = $$props;
    	let { character = 0 } = $$props;
    	let text = message.split("\n");
    	const dispatch = createEventDispatcher();
    	const charactersList = ["./images/Tigre1.jpeg", "./images/Tigre2.jpeg", "./images/Tigre3.jpeg"];

    	const okClicked = () => {
    		dispatch("okClicked", {});
    	};

    	const close = () => {
    		//modalToggle = false;
    		dispatch("close", {});
    	};

    	const writable_props = ['message', 'character'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalWithCharacter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(5, message = $$props.message);
    		if ('character' in $$props) $$invalidate(0, character = $$props.character);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		fly,
    		message,
    		character,
    		text,
    		dispatch,
    		charactersList,
    		okClicked,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(5, message = $$props.message);
    		if ('character' in $$props) $$invalidate(0, character = $$props.character);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [character, text, charactersList, okClicked, close, message];
    }

    class ModalWithCharacter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { message: 5, character: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalWithCharacter",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[5] === undefined && !('message' in props)) {
    			console.warn("<ModalWithCharacter> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<ModalWithCharacter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<ModalWithCharacter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get character() {
    		throw new Error("<ModalWithCharacter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set character(value) {
    		throw new Error("<ModalWithCharacter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TutorialButton.svelte generated by Svelte v3.49.0 */
    const file$3 = "src\\components\\TutorialButton.svelte";

    // (22:0) {#if ready}
    function create_if_block_1(ctx) {
    	let button;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "T3allem ella3b";
    			attr_dev(button, "class", "button is-info is-outlined is-rounded main-font-family svelte-e6j20f");
    			add_location(button, file$3, 22, 2, 479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*openModal*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, { duration: 2000, delay: 600 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, { duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(22:0) {#if ready}",
    		ctx
    	});

    	return block;
    }

    // (33:0) {#if modalToggle}
    function create_if_block$2(ctx) {
    	let modalwithcharacter;
    	let current;

    	modalwithcharacter = new ModalWithCharacter({
    			props: {
    				message: /*message*/ ctx[2],
    				character: "2"
    			},
    			$$inline: true
    		});

    	modalwithcharacter.$on("close", /*closeModal*/ ctx[4]);
    	modalwithcharacter.$on("okClicked", /*closeModal*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(modalwithcharacter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalwithcharacter, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalwithcharacter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalwithcharacter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalwithcharacter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(33:0) {#if modalToggle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*ready*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*modalToggle*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ready*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*ready*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*modalToggle*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*modalToggle*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TutorialButton', slots, []);
    	let ready, modalToggle;
    	let message = "Désolé pas encore prèt... \n Inchallah très bientôt!";

    	const openModal = () => {
    		$$invalidate(1, modalToggle = true);
    	};

    	const closeModal = () => {
    		$$invalidate(1, modalToggle = false);
    	};

    	onMount(() => {
    		$$invalidate(0, ready = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TutorialButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		slide,
    		ModalWithCharacter,
    		ready,
    		modalToggle,
    		message,
    		openModal,
    		closeModal
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(0, ready = $$props.ready);
    		if ('modalToggle' in $$props) $$invalidate(1, modalToggle = $$props.modalToggle);
    		if ('message' in $$props) $$invalidate(2, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ready, modalToggle, message, openModal, closeModal];
    }

    class TutorialButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TutorialButton",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\pages\StartPage.svelte generated by Svelte v3.49.0 */
    const file$4 = "src\\pages\\StartPage.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div0;
    	let startgametitle;
    	let t0;
    	let div1;
    	let playbutton;
    	let t1;
    	let div2;
    	let tutorialbutton;
    	let current;
    	startgametitle = new StartGameTitle({ $$inline: true });
    	playbutton = new PlayButton({ $$inline: true });
    	tutorialbutton = new TutorialButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(startgametitle.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(playbutton.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(tutorialbutton.$$.fragment);
    			attr_dev(div0, "class", "svelte-2480ae");
    			add_location(div0, file$4, 7, 2, 268);
    			attr_dev(div1, "class", "svelte-2480ae");
    			add_location(div1, file$4, 10, 2, 311);
    			attr_dev(div2, "class", "svelte-2480ae");
    			add_location(div2, file$4, 13, 2, 350);
    			attr_dev(div3, "class", "is-flex-center is-100-height svelte-2480ae");
    			add_location(div3, file$4, 6, 0, 222);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(startgametitle, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(playbutton, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(tutorialbutton, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(startgametitle.$$.fragment, local);
    			transition_in(playbutton.$$.fragment, local);
    			transition_in(tutorialbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(startgametitle.$$.fragment, local);
    			transition_out(playbutton.$$.fragment, local);
    			transition_out(tutorialbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(startgametitle);
    			destroy_component(playbutton);
    			destroy_component(tutorialbutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartPage', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		PlayButton,
    		StartGameTitle,
    		TutorialButton
    	});

    	return [];
    }

    class StartPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartPage",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Ui.svelte generated by Svelte v3.49.0 */
    const file$5 = "src\\components\\Ui.svelte";

    // (28:0) {#if ready}
    function create_if_block$3(ctx) {
    	let div5;
    	let div3;
    	let i0;
    	let t0;
    	let div2;
    	let div0;
    	let span0;
    	let t2;
    	let div1;
    	let i1;
    	let t3;
    	let span1;
    	let t4;
    	let div1_intro;
    	let t5;
    	let div4;
    	let i2;
    	let div5_intro;
    	let div5_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "SKON(Moh)";
    			t2 = space();
    			div1 = element("div");
    			i1 = element("i");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(/*$score*/ ctx[1]);
    			t5 = space();
    			div4 = element("div");
    			i2 = element("i");
    			attr_dev(i0, "class", "fas fa-lg fa-user-circle m-t25 svelte-39p9mi");
    			add_location(i0, file$5, 34, 6, 704);
    			add_location(span0, file$5, 37, 10, 836);
    			attr_dev(div0, "class", "player-name");
    			add_location(div0, file$5, 36, 8, 799);
    			attr_dev(i1, "class", "fas fa-star");
    			add_location(i1, file$5, 43, 10, 1030);
    			add_location(span1, file$5, 44, 10, 1067);
    			attr_dev(div1, "class", "player-score m-t-25 is-size-5 has-text-warning svelte-39p9mi");
    			add_location(div1, file$5, 39, 8, 884);
    			attr_dev(div2, "class", "player-display ml-2");
    			add_location(div2, file$5, 35, 6, 756);
    			attr_dev(div3, "class", "left svelte-39p9mi");
    			add_location(div3, file$5, 33, 4, 678);
    			attr_dev(i2, "class", "fas fa-ellipsis-v");
    			add_location(i2, file$5, 49, 6, 1163);
    			attr_dev(div4, "class", "right");
    			add_location(div4, file$5, 48, 4, 1136);
    			attr_dev(div5, "class", "ui is-size-3 svelte-39p9mi");
    			add_location(div5, file$5, 28, 2, 541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, i0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, i1);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(span1, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$score*/ 2) set_data_dev(t4, /*$score*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, /*spin*/ ctx[2], { duration: 1500, delay: 1000 });
    					div1_intro.start();
    				});
    			}

    			add_render_callback(() => {
    				if (div5_outro) div5_outro.end(1);
    				div5_intro = create_in_transition(div5, fly, { y: -100, duration: 1500, delay: 200 });
    				div5_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div5_intro) div5_intro.invalidate();
    			div5_outro = create_out_transition(div5, fly, { y: 100, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching && div5_outro) div5_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(28:0) {#if ready}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*ready*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ready*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $score;
    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => $$invalidate(1, $score = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ui', slots, []);
    	let ready;

    	function spin(node, { duration, delay }) {
    		return {
    			duration,
    			delay,
    			css: t => {
    				const eased = elasticOut(t);

    				return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);
          `;
    			}
    		};
    	}

    	onMount(() => {
    		$$invalidate(0, ready = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ui> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		elasticOut,
    		score,
    		ready,
    		spin,
    		$score
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(0, ready = $$props.ready);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ready, $score, spin];
    }

    class Ui extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ui",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\modals\ModalResponseWithCharacter.svelte generated by Svelte v3.49.0 */
    const file$6 = "src\\components\\modals\\ModalResponseWithCharacter.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (39:6) {#each text as p}
    function create_each_block$1(ctx) {
    	let p;
    	let t_value = /*p*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file$6, 39, 8, 955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(39:6) {#each text as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div7;
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t0;
    	let div6;
    	let img;
    	let img_src_value;
    	let t1;
    	let div5;
    	let t2;
    	let div2;
    	let div1;
    	let input;
    	let t3;
    	let p;
    	let t5;
    	let div4;
    	let div3;
    	let t7;
    	let button;
    	let div7_intro;
    	let div7_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*text*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div6 = element("div");
    			img = element("img");
    			t1 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t3 = space();
    			p = element("p");
    			p.textContent = "As tu trouvé la réponse de l'énigme?";
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "Valider!";
    			t7 = space();
    			button = element("button");
    			attr_dev(div0, "class", "modal-background svelte-1nak1xm");
    			add_location(div0, file$6, 29, 2, 646);
    			if (!src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[3][/*character*/ ctx[0]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "character");
    			attr_dev(img, "class", "svelte-1nak1xm");
    			add_location(img, file$6, 36, 4, 827);
    			attr_dev(input, "class", "input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Réponse");
    			add_location(input, file$6, 44, 10, 1057);
    			attr_dev(div1, "class", "control");
    			add_location(div1, file$6, 43, 8, 1024);
    			attr_dev(p, "class", "help");
    			add_location(p, file$6, 51, 8, 1225);
    			attr_dev(div2, "class", "field mt-3");
    			add_location(div2, file$6, 42, 6, 990);
    			attr_dev(div3, "class", "is-30-percent is-clickable svelte-1nak1xm");
    			add_location(div3, file$6, 54, 8, 1341);
    			attr_dev(div4, "class", "has-text-right");
    			add_location(div4, file$6, 53, 6, 1303);
    			attr_dev(div5, "class", "card has-text-left svelte-1nak1xm");
    			add_location(div5, file$6, 37, 4, 888);
    			attr_dev(div6, "class", "modal-content svelte-1nak1xm");
    			toggle_class(div6, "has-text-right", /*character*/ ctx[0] == 2);
    			add_location(div6, file$6, 35, 2, 756);
    			attr_dev(button, "class", "modal-close is-large");
    			attr_dev(button, "aria-label", "close");
    			add_location(button, file$6, 60, 2, 1478);
    			attr_dev(div7, "class", "modal is-active");
    			add_location(div7, file$6, 28, 0, 570);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, img);
    			append_dev(div6, t1);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div5, t2);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*response*/ ctx[1]);
    			append_dev(div2, t3);
    			append_dev(div2, p);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div7, t7);
    			append_dev(div7, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*close*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(div3, "click", /*okClicked*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*character*/ 1 && !src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[3][/*character*/ ctx[0]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*text*/ 4) {
    				each_value = /*text*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*response*/ 2 && input.value !== /*response*/ ctx[1]) {
    				set_input_value(input, /*response*/ ctx[1]);
    			}

    			if (dirty & /*character*/ 1) {
    				toggle_class(div6, "has-text-right", /*character*/ ctx[0] == 2);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				div0_intro = create_in_transition(div0, fade, { delay: 100 });
    				div0_intro.start();
    			});

    			add_render_callback(() => {
    				if (div7_outro) div7_outro.end(1);
    				div7_intro = create_in_transition(div7, fly, { x: 50, duration: 500 });
    				div7_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, {});
    			if (div7_intro) div7_intro.invalidate();
    			div7_outro = create_out_transition(div7, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching && div0_outro) div0_outro.end();
    			destroy_each(each_blocks, detaching);
    			if (detaching && div7_outro) div7_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ModalResponseWithCharacter', slots, []);
    	let { message } = $$props;
    	let { character = 0 } = $$props;
    	let response;
    	let text = message.split("\n");
    	const dispatch = createEventDispatcher();
    	const charactersList = ["./images/Tigre1.jpeg", "./images/Tigre2.jpeg", "./images/Tigre3.jpeg"];

    	const okClicked = () => {
    		dispatch("okClicked", { response });
    	};

    	const close = () => {
    		//modalToggle = false;
    		dispatch("close", {});
    	};

    	const writable_props = ['message', 'character'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalResponseWithCharacter> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		response = this.value;
    		$$invalidate(1, response);
    	}

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(6, message = $$props.message);
    		if ('character' in $$props) $$invalidate(0, character = $$props.character);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		fly,
    		message,
    		character,
    		response,
    		text,
    		dispatch,
    		charactersList,
    		okClicked,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(6, message = $$props.message);
    		if ('character' in $$props) $$invalidate(0, character = $$props.character);
    		if ('response' in $$props) $$invalidate(1, response = $$props.response);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		character,
    		response,
    		text,
    		charactersList,
    		okClicked,
    		close,
    		message,
    		input_input_handler
    	];
    }

    class ModalResponseWithCharacter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { message: 6, character: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalResponseWithCharacter",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[6] === undefined && !('message' in props)) {
    			console.warn("<ModalResponseWithCharacter> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<ModalResponseWithCharacter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<ModalResponseWithCharacter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get character() {
    		throw new Error("<ModalResponseWithCharacter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set character(value) {
    		throw new Error("<ModalResponseWithCharacter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\modals\ModalWin.svelte generated by Svelte v3.49.0 */
    const file$7 = "src\\components\\modals\\ModalWin.svelte";

    function create_fragment$7(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let img;
    	let img_src_value;
    	let t1;
    	let div1;
    	let h1;
    	let t2;
    	let div2_intro;
    	let div3_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			img = element("img");
    			t1 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t2 = text(/*message*/ ctx[0]);
    			attr_dev(div0, "class", "modal-background svelte-3ncjmf");
    			add_location(div0, file$7, 41, 2, 964);
    			if (!src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[2][/*character*/ ctx[1]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "character");
    			attr_dev(img, "class", "svelte-3ncjmf");
    			add_location(img, file$7, 43, 4, 1074);
    			attr_dev(h1, "class", "is-size-1 has-text-warning svelte-3ncjmf");
    			add_location(h1, file$7, 45, 6, 1188);
    			attr_dev(div1, "class", "card has-text-centered win-text svelte-3ncjmf");
    			add_location(div1, file$7, 44, 4, 1135);
    			attr_dev(div2, "class", "modal-content svelte-3ncjmf");
    			add_location(div2, file$7, 42, 2, 1000);
    			attr_dev(div3, "class", "modal is-active");
    			add_location(div3, file$7, 40, 0, 922);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, img);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*character*/ 2 && !src_url_equal(img.src, img_src_value = /*charactersList*/ ctx[2][/*character*/ ctx[1]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*message*/ 1) set_data_dev(t2, /*message*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, /*whoosh*/ ctx[3], { duration: 2000, delay: 0 });
    					div2_intro.start();
    				});
    			}

    			if (div3_outro) div3_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			div3_outro = create_out_transition(div3, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && div3_outro) div3_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ModalWin', slots, []);
    	let { message } = $$props;
    	let { character = 1 } = $$props;

    	//const dispatch = createEventDispatcher();
    	const charactersList = ["./images/Tigre1.jpeg", "./images/Tigre2.jpeg", "./images/Tigre3.jpeg"];

    	/* const okClicked = () => {
      dispatch("okClicked", {});
    };

    const close = () => {
      //modalToggle = false;
      dispatch("close", {});
    }; */
    	function whoosh(node, params) {
    		const existingTransform = getComputedStyle(node).transform.replace("none", "");

    		return {
    			delay: params.delay || 0,
    			duration: params.duration || 400,
    			easing: params.easing || elasticOut,
    			css: (t, u) => `transform: ${existingTransform} scale(${t})`
    		};
    	}

    	const writable_props = ['message', 'character'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalWin> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('character' in $$props) $$invalidate(1, character = $$props.character);
    	};

    	$$self.$capture_state = () => ({
    		elasticOut,
    		fade,
    		fly,
    		message,
    		character,
    		charactersList,
    		whoosh
    	});

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('character' in $$props) $$invalidate(1, character = $$props.character);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, character, charactersList, whoosh];
    }

    class ModalWin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { message: 0, character: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalWin",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !('message' in props)) {
    			console.warn("<ModalWin> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<ModalWin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<ModalWin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get character() {
    		throw new Error("<ModalWin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set character(value) {
    		throw new Error("<ModalWin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const missions = writable([
      {
        title: "appartement",
        difficulty: 1,
        id: 0,
        started: 0,
        completed: 0,
        levels: [
          {
            lvl: 0,
            objective: 123,
            completed: 0,
            points: 10,
            text: "Bienvenue dans Scavenger Hunt v0.0.1! \n retrouves moi vite dans l'entrée, il y a quelque chose qui va certainement t'interessé.",
          },
          {
            lvl: 1,
            objective: 234,
            completed: 0,
            points: 20,
            text: "J'espere que tu n'as pas eu du mal a me retrouver! \n A partir de maintenant il va falloir faire plus attention; tu va devoir suivre mes traces pour trouver le prochain indice qui nous aidera a trouver le trésor. \n Ce que je me rappelles c'est que cette endroit sentait les épices.",
          },
        ],
      },
      {
        title: "appartement 2",
        difficulty: 2,
        id: 1,
        started: 0,
        completed: 0,
        levels: [
          {
            lvl: 0,
            objective: 123,
            completed: 0,
            points: 10,
            text: "Bienvenue dans Scavenger Hunt v0.0.1! \n retouves moi vite dans l'enttrée, j'ai quelque chose d'important a te dire.",
          },
          {
            lvl: 1,
            objective: 234,
            completed: 0,
            points: 20,
            text: "J'espere que tu n'as pas eu du mal a me retrouver! \n A partir de maintenant il va falloir faire plus attention; tu va devoir suivre mes traces pour trouver le prochain indice qui nous aidera a trouver le trésor. \n Ce que je me rappelles c'est que cette endroit sentait les épices.",
          },
        ],
      },
      {
        title: "appartement 3",
        difficulty: 3,
        id: 2,
        started: 0,
        completed: 0,
        levels: [
          {
            lvl: 0,
            objective: 123,
            completed: 0,
            points: 10,
            text: "Bienvenue dans Scavenger Hunt v0.0.1! \n retouves moi vite dans l'enttrée, j'ai quelque chose d'important a te dire.",
          },
          {
            lvl: 1,
            objective: 234,
            completed: 0,
            points: 20,
            text: "J'espere que tu n'as pas eu du mal a me retrouver! \n A partir de maintenant il va falloir faire plus attention; tu va devoir suivre mes traces pour trouver le prochain indice qui nous aidera a trouver le trésor. \n Ce que je me rappelles c'est que cette endroit sentait les épices.",
          },
        ],
      },
    ]);

    /* src\pages\GamePage.svelte generated by Svelte v3.49.0 */
    const file$8 = "src\\pages\\GamePage.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (95:2) {#if startedMissions.length}
    function create_if_block_4(ctx) {
    	let div;
    	let span;
    	let t1;
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*startedMissions*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "ACTIVE MISSIONS";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(span, "class", "tag is-warning");
    			add_location(span, file$8, 96, 6, 2911);
    			attr_dev(div, "class", "svelte-185ixjw");
    			add_location(div, file$8, 95, 4, 2898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*startedMissions, fullowUpMission*/ 1025) {
    				each_value_2 = /*startedMissions*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(95:2) {#if startedMissions.length}",
    		ctx
    	});

    	return block;
    }

    // (117:12) {:else}
    function create_else_block_1(ctx) {
    	let i;
    	let i_intro;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "ml-1 fas fa-check has-text-success");
    			add_location(i, file$8, 117, 14, 3604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		i: function intro(local) {
    			if (!i_intro) {
    				add_render_callback(() => {
    					i_intro = create_in_transition(i, /*spin*/ ctx[14], { duration: 1000, delay: 300 });
    					i_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(117:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (115:12) {#if !lvl.completed}
    function create_if_block_5(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "ml-1 fas fa-times has-text-grey-light");
    			add_location(i, file$8, 115, 14, 3516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(115:12) {#if !lvl.completed}",
    		ctx
    	});

    	return block;
    }

    // (114:10) {#each mission.levels as lvl, i}
    function create_each_block_3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*lvl*/ ctx[27].completed) return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(114:10) {#each mission.levels as lvl, i}",
    		ctx
    	});

    	return block;
    }

    // (99:4) {#each startedMissions as mission, i}
    function create_each_block_2(ctx) {
    	let div1;
    	let p;
    	let t0_value = /*mission*/ ctx[21].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div1_class_value;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*mission*/ ctx[21].levels;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*mission*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(p, "class", "is-inline-block");
    			add_location(p, file$8, 109, 8, 3315);
    			attr_dev(div0, "class", "is-inline-block svelte-185ixjw");
    			add_location(div0, file$8, 112, 8, 3393);

    			attr_dev(div1, "class", div1_class_value = "card border-" + (/*mission*/ ctx[21].difficulty == 3
    			? 'danger'
    			: /*mission*/ ctx[21].difficulty == 2
    				? 'warning'
    				: 'success') + " svelte-185ixjw");

    			add_location(div1, file$8, 99, 6, 3025);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*startedMissions*/ 1) && t0_value !== (t0_value = /*mission*/ ctx[21].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*startedMissions*/ 1) {
    				each_value_3 = /*mission*/ ctx[21].levels;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (!current || dirty & /*startedMissions*/ 1 && div1_class_value !== (div1_class_value = "card border-" + (/*mission*/ ctx[21].difficulty == 3
    			? 'danger'
    			: /*mission*/ ctx[21].difficulty == 2
    				? 'warning'
    				: 'success') + " svelte-185ixjw")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(99:4) {#each startedMissions as mission, i}",
    		ctx
    	});

    	return block;
    }

    // (157:2) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No available missions";
    			attr_dev(div, "class", "has-text-grey-light svelte-185ixjw");
    			add_location(div, file$8, 157, 4, 4789);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(157:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (132:2) {#if availableMissions.length}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*availableMissions*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableMissions, startThemission, Array, undefined*/ 514) {
    				each_value = /*availableMissions*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(132:2) {#if availableMissions.length}",
    		ctx
    	});

    	return block;
    }

    // (150:12) {#each Array(mission.difficulty).fill(undefined) as x, i}
    function create_each_block_1(ctx) {
    	let i_1;

    	const block = {
    		c: function create() {
    			i_1 = element("i");
    			attr_dev(i_1, "class", "ml-1 fas fa-times has-text-danger");
    			add_location(i_1, file$8, 150, 14, 4642);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i_1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(150:12) {#each Array(mission.difficulty).fill(undefined) as x, i}",
    		ctx
    	});

    	return block;
    }

    // (133:4) {#each availableMissions as mission, i}
    function create_each_block$2(ctx) {
    	let div1;
    	let p;
    	let t0_value = /*mission*/ ctx[21].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let span;
    	let small;
    	let t3;
    	let t4;
    	let div1_class_value;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = Array(/*mission*/ ctx[21].difficulty).fill(undefined);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*mission*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			span = element("span");
    			small = element("small");
    			small.textContent = "Difficulté";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			attr_dev(p, "class", "is-inline-block");
    			add_location(p, file$8, 143, 8, 4348);
    			attr_dev(small, "class", "mr-1");
    			add_location(small, file$8, 148, 12, 4517);
    			attr_dev(span, "class", "tag is-light baseline svelte-185ixjw");
    			add_location(span, file$8, 147, 10, 4467);
    			attr_dev(div0, "class", "is-inline-block svelte-185ixjw");
    			add_location(div0, file$8, 146, 8, 4426);

    			attr_dev(div1, "class", div1_class_value = "card border-" + (/*mission*/ ctx[21].difficulty == 3
    			? 'danger'
    			: /*mission*/ ctx[21].difficulty == 2
    				? 'warning'
    				: 'success') + " svelte-185ixjw");

    			add_location(div1, file$8, 133, 6, 3998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, small);
    			append_dev(span, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span, null);
    			}

    			append_dev(div1, t4);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*availableMissions*/ 2) && t0_value !== (t0_value = /*mission*/ ctx[21].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*availableMissions*/ 2) {
    				each_value_1 = Array(/*mission*/ ctx[21].difficulty).fill(undefined);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (!current || dirty & /*availableMissions*/ 2 && div1_class_value !== (div1_class_value = "card border-" + (/*mission*/ ctx[21].difficulty == 3
    			? 'danger'
    			: /*mission*/ ctx[21].difficulty == 2
    				? 'warning'
    				: 'success') + " svelte-185ixjw")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);

    				div1_intro = create_in_transition(div1, fly, {
    					x: -100,
    					duration: 1000,
    					delay: 500 * (/*i*/ ctx[23] + 2)
    				});

    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { x: 100, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(133:4) {#each availableMissions as mission, i}",
    		ctx
    	});

    	return block;
    }

    // (162:0) {#if modalToggle}
    function create_if_block_2(ctx) {
    	let modalwithcharacter;
    	let current;

    	modalwithcharacter = new ModalWithCharacter({
    			props: {
    				message: /*message*/ ctx[5],
    				character: /*character*/ ctx[7]
    			},
    			$$inline: true
    		});

    	modalwithcharacter.$on("close", /*closeModal*/ ctx[13]);
    	modalwithcharacter.$on("okClicked", /*closeModal*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(modalwithcharacter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalwithcharacter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalwithcharacter_changes = {};
    			if (dirty & /*message*/ 32) modalwithcharacter_changes.message = /*message*/ ctx[5];
    			if (dirty & /*character*/ 128) modalwithcharacter_changes.character = /*character*/ ctx[7];
    			modalwithcharacter.$set(modalwithcharacter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalwithcharacter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalwithcharacter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalwithcharacter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(162:0) {#if modalToggle}",
    		ctx
    	});

    	return block;
    }

    // (171:0) {#if responseModalToggle}
    function create_if_block_1$1(ctx) {
    	let modalresponsewithcharacter;
    	let current;

    	modalresponsewithcharacter = new ModalResponseWithCharacter({
    			props: {
    				message: /*message*/ ctx[5],
    				character: /*character*/ ctx[7]
    			},
    			$$inline: true
    		});

    	modalresponsewithcharacter.$on("close", /*justCloseResponseModal*/ ctx[12]);
    	modalresponsewithcharacter.$on("okClicked", /*closeResponseModal*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(modalresponsewithcharacter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalresponsewithcharacter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalresponsewithcharacter_changes = {};
    			if (dirty & /*message*/ 32) modalresponsewithcharacter_changes.message = /*message*/ ctx[5];
    			if (dirty & /*character*/ 128) modalresponsewithcharacter_changes.character = /*character*/ ctx[7];
    			modalresponsewithcharacter.$set(modalresponsewithcharacter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalresponsewithcharacter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalresponsewithcharacter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalresponsewithcharacter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(171:0) {#if responseModalToggle}",
    		ctx
    	});

    	return block;
    }

    // (180:0) {#if winModal}
    function create_if_block$4(ctx) {
    	let modalwin;
    	let current;

    	modalwin = new ModalWin({
    			props: {
    				message: /*winText*/ ctx[3],
    				character: /*winCharacter*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modalwin.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalwin, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalwin_changes = {};
    			if (dirty & /*winText*/ 8) modalwin_changes.message = /*winText*/ ctx[3];
    			if (dirty & /*winCharacter*/ 16) modalwin_changes.character = /*winCharacter*/ ctx[4];
    			modalwin.$set(modalwin_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalwin.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalwin.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalwin, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(180:0) {#if winModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let span;
    	let t2;
    	let current_block_type_index;
    	let if_block1;
    	let t3;
    	let t4;
    	let t5;
    	let if_block4_anchor;
    	let current;
    	let if_block0 = /*startedMissions*/ ctx[0].length && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block_3, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*availableMissions*/ ctx[1].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = /*modalToggle*/ ctx[6] && create_if_block_2(ctx);
    	let if_block3 = /*responseModalToggle*/ ctx[8] && create_if_block_1$1(ctx);
    	let if_block4 = /*winModal*/ ctx[2] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "AVAILABLE MISSIONS";
    			t2 = space();
    			if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			attr_dev(span, "class", "tag is-white");
    			add_location(span, file$8, 129, 4, 3849);
    			attr_dev(div0, "class", "svelte-185ixjw");
    			add_location(div0, file$8, 128, 2, 3838);
    			attr_dev(div1, "class", "is-flex-center is-100-height svelte-185ixjw");
    			add_location(div1, file$8, 93, 0, 2818);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t2);
    			if_blocks[current_block_type_index].m(div1, null);
    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*startedMissions*/ ctx[0].length) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*startedMissions*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}

    			if (/*modalToggle*/ ctx[6]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*modalToggle*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t4.parentNode, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*responseModalToggle*/ ctx[8]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*responseModalToggle*/ 256) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t5.parentNode, t5);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*winModal*/ ctx[2]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*winModal*/ 4) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$4(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $score;
    	let $missions;
    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => $$invalidate(20, $score = $$value));
    	validate_store(missions, 'missions');
    	component_subscribe($$self, missions, $$value => $$invalidate(15, $missions = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GamePage', slots, []);
    	let startedMissions = [];
    	let availableMissions = [];
    	let winModal;
    	let winText;
    	let winCharacter;
    	let selectMission;
    	let selectMissionLevel;
    	let message;
    	let modalToggle;
    	let character;
    	let responseModalToggle;

    	const startThemission = id => {
    		$missions.find(m => m.id == id).started = 1;
    		selectMission = $missions.find(m => m.id == id);
    		$$invalidate(5, message = selectMission.levels.find(l => !l.completed).text);

    		$$invalidate(7, character = selectMission.levels.find(l => !l.completed).lvl == 0
    		? 1
    		: 0);

    		$$invalidate(6, modalToggle = true);
    		set_store_value(missions, $missions = [...$missions], $missions);
    	};

    	const fullowUpMission = id => {
    		selectMission = $missions.find(m => m.id == id);
    		selectMissionLevel = selectMission.levels.find(l => !l.completed);
    		$$invalidate(7, character = 1);
    		$$invalidate(5, message = selectMission.levels.find(l => !l.completed).text);
    		$$invalidate(8, responseModalToggle = true);
    	};

    	const closeResponseModal = e => {
    		const answer = e.detail.response;
    		let success = answer == selectMissionLevel.objective;

    		if (success) {
    			selectMissionLevel.completed = 1;
    			set_store_value(score, $score += selectMissionLevel.points, $score);
    			$$invalidate(0, startedMissions = [...startedMissions]);

    			if (selectMissionLevel.lvl == selectMission.levels.length - 1) {
    				$$invalidate(3, winText = "BRAVOO!");
    				$$invalidate(4, winCharacter = 1);
    				$$invalidate(2, winModal = true);
    			}
    		} else {
    			$$invalidate(3, winText = "Ouups... Raté!");
    			$$invalidate(4, winCharacter = 2);
    			$$invalidate(2, winModal = true);

    			setTimeout(
    				() => {
    					$$invalidate(2, winModal = false);
    				},
    				3000
    			);
    		}

    		$$invalidate(8, responseModalToggle = false);
    	};

    	const justCloseResponseModal = () => {
    		$$invalidate(8, responseModalToggle = false);
    	};

    	const closeModal = () => {
    		$$invalidate(6, modalToggle = false);
    	};

    	function spin(node, { duration, delay }) {
    		return {
    			duration,
    			delay,
    			css: t => {
    				const eased = elasticOut(t);

    				return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);
          `;
    			}
    		};
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GamePage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = mission => fullowUpMission(mission.id);
    	const click_handler_1 = mission => startThemission(mission.id);

    	$$self.$capture_state = () => ({
    		elasticOut,
    		fade,
    		fly,
    		ModalResponseWithCharacter,
    		ModalWin,
    		ModalWithCharacter,
    		score,
    		missions,
    		startedMissions,
    		availableMissions,
    		winModal,
    		winText,
    		winCharacter,
    		selectMission,
    		selectMissionLevel,
    		message,
    		modalToggle,
    		character,
    		responseModalToggle,
    		startThemission,
    		fullowUpMission,
    		closeResponseModal,
    		justCloseResponseModal,
    		closeModal,
    		spin,
    		$score,
    		$missions
    	});

    	$$self.$inject_state = $$props => {
    		if ('startedMissions' in $$props) $$invalidate(0, startedMissions = $$props.startedMissions);
    		if ('availableMissions' in $$props) $$invalidate(1, availableMissions = $$props.availableMissions);
    		if ('winModal' in $$props) $$invalidate(2, winModal = $$props.winModal);
    		if ('winText' in $$props) $$invalidate(3, winText = $$props.winText);
    		if ('winCharacter' in $$props) $$invalidate(4, winCharacter = $$props.winCharacter);
    		if ('selectMission' in $$props) selectMission = $$props.selectMission;
    		if ('selectMissionLevel' in $$props) selectMissionLevel = $$props.selectMissionLevel;
    		if ('message' in $$props) $$invalidate(5, message = $$props.message);
    		if ('modalToggle' in $$props) $$invalidate(6, modalToggle = $$props.modalToggle);
    		if ('character' in $$props) $$invalidate(7, character = $$props.character);
    		if ('responseModalToggle' in $$props) $$invalidate(8, responseModalToggle = $$props.responseModalToggle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$missions*/ 32768) {
    			/*$: startedMissions = $missions.filter((m) => m.started && !m.completed);
    $: availableMissions = $missions.filter((m) => !m.started);
    $: completedMissions = $missions.filter((m) => m.completed); */
    			 if ($missions) {
    				$$invalidate(0, startedMissions = $missions.filter(m => m.started && !m.completed));
    				$$invalidate(1, availableMissions = $missions.filter(m => !m.started));
    			}
    		}
    	};

    	return [
    		startedMissions,
    		availableMissions,
    		winModal,
    		winText,
    		winCharacter,
    		message,
    		modalToggle,
    		character,
    		responseModalToggle,
    		startThemission,
    		fullowUpMission,
    		closeResponseModal,
    		justCloseResponseModal,
    		closeModal,
    		spin,
    		$missions,
    		click_handler,
    		click_handler_1
    	];
    }

    class GamePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePage",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file$9 = "src\\App.svelte";

    // (11:2) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let ui;
    	let t;
    	let gamepage;
    	let current;
    	ui = new Ui({ $$inline: true });
    	gamepage = new GamePage({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(ui.$$.fragment);
    			t = space();
    			create_component(gamepage.$$.fragment);
    			attr_dev(div, "class", "ui has-text-white svelte-nlzo0z");
    			add_location(div, file$9, 11, 4, 281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(ui, div, null);
    			insert_dev(target, t, anchor);
    			mount_component(gamepage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ui.$$.fragment, local);
    			transition_in(gamepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ui.$$.fragment, local);
    			transition_out(gamepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(ui);
    			if (detaching) detach_dev(t);
    			destroy_component(gamepage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(11:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:2) {#if !$playClicked}
    function create_if_block$5(ctx) {
    	let startpage;
    	let current;
    	startpage = new StartPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(startpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(startpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(startpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(startpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(startpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(9:2) {#if !$playClicked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$playClicked*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "main-bg");
    			add_location(div, file$9, 7, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $playClicked;
    	validate_store(playClicked, 'playClicked');
    	component_subscribe($$self, playClicked, $$value => $$invalidate(0, $playClicked = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		StartPage,
    		playClicked,
    		Ui,
    		GamePage,
    		$playClicked
    	});

    	return [$playClicked];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
