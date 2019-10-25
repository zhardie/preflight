
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }

    function append(target, node) {
        target.appendChild(node);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_render.push(fn);
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
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
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            if (detaching)
                component.$$.fragment.d(1);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                }
            };
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        const invalidators = [];
        const store = readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                run_all(invalidators);
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
        return {
            subscribe(run, invalidate = noop) {
                invalidators.push(invalidate);
                const unsubscribe = store.subscribe(run, invalidate);
                return () => {
                    const index = invalidators.indexOf(invalidate);
                    if (index !== -1) {
                        invalidators.splice(index, 1);
                    }
                    unsubscribe();
                };
            }
        };
    }

    function regexparam (str, loose) {
    	var c, o, tmp, ext, keys=[], pattern='', arr=str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.5.4 */

    function create_fragment(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		return {
    			props: { params: ctx.componentParams },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = {};
    			if (changed.componentParams) switch_instance_changes.params = ctx.componentParams;

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, () => {
    						destroy_component(old_component);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    const hashPosition = window.location.href.indexOf('#/');
    let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/';

    // Check if there's a querystring
    const qsPosition = location.indexOf('?');
    let querystring = '';
    if (qsPosition > -1) {
        querystring = location.substr(qsPosition + 1);
        location = location.substr(0, qsPosition);
    }

    return {location, querystring}
    }

    /**
     * Readable store that returns the current full location (incl. querystring)
     */
    const loc = readable(
    getLocation(),
    // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
        const update = () => {
            set(getLocation());
        };
        window.addEventListener('hashchange', update, false);

        return function stop() {
            window.removeEventListener('hashchange', update, false);
        }
    }
    );

    /**
     * Readable store that returns the current location
     */
    const location = derived(
    loc,
    ($loc) => $loc.location
    );

    /**
     * Readable store that returns the current querystring
     */
    const querystring = derived(
    loc,
    ($loc) => $loc.querystring
    );

    function instance($$self, $$props, $$invalidate) {
    	let $loc;

    	validate_store(loc, 'loc');
    	subscribe($$self, loc, $$value => { $loc = $$value; $$invalidate('$loc', $loc); });

    	/**
     * Dictionary of all routes, in the format `'/path': component`.
     *
     * For example:
     * ````js
     * import HomeRoute from './routes/HomeRoute.svelte'
     * import BooksRoute from './routes/BooksRoute.svelte'
     * import NotFoundRoute from './routes/NotFoundRoute.svelte'
     * routes = {
     *     '/': HomeRoute,
     *     '/books': BooksRoute,
     *     '*': NotFoundRoute
     * }
     * ````
     */
    let { routes = {} } = $$props;

    /**
     * Container for a route: path, component
     */
    class RouteItem {
        /**
         * Initializes the object and creates a regular expression from the path, using regexparam.
         *
         * @param {string} path - Path to the route (must start with '/' or '*')
         * @param {SvelteComponent} component - Svelte component for the route
         */
        constructor(path, component) {
            // Path must start with '/' or '*'
            if (!path || path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*')) {
                throw Error('Invalid value for "path" argument')
            }

            const {pattern, keys} = regexparam(path);

            this.path = path;
            this.component = component;

            this._pattern = pattern;
            this._keys = keys;
        }

        /**
         * Checks if `path` matches the current route.
         * If there's a match, will return the list of parameters from the URL (if any).
         * In case of no match, the method will return `null`.
         *
         * @param {string} path - Path to test
         * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
         */
        match(path) {
            const matches = this._pattern.exec(path);
            if (matches === null) {
                return null
            }

            const out = {};
            let i = 0;
            while (i < this._keys.length) {
                out[this._keys[i]] = matches[++i] || null;
            }
            return out
        }
    }

    // Set up all routes
    const routesList = Object.keys(routes).map((path) => {
        return new RouteItem(path, routes[path])
    });

    // Props for the component to render
    let component = null;
    let componentParams = {};

    	const writable_props = ['routes'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('routes' in $$props) $$invalidate('routes', routes = $$props.routes);
    	};

    	$$self.$$.update = ($$dirty = { component: 1, $loc: 1 }) => {
    		if ($$dirty.component || $$dirty.$loc) { {
                // Find a route matching the location
                $$invalidate('component', component = null);
                let i = 0;
                while (!component && i < routesList.length) {
                    const match = routesList[i].match($loc.location);
                    if (match) {
                        $$invalidate('component', component = routesList[i].component);
                        $$invalidate('componentParams', componentParams = match);
                    }
                    i++;
                }
            } }
    	};

    	return { routes, component, componentParams };
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["routes"]);
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Config
    const apiHost = readable('https://preflight-zhardie.appspot.com');
    const apiHeaders = readable({
        'Content-Type': 'application/json'
    });
    // End Config

    const credentials = writable(false);
    const username = writable('');

    /* src/pages/Login.svelte generated by Svelte v3.5.4 */

    const file = "src/pages/Login.svelte";

    function create_fragment$1(ctx) {
    	var h2, t1, div4, form, div1, div0, input0, t2, label0, t4, div3, div2, input1, t5, label1, t7, button, dispose;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "preflight";
    			t1 = space();
    			div4 = element("div");
    			form = element("form");
    			div1 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "Username";
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t7 = space();
    			button = element("button");
    			button.textContent = "sign in";
    			add_location(h2, file, 31, 0, 661);
    			attr(input0, "id", "username");
    			attr(input0, "type", "text");
    			attr(input0, "class", "validate");
    			add_location(input0, file, 36, 8, 826);
    			attr(label0, "for", "username");
    			add_location(label0, file, 37, 8, 908);
    			attr(div0, "class", "input-field col s12");
    			add_location(div0, file, 35, 6, 784);
    			attr(div1, "class", "row");
    			add_location(div1, file, 34, 4, 760);
    			attr(input1, "id", "password");
    			attr(input1, "type", "password");
    			attr(input1, "class", "validate");
    			add_location(input1, file, 42, 8, 1041);
    			attr(label1, "for", "password");
    			add_location(label1, file, 43, 8, 1126);
    			attr(div2, "class", "input-field col s12");
    			add_location(div2, file, 41, 6, 999);
    			attr(div3, "class", "row");
    			add_location(div3, file, 40, 4, 975);
    			attr(button, "class", "btn waves-effect waves-light");
    			attr(button, "type", "submit");
    			attr(button, "name", "action");
    			add_location(button, file, 46, 4, 1193);
    			attr(form, "class", "col s12");
    			add_location(form, file, 33, 2, 700);
    			attr(div4, "class", "row");
    			add_location(div4, file, 32, 0, 680);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(form, "submit", prevent_default(ctx.login))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div4, anchor);
    			append(div4, form);
    			append(form, div1);
    			append(div1, div0);
    			append(div0, input0);

    			input0.value = ctx.$username;

    			append(div0, t2);
    			append(div0, label0);
    			append(form, t4);
    			append(form, div3);
    			append(div3, div2);
    			append(div2, input1);

    			input1.value = ctx.password;

    			append(div2, t5);
    			append(div2, label1);
    			append(form, t7);
    			append(form, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$username && (input0.value !== ctx.$username)) input0.value = ctx.$username;
    			if (changed.password) input1.value = ctx.password;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    				detach(t1);
    				detach(div4);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $apiHost, $username, $apiHeaders;

    	validate_store(apiHost, 'apiHost');
    	subscribe($$self, apiHost, $$value => { $apiHost = $$value; $$invalidate('$apiHost', $apiHost); });
    	validate_store(username, 'username');
    	subscribe($$self, username, $$value => { $username = $$value; $$invalidate('$username', $username); });
    	validate_store(apiHeaders, 'apiHeaders');
    	subscribe($$self, apiHeaders, $$value => { $apiHeaders = $$value; $$invalidate('$apiHeaders', $apiHeaders); });

    	let password = '';

      async function login() {
        let url = $apiHost + '/login';
        let body = {
          'username': $username,
          'password': password
        };
        const res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          credentials: "include",
          redirect: 'follow',
          headers: $apiHeaders,
          body: JSON.stringify(body)
        });

        const text = await res.text();

        if (res.ok) {
          credentials.update( n => true);
          username.update( n => $username);
        } else {
          M.toast({html: "Error signing in"});
        }
      }

    	function input0_input_handler() {
    		username.set(this.value);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	return {
    		password,
    		login,
    		$username,
    		input0_input_handler,
    		input1_input_handler
    	};
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src/components/NewReservation.svelte generated by Svelte v3.5.4 */

    const file$1 = "src/components/NewReservation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.instructor = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.plane = list[i];
    	return child_ctx;
    }

    // (85:10) {#each planes as plane}
    function create_each_block_1(ctx) {
    	var option, t_value = ctx.plane.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.plane.id;
    			option.value = option.__value;
    			add_location(option, file$1, 85, 12, 2640);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.planes) && t_value !== (t_value = ctx.plane.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.planes) && option_value_value !== (option_value_value = ctx.plane.id)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (95:10) {#each instructors as instructor}
    function create_each_block(ctx) {
    	var option, t_value = ctx.instructor.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.instructor.id;
    			option.value = option.__value;
    			add_location(option, file$1, 95, 12, 2943);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.instructors) && t_value !== (t_value = ctx.instructor.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.instructors) && option_value_value !== (option_value_value = ctx.instructor.id)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div12, form, div1, div0, input0, t0, label0, t2, div3, div2, select0, t3, label1, t5, div5, div4, select1, t6, label2, t8, div8, div6, input1, t9, label3, t11, div7, input2, t12, label4, t14, div11, div9, input3, t15, label5, t17, div10, input4, t18, label6, t20, button, dispose;

    	var each_value_1 = ctx.planes;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.instructors;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div12 = element("div");
    			form = element("form");
    			div1 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label0 = element("label");
    			label0.textContent = "Member";
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			select0 = element("select");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Aircraft";
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			select1 = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			label2 = element("label");
    			label2.textContent = "Instructor";
    			t8 = space();
    			div8 = element("div");
    			div6 = element("div");
    			input1 = element("input");
    			t9 = space();
    			label3 = element("label");
    			label3.textContent = "Begin date";
    			t11 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t12 = space();
    			label4 = element("label");
    			label4.textContent = "Begin time";
    			t14 = space();
    			div11 = element("div");
    			div9 = element("div");
    			input3 = element("input");
    			t15 = space();
    			label5 = element("label");
    			label5.textContent = "End date";
    			t17 = space();
    			div10 = element("div");
    			input4 = element("input");
    			t18 = space();
    			label6 = element("label");
    			label6.textContent = "End time";
    			t20 = space();
    			button = element("button");
    			button.textContent = "Schedule";
    			input0.disabled = true;
    			input0.value = ctx.$username;
    			attr(input0, "id", "username");
    			attr(input0, "type", "text");
    			attr(input0, "class", "validate");
    			add_location(input0, file$1, 77, 8, 2319);
    			attr(label0, "class", "active");
    			attr(label0, "for", "username");
    			add_location(label0, file$1, 78, 8, 2405);
    			attr(div0, "class", "input-field col s6");
    			add_location(div0, file$1, 76, 6, 2278);
    			attr(div1, "class", "row");
    			add_location(div1, file$1, 75, 4, 2254);
    			select0.multiple = true;
    			attr(select0, "id", "planes");
    			add_location(select0, file$1, 83, 8, 2564);
    			add_location(label1, file$1, 88, 8, 2731);
    			attr(div2, "class", "input-field col s6");
    			add_location(div2, file$1, 82, 6, 2523);
    			attr(div3, "class", "row");
    			add_location(div3, file$1, 81, 4, 2499);
    			attr(select1, "id", "instructor");
    			add_location(select1, file$1, 93, 8, 2862);
    			add_location(label2, file$1, 98, 8, 3044);
    			attr(div4, "class", "input-field col s6");
    			add_location(div4, file$1, 92, 6, 2821);
    			attr(div5, "class", "row");
    			add_location(div5, file$1, 91, 4, 2797);
    			attr(input1, "id", "begin_date");
    			attr(input1, "type", "text");
    			attr(input1, "class", "datepicker");
    			add_location(input1, file$1, 103, 8, 3177);
    			attr(label3, "class", "active");
    			attr(label3, "for", "begin_date");
    			add_location(label3, file$1, 104, 8, 3240);
    			attr(div6, "class", "input-field col s6");
    			add_location(div6, file$1, 102, 6, 3136);
    			attr(input2, "id", "begin_time");
    			attr(input2, "type", "text");
    			attr(input2, "class", "timepicker");
    			add_location(input2, file$1, 107, 8, 3358);
    			attr(label4, "class", "active");
    			attr(label4, "for", "begin_time");
    			add_location(label4, file$1, 108, 8, 3421);
    			attr(div7, "class", "input-field col s6");
    			add_location(div7, file$1, 106, 6, 3317);
    			attr(div8, "class", "row");
    			add_location(div8, file$1, 101, 4, 3112);
    			attr(input3, "id", "end_date");
    			attr(input3, "type", "text");
    			attr(input3, "class", "datepicker");
    			add_location(input3, file$1, 113, 8, 3586);
    			attr(label5, "class", "active");
    			attr(label5, "for", "end_date");
    			add_location(label5, file$1, 114, 8, 3647);
    			attr(div9, "class", "input-field col s6");
    			add_location(div9, file$1, 112, 6, 3545);
    			attr(input4, "id", "end_time");
    			attr(input4, "type", "text");
    			attr(input4, "class", "timepicker");
    			add_location(input4, file$1, 117, 8, 3761);
    			attr(label6, "class", "active");
    			attr(label6, "for", "end_time");
    			add_location(label6, file$1, 118, 8, 3822);
    			attr(div10, "class", "input-field col s6");
    			add_location(div10, file$1, 116, 6, 3720);
    			attr(div11, "class", "row");
    			add_location(div11, file$1, 111, 4, 3521);
    			attr(button, "class", "btn waves-effect waves-light");
    			attr(button, "type", "submit");
    			attr(button, "name", "action");
    			add_location(button, file$1, 121, 4, 3918);
    			attr(form, "class", "col s12");
    			add_location(form, file$1, 74, 2, 2179);
    			attr(div12, "class", "row");
    			add_location(div12, file$1, 73, 0, 2159);
    			dispose = listen(form, "submit", prevent_default(ctx.submitNewReservation));
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div12, anchor);
    			append(div12, form);
    			append(form, div1);
    			append(div1, div0);
    			append(div0, input0);
    			append(div0, t0);
    			append(div0, label0);
    			append(form, t2);
    			append(form, div3);
    			append(div3, div2);
    			append(div2, select0);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			append(div2, t3);
    			append(div2, label1);
    			append(form, t5);
    			append(form, div5);
    			append(div5, div4);
    			append(div4, select1);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			append(div4, t6);
    			append(div4, label2);
    			append(form, t8);
    			append(form, div8);
    			append(div8, div6);
    			append(div6, input1);
    			append(div6, t9);
    			append(div6, label3);
    			append(div8, t11);
    			append(div8, div7);
    			append(div7, input2);
    			append(div7, t12);
    			append(div7, label4);
    			append(form, t14);
    			append(form, div11);
    			append(div11, div9);
    			append(div9, input3);
    			append(div9, t15);
    			append(div9, label5);
    			append(div11, t17);
    			append(div11, div10);
    			append(div10, input4);
    			append(div10, t18);
    			append(div10, label6);
    			append(form, t20);
    			append(form, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$username) {
    				input0.value = ctx.$username;
    			}

    			if (changed.planes) {
    				each_value_1 = ctx.planes;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.instructors) {
    				each_value = ctx.instructors;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div12);
    			}

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    function getTwentyFourHourTime(amPmString) { 
      var d = new Date("1/1/2013 " + amPmString); 
      return d.getHours() + ':' + d.getMinutes(); 
    }

    function constructTimestamp(date, time) {
      var timestamp = new Date(date + ' ' + getTwentyFourHourTime(time)).getTime();
      return timestamp;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $apiHost, $apiHeaders, $username;

    	validate_store(apiHost, 'apiHost');
    	subscribe($$self, apiHost, $$value => { $apiHost = $$value; $$invalidate('$apiHost', $apiHost); });
    	validate_store(apiHeaders, 'apiHeaders');
    	subscribe($$self, apiHeaders, $$value => { $apiHeaders = $$value; $$invalidate('$apiHeaders', $apiHeaders); });
    	validate_store(username, 'username');
    	subscribe($$self, username, $$value => { $username = $$value; $$invalidate('$username', $username); });

    	
      let { instructors, planes } = $$props;

      onMount(() => {
        // init date pickers
        var elems = document.querySelectorAll('.datepicker');
        var options = {
          'autoClose': true
        };
        var instances = M.Datepicker.init(elems, options);

        // init time pickers
        elems = document.querySelectorAll('.timepicker');
        options = {
          'autoClose': true
        };
        instances = M.Timepicker.init(elems, options);
      });

      afterUpdate(() => {
        // init selects
        var elems = document.querySelectorAll('select');
        var options = {};
        var instances = M.FormSelect.init(elems, options);
      });

      async function submitNewReservation() {
        let url = $apiHost + '/schedule_new_reservation';
        const planes_selected = document.querySelectorAll('#planes option:checked');
        const planes_values = Array.from(planes_selected).map(el => el.value);
        let begin_ts = constructTimestamp(document.getElementById('begin_date').value, document.getElementById('begin_time').value);
        let end_ts = constructTimestamp(document.getElementById('end_date').value, document.getElementById('end_time').value);
        let data = {
            'username': document.getElementById('username').value,
            'instructor': document.getElementById('instructor').value,
            'desired_planes': planes_values,
            'begin_ts': begin_ts/1000,
            'end_ts': end_ts/1000
        };

        console.log(data);

        const res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          credentials: "include",
          redirect: 'follow',
          headers: $apiHeaders,
          body: JSON.stringify(data)
        });

        if (res.ok) {
          M.toast({html: "Success!"});
        } else {
          M.toast({html: "Error signing in"});
        }
      }

    	const writable_props = ['instructors', 'planes'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<NewReservation> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('instructors' in $$props) $$invalidate('instructors', instructors = $$props.instructors);
    		if ('planes' in $$props) $$invalidate('planes', planes = $$props.planes);
    	};

    	return {
    		instructors,
    		planes,
    		submitNewReservation,
    		$username
    	};
    }

    class NewReservation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["instructors", "planes"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.instructors === undefined && !('instructors' in props)) {
    			console.warn("<NewReservation> was created without expected prop 'instructors'");
    		}
    		if (ctx.planes === undefined && !('planes' in props)) {
    			console.warn("<NewReservation> was created without expected prop 'planes'");
    		}
    	}

    	get instructors() {
    		throw new Error("<NewReservation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set instructors(value) {
    		throw new Error("<NewReservation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get planes() {
    		throw new Error("<NewReservation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set planes(value) {
    		throw new Error("<NewReservation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Configure.svelte generated by Svelte v3.5.4 */

    const file$2 = "src/pages/Configure.svelte";

    function create_fragment$3(ctx) {
    	var h2, t_1, current;

    	var newreservation = new NewReservation({
    		props: {
    		instructors: ctx.instructors,
    		planes: ctx.planes
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Configure";
    			t_1 = space();
    			newreservation.$$.fragment.c();
    			add_location(h2, file$2, 30, 0, 734);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t_1, anchor);
    			mount_component(newreservation, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var newreservation_changes = {};
    			if (changed.instructors) newreservation_changes.instructors = ctx.instructors;
    			if (changed.planes) newreservation_changes.planes = ctx.planes;
    			newreservation.$set(newreservation_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(newreservation.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(newreservation.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    				detach(t_1);
    			}

    			destroy_component(newreservation, detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $apiHost;

    	validate_store(apiHost, 'apiHost');
    	subscribe($$self, apiHost, $$value => { $apiHost = $$value; $$invalidate('$apiHost', $apiHost); });

    	

      let planes = [];
      let instructors = [];
      let scheduled_reservations = [];

      onMount(
        async () => {
          let url = $apiHost + '/everything';
          const res = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            credentials: 'include'
          });
          const resp = await res.text();
          const r_resp = JSON.parse(resp);
          console.log(r_resp);
          $$invalidate('planes', planes = r_resp.planes);
          $$invalidate('instructors', instructors = r_resp.instructors);
          scheduled_reservations = r_resp.scheduled_reservations;
        }
      );

    	return { planes, instructors };
    }

    class Configure extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/pages/Notfound.svelte generated by Svelte v3.5.4 */

    const file$3 = "src/pages/Notfound.svelte";

    function create_fragment$4(ctx) {
    	var h1;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "404 :'(";
    			add_location(h1, file$3, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    			}
    		}
    	};
    }

    class Notfound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.5.4 */

    // (17:0) {:else}
    function create_else_block(ctx) {
    	var current;

    	var router = new Router({
    		props: { routes: ctx.routes },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			router.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var router_changes = {};
    			if (changed.routes) router_changes.routes = ctx.routes;
    			router.$set(router_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    }

    // (15:0) {#if $credentials == false}
    function create_if_block(ctx) {
    	var current;

    	var login = new Login({ $$inline: true });

    	return {
    		c: function create() {
    			login.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.$credentials == false) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $credentials;

    	validate_store(credentials, 'credentials');
    	subscribe($$self, credentials, $$value => { $credentials = $$value; $$invalidate('$credentials', $credentials); });

    	

      const routes = {
        '/': Configure,
        '*': Notfound
      };

    	return { routes, $credentials };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
