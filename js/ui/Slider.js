goog.provide("mix.ui.Slider");

goog.require("mix.domlib");
goog.require("mix.lib.TemplateManager");

/**
 * Given a DOM node, this function sets that node up to be a
 * DOM slider that can be dragged on or off. Note that this only works
 * on DOM nodes that are template-bound.
 * @param {Node} dom the root DOM node that we will be listening to. it may
 *          contain one or more elements that will be slide-able
 * @param {function(boolean, Object)} switchedCallback this function will be
 *          called with either true if switch is moved right, false if moved
 *          left. The second parameter is the data that is associated with
 *          the template that was just switched.
 * @param {function(boolean, Object)=} endedCallback this function will be
 *          called with two arguments: 1) A boolean indicating whether the
 *          user changed the state of the slider (true) or if they did not
 *          fully slide a specific slider (false), and 2) the template data
 *          associated with whatever slider was being manipulated. It is
 *          called at the end of user-interaction (mouse/touch up), whether
 *          or not the user made a change. If not given, nothing will be
 *          called.
 * @param {?number=} xLim the limit you have to pull before activatin
 *          (default: 10)
 * @param {?number=} yLim the limit you you can move in the y-directon
 *          before cancelling the switch (default: 10)
 */
mix.ui.Slider = function(dom, switchedCallback, endedCallback, xLim, yLim) {
    if (xLim === null || xLim === undefined) {
        xLim = 10;
    }
    if (yLim === null || yLim === undefined) {
        yLim = 10;
    }
    var isDragDone = function(data, x, y) {
        if (Math.abs(data.drag.y - y) > yLim) {
            return true;
        }
        var deltaX = x - data.drag.x;
        if (deltaX > xLim) {
            switchedCallback(true, data);
            return true;
        } else if (deltaX < -xLim) {
            switchedCallback(false, data);
            return true;
        }

        return false;
    };

    var dragStarted = function(data, x, y) {
        data.drag = {x: x, y: y};
    };

    var dragEnded = function(data, x, y) {
        if (!data.drag) {return;}

        var didChange = isDragDone(data, x, y);
        data.drag = null;
        if (endedCallback) {endedCallback(didChange, data);}
    };

    var dragMoved = function(data, x, y) {
        if (!data.drag) {return;}

        var done = isDragDone(data, x, y);
        if (done) {
            data.drag = null;
        }
    };

    var makeListener = function(eventName, callback, isTouch) {
        dom.addEventListener(eventName, function(e) {
            var dom = mix.domlib.scanUp(
                e.target, mix.lib.TemplateManager.isTemplate, 10);
                var data = mix.lib.TemplateManager.getData(dom);

                var x = e.clientX;
                var y = e.clientY;
                if (isTouch && e.targetTouches[0]) {
                    x = e.targetTouches[0].pageX;
                    y = e.targetTouches[0].pageY;
                } else if (isTouch && data.drag) {
                    x = data.drag.x;
                    y = data.drag.y;
                }
                if (data) {callback(data, x, y);}
        }, false);
    };

    var fd = mix.domlib.featureDetection();
    if (!fd.touch) {
        makeListener("mousedown", dragStarted, false);
        makeListener("mousemove", dragMoved, false);
        makeListener("mouseup", dragEnded, false);
    } else {
        makeListener("touchstart", dragStarted, true);
        makeListener("touchmove", dragMoved, true);
        makeListener("touchend", dragEnded, true);
        makeListener("touchcancel", dragEnded, true);
    }
};
