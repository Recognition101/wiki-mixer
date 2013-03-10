goog.provide("mix.lib.TemplateManager");

goog.require("mix.domlib");
goog.require("mix.objlib");

/**
 * This object supports extremely basic DOM templates.
 * It can pull DOM nodes out and collect them in a map,
 * and dynamically update their content to match an object.
 * @constructor
 * @class
 */
mix.lib.TemplateManager = function() {
    this.templates = {};
};

/**
 * Pulls a node out of the dom and uses it as a template with
 * a given ID. That ID can then be used in generateDom.
 * @param {string} id a Template ID to use for future referencing this template
 * @param {Node} dom the dom node to remove from the DOM and make into a template
 */
mix.lib.TemplateManager.prototype.addTemplate = function(id, dom) {
    var fragmentMap = {};
    var frags = dom.querySelectorAll("*[data-frag]");
    var fragNm = "";
    for(var i=0; i < frags.length; i+=1) {
        fragNm = frags[i].getAttribute("data-frag");
        if (fragNm !== "") {
            fragmentMap[fragNm] = frags[i];
            mix.domlib.remove(frags[i]);
        }
    }

    var loops = dom.querySelectorAll("*[data-loop]");
    for(i=0; i < loops.length; i+=1) {
        loops[i].innerHTML = "";
    }

    dom.removeAttribute("id");
    this.templates[id] = {
        dom: dom,
        frags: fragmentMap
    };

    mix.domlib.remove(dom);
    dom.tmp__isTemplate = true;
    dom.tmp__data = {};
};

/**
 * Creates a new DOM Nodes based on a template and some data.
 * @param {string} id a Template ID to create a new DOM node from
 * @param {Object} data the data to fill the template with
 * @return {Node} the generated DOM node
 */
mix.lib.TemplateManager.prototype.generateDom = function(id, data) {
    if (!(id in this.templates)) {
        return null;
    }

    var domRet = this.templates[id].dom.cloneNode(true);
    this.populateTemplate(id, domRet, data);
    return domRet;
};

/**
 * Given a DOM Node with template data attributes, this function updates
 * the DOM node with a new data object. Note that undefined data keys
 * will retain their old value.
 * @param {string} id the Template ID
 * @param {Node} dom the DOM Node to fill with data
 * @param {Object} data the data to fill the DOM with
 */
mix.lib.TemplateManager.prototype.populateTemplate = function(id, dom, data) {
    this.populateTemplateRec(id, dom, data, false, 0);
};

/**
 * Given a DOM Node, this function lets you know if that node is a
 * template or template fragment (and thus has associated data).
 * @param {Node} dom the dom node to test
 * @return {boolean} true if this node is a template or fragment
 */
mix.lib.TemplateManager.isTemplate = function(dom) {
    return dom && dom.tmp__isTemplate;
};

/**
 * Gets the data associated with this template or template fragment.
 * Returns null if this dom node is not a template or template fragment.
 * @param {Node} dom the dom node to fetch data for
 * @return {?Object} the data associated, or null if no data is associated
 */
mix.lib.TemplateManager.getData = function(dom) {
    if (dom && dom.tmp__isTemplate) {
        return dom.tmp__data;
    }
    return null;
};

/**
 * The actual implementation of the above method.
 * @private
 * @param {string} id the Template ID
 * @param {Node} dom the DOM Node to fill with data
 * @param {Object} data the data to fill the DOM with
 * @param {boolean} initialFrag true if this is the initial population of a data fragment (not a template)
 * @param {number} contextLevel maintains how far into recursion we are
 */
mix.lib.TemplateManager.prototype.populateTemplateRec = function(id, dom, data, initialFrag, contextLevel) {
    var query = initialFrag ? "*[data-html]" :
                contextLevel === 0 ? "*[data-html]:not([data-ctx])" :
                "*[data-html][data-ctx=\""+contextLevel+"\"]";
    var fill = dom.querySelectorAll(query);
    var keys = null, attrs = null, prevElems=null, context = null;
    var newHtml = "", i=0, j=0;
    dom.tmp__data = data;
    dom.tmp__isTemplate = true;

    for(i=0; i < fill.length; i+=1) {
        keys = fill[i].getAttribute("data-html");
        newHtml = undefined;
        if (keys === ".") {
            newHtml = data;
        } else {
            keys = keys ? keys.split(".") : [];
            newHtml = mix.objlib.lookup(data, keys);
        }
        if (newHtml !== undefined && (""+newHtml) !== fill[i].innerHTML) {
            fill[i].innerHTML = newHtml;
            if (contextLevel > 0 && initialFrag) {
                fill[i].setAttribute("data-ctx", contextLevel);
            }
        }
    }

    var replaceAttrs = function(domAttrs) {
        attrs = domAttrs.getAttribute("data-attr");
        attrs = attrs.split(";");

        for(j=0; j < attrs.length; j+=1) {
            keys = attrs[j].split(":");
            if (keys[0] && keys[1]) {
                keys[0] = mix.objlib.trim(keys[0]);
                keys[1] = mix.objlib.trim(keys[1]);
                var dat = "";
                if (keys[1] === ".") {
                    dat = data;
                } else {
                    keys[1] = keys[1] ? keys[1].split(".") : [];
                    dat = mix.objlib.lookup(data, keys[1]);
                }
                if (dat !== undefined && domAttrs.getAttribute(keys[0]) !== (""+dat)) {
                    domAttrs.setAttribute(keys[0], dat);
                }
            }
        }

        if (contextLevel > 0 && initialFrag) {
            domAttrs.setAttribute("data-ctx", contextLevel);
        }
    };

    query = initialFrag ? "*[data-attr]" :
            contextLevel === 0 ? "*[data-attr]:not([data-ctx])" :
            "*[data-attr][data-ctx=\""+contextLevel+"\"]";
    fill = dom.querySelectorAll("*[data-attr]");
    if (dom.getAttribute("data-attr")) {
        replaceAttrs(dom);
    }
    for(i=0; i < fill.length; i+=1) {
        replaceAttrs(fill[i]);
    }

    var newDom = null;
    fill = dom.querySelectorAll("*[data-loop]");
    for(i=0; i < fill.length; i+=1) {
        attrs = fill[i].getAttribute("data-loop").split(" in ");
        if (attrs[0] && attrs[1]) {
            attrs[0] = mix.objlib.trim(attrs[0]);
            attrs[1] = mix.objlib.trim(attrs[1]);
            context = mix.objlib.lookup(data, attrs[0].split("."));
            if (context && context.length) {
                prevElems = fill[i].querySelectorAll("*[data-frag="+attrs[1]+"]");
                for(j=0; j < context.length; j+=1) {
                    if (j < prevElems.length) {
                        this.populateTemplateRec(id, prevElems[j], context[j], false, contextLevel + 1);
                    } else {
                        newDom = this.templates[id].frags[attrs[1]].cloneNode(true);
                        fill[i].appendChild(newDom);
                        this.populateTemplateRec(id, newDom, context[j], true, contextLevel + 1);
                    }
                }
                for(j=context.length; j < prevElems.length; j+=1) {
                    mix.domlib.remove(prevElems[j]);
                }
            }
        }
    }
};
