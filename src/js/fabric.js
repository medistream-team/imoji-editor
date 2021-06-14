/*! Fabric.js Copyright 2008-2015, Printio (Juriy Zaytsev, Maxim Chernyak) */
// Gestures, Interaction, Serialization, fabric.Image, Remove SVG import

var fabric = fabric || { version: '4.4.0' };
if (typeof exports !== 'undefined') {
  exports.fabric = fabric;
} else if (typeof define === 'function' && define.amd) {
  /* _AMD_START_ */
  define([], function() {
    return fabric;
  });
}
/* _AMD_END_ */
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (
    document instanceof
    (typeof HTMLDocument !== 'undefined' ? HTMLDocument : Document)
  ) {
    fabric.document = document;
  } else {
    fabric.document = document.implementation.createHTMLDocument('');
  }
  fabric.window = window;
} else {
  // assume we're running under node.js when document/window are not present
  var jsdom = require('jsdom');
  var virtualWindow = new jsdom.JSDOM(
    decodeURIComponent(
      '%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3C%2Fhead%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E'
    ),
    {
      features: {
        FetchExternalResources: ['img']
      },
      resources: 'usable'
    }
  ).window;
  fabric.document = virtualWindow.document;
  fabric.jsdomImplForWrapper = require('jsdom/lib/jsdom/living/generated/utils').implForWrapper;
  fabric.nodeCanvas = require('jsdom/lib/jsdom/utils').Canvas;
  fabric.window = virtualWindow;
  DOMParser = fabric.window.DOMParser;
}

/**
 * True when in environment that supports touch events
 * @type boolean
 */
fabric.isTouchSupported =
  'ontouchstart' in fabric.window ||
  'ontouchstart' in fabric.document ||
  (fabric.window &&
    fabric.window.navigator &&
    fabric.window.navigator.maxTouchPoints > 0);

/**
 * True when in environment that's probably Node.js
 * @type boolean
 */
fabric.isLikelyNode =
  typeof Buffer !== 'undefined' && typeof window === 'undefined';

/**
 * Pixel per Inch as a default value set to 96. Can be changed for more realistic conversion.
 */
fabric.DPI = 96;
fabric.reNum = '(?:[-+]?(?:\\d+|\\d*\\.\\d+)(?:[eE][-+]?\\d+)?)';
fabric.commaWsp = '(?:\\s+,?\\s*|,\\s*)';
fabric.rePathCommand = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:[eE][-+]?\d+)?)/gi;
fabric.reNonWord = /[ \n\.,;!\?\-]/;
fabric.fontPaths = {};
fabric.iMatrix = [1, 0, 0, 1, 0, 0];
fabric.svgNS = 'http://www.w3.org/2000/svg';

/**
 * Pixel limit for cache canvases. 1Mpx , 4Mpx should be fine.
 * @since 1.7.14
 * @type Number
 * @default
 */
fabric.perfLimitSizeTotal = 2097152;

/**
 * Pixel limit for cache canvases width or height. IE fixes the maximum at 5000
 * @since 1.7.14
 * @type Number
 * @default
 */
fabric.maxCacheSideLimit = 4096;

/**
 * Lowest pixel limit for cache canvases, set at 256PX
 * @since 1.7.14
 * @type Number
 * @default
 */
fabric.minCacheSideLimit = 256;

/**
 * Cache Object for widths of chars in text rendering.
 */
fabric.charWidthsCache = {};

/**
 * if webgl is enabled and available, textureSize will determine the size
 * of the canvas backend
 * @since 2.0.0
 * @type Number
 * @default
 */
fabric.textureSize = 2048;

/**
 * When 'true', style information is not retained when copy/pasting text, making
 * pasted text use destination style.
 * Defaults to 'false'.
 * @type Boolean
 * @default
 */
fabric.disableStyleCopyPaste = false;

/**
 * Enable webgl for filtering picture is available
 * A filtering backend will be initialized, this will both take memory and
 * time since a default 2048x2048 canvas will be created for the gl context
 * @since 2.0.0
 * @type Boolean
 * @default
 */
fabric.enableGLFiltering = true;

/**
 * Device Pixel Ratio
 * @see https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/HTML-canvas-guide/SettingUptheCanvas/SettingUptheCanvas.html
 */
fabric.devicePixelRatio =
  fabric.window.devicePixelRatio ||
  fabric.window.webkitDevicePixelRatio ||
  fabric.window.mozDevicePixelRatio ||
  1;
/**
 * Browser-specific constant to adjust CanvasRenderingContext2D.shadowBlur value,
 * which is unitless and not rendered equally across browsers.
 *
 * Values that work quite well (as of October 2017) are:
 * - Chrome: 1.5
 * - Edge: 1.75
 * - Firefox: 0.9
 * - Safari: 0.95
 *
 * @since 2.0.0
 * @type Number
 * @default 1
 */
fabric.browserShadowBlurConstant = 1;

/**
 * This object contains the result of arc to bezier conversion for faster retrieving if the same arc needs to be converted again.
 * It was an internal variable, is accessible since version 2.3.4
 */
fabric.arcToSegmentsCache = {};

/**
 * This object keeps the results of the boundsOfCurve calculation mapped by the joined arguments necessary to calculate it.
 * It does speed up calculation, if you parse and add always the same paths, but in case of heavy usage of freedrawing
 * you do not get any speed benefit and you get a big object in memory.
 * The object was a private variable before, while now is appended to the lib so that you have access to it and you
 * can eventually clear it.
 * It was an internal variable, is accessible since version 2.3.4
 */
fabric.boundsOfCurveCache = {};

/**
 * If disabled boundsOfCurveCache is not used. For apps that make heavy usage of pencil drawing probably disabling it is better
 * @default true
 */
fabric.cachesBoundsOfCurve = true;

/**
 * Skip performance testing of setupGLContext and force the use of putImageData that seems to be the one that works best on
 * Chrome + old hardware. if your users are experiencing empty images after filtering you may try to force this to true
 * this has to be set before instantiating the filtering backend ( before filtering the first image )
 * @type Boolean
 * @default false
 */
fabric.forceGLPutImageData = false;

fabric.initFilterBackend = function() {
  if (
    fabric.enableGLFiltering &&
    fabric.isWebglSupported &&
    fabric.isWebglSupported(fabric.textureSize)
  ) {
    console.log('max texture size: ' + fabric.maxTextureSize);
    return new fabric.WebglFilterBackend({ tileSize: fabric.textureSize });
  } else if (fabric.Canvas2dFilterBackend) {
    return new fabric.Canvas2dFilterBackend();
  }
};
/*:
	----------------------------------------------------
	event.js : 1.1.5 : 2014/02/12 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, longpress, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake
	----------------------------------------------------
	Ideas for the future
	----------------------------------------------------
	* GamePad, and other input abstractions.
	* Event batching - i.e. for every x fingers down a new gesture is created.
	----------------------------------------------------
	http://www.w3.org/TR/2011/WD-touch-events-20110505/
	----------------------------------------------------
*/

if (typeof eventjs === 'undefined') var eventjs = {};

(function(root) {
  'use strict';

  // Add custom *EventListener commands to HTMLElements (set false to prevent funkiness).
  root.modifyEventListener = false;

  // Add bulk *EventListener commands on NodeLists from querySelectorAll and others  (set false to prevent funkiness).
  root.modifySelectors = false;

  root.configure = function(conf) {
    if (isFinite(conf.modifyEventListener))
      root.modifyEventListener = conf.modifyEventListener;
    if (isFinite(conf.modifySelectors))
      root.modifySelectors = conf.modifySelectors;
    /// Augment event listeners
    if (eventListenersAgumented === false && root.modifyEventListener) {
      augmentEventListeners();
    }
    if (selectorsAugmented === false && root.modifySelectors) {
      augmentSelectors();
    }
  };

  // Event maintenance.
  root.add = function(target, type, listener, configure) {
    return eventManager(target, type, listener, configure, 'add');
  };

  root.remove = function(target, type, listener, configure) {
    return eventManager(target, type, listener, configure, 'remove');
  };

  root.returnFalse = function(event) {
    return false;
  };

  root.stop = function(event) {
    if (!event) return;
    if (event.stopPropagation) event.stopPropagation();
    event.cancelBubble = true; // <= IE8
    event.cancelBubbleCount = 0;
  };

  root.prevent = function(event) {
    if (!event) return;
    if (event.preventDefault) {
      event.preventDefault();
    } else if (event.preventManipulation) {
      event.preventManipulation(); // MS
    } else {
      event.returnValue = false; // <= IE8
    }
  };

  root.cancel = function(event) {
    root.stop(event);
    root.prevent(event);
  };

  root.blur = function() {
    // Blurs the focused element. Useful when using eventjs.cancel as canceling will prevent focused elements from being blurred.
    var node = document.activeElement;
    if (!node) return;
    var nodeName = document.activeElement.nodeName;
    if (
      nodeName === 'INPUT' ||
      nodeName === 'TEXTAREA' ||
      node.contentEditable === 'true'
    ) {
      if (node.blur) node.blur();
    }
  };

  // Check whether event is natively supported (via @kangax)
  root.getEventSupport = function(target, type) {
    if (typeof target === 'string') {
      type = target;
      target = window;
    }
    type = 'on' + type;
    if (type in target) return true;
    if (!target.setAttribute) target = document.createElement('div');
    if (target.setAttribute && target.removeAttribute) {
      target.setAttribute(type, '');
      var isSupported = typeof target[type] === 'function';
      if (typeof target[type] !== 'undefined') target[type] = null;
      target.removeAttribute(type);
      return isSupported;
    }
  };

  var clone = function(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    var temp = new obj.constructor();
    for (var key in obj) {
      if (!obj[key] || typeof obj[key] !== 'object') {
        temp[key] = obj[key];
      } else {
        // clone sub-object
        temp[key] = clone(obj[key]);
      }
    }
    return temp;
  };

  /// Handle custom *EventListener commands.
  var eventManager = function(
    target,
    type,
    listener,
    configure,
    trigger,
    fromOverwrite
  ) {
    configure = configure || {};
    // Check whether target is a configuration variable;
    if (String(target) === '[object Object]') {
      var data = target;
      target = data.target;
      delete data.target;
      ///
      if (data.type && data.listener) {
        type = data.type;
        delete data.type;
        listener = data.listener;
        delete data.listener;
        for (var key in data) {
          configure[key] = data[key];
        }
      } else {
        // specialness
        for (var param in data) {
          var value = data[param];
          if (typeof value === 'function') continue;
          configure[param] = value;
        }
        ///
        var ret = {};
        for (var key in data) {
          var param = key.split(',');
          var o = data[key];
          var conf = {};
          for (var k in configure) {
            // clone base configuration
            conf[k] = configure[k];
          }
          ///
          if (typeof o === 'function') {
            // without configuration
            var listener = o;
          } else if (typeof o.listener === 'function') {
            // with configuration
            var listener = o.listener;
            for (var k in o) {
              // merge configure into base configuration
              if (typeof o[k] === 'function') continue;
              conf[k] = o[k];
            }
          } else {
            // not a listener
            continue;
          }
          ///
          for (var n = 0; n < param.length; n++) {
            ret[key] = eventjs.add(target, param[n], listener, conf, trigger);
          }
        }
        return ret;
      }
    }
    ///
    if (!target || !type || !listener) return;
    // Check for element to load on interval (before onload).
    if (typeof target === 'string' && type === 'ready') {
      if (window.eventjs_stallOnReady) {
        /// force stall for scripts to load
        type = 'load';
        target = window;
      } else {
        //
        var time = new Date().getTime();
        var timeout = configure.timeout;
        var ms = configure.interval || 1000 / 60;
        var interval = window.setInterval(function() {
          if (new Date().getTime() - time > timeout) {
            window.clearInterval(interval);
          }
          if (document.querySelector(target)) {
            window.clearInterval(interval);
            setTimeout(listener, 1);
          }
        }, ms);
        return;
      }
    }
    // Get DOM element from Query Selector.
    if (typeof target === 'string') {
      target = document.querySelectorAll(target);
      if (target.length === 0)
        return createError('Missing target on listener!', arguments); // No results.
      if (target.length === 1) {
        // Single target.
        target = target[0];
      }
    }

    /// Handle multiple targets.
    var event;
    var events = {};
    if (target.length > 0 && target !== window) {
      for (var n0 = 0, length0 = target.length; n0 < length0; n0++) {
        event = eventManager(
          target[n0],
          type,
          listener,
          clone(configure),
          trigger
        );
        if (event) events[n0] = event;
      }
      return createBatchCommands(events);
    }

    /// Check for multiple events in one string.
    if (typeof type === 'string') {
      type = type.toLowerCase();
      if (type.indexOf(' ') !== -1) {
        type = type.split(' ');
      } else if (type.indexOf(',') !== -1) {
        type = type.split(',');
      }
    }

    /// Attach or remove multiple events associated with a target.
    if (typeof type !== 'string') {
      // Has multiple events.
      if (typeof type.length === 'number') {
        // Handle multiple listeners glued together.
        for (var n1 = 0, length1 = type.length; n1 < length1; n1++) {
          // Array [type]
          event = eventManager(
            target,
            type[n1],
            listener,
            clone(configure),
            trigger
          );
          if (event) events[type[n1]] = event;
        }
      } else {
        // Handle multiple listeners.
        for (var key in type) {
          // Object {type}
          if (typeof type[key] === 'function') {
            // without configuration.
            event = eventManager(
              target,
              key,
              type[key],
              clone(configure),
              trigger
            );
          } else {
            // with configuration.
            event = eventManager(
              target,
              key,
              type[key].listener,
              clone(type[key]),
              trigger
            );
          }
          if (event) events[key] = event;
        }
      }
      return createBatchCommands(events);
    } else if (type.indexOf('on') === 0) {
      // to support things like "onclick" instead of "click"
      type = type.substr(2);
    }

    // Ensure listener is a function.
    if (typeof target !== 'object')
      return createError('Target is not defined!', arguments);
    if (typeof listener !== 'function')
      return createError('Listener is not a function!', arguments);

    // Generate a unique wrapper identifier.
    var useCapture = configure.useCapture || false;
    var id = getID(target) + '.' + getID(listener) + '.' + (useCapture ? 1 : 0);
    // Handle the event.
    if (root.Gesture && root.Gesture._gestureHandlers[type]) {
      // Fire custom event.
      id = type + id;
      if (trigger === 'remove') {
        // Remove event listener.
        if (!wrappers[id]) return; // Already removed.
        wrappers[id].remove();
        delete wrappers[id];
      } else if (trigger === 'add') {
        // Attach event listener.
        if (wrappers[id]) {
          wrappers[id].add();
          return wrappers[id]; // Already attached.
        }
        // Retains "this" orientation.
        if (configure.useCall && !root.modifyEventListener) {
          var tmp = listener;
          listener = function(event, self) {
            for (var key in self) event[key] = self[key];
            return tmp.call(target, event);
          };
        }
        // Create listener proxy.
        configure.gesture = type;
        configure.target = target;
        configure.listener = listener;
        configure.fromOverwrite = fromOverwrite;
        // Record wrapper.
        wrappers[id] = root.proxy[type](configure);
      }
      return wrappers[id];
    } else {
      // Fire native event.
      var eventList = getEventList(type);
      for (var n = 0, eventId; n < eventList.length; n++) {
        type = eventList[n];
        eventId = type + '.' + id;
        if (trigger === 'remove') {
          // Remove event listener.
          if (!wrappers[eventId]) continue; // Already removed.
          target[remove](type, listener, useCapture);
          delete wrappers[eventId];
        } else if (trigger === 'add') {
          // Attach event listener.
          if (wrappers[eventId]) return wrappers[eventId]; // Already attached.
          target[add](type, listener, useCapture);
          // Record wrapper.
          wrappers[eventId] = {
            id: eventId,
            type: type,
            target: target,
            listener: listener,
            remove: function() {
              for (var n = 0; n < eventList.length; n++) {
                root.remove(target, eventList[n], listener, configure);
              }
            }
          };
        }
      }
      return wrappers[eventId];
    }
  };

  /// Perform batch actions on multiple events.
  var createBatchCommands = function(events) {
    return {
      remove: function() {
        // Remove multiple events.
        for (var key in events) {
          events[key].remove();
        }
      },
      add: function() {
        // Add multiple events.
        for (var key in events) {
          events[key].add();
        }
      }
    };
  };

  /// Display error message in console.
  var createError = function(message, data) {
    if (typeof console === 'undefined') return;
    if (typeof console.error === 'undefined') return;
    console.error(message, data);
  };

  /// Handle naming discrepancies between platforms.
  var pointerDefs = {
    msPointer: ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'],
    touch: ['touchstart', 'touchmove', 'touchend'],
    mouse: ['mousedown', 'mousemove', 'mouseup']
  };

  var pointerDetect = {
    // MSPointer
    MSPointerDown: 0,
    MSPointerMove: 1,
    MSPointerUp: 2,
    // Touch
    touchstart: 0,
    touchmove: 1,
    touchend: 2,
    // Mouse
    mousedown: 0,
    mousemove: 1,
    mouseup: 2
  };

  var getEventSupport = (function() {
    root.supports = {};
    if (window.navigator.msPointerEnabled) {
      root.supports.msPointer = true;
    }
    if (root.getEventSupport('touchstart')) {
      root.supports.touch = true;
    }
    if (root.getEventSupport('mousedown')) {
      root.supports.mouse = true;
    }
  })();

  var getEventList = (function() {
    return function(type) {
      var prefix = document.addEventListener ? '' : 'on'; // IE
      var idx = pointerDetect[type];
      if (isFinite(idx)) {
        var types = [];
        for (var key in root.supports) {
          types.push(prefix + pointerDefs[key][idx]);
        }
        return types;
      } else {
        return [prefix + type];
      }
    };
  })();

  /// Event wrappers to keep track of all events placed in the window.
  var wrappers = {};
  var counter = 0;
  var getID = function(object) {
    if (object === window) return '#window';
    if (object === document) return '#document';
    if (!object.uniqueID) object.uniqueID = 'e' + counter++;
    return object.uniqueID;
  };

  /// Detect platforms native *EventListener command.
  var add = document.addEventListener ? 'addEventListener' : 'attachEvent';
  var remove = document.removeEventListener
    ? 'removeEventListener'
    : 'detachEvent';

  /*
	Pointer.js
	----------------------------------------
	Modified from; https://github.com/borismus/pointer.js
*/

  root.createPointerEvent = function(event, self, preventRecord) {
    var eventName = self.gesture;
    var target = self.target;
    var pts = event.changedTouches || root.proxy.getCoords(event);
    if (pts.length) {
      var pt = pts[0];
      self.pointers = preventRecord ? [] : pts;
      self.pageX = pt.pageX;
      self.pageY = pt.pageY;
      self.x = self.pageX;
      self.y = self.pageY;
    }
    ///
    var newEvent = document.createEvent('Event');
    newEvent.initEvent(eventName, true, true);
    newEvent.originalEvent = event;
    for (var k in self) {
      if (k === 'target') continue;
      newEvent[k] = self[k];
    }
    ///
    var type = newEvent.type;
    if (root.Gesture && root.Gesture._gestureHandlers[type]) {
      // capture custom events.
      //		target.dispatchEvent(newEvent);
      self.oldListener.call(target, newEvent, self, false);
    }
  };

  var eventListenersAgumented = false;
  var augmentEventListeners = function() {
    /// Allows *EventListener to use custom event proxies.
    if (!window.HTMLElement) return;
    var augmentEventListener = function(proto) {
      var recall = function(trigger) {
        // overwrite native *EventListener's
        var handle = trigger + 'EventListener';
        var handler = proto[handle];
        proto[handle] = function(type, listener, useCapture) {
          if (root.Gesture && root.Gesture._gestureHandlers[type]) {
            // capture custom events.
            var configure = useCapture;
            if (typeof useCapture === 'object') {
              configure.useCall = true;
            } else {
              // convert to configuration object.
              configure = {
                useCall: true,
                useCapture: useCapture
              };
            }
            eventManager(this, type, listener, configure, trigger, true);
            //					handler.call(this, type, listener, useCapture);
          } else {
            // use native function.
            var types = getEventList(type);
            for (var n = 0; n < types.length; n++) {
              handler.call(this, types[n], listener, useCapture);
            }
          }
        };
      };
      recall('add');
      recall('remove');
    };
    // NOTE: overwriting HTMLElement doesn't do anything in Firefox.
    if (navigator.userAgent.match(/Firefox/)) {
      // TODO: fix Firefox for the general case.
      augmentEventListener(HTMLDivElement.prototype);
      augmentEventListener(HTMLCanvasElement.prototype);
    } else {
      augmentEventListener(HTMLElement.prototype);
    }
    augmentEventListener(document);
    augmentEventListener(window);
  };

  var selectorsAugmented = false;
  var augmentSelectors = function() {
    /// Allows querySelectorAll and other NodeLists to perform *EventListener commands in bulk.
    var proto = NodeList.prototype;
    proto.removeEventListener = function(type, listener, useCapture) {
      for (var n = 0, length = this.length; n < length; n++) {
        this[n].removeEventListener(type, listener, useCapture);
      }
    };
    proto.addEventListener = function(type, listener, useCapture) {
      for (var n = 0, length = this.length; n < length; n++) {
        this[n].addEventListener(type, listener, useCapture);
      }
    };
  };

  return root;
})(eventjs);

/*:
	----------------------------------------------------
	eventjs.proxy : 0.4.2 : 2013/07/17 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/eventjs.js
	----------------------------------------------------
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  /*
	Create a new pointer gesture instance.
*/

  root.pointerSetup = function(conf, self) {
    /// Configure.
    conf.target = conf.target || window;
    conf.doc = conf.target.ownerDocument || conf.target; // Associated document.
    conf.minFingers = conf.minFingers || conf.fingers || 1; // Minimum required fingers.
    conf.maxFingers = conf.maxFingers || conf.fingers || Infinity; // Maximum allowed fingers.
    conf.position = conf.position || 'relative'; // Determines what coordinate system points are returned.
    delete conf.fingers; //-
    /// Convenience data.
    self = self || {};
    self.enabled = true;
    self.gesture = conf.gesture;
    self.target = conf.target;
    self.env = conf.env;
    ///
    if (eventjs.modifyEventListener && conf.fromOverwrite) {
      conf.oldListener = conf.listener;
      conf.listener = eventjs.createPointerEvent;
    }
    /// Convenience commands.
    var fingers = 0;
    var type =
      self.gesture.indexOf('pointer') === 0 && eventjs.modifyEventListener
        ? 'pointer'
        : 'mouse';
    if (conf.oldListener) self.oldListener = conf.oldListener;
    ///
    self.listener = conf.listener;
    self.proxy = function(listener) {
      self.defaultListener = conf.listener;
      conf.listener = listener;
      listener(conf.event, self);
    };
    self.add = function() {
      if (self.enabled === true) return;
      if (conf.onPointerDown)
        eventjs.add(conf.target, type + 'down', conf.onPointerDown);
      if (conf.onPointerMove)
        eventjs.add(conf.doc, type + 'move', conf.onPointerMove);
      if (conf.onPointerUp)
        eventjs.add(conf.doc, type + 'up', conf.onPointerUp);
      self.enabled = true;
    };
    self.remove = function() {
      if (self.enabled === false) return;
      if (conf.onPointerDown)
        eventjs.remove(conf.target, type + 'down', conf.onPointerDown);
      if (conf.onPointerMove)
        eventjs.remove(conf.doc, type + 'move', conf.onPointerMove);
      if (conf.onPointerUp)
        eventjs.remove(conf.doc, type + 'up', conf.onPointerUp);
      self.reset();
      self.enabled = false;
    };
    self.pause = function(opt) {
      if (conf.onPointerMove && (!opt || opt.move))
        eventjs.remove(conf.doc, type + 'move', conf.onPointerMove);
      if (conf.onPointerUp && (!opt || opt.up))
        eventjs.remove(conf.doc, type + 'up', conf.onPointerUp);
      fingers = conf.fingers;
      conf.fingers = 0;
    };
    self.resume = function(opt) {
      if (conf.onPointerMove && (!opt || opt.move))
        eventjs.add(conf.doc, type + 'move', conf.onPointerMove);
      if (conf.onPointerUp && (!opt || opt.up))
        eventjs.add(conf.doc, type + 'up', conf.onPointerUp);
      conf.fingers = fingers;
    };
    self.reset = function() {
      conf.tracker = {};
      conf.fingers = 0;
    };
    ///
    return self;
  };

  /*
	Begin proxied pointer command.
*/

  var sp = eventjs.supports; // Default pointerType
  ///
  eventjs.isMouse = !!sp.mouse;
  eventjs.isMSPointer = !!sp.touch;
  eventjs.isTouch = !!sp.msPointer;
  ///
  root.pointerStart = function(event, self, conf) {
    /// tracks multiple inputs
    var type = (event.type || 'mousedown').toUpperCase();
    if (type.indexOf('MOUSE') === 0) {
      eventjs.isMouse = true;
      eventjs.isTouch = false;
      eventjs.isMSPointer = false;
    } else if (type.indexOf('TOUCH') === 0) {
      eventjs.isMouse = false;
      eventjs.isTouch = true;
      eventjs.isMSPointer = false;
    } else if (type.indexOf('MSPOINTER') === 0) {
      eventjs.isMouse = false;
      eventjs.isTouch = false;
      eventjs.isMSPointer = true;
    }
    ///
    var addTouchStart = function(touch, sid) {
      var bbox = conf.bbox;
      var pt = (track[sid] = {});
      ///
      switch (conf.position) {
        case 'absolute': // Absolute from within window.
          pt.offsetX = 0;
          pt.offsetY = 0;
          break;
        case 'differenceFromLast': // Since last coordinate recorded.
          pt.offsetX = touch.pageX;
          pt.offsetY = touch.pageY;
          break;
        case 'difference': // Relative from origin.
          pt.offsetX = touch.pageX;
          pt.offsetY = touch.pageY;
          break;
        case 'move': // Move target element.
          pt.offsetX = touch.pageX - bbox.x1;
          pt.offsetY = touch.pageY - bbox.y1;
          break;
        default:
          // Relative from within target.
          pt.offsetX = bbox.x1 - bbox.scrollLeft;
          pt.offsetY = bbox.y1 - bbox.scrollTop;
          break;
      }
      ///
      var x = touch.pageX - pt.offsetX;
      var y = touch.pageY - pt.offsetY;
      ///
      pt.rotation = 0;
      pt.scale = 1;
      pt.startTime = pt.moveTime = new Date().getTime();
      pt.move = { x: x, y: y };
      pt.start = { x: x, y: y };
      ///
      conf.fingers++;
    };
    ///
    conf.event = event;
    if (self.defaultListener) {
      conf.listener = self.defaultListener;
      delete self.defaultListener;
    }
    ///
    var isTouchStart = !conf.fingers;
    var track = conf.tracker;
    var touches = event.changedTouches || root.getCoords(event);
    var length = touches.length;
    // Adding touch events to tracking.
    for (var i = 0; i < length; i++) {
      var touch = touches[i];
      var sid = touch.identifier || Infinity; // Touch ID.
      // Track the current state of the touches.
      if (conf.fingers) {
        if (conf.fingers >= conf.maxFingers) {
          var ids = [];
          for (var sid in conf.tracker) ids.push(sid);
          self.identifier = ids.join(',');
          return isTouchStart;
        }
        var fingers = 0; // Finger ID.
        for (var rid in track) {
          // Replace removed finger.
          if (track[rid].up) {
            delete track[rid];
            addTouchStart(touch, sid);
            conf.cancel = true;
            break;
          }
          fingers++;
        }
        // Add additional finger.
        if (track[sid]) continue;
        addTouchStart(touch, sid);
      } else {
        // Start tracking fingers.
        track = conf.tracker = {};
        self.bbox = conf.bbox = root.getBoundingBox(conf.target);
        conf.fingers = 0;
        conf.cancel = false;
        addTouchStart(touch, sid);
      }
    }
    ///
    var ids = [];
    for (var sid in conf.tracker) ids.push(sid);
    self.identifier = ids.join(',');
    ///
    return isTouchStart;
  };

  /*
	End proxied pointer command.
*/

  root.pointerEnd = function(event, self, conf, onPointerUp) {
    // Record changed touches have ended (iOS changedTouches is not reliable).
    var touches = event.touches || [];
    var length = touches.length;
    var exists = {};
    for (var i = 0; i < length; i++) {
      var touch = touches[i];
      var sid = touch.identifier;
      exists[sid || Infinity] = true;
    }
    for (var sid in conf.tracker) {
      var track = conf.tracker[sid];
      if (exists[sid] || track.up) continue;
      if (onPointerUp) {
        // add changedTouches to mouse.
        onPointerUp(
          {
            pageX: track.pageX,
            pageY: track.pageY,
            changedTouches: [
              {
                pageX: track.pageX,
                pageY: track.pageY,
                identifier: sid === 'Infinity' ? Infinity : sid
              }
            ]
          },
          'up'
        );
      }
      track.up = true;
      conf.fingers--;
    }
    /*	// This should work but fails in Safari on iOS4 so not using it.
	var touches = event.changedTouches || root.getCoords(event);
	var length = touches.length;
	// Record changed touches have ended (this should work).
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier || Infinity;
		var track = conf.tracker[sid];
		if (track && !track.up) {
			if (onPointerUp) { // add changedTouches to mouse.
				onPointerUp({
					changedTouches: [{
						pageX: track.pageX,
						pageY: track.pageY,
						identifier: sid === "Infinity" ? Infinity : sid
					}]
				}, "up");
			}
			track.up = true;
			conf.fingers --;
		}
	} */
    // Wait for all fingers to be released.
    if (conf.fingers !== 0) return false;
    // Record total number of fingers gesture used.
    var ids = [];
    conf.gestureFingers = 0;
    for (var sid in conf.tracker) {
      conf.gestureFingers++;
      ids.push(sid);
    }
    self.identifier = ids.join(',');
    // Our pointer gesture has ended.
    return true;
  };

  /*
	Returns mouse coords in an array to match event.*Touches
	------------------------------------------------------------
	var touch = event.changedTouches || root.getCoords(event);
*/

  root.getCoords = function(event) {
    if (typeof event.pageX !== 'undefined') {
      // Desktop browsers.
      root.getCoords = function(event) {
        return Array({
          type: 'mouse',
          x: event.pageX,
          y: event.pageY,
          pageX: event.pageX,
          pageY: event.pageY,
          identifier: event.pointerId || Infinity // pointerId is MS
        });
      };
    } else {
      // Internet Explorer <= 8.0
      root.getCoords = function(event) {
        var doc = document.documentElement;
        event = event || window.event;
        return Array({
          type: 'mouse',
          x: event.clientX + doc.scrollLeft,
          y: event.clientY + doc.scrollTop,
          pageX: event.clientX + doc.scrollLeft,
          pageY: event.clientY + doc.scrollTop,
          identifier: Infinity
        });
      };
    }
    return root.getCoords(event);
  };

  /*
	Returns single coords in an object.
	------------------------------------------------------------
	var mouse = root.getCoord(event);
*/

  root.getCoord = function(event) {
    if ('ontouchstart' in window) {
      // Mobile browsers.
      var pX = 0;
      var pY = 0;
      root.getCoord = function(event) {
        var touches = event.changedTouches;
        if (touches && touches.length) {
          // ontouchstart + ontouchmove
          return {
            x: (pX = touches[0].pageX),
            y: (pY = touches[0].pageY)
          };
        } else {
          // ontouchend
          return {
            x: pX,
            y: pY
          };
        }
      };
    } else if (
      typeof event.pageX !== 'undefined' &&
      typeof event.pageY !== 'undefined'
    ) {
      // Desktop browsers.
      root.getCoord = function(event) {
        return {
          x: event.pageX,
          y: event.pageY
        };
      };
    } else {
      // Internet Explorer <=8.0
      root.getCoord = function(event) {
        var doc = document.documentElement;
        event = event || window.event;
        return {
          x: event.clientX + doc.scrollLeft,
          y: event.clientY + doc.scrollTop
        };
      };
    }
    return root.getCoord(event);
  };

  /*
	Get target scale and position in space.
*/

  var getPropertyAsFloat = function(o, type) {
    var n = parseFloat(o.getPropertyValue(type), 10);
    return isFinite(n) ? n : 0;
  };

  root.getBoundingBox = function(o) {
    if (o === window || o === document) o = document.body;
    ///
    var bbox = {};
    var bcr = o.getBoundingClientRect();
    bbox.width = bcr.width;
    bbox.height = bcr.height;
    bbox.x1 = bcr.left;
    bbox.y1 = bcr.top;
    bbox.scaleX = bcr.width / o.offsetWidth || 1;
    bbox.scaleY = bcr.height / o.offsetHeight || 1;
    bbox.scrollLeft = 0;
    bbox.scrollTop = 0;
    ///
    var style = window.getComputedStyle(o);
    var borderBox = style.getPropertyValue('box-sizing') === 'border-box';
    ///
    if (borderBox === false) {
      var left = getPropertyAsFloat(style, 'border-left-width');
      var right = getPropertyAsFloat(style, 'border-right-width');
      var bottom = getPropertyAsFloat(style, 'border-bottom-width');
      var top = getPropertyAsFloat(style, 'border-top-width');
      bbox.border = [left, right, top, bottom];
      bbox.x1 += left;
      bbox.y1 += top;
      bbox.width -= right + left;
      bbox.height -= bottom + top;
    }

    /*	var left = getPropertyAsFloat(style, "padding-left");
	var right = getPropertyAsFloat(style, "padding-right");
	var bottom = getPropertyAsFloat(style, "padding-bottom");
	var top = getPropertyAsFloat(style, "padding-top");
	bbox.padding = [ left, right, top, bottom ];*/
    ///
    bbox.x2 = bbox.x1 + bbox.width;
    bbox.y2 = bbox.y1 + bbox.height;

    /// Get the scroll of container element.
    var position = style.getPropertyValue('position');
    var tmp = position === 'fixed' ? o : o.parentNode;
    while (tmp !== null) {
      if (tmp === document.body) break;
      if (tmp.scrollTop === undefined) break;
      var style = window.getComputedStyle(tmp);
      var position = style.getPropertyValue('position');
      if (position === 'absolute') {
      } else if (position === 'fixed') {
        //			bbox.scrollTop += document.body.scrollTop;
        //			bbox.scrollLeft += document.body.scrollLeft;
        bbox.scrollTop -= tmp.parentNode.scrollTop;
        bbox.scrollLeft -= tmp.parentNode.scrollLeft;
        break;
      } else {
        bbox.scrollLeft += tmp.scrollLeft;
        bbox.scrollTop += tmp.scrollTop;
      }
      ///
      tmp = tmp.parentNode;
    }
    ///
    bbox.scrollBodyLeft =
      window.pageXOffset !== undefined
        ? window.pageXOffset
        : (
            document.documentElement ||
            document.body.parentNode ||
            document.body
          ).scrollLeft;
    bbox.scrollBodyTop =
      window.pageYOffset !== undefined
        ? window.pageYOffset
        : (
            document.documentElement ||
            document.body.parentNode ||
            document.body
          ).scrollTop;
    ///
    bbox.scrollLeft -= bbox.scrollBodyLeft;
    bbox.scrollTop -= bbox.scrollBodyTop;
    ///
    return bbox;
  };

  /*
	Keep track of metaKey, the proper ctrlKey for users platform.
	----------------------------------------------------
	http://www.quirksmode.org/js/keys.html
	-----------------------------------
	http://unixpapa.com/js/key.html
*/

  (function() {
    var agent = navigator.userAgent.toLowerCase();
    var mac = agent.indexOf('macintosh') !== -1;
    var metaKeys;
    if (mac && agent.indexOf('khtml') !== -1) {
      // chrome, safari.
      metaKeys = { 91: true, 93: true };
    } else if (mac && agent.indexOf('firefox') !== -1) {
      // mac firefox.
      metaKeys = { 224: true };
    } else {
      // windows, linux, or mac opera.
      metaKeys = { 17: true };
    }
    (root.metaTrackerReset = function() {
      eventjs.fnKey = root.fnKey = false;
      eventjs.metaKey = root.metaKey = false;
      eventjs.escKey = root.escKey = false;
      eventjs.ctrlKey = root.ctrlKey = false;
      eventjs.shiftKey = root.shiftKey = false;
      eventjs.altKey = root.altKey = false;
    })();
    root.metaTracker = function(event) {
      var isKeyDown = event.type === 'keydown';
      if (event.keyCode === 27) eventjs.escKey = root.escKey = isKeyDown;
      if (metaKeys[event.keyCode]) eventjs.metaKey = root.metaKey = isKeyDown;
      eventjs.ctrlKey = root.ctrlKey = event.ctrlKey;
      eventjs.shiftKey = root.shiftKey = event.shiftKey;
      eventjs.altKey = root.altKey = event.altKey;
    };
  })();

  return root;
})(eventjs.proxy);
/*:
	----------------------------------------------------
	"MutationObserver" event proxy.
	----------------------------------------------------
	author: Selvakumar Arumugam - MIT LICENSE
	   src: http://stackoverflow.com/questions/10868104/can-you-have-a-javascript-hook-trigger-after-a-dom-elements-style-object-change
	----------------------------------------------------
*/
if (typeof eventjs === 'undefined') var eventjs = {};

eventjs.MutationObserver = (function() {
  var MutationObserver =
    window.MutationObserver ||
    window.WebKitMutationObserver ||
    window.MozMutationObserver;
  var DOMAttrModifiedSupported =
    !MutationObserver &&
    (function() {
      var p = document.createElement('p');
      var flag = false;
      var fn = function() {
        flag = true;
      };
      if (p.addEventListener) {
        p.addEventListener('DOMAttrModified', fn, false);
      } else if (p.attachEvent) {
        p.attachEvent('onDOMAttrModified', fn);
      } else {
        return false;
      }
      ///
      p.setAttribute('id', 'target');
      ///
      return flag;
    })();
  ///
  return function(container, callback) {
    if (MutationObserver) {
      var options = {
        subtree: false,
        attributes: true
      };
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(e) {
          callback.call(e.target, e.attributeName);
        });
      });
      observer.observe(container, options);
    } else if (DOMAttrModifiedSupported) {
      eventjs.add(container, 'DOMAttrModified', function(e) {
        callback.call(container, e.attrName);
      });
    } else if ('onpropertychange' in document.body) {
      eventjs.add(container, 'propertychange', function(e) {
        callback.call(container, window.event.propertyName);
      });
    }
  };
})();
/*:
	"Click" event proxy.
	----------------------------------------------------
	eventjs.add(window, "click", function(event, self) {});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.click = function(conf) {
    conf.gesture = conf.gesture || 'click';
    conf.maxFingers = conf.maxFingers || conf.fingers || 1;
    /// Tracking the events.
    conf.onPointerDown = function(event) {
      if (root.pointerStart(event, self, conf)) {
        eventjs.add(conf.target, 'mouseup', conf.onPointerUp);
      }
    };
    conf.onPointerUp = function(event) {
      if (root.pointerEnd(event, self, conf)) {
        eventjs.remove(conf.target, 'mouseup', conf.onPointerUp);
        var pointers = event.changedTouches || root.getCoords(event);
        var pointer = pointers[0];
        var bbox = conf.bbox;
        var newbbox = root.getBoundingBox(conf.target);
        var y = pointer.pageY - newbbox.scrollBodyTop;
        var x = pointer.pageX - newbbox.scrollBodyLeft;
        ////
        if (
          x > bbox.x1 &&
          y > bbox.y1 &&
          x < bbox.x2 &&
          y < bbox.y2 &&
          bbox.scrollTop === newbbox.scrollTop
        ) {
          // has not been scrolled
          ///
          for (var key in conf.tracker) break; //- should be modularized? in dblclick too
          var point = conf.tracker[key];
          self.x = point.start.x;
          self.y = point.start.y;
          ///
          conf.listener(event, self);
        }
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    self.state = 'click';
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.click = root.click;

  return root;
})(eventjs.proxy);
/*:
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	eventjs.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 25 pixel drift.
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.dbltap = root.dblclick = function(conf) {
    conf.gesture = conf.gesture || 'dbltap';
    conf.maxFingers = conf.maxFingers || conf.fingers || 1;
    // Setting up local variables.
    var delay = 700; // in milliseconds
    var time0, time1, timeout;
    var pointer0, pointer1;
    // Tracking the events.
    conf.onPointerDown = function(event) {
      var pointers = event.changedTouches || root.getCoords(event);
      if (time0 && !time1) {
        // Click #2
        pointer1 = pointers[0];
        time1 = new Date().getTime() - time0;
      } else {
        // Click #1
        pointer0 = pointers[0];
        time0 = new Date().getTime();
        time1 = 0;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          time0 = 0;
        }, delay);
      }
      if (root.pointerStart(event, self, conf)) {
        eventjs
          .add(conf.target, 'mousemove', conf.onPointerMove)
          .listener(event);
        eventjs.add(conf.target, 'mouseup', conf.onPointerUp);
      }
    };
    conf.onPointerMove = function(event) {
      if (time0 && !time1) {
        var pointers = event.changedTouches || root.getCoords(event);
        pointer1 = pointers[0];
      }
      var bbox = conf.bbox;
      var ax = pointer1.pageX - bbox.x1;
      var ay = pointer1.pageY - bbox.y1;
      if (
        !(
          ax > 0 &&
          ax < bbox.width && // Within target coordinates..
          ay > 0 &&
          ay < bbox.height &&
          Math.abs(pointer1.pageX - pointer0.pageX) <= 25 && // Within drift deviance.
          Math.abs(pointer1.pageY - pointer0.pageY) <= 25
        )
      ) {
        // Cancel out this listener.
        eventjs.remove(conf.target, 'mousemove', conf.onPointerMove);
        clearTimeout(timeout);
        time0 = time1 = 0;
      }
    };
    conf.onPointerUp = function(event) {
      if (root.pointerEnd(event, self, conf)) {
        eventjs.remove(conf.target, 'mousemove', conf.onPointerMove);
        eventjs.remove(conf.target, 'mouseup', conf.onPointerUp);
      }
      if (time0 && time1) {
        if (time1 <= delay) {
          // && !(event.cancelBubble && ++event.cancelBubbleCount > 1)) {
          self.state = conf.gesture;
          for (var key in conf.tracker) break;
          var point = conf.tracker[key];
          self.x = point.start.x;
          self.y = point.start.y;
          conf.listener(event, self);
        }
        clearTimeout(timeout);
        time0 = time1 = 0;
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    self.state = 'dblclick';
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.dbltap = root.dbltap;
  eventjs.Gesture._gestureHandlers.dblclick = root.dblclick;

  return root;
})(eventjs.proxy);
/*:
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	eventjs.add(window, "drag", function(event, self) {
		console.log(self.gesture, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.dragElement = function(that, event) {
    root.drag({
      event: event,
      target: that,
      position: 'move',
      listener: function(event, self) {
        that.style.left = self.x + 'px';
        that.style.top = self.y + 'px';
        eventjs.prevent(event);
      }
    });
  };

  root.drag = function(conf) {
    conf.gesture = 'drag';
    conf.onPointerDown = function(event) {
      if (root.pointerStart(event, self, conf)) {
        if (!conf.monitor) {
          eventjs.add(conf.doc, 'mousemove', conf.onPointerMove);
          eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
        }
      }
      // Process event listener.
      conf.onPointerMove(event, 'down');
    };
    conf.onPointerMove = function(event, state) {
      if (!conf.tracker) return conf.onPointerDown(event);
      var bbox = conf.bbox;
      var touches = event.changedTouches || root.getCoords(event);
      var length = touches.length;
      for (var i = 0; i < length; i++) {
        var touch = touches[i];
        var identifier = touch.identifier || Infinity;
        var pt = conf.tracker[identifier];
        // Identifier defined outside of listener.
        if (!pt) continue;
        pt.pageX = touch.pageX;
        pt.pageY = touch.pageY;
        // Record data.
        self.state = state || 'move';
        self.identifier = identifier;
        self.start = pt.start;
        self.fingers = conf.fingers;
        if (conf.position === 'differenceFromLast') {
          self.x = pt.pageX - pt.offsetX;
          self.y = pt.pageY - pt.offsetY;
          pt.offsetX = pt.pageX;
          pt.offsetY = pt.pageY;
        } else {
          self.x = pt.pageX - pt.offsetX;
          self.y = pt.pageY - pt.offsetY;
        }
        ///
        conf.listener(event, self);
      }
    };
    conf.onPointerUp = function(event) {
      // Remove tracking for touch.
      if (root.pointerEnd(event, self, conf, conf.onPointerMove)) {
        if (!conf.monitor) {
          eventjs.remove(conf.doc, 'mousemove', conf.onPointerMove);
          eventjs.remove(conf.doc, 'mouseup', conf.onPointerUp);
        }
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    // Attach events.
    if (conf.event) {
      conf.onPointerDown(conf.event);
    } else {
      //
      eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
      if (conf.monitor) {
        eventjs.add(conf.doc, 'mousemove', conf.onPointerMove);
        eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
      }
    }
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.drag = root.drag;

  return root;
})(eventjs.proxy);
/*:
	"Gesture" event proxy (2+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "gesture", function(event, self) {
		console.log(
			self.x, // centroid
			self.y,
			self.rotation,
			self.scale,
			self.fingers,
			self.state
		);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  var RAD_DEG = Math.PI / 180;
  var getCentroid = function(self, points) {
    var centroidx = 0;
    var centroidy = 0;
    var length = 0;
    for (var sid in points) {
      var touch = points[sid];
      if (touch.up) continue;
      centroidx += touch.move.x;
      centroidy += touch.move.y;
      length++;
    }
    self.x = centroidx /= length;
    self.y = centroidy /= length;
    return self;
  };

  root.gesture = function(conf) {
    conf.gesture = conf.gesture || 'gesture';
    conf.minFingers = conf.minFingers || conf.fingers || 2;
    // Tracking the events.
    conf.onPointerDown = function(event) {
      var fingers = conf.fingers;
      if (root.pointerStart(event, self, conf)) {
        eventjs.add(conf.doc, 'mousemove', conf.onPointerMove);
        eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
      }
      // Record gesture start.
      if (conf.fingers === conf.minFingers && fingers !== conf.fingers) {
        self.fingers = conf.minFingers;
        self.scale = 1;
        self.rotation = 0;
        self.state = 'start';
        var sids = ''; //- FIXME(mud): can generate duplicate IDs.
        for (var key in conf.tracker) sids += key;
        self.identifier = parseInt(sids);
        getCentroid(self, conf.tracker);
        conf.listener(event, self);
      }
    };
    ///
    conf.onPointerMove = function(event, state) {
      var bbox = conf.bbox;
      var points = conf.tracker;
      var touches = event.changedTouches || root.getCoords(event);
      var length = touches.length;
      // Update tracker coordinates.
      for (var i = 0; i < length; i++) {
        var touch = touches[i];
        var sid = touch.identifier || Infinity;
        var pt = points[sid];
        // Check whether "pt" is used by another gesture.
        if (!pt) continue;
        // Find the actual coordinates.
        pt.move.x = touch.pageX - bbox.x1;
        pt.move.y = touch.pageY - bbox.y1;
      }
      ///
      if (conf.fingers < conf.minFingers) return;
      ///
      var touches = [];
      var scale = 0;
      var rotation = 0;

      /// Calculate centroid of gesture.
      getCentroid(self, points);
      ///
      for (var sid in points) {
        var touch = points[sid];
        if (touch.up) continue;
        var start = touch.start;
        if (!start.distance) {
          var dx = start.x - self.x;
          var dy = start.y - self.y;
          start.distance = Math.sqrt(dx * dx + dy * dy);
          start.angle = Math.atan2(dx, dy) / RAD_DEG;
        }
        // Calculate scale.
        var dx = touch.move.x - self.x;
        var dy = touch.move.y - self.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        scale += distance / start.distance;
        // Calculate rotation.
        var angle = Math.atan2(dx, dy) / RAD_DEG;
        var rotate = ((start.angle - angle + 360) % 360) - 180;
        touch.DEG2 = touch.DEG1; // Previous degree.
        touch.DEG1 = rotate > 0 ? rotate : -rotate; // Current degree.
        if (typeof touch.DEG2 !== 'undefined') {
          if (rotate > 0) {
            touch.rotation += touch.DEG1 - touch.DEG2;
          } else {
            touch.rotation -= touch.DEG1 - touch.DEG2;
          }
          rotation += touch.rotation;
        }
        // Attach current points to self.
        touches.push(touch.move);
      }
      ///
      self.touches = touches;
      self.fingers = conf.fingers;
      self.scale = scale / conf.fingers;
      self.rotation = rotation / conf.fingers;
      self.state = 'change';
      conf.listener(event, self);
    };
    conf.onPointerUp = function(event) {
      // Remove tracking for touch.
      var fingers = conf.fingers;
      if (root.pointerEnd(event, self, conf)) {
        eventjs.remove(conf.doc, 'mousemove', conf.onPointerMove);
        eventjs.remove(conf.doc, 'mouseup', conf.onPointerUp);
      }
      // Check whether fingers has dropped below minFingers.
      if (fingers === conf.minFingers && conf.fingers < conf.minFingers) {
        self.fingers = conf.fingers;
        self.state = 'end';
        conf.listener(event, self);
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.gesture = root.gesture;

  return root;
})(eventjs.proxy);
/*:
	"Pointer" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "gesture", function(event, self) {
		console.log(self.rotation, self.scale, self.fingers, self.state);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.pointerdown = root.pointermove = root.pointerup = function(conf) {
    conf.gesture = conf.gesture || 'pointer';
    if (conf.target.isPointerEmitter) return;
    // Tracking the events.
    var isDown = true;
    conf.onPointerDown = function(event) {
      isDown = false;
      self.gesture = 'pointerdown';
      conf.listener(event, self);
    };
    conf.onPointerMove = function(event) {
      self.gesture = 'pointermove';
      conf.listener(event, self, isDown);
    };
    conf.onPointerUp = function(event) {
      isDown = true;
      self.gesture = 'pointerup';
      conf.listener(event, self, true);
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    eventjs.add(conf.target, 'mousemove', conf.onPointerMove);
    eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
    // Return this object.
    conf.target.isPointerEmitter = true;
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.pointerdown = root.pointerdown;
  eventjs.Gesture._gestureHandlers.pointermove = root.pointermove;
  eventjs.Gesture._gestureHandlers.pointerup = root.pointerup;

  return root;
})(eventjs.proxy);
/*:
	"Device Motion" and "Shake" event proxy.
	----------------------------------------------------
	http://developer.android.com/reference/android/hardware/Sensoreventjs.html#values
	----------------------------------------------------
	eventjs.add(window, "shake", function(event, self) {});
	eventjs.add(window, "devicemotion", function(event, self) {
		console.log(self.acceleration, self.accelerationIncludingGravity);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.shake = function(conf) {
    // Externally accessible data.
    var self = {
      gesture: 'devicemotion',
      acceleration: {},
      accelerationIncludingGravity: {},
      target: conf.target,
      listener: conf.listener,
      remove: function() {
        window.removeEventListener('devicemotion', onDeviceMotion, false);
      }
    };
    // Setting up local variables.
    var threshold = 4; // Gravitational threshold.
    var timeout = 1000; // Timeout between shake events.
    var timeframe = 200; // Time between shakes.
    var shakes = 3; // Minimum shakes to trigger event.
    var lastShake = new Date().getTime();
    var gravity = { x: 0, y: 0, z: 0 };
    var delta = {
      x: { count: 0, value: 0 },
      y: { count: 0, value: 0 },
      z: { count: 0, value: 0 }
    };
    // Tracking the events.
    var onDeviceMotion = function(e) {
      var alpha = 0.8; // Low pass filter.
      var o = e.accelerationIncludingGravity;
      gravity.x = alpha * gravity.x + (1 - alpha) * o.x;
      gravity.y = alpha * gravity.y + (1 - alpha) * o.y;
      gravity.z = alpha * gravity.z + (1 - alpha) * o.z;
      self.accelerationIncludingGravity = gravity;
      self.acceleration.x = o.x - gravity.x;
      self.acceleration.y = o.y - gravity.y;
      self.acceleration.z = o.z - gravity.z;
      ///
      if (conf.gesture === 'devicemotion') {
        conf.listener(e, self);
        return;
      }
      var data = 'xyz';
      var now = new Date().getTime();
      for (var n = 0, length = data.length; n < length; n++) {
        var letter = data[n];
        var ACCELERATION = self.acceleration[letter];
        var DELTA = delta[letter];
        var abs = Math.abs(ACCELERATION);
        /// Check whether another shake event was recently registered.
        if (now - lastShake < timeout) continue;
        /// Check whether delta surpasses threshold.
        if (abs > threshold) {
          var idx = (now * ACCELERATION) / abs;
          var span = Math.abs(idx + DELTA.value);
          // Check whether last delta was registered within timeframe.
          if (DELTA.value && span < timeframe) {
            DELTA.value = idx;
            DELTA.count++;
            // Check whether delta count has enough shakes.
            if (DELTA.count === shakes) {
              conf.listener(e, self);
              // Reset tracking.
              lastShake = now;
              DELTA.value = 0;
              DELTA.count = 0;
            }
          } else {
            // Track first shake.
            DELTA.value = idx;
            DELTA.count = 1;
          }
        }
      }
    };
    // Attach events.
    if (!window.addEventListener) return;
    window.addEventListener('devicemotion', onDeviceMotion, false);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.shake = root.shake;

  return root;
})(eventjs.proxy);
/*:
	"Swipe" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: snap, threshold, maxFingers.
	----------------------------------------------------
	eventjs.add(window, "swipe", function(event, self) {
		console.log(self.velocity, self.angle);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  var RAD_DEG = Math.PI / 180;

  root.swipe = function(conf) {
    conf.snap = conf.snap || 90; // angle snap.
    conf.threshold = conf.threshold || 1; // velocity threshold.
    conf.gesture = conf.gesture || 'swipe';
    // Tracking the events.
    conf.onPointerDown = function(event) {
      if (root.pointerStart(event, self, conf)) {
        eventjs.add(conf.doc, 'mousemove', conf.onPointerMove).listener(event);
        eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
      }
    };
    conf.onPointerMove = function(event) {
      var touches = event.changedTouches || root.getCoords(event);
      var length = touches.length;
      for (var i = 0; i < length; i++) {
        var touch = touches[i];
        var sid = touch.identifier || Infinity;
        var o = conf.tracker[sid];
        // Identifier defined outside of listener.
        if (!o) continue;
        o.move.x = touch.pageX;
        o.move.y = touch.pageY;
        o.moveTime = new Date().getTime();
      }
    };
    conf.onPointerUp = function(event) {
      if (root.pointerEnd(event, self, conf)) {
        eventjs.remove(conf.doc, 'mousemove', conf.onPointerMove);
        eventjs.remove(conf.doc, 'mouseup', conf.onPointerUp);
        ///
        var velocity1;
        var velocity2;
        var degree1;
        var degree2;
        /// Calculate centroid of gesture.
        var start = { x: 0, y: 0 };
        var endx = 0;
        var endy = 0;
        var length = 0;
        ///
        for (var sid in conf.tracker) {
          var touch = conf.tracker[sid];
          var xdist = touch.move.x - touch.start.x;
          var ydist = touch.move.y - touch.start.y;
          ///
          endx += touch.move.x;
          endy += touch.move.y;
          start.x += touch.start.x;
          start.y += touch.start.y;
          length++;
          ///
          var distance = Math.sqrt(xdist * xdist + ydist * ydist);
          var ms = touch.moveTime - touch.startTime;
          var degree2 = Math.atan2(xdist, ydist) / RAD_DEG + 180;
          var velocity2 = ms ? distance / ms : 0;
          if (typeof degree1 === 'undefined') {
            degree1 = degree2;
            velocity1 = velocity2;
          } else if (Math.abs(degree2 - degree1) <= 20) {
            degree1 = (degree1 + degree2) / 2;
            velocity1 = (velocity1 + velocity2) / 2;
          } else {
            return;
          }
        }
        ///
        var fingers = conf.gestureFingers;
        if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
          if (velocity1 > conf.threshold) {
            start.x /= length;
            start.y /= length;
            self.start = start;
            self.x = endx / length;
            self.y = endy / length;
            self.angle = -(
              (((degree1 / conf.snap + 0.5) >> 0) * conf.snap || 360) - 360
            );
            self.velocity = velocity1;
            self.fingers = fingers;
            self.state = 'swipe';
            conf.listener(event, self);
          }
        }
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.swipe = root.swipe;

  return root;
})(eventjs.proxy);
/*:
	"Tap" and "Longpress" event proxy.
	----------------------------------------------------
	CONFIGURE: delay (longpress), timeout (tap).
	----------------------------------------------------
	eventjs.add(window, "tap", function(event, self) {
		console.log(self.fingers);
	});
	----------------------------------------------------
	multi-finger tap // touch an target for <= 250ms.
	multi-finger longpress // touch an target for >= 500ms
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.longpress = function(conf) {
    conf.gesture = 'longpress';
    return root.tap(conf);
  };

  root.tap = function(conf) {
    conf.delay = conf.delay || 500;
    conf.timeout = conf.timeout || 250;
    conf.driftDeviance = conf.driftDeviance || 10;
    conf.gesture = conf.gesture || 'tap';
    // Setting up local variables.
    var timestamp, timeout;
    // Tracking the events.
    conf.onPointerDown = function(event) {
      if (root.pointerStart(event, self, conf)) {
        timestamp = new Date().getTime();
        // Initialize event listeners.
        eventjs.add(conf.doc, 'mousemove', conf.onPointerMove).listener(event);
        eventjs.add(conf.doc, 'mouseup', conf.onPointerUp);
        // Make sure this is a "longpress" event.
        if (conf.gesture !== 'longpress') return;
        timeout = setTimeout(function() {
          if (event.cancelBubble && ++event.cancelBubbleCount > 1) return;
          // Make sure no fingers have been changed.
          var fingers = 0;
          for (var key in conf.tracker) {
            var point = conf.tracker[key];
            if (point.end === true) return;
            if (conf.cancel) return;
            fingers++;
          }
          // Send callback.
          if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
            self.state = 'start';
            self.fingers = fingers;
            self.x = point.start.x;
            self.y = point.start.y;
            conf.listener(event, self);
          }
        }, conf.delay);
      }
    };
    conf.onPointerMove = function(event) {
      var bbox = conf.bbox;
      var touches = event.changedTouches || root.getCoords(event);
      var length = touches.length;
      for (var i = 0; i < length; i++) {
        var touch = touches[i];
        var identifier = touch.identifier || Infinity;
        var pt = conf.tracker[identifier];
        if (!pt) continue;
        var x = touch.pageX - bbox.x1;
        var y = touch.pageY - bbox.y1;
        ///
        var dx = x - pt.start.x;
        var dy = y - pt.start.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (
          !(
            x > 0 &&
            x < bbox.width && // Within target coordinates..
            y > 0 &&
            y < bbox.height &&
            distance <= conf.driftDeviance
          )
        ) {
          // Within drift deviance.
          // Cancel out this listener.
          eventjs.remove(conf.doc, 'mousemove', conf.onPointerMove);
          conf.cancel = true;
          return;
        }
      }
    };
    conf.onPointerUp = function(event) {
      if (root.pointerEnd(event, self, conf)) {
        clearTimeout(timeout);
        eventjs.remove(conf.doc, 'mousemove', conf.onPointerMove);
        eventjs.remove(conf.doc, 'mouseup', conf.onPointerUp);
        if (event.cancelBubble && ++event.cancelBubbleCount > 1) return;
        // Callback release on longpress.
        if (conf.gesture === 'longpress') {
          if (self.state === 'start') {
            self.state = 'end';
            conf.listener(event, self);
          }
          return;
        }
        // Cancel event due to movement.
        if (conf.cancel) return;
        // Ensure delay is within margins.
        if (new Date().getTime() - timestamp > conf.timeout) return;
        // Send callback.
        var fingers = conf.gestureFingers;
        if (conf.minFingers <= fingers && conf.maxFingers >= fingers) {
          self.state = 'tap';
          self.fingers = conf.gestureFingers;
          conf.listener(event, self);
        }
      }
    };
    // Generate maintenance commands, and other configurations.
    var self = root.pointerSetup(conf);
    // Attach events.
    eventjs.add(conf.target, 'mousedown', conf.onPointerDown);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.tap = root.tap;
  eventjs.Gesture._gestureHandlers.longpress = root.longpress;

  return root;
})(eventjs.proxy);
/*:
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	eventjs.add(window, "wheel", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
*/

if (typeof eventjs === 'undefined') var eventjs = {};
if (typeof eventjs.proxy === 'undefined') eventjs.proxy = {};

eventjs.proxy = (function(root) {
  'use strict';

  root.wheelPreventElasticBounce = function(el) {
    if (!el) return;
    if (typeof el === 'string') el = document.querySelector(el);
    eventjs.add(el, 'wheel', function(event, self) {
      self.preventElasticBounce();
      eventjs.stop(event);
    });
  };

  root.wheel = function(conf) {
    // Configure event listener.
    var interval;
    var timeout = conf.timeout || 150;
    var count = 0;
    // Externally accessible data.
    var self = {
      gesture: 'wheel',
      state: 'start',
      wheelDelta: 0,
      target: conf.target,
      listener: conf.listener,
      preventElasticBounce: function(event) {
        var target = this.target;
        var scrollTop = target.scrollTop;
        var top = scrollTop + target.offsetHeight;
        var height = target.scrollHeight;
        if (top === height && this.wheelDelta <= 0) eventjs.cancel(event);
        else if (scrollTop === 0 && this.wheelDelta >= 0) eventjs.cancel(event);
        eventjs.stop(event);
      },
      add: function() {
        conf.target[add](type, onMouseWheel, false);
      },
      remove: function() {
        conf.target[remove](type, onMouseWheel, false);
      }
    };
    // Tracking the events.
    var onMouseWheel = function(event) {
      event = event || window.event;
      self.state = count++ ? 'change' : 'start';
      self.wheelDelta = event.detail ? event.detail * -20 : event.wheelDelta;
      conf.listener(event, self);
      clearTimeout(interval);
      interval = setTimeout(function() {
        count = 0;
        self.state = 'end';
        self.wheelDelta = 0;
        conf.listener(event, self);
      }, timeout);
    };
    // Attach events.
    var add = document.addEventListener ? 'addEventListener' : 'attachEvent';
    var remove = document.removeEventListener
      ? 'removeEventListener'
      : 'detachEvent';
    var type = eventjs.getEventSupport('mousewheel')
      ? 'mousewheel'
      : 'DOMMouseScroll';
    conf.target[add](type, onMouseWheel, false);
    // Return this object.
    return self;
  };

  eventjs.Gesture = eventjs.Gesture || {};
  eventjs.Gesture._gestureHandlers = eventjs.Gesture._gestureHandlers || {};
  eventjs.Gesture._gestureHandlers.wheel = root.wheel;

  return root;
})(eventjs.proxy);
/*
	"Orientation Change"
	----------------------------------------------------
	https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html#//apple_ref/doc/uid/TP40010526
	----------------------------------------------------
	Event.add(window, "deviceorientation", function(event, self) {});
*/

if (typeof Event === 'undefined') var Event = {};
if (typeof Event.proxy === 'undefined') Event.proxy = {};

Event.proxy = (function(root) {
  'use strict';

  root.orientation = function(conf) {
    // Externally accessible data.
    var self = {
      gesture: 'orientationchange',
      previous: null /* Report the previous orientation */,
      current: window.orientation,
      target: conf.target,
      listener: conf.listener,
      remove: function() {
        window.removeEventListener(
          'orientationchange',
          onOrientationChange,
          false
        );
      }
    };

    // Tracking the events.
    var onOrientationChange = function(e) {
      self.previous = self.current;
      self.current = window.orientation;
      if (self.previous !== null && self.previous != self.current) {
        conf.listener(e, self);
        return;
      }
    };
    // Attach events.
    if (window.DeviceOrientationEvent) {
      window.addEventListener('orientationchange', onOrientationChange, false);
    }
    // Return this object.
    return self;
  };

  Event.Gesture = Event.Gesture || {};
  Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
  Event.Gesture._gestureHandlers.orientation = root.orientation;

  return root;
})(Event.proxy);
(function() {
  /**
   * @private
   * @param {String} eventName
   * @param {Function} handler
   */
  function _removeEventListener(eventName, handler) {
    if (!this.__eventListeners[eventName]) {
      return;
    }
    var eventListener = this.__eventListeners[eventName];
    if (handler) {
      eventListener[eventListener.indexOf(handler)] = false;
    } else {
      fabric.util.array.fill(eventListener, false);
    }
  }

  /**
   * Observes specified event
   * @memberOf fabric.Observable
   * @alias on
   * @param {String|Object} eventName Event name (eg. 'after:render') or object with key/value pairs (eg. {'after:render': handler, 'selection:cleared': handler})
   * @param {Function} handler Function that receives a notification when an event of the specified type occurs
   * @return {Self} thisArg
   * @chainable
   */
  function on(eventName, handler) {
    if (!this.__eventListeners) {
      this.__eventListeners = {};
    }
    // one object with key/value pairs was passed
    if (arguments.length === 1) {
      for (var prop in eventName) {
        this.on(prop, eventName[prop]);
      }
    } else {
      if (!this.__eventListeners[eventName]) {
        this.__eventListeners[eventName] = [];
      }
      this.__eventListeners[eventName].push(handler);
    }
    return this;
  }

  /**
   * Stops event observing for a particular event handler. Calling this method
   * without arguments removes all handlers for all events
   * @memberOf fabric.Observable
   * @alias off
   * @param {String|Object} eventName Event name (eg. 'after:render') or object with key/value pairs (eg. {'after:render': handler, 'selection:cleared': handler})
   * @param {Function} handler Function to be deleted from EventListeners
   * @return {Self} thisArg
   * @chainable
   */
  function off(eventName, handler) {
    if (!this.__eventListeners) {
      return this;
    }

    // remove all key/value pairs (event name -> event handler)
    if (arguments.length === 0) {
      for (eventName in this.__eventListeners) {
        _removeEventListener.call(this, eventName);
      }
    }
    // one object with key/value pairs was passed
    else if (arguments.length === 1 && typeof arguments[0] === 'object') {
      for (var prop in eventName) {
        _removeEventListener.call(this, prop, eventName[prop]);
      }
    } else {
      _removeEventListener.call(this, eventName, handler);
    }
    return this;
  }

  /**
   * Fires event with an optional options object
   * @memberOf fabric.Observable
   * @param {String} eventName Event name to fire
   * @param {Object} [options] Options object
   * @return {Self} thisArg
   * @chainable
   */
  function fire(eventName, options) {
    if (!this.__eventListeners) {
      return this;
    }

    var listenersForEvent = this.__eventListeners[eventName];
    if (!listenersForEvent) {
      return this;
    }

    for (var i = 0, len = listenersForEvent.length; i < len; i++) {
      listenersForEvent[i] && listenersForEvent[i].call(this, options || {});
    }
    this.__eventListeners[eventName] = listenersForEvent.filter(function(
      value
    ) {
      return value !== false;
    });
    return this;
  }

  /**
   * @namespace fabric.Observable
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2#events}
   * @see {@link http://fabricjs.com/events|Events demo}
   */
  fabric.Observable = {
    fire: fire,
    on: on,
    off: off
  };
})();
/**
 * @namespace fabric.Collection
 */
fabric.Collection = {
  _objects: [],

  /**
   * Adds objects to collection, Canvas or Group, then renders canvas
   * (if `renderOnAddRemove` is not `false`).
   * in case of Group no changes to bounding box are made.
   * Objects should be instances of (or inherit from) fabric.Object
   * Use of this function is highly discouraged for groups.
   * you can add a bunch of objects with the add method but then you NEED
   * to run a addWithUpdate call for the Group class or position/bbox will be wrong.
   * @param {...fabric.Object} object Zero or more fabric instances
   * @return {Self} thisArg
   * @chainable
   */
  add: function() {
    this._objects.push.apply(this._objects, arguments);
    if (this._onObjectAdded) {
      for (var i = 0, length = arguments.length; i < length; i++) {
        this._onObjectAdded(arguments[i]);
      }
    }
    this.renderOnAddRemove && this.requestRenderAll();
    return this;
  },

  /**
   * Inserts an object into collection at specified index, then renders canvas (if `renderOnAddRemove` is not `false`)
   * An object should be an instance of (or inherit from) fabric.Object
   * Use of this function is highly discouraged for groups.
   * you can add a bunch of objects with the insertAt method but then you NEED
   * to run a addWithUpdate call for the Group class or position/bbox will be wrong.
   * @param {Object} object Object to insert
   * @param {Number} index Index to insert object at
   * @param {Boolean} nonSplicing When `true`, no splicing (shifting) of objects occurs
   * @return {Self} thisArg
   * @chainable
   */
  insertAt: function(object, index, nonSplicing) {
    var objects = this._objects;
    if (nonSplicing) {
      objects[index] = object;
    } else {
      objects.splice(index, 0, object);
    }
    this._onObjectAdded && this._onObjectAdded(object);
    this.renderOnAddRemove && this.requestRenderAll();
    return this;
  },

  /**
   * Removes objects from a collection, then renders canvas (if `renderOnAddRemove` is not `false`)
   * @param {...fabric.Object} object Zero or more fabric instances
   * @return {Self} thisArg
   * @chainable
   */
  remove: function() {
    var objects = this._objects,
      index,
      somethingRemoved = false;

    for (var i = 0, length = arguments.length; i < length; i++) {
      index = objects.indexOf(arguments[i]);

      // only call onObjectRemoved if an object was actually removed
      if (index !== -1) {
        somethingRemoved = true;
        objects.splice(index, 1);
        this._onObjectRemoved && this._onObjectRemoved(arguments[i]);
      }
    }

    this.renderOnAddRemove && somethingRemoved && this.requestRenderAll();
    return this;
  },

  /**
   * Executes given function for each object in this group
   * @param {Function} callback
   *                   Callback invoked with current object as first argument,
   *                   index - as second and an array of all objects - as third.
   *                   Callback is invoked in a context of Global Object (e.g. `window`)
   *                   when no `context` argument is given
   *
   * @param {Object} context Context (aka thisObject)
   * @return {Self} thisArg
   * @chainable
   */
  forEachObject: function(callback, context) {
    var objects = this.getObjects();
    for (var i = 0, len = objects.length; i < len; i++) {
      callback.call(context, objects[i], i, objects);
    }
    return this;
  },

  /**
   * Returns an array of children objects of this instance
   * Type parameter introduced in 1.3.10
   * since 2.3.5 this method return always a COPY of the array;
   * @param {String} [type] When specified, only objects of this type are returned
   * @return {Array}
   */
  getObjects: function(type) {
    if (typeof type === 'undefined') {
      return this._objects.concat();
    }
    return this._objects.filter(function(o) {
      return o.type === type;
    });
  },

  /**
   * Returns object at specified index
   * @param {Number} index
   * @return {Self} thisArg
   */
  item: function(index) {
    return this._objects[index];
  },

  /**
   * Returns true if collection contains no objects
   * @return {Boolean} true if collection is empty
   */
  isEmpty: function() {
    return this._objects.length === 0;
  },

  /**
   * Returns a size of a collection (i.e: length of an array containing its objects)
   * @return {Number} Collection size
   */
  size: function() {
    return this._objects.length;
  },

  /**
   * Returns true if collection contains an object
   * @param {Object} object Object to check against
   * @return {Boolean} `true` if collection contains an object
   */
  contains: function(object) {
    return this._objects.indexOf(object) > -1;
  },

  /**
   * Returns number representation of a collection complexity
   * @return {Number} complexity
   */
  complexity: function() {
    return this._objects.reduce(function(memo, current) {
      memo += current.complexity ? current.complexity() : 0;
      return memo;
    }, 0);
  }
};
/**
 * @namespace fabric.CommonMethods
 */
fabric.CommonMethods = {
  /**
   * Sets object's properties from options
   * @param {Object} [options] Options object
   */
  _setOptions: function(options) {
    for (var prop in options) {
      this.set(prop, options[prop]);
    }
  },

  /**
   * @private
   * @param {Object} [filler] Options object
   * @param {String} [property] property to set the Gradient to
   */
  _initGradient: function(filler, property) {
    if (filler && filler.colorStops && !(filler instanceof fabric.Gradient)) {
      this.set(property, new fabric.Gradient(filler));
    }
  },

  /**
   * @private
   * @param {Object} [filler] Options object
   * @param {String} [property] property to set the Pattern to
   * @param {Function} [callback] callback to invoke after pattern load
   */
  _initPattern: function(filler, property, callback) {
    if (filler && filler.source && !(filler instanceof fabric.Pattern)) {
      this.set(property, new fabric.Pattern(filler, callback));
    } else {
      callback && callback();
    }
  },

  /**
   * @private
   */
  _setObject: function(obj) {
    for (var prop in obj) {
      this._set(prop, obj[prop]);
    }
  },

  /**
   * Sets property to a given value. When changing position/dimension -related properties (left, top, scale, angle, etc.) `set` does not update position of object's borders/controls. If you need to update those, call `setCoords()`.
   * @param {String|Object} key Property name or object (if object, iterate over the object properties)
   * @param {Object|Function} value Property value (if function, the value is passed into it and its return value is used as a new one)
   * @return {fabric.Object} thisArg
   * @chainable
   */
  set: function(key, value) {
    if (typeof key === 'object') {
      this._setObject(key);
    } else {
      this._set(key, value);
    }
    return this;
  },

  _set: function(key, value) {
    this[key] = value;
  },

  /**
   * Toggles specified property from `true` to `false` or from `false` to `true`
   * @param {String} property Property to toggle
   * @return {fabric.Object} thisArg
   * @chainable
   */
  toggle: function(property) {
    var value = this.get(property);
    if (typeof value === 'boolean') {
      this.set(property, !value);
    }
    return this;
  },

  /**
   * Basic getter
   * @param {String} property Property name
   * @return {*} value of a property
   */
  get: function(property) {
    return this[property];
  }
};
(function(global) {
  var sqrt = Math.sqrt,
    atan2 = Math.atan2,
    pow = Math.pow,
    PiBy180 = Math.PI / 180,
    PiBy2 = Math.PI / 2;

  /**
   * @namespace fabric.util
   */
  fabric.util = {
    /**
     * Calculate the cos of an angle, avoiding returning floats for known results
     * @static
     * @memberOf fabric.util
     * @param {Number} angle the angle in radians or in degree
     * @return {Number}
     */
    cos: function(angle) {
      if (angle === 0) {
        return 1;
      }
      if (angle < 0) {
        // cos(a) = cos(-a)
        angle = -angle;
      }
      var angleSlice = angle / PiBy2;
      switch (angleSlice) {
        case 1:
        case 3:
          return 0;
        case 2:
          return -1;
      }
      return Math.cos(angle);
    },

    /**
     * Calculate the sin of an angle, avoiding returning floats for known results
     * @static
     * @memberOf fabric.util
     * @param {Number} angle the angle in radians or in degree
     * @return {Number}
     */
    sin: function(angle) {
      if (angle === 0) {
        return 0;
      }
      var angleSlice = angle / PiBy2,
        sign = 1;
      if (angle < 0) {
        // sin(-a) = -sin(a)
        sign = -1;
      }
      switch (angleSlice) {
        case 1:
          return sign;
        case 2:
          return 0;
        case 3:
          return -sign;
      }
      return Math.sin(angle);
    },

    /**
     * Removes value from an array.
     * Presence of value (and its position in an array) is determined via `Array.prototype.indexOf`
     * @static
     * @memberOf fabric.util
     * @param {Array} array
     * @param {*} value
     * @return {Array} original array
     */
    removeFromArray: function(array, value) {
      var idx = array.indexOf(value);
      if (idx !== -1) {
        array.splice(idx, 1);
      }
      return array;
    },

    /**
     * Returns random number between 2 specified ones.
     * @static
     * @memberOf fabric.util
     * @param {Number} min lower limit
     * @param {Number} max upper limit
     * @return {Number} random value (between min and max)
     */
    getRandomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Transforms degrees to radians.
     * @static
     * @memberOf fabric.util
     * @param {Number} degrees value in degrees
     * @return {Number} value in radians
     */
    degreesToRadians: function(degrees) {
      return degrees * PiBy180;
    },

    /**
     * Transforms radians to degrees.
     * @static
     * @memberOf fabric.util
     * @param {Number} radians value in radians
     * @return {Number} value in degrees
     */
    radiansToDegrees: function(radians) {
      return radians / PiBy180;
    },

    /**
     * Rotates `point` around `origin` with `radians`
     * @static
     * @memberOf fabric.util
     * @param {fabric.Point} point The point to rotate
     * @param {fabric.Point} origin The origin of the rotation
     * @param {Number} radians The radians of the angle for the rotation
     * @return {fabric.Point} The new rotated point
     */
    rotatePoint: function(point, origin, radians) {
      point.subtractEquals(origin);
      var v = fabric.util.rotateVector(point, radians);
      return new fabric.Point(v.x, v.y).addEquals(origin);
    },

    /**
     * Rotates `vector` with `radians`
     * @static
     * @memberOf fabric.util
     * @param {Object} vector The vector to rotate (x and y)
     * @param {Number} radians The radians of the angle for the rotation
     * @return {Object} The new rotated point
     */
    rotateVector: function(vector, radians) {
      var sin = fabric.util.sin(radians),
        cos = fabric.util.cos(radians),
        rx = vector.x * cos - vector.y * sin,
        ry = vector.x * sin + vector.y * cos;
      return {
        x: rx,
        y: ry
      };
    },

    /**
     * Apply transform t to point p
     * @static
     * @memberOf fabric.util
     * @param  {fabric.Point} p The point to transform
     * @param  {Array} t The transform
     * @param  {Boolean} [ignoreOffset] Indicates that the offset should not be applied
     * @return {fabric.Point} The transformed point
     */
    transformPoint: function(p, t, ignoreOffset) {
      if (ignoreOffset) {
        return new fabric.Point(
          t[0] * p.x + t[2] * p.y,
          t[1] * p.x + t[3] * p.y
        );
      }
      return new fabric.Point(
        t[0] * p.x + t[2] * p.y + t[4],
        t[1] * p.x + t[3] * p.y + t[5]
      );
    },

    /**
     * Returns coordinates of points's bounding rectangle (left, top, width, height)
     * @param {Array} points 4 points array
     * @param {Array} [transform] an array of 6 numbers representing a 2x3 transform matrix
     * @return {Object} Object with left, top, width, height properties
     */
    makeBoundingBoxFromPoints: function(points, transform) {
      if (transform) {
        for (var i = 0; i < points.length; i++) {
          points[i] = fabric.util.transformPoint(points[i], transform);
        }
      }
      var xPoints = [points[0].x, points[1].x, points[2].x, points[3].x],
        minX = fabric.util.array.min(xPoints),
        maxX = fabric.util.array.max(xPoints),
        width = maxX - minX,
        yPoints = [points[0].y, points[1].y, points[2].y, points[3].y],
        minY = fabric.util.array.min(yPoints),
        maxY = fabric.util.array.max(yPoints),
        height = maxY - minY;

      return {
        left: minX,
        top: minY,
        width: width,
        height: height
      };
    },

    /**
     * Invert transformation t
     * @static
     * @memberOf fabric.util
     * @param {Array} t The transform
     * @return {Array} The inverted transform
     */
    invertTransform: function(t) {
      var a = 1 / (t[0] * t[3] - t[1] * t[2]),
        r = [a * t[3], -a * t[1], -a * t[2], a * t[0]],
        o = fabric.util.transformPoint({ x: t[4], y: t[5] }, r, true);
      r[4] = -o.x;
      r[5] = -o.y;
      return r;
    },

    /**
     * A wrapper around Number#toFixed, which contrary to native method returns number, not string.
     * @static
     * @memberOf fabric.util
     * @param {Number|String} number number to operate on
     * @param {Number} fractionDigits number of fraction digits to "leave"
     * @return {Number}
     */
    toFixed: function(number, fractionDigits) {
      return parseFloat(Number(number).toFixed(fractionDigits));
    },

    /**
     * Converts from attribute value to pixel value if applicable.
     * Returns converted pixels or original value not converted.
     * @param {Number|String} value number to operate on
     * @param {Number} fontSize
     * @return {Number|String}
     */
    parseUnit: function(value, fontSize) {
      var unit = /\D{0,2}$/.exec(value),
        number = parseFloat(value);
      if (!fontSize) {
        fontSize = fabric.Text.DEFAULT_SVG_FONT_SIZE;
      }
      switch (unit[0]) {
        case 'mm':
          return (number * fabric.DPI) / 25.4;

        case 'cm':
          return (number * fabric.DPI) / 2.54;

        case 'in':
          return number * fabric.DPI;

        case 'pt':
          return (number * fabric.DPI) / 72; // or * 4 / 3

        case 'pc':
          return ((number * fabric.DPI) / 72) * 12; // or * 16

        case 'em':
          return number * fontSize;

        default:
          return number;
      }
    },

    /**
     * Function which always returns `false`.
     * @static
     * @memberOf fabric.util
     * @return {Boolean}
     */
    falseFunction: function() {
      return false;
    },

    /**
     * Returns klass "Class" object of given namespace
     * @memberOf fabric.util
     * @param {String} type Type of object (eg. 'circle')
     * @param {String} namespace Namespace to get klass "Class" object from
     * @return {Object} klass "Class"
     */
    getKlass: function(type, namespace) {
      // capitalize first letter only
      type = fabric.util.string.camelize(
        type.charAt(0).toUpperCase() + type.slice(1)
      );
      return fabric.util.resolveNamespace(namespace)[type];
    },

    /**
     * Returns array of attributes for given svg that fabric parses
     * @memberOf fabric.util
     * @param {String} type Type of svg element (eg. 'circle')
     * @return {Array} string names of supported attributes
     */
    getSvgAttributes: function(type) {
      var attributes = ['instantiated_by_use', 'style', 'id', 'class'];
      switch (type) {
        case 'linearGradient':
          attributes = attributes.concat([
            'x1',
            'y1',
            'x2',
            'y2',
            'gradientUnits',
            'gradientTransform'
          ]);
          break;
        case 'radialGradient':
          attributes = attributes.concat([
            'gradientUnits',
            'gradientTransform',
            'cx',
            'cy',
            'r',
            'fx',
            'fy',
            'fr'
          ]);
          break;
        case 'stop':
          attributes = attributes.concat([
            'offset',
            'stop-color',
            'stop-opacity'
          ]);
          break;
      }
      return attributes;
    },

    /**
     * Returns object of given namespace
     * @memberOf fabric.util
     * @param {String} namespace Namespace string e.g. 'fabric.Image.filter' or 'fabric'
     * @return {Object} Object for given namespace (default fabric)
     */
    resolveNamespace: function(namespace) {
      if (!namespace) {
        return fabric;
      }

      var parts = namespace.split('.'),
        len = parts.length,
        i,
        obj = global || fabric.window;

      for (i = 0; i < len; ++i) {
        obj = obj[parts[i]];
      }

      return obj;
    },

    /**
     * Loads image element from given url and passes it to a callback
     * @memberOf fabric.util
     * @param {String} url URL representing an image
     * @param {Function} callback Callback; invoked with loaded image
     * @param {*} [context] Context to invoke callback in
     * @param {Object} [crossOrigin] crossOrigin value to set image element to
     */
    loadImage: function(url, callback, context, crossOrigin) {
      if (!url) {
        callback && callback.call(context, url);
        return;
      }

      var img = fabric.util.createImage();

      /** @ignore */
      var onLoadCallback = function() {
        callback && callback.call(context, img, false);
        img = img.onload = img.onerror = null;
      };

      img.onload = onLoadCallback;
      /** @ignore */
      img.onerror = function() {
        fabric.log('Error loading ' + img.src);
        callback && callback.call(context, null, true);
        img = img.onload = img.onerror = null;
      };

      // data-urls appear to be buggy with crossOrigin
      // https://github.com/kangax/fabric.js/commit/d0abb90f1cd5c5ef9d2a94d3fb21a22330da3e0a#commitcomment-4513767
      // see https://code.google.com/p/chromium/issues/detail?id=315152
      //     https://bugzilla.mozilla.org/show_bug.cgi?id=935069
      // crossOrigin null is the same as not set.
      if (
        url.indexOf('data') !== 0 &&
        crossOrigin !== undefined &&
        crossOrigin !== null
      ) {
        img.crossOrigin = crossOrigin;
      }

      // IE10 / IE11-Fix: SVG contents from data: URI
      // will only be available if the IMG is present
      // in the DOM (and visible)
      if (url.substring(0, 14) === 'data:image/svg') {
        img.onload = null;
        fabric.util.loadImageInDom(img, onLoadCallback);
      }

      img.src = url;
    },

    /**
     * Attaches SVG image with data: URL to the dom
     * @memberOf fabric.util
     * @param {Object} img Image object with data:image/svg src
     * @param {Function} callback Callback; invoked with loaded image
     * @return {Object} DOM element (div containing the SVG image)
     */
    loadImageInDom: function(img, onLoadCallback) {
      var div = fabric.document.createElement('div');
      div.style.width = div.style.height = '1px';
      div.style.left = div.style.top = '-100%';
      div.style.position = 'absolute';
      div.appendChild(img);
      fabric.document.querySelector('body').appendChild(div);
      /**
       * Wrap in function to:
       *   1. Call existing callback
       *   2. Cleanup DOM
       */
      img.onload = function() {
        onLoadCallback();
        div.parentNode.removeChild(div);
        div = null;
      };
    },

    /**
     * Creates corresponding fabric instances from their object representations
     * @static
     * @memberOf fabric.util
     * @param {Array} objects Objects to enliven
     * @param {Function} callback Callback to invoke when all objects are created
     * @param {String} namespace Namespace to get klass "Class" object from
     * @param {Function} reviver Method for further parsing of object elements,
     * called after each fabric object created.
     */
    enlivenObjects: function(objects, callback, namespace, reviver) {
      objects = objects || [];

      var enlivenedObjects = [],
        numLoadedObjects = 0,
        numTotalObjects = objects.length;

      function onLoaded() {
        if (++numLoadedObjects === numTotalObjects) {
          callback &&
            callback(
              enlivenedObjects.filter(function(obj) {
                // filter out undefined objects (objects that gave error)
                return obj;
              })
            );
        }
      }

      if (!numTotalObjects) {
        callback && callback(enlivenedObjects);
        return;
      }

      objects.forEach(function(o, index) {
        // if sparse array
        if (!o || !o.type) {
          onLoaded();
          return;
        }
        var klass = fabric.util.getKlass(o.type, namespace);
        klass.fromObject(o, function(obj, error) {
          error || (enlivenedObjects[index] = obj);
          reviver && reviver(o, obj, error);
          onLoaded();
        });
      });
    },

    /**
     * Create and wait for loading of patterns
     * @static
     * @memberOf fabric.util
     * @param {Array} patterns Objects to enliven
     * @param {Function} callback Callback to invoke when all objects are created
     * called after each fabric object created.
     */
    enlivenPatterns: function(patterns, callback) {
      patterns = patterns || [];

      function onLoaded() {
        if (++numLoadedPatterns === numPatterns) {
          callback && callback(enlivenedPatterns);
        }
      }

      var enlivenedPatterns = [],
        numLoadedPatterns = 0,
        numPatterns = patterns.length;

      if (!numPatterns) {
        callback && callback(enlivenedPatterns);
        return;
      }

      patterns.forEach(function(p, index) {
        if (p && p.source) {
          new fabric.Pattern(p, function(pattern) {
            enlivenedPatterns[index] = pattern;
            onLoaded();
          });
        } else {
          enlivenedPatterns[index] = p;
          onLoaded();
        }
      });
    },

    /**
     * Groups SVG elements (usually those retrieved from SVG document)
     * @static
     * @memberOf fabric.util
     * @param {Array} elements SVG elements to group
     * @param {Object} [options] Options object
     * @param {String} path Value to set sourcePath to
     * @return {fabric.Object|fabric.Group}
     */
    groupSVGElements: function(elements, options, path) {
      var object;
      if (elements && elements.length === 1) {
        return elements[0];
      }
      if (options) {
        if (options.width && options.height) {
          options.centerPoint = {
            x: options.width / 2,
            y: options.height / 2
          };
        } else {
          delete options.width;
          delete options.height;
        }
      }
      object = new fabric.Group(elements, options);
      if (typeof path !== 'undefined') {
        object.sourcePath = path;
      }
      return object;
    },

    /**
     * Populates an object with properties of another object
     * @static
     * @memberOf fabric.util
     * @param {Object} source Source object
     * @param {Object} destination Destination object
     * @return {Array} properties Properties names to include
     */
    populateWithProperties: function(source, destination, properties) {
      if (
        properties &&
        Object.prototype.toString.call(properties) === '[object Array]'
      ) {
        for (var i = 0, len = properties.length; i < len; i++) {
          if (properties[i] in source) {
            destination[properties[i]] = source[properties[i]];
          }
        }
      }
    },

    /**
     * Draws a dashed line between two points
     *
     * This method is used to draw dashed line around selection area.
     * See <a href="http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas">dotted stroke in canvas</a>
     *
     * @param {CanvasRenderingContext2D} ctx context
     * @param {Number} x  start x coordinate
     * @param {Number} y start y coordinate
     * @param {Number} x2 end x coordinate
     * @param {Number} y2 end y coordinate
     * @param {Array} da dash array pattern
     */
    drawDashedLine: function(ctx, x, y, x2, y2, da) {
      var dx = x2 - x,
        dy = y2 - y,
        len = sqrt(dx * dx + dy * dy),
        rot = atan2(dy, dx),
        dc = da.length,
        di = 0,
        draw = true;

      ctx.save();
      ctx.translate(x, y);
      ctx.moveTo(0, 0);
      ctx.rotate(rot);

      x = 0;
      while (len > x) {
        x += da[di++ % dc];
        if (x > len) {
          x = len;
        }
        ctx[draw ? 'lineTo' : 'moveTo'](x, 0);
        draw = !draw;
      }

      ctx.restore();
    },

    /**
     * Creates canvas element
     * @static
     * @memberOf fabric.util
     * @return {CanvasElement} initialized canvas element
     */
    createCanvasElement: function() {
      return fabric.document.createElement('canvas');
    },

    /**
     * Creates a canvas element that is a copy of another and is also painted
     * @param {CanvasElement} canvas to copy size and content of
     * @static
     * @memberOf fabric.util
     * @return {CanvasElement} initialized canvas element
     */
    copyCanvasElement: function(canvas) {
      var newCanvas = fabric.util.createCanvasElement();
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      newCanvas.getContext('2d').drawImage(canvas, 0, 0);
      return newCanvas;
    },

    /**
     * since 2.6.0 moved from canvas instance to utility.
     * @param {CanvasElement} canvasEl to copy size and content of
     * @param {String} format 'jpeg' or 'png', in some browsers 'webp' is ok too
     * @param {Number} quality <= 1 and > 0
     * @static
     * @memberOf fabric.util
     * @return {String} data url
     */
    toDataURL: function(canvasEl, format, quality) {
      return canvasEl.toDataURL('image/' + format, quality);
    },

    /**
     * Creates image element (works on client and node)
     * @static
     * @memberOf fabric.util
     * @return {HTMLImageElement} HTML image element
     */
    createImage: function() {
      return fabric.document.createElement('img');
    },

    /**
     * Multiply matrix A by matrix B to nest transformations
     * @static
     * @memberOf fabric.util
     * @param  {Array} a First transformMatrix
     * @param  {Array} b Second transformMatrix
     * @param  {Boolean} is2x2 flag to multiply matrices as 2x2 matrices
     * @return {Array} The product of the two transform matrices
     */
    multiplyTransformMatrices: function(a, b, is2x2) {
      // Matrix multiply a * b
      return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        is2x2 ? 0 : a[0] * b[4] + a[2] * b[5] + a[4],
        is2x2 ? 0 : a[1] * b[4] + a[3] * b[5] + a[5]
      ];
    },

    /**
     * Decomposes standard 2x3 matrix into transform components
     * @static
     * @memberOf fabric.util
     * @param  {Array} a transformMatrix
     * @return {Object} Components of transform
     */
    qrDecompose: function(a) {
      var angle = atan2(a[1], a[0]),
        denom = pow(a[0], 2) + pow(a[1], 2),
        scaleX = sqrt(denom),
        scaleY = (a[0] * a[3] - a[2] * a[1]) / scaleX,
        skewX = atan2(a[0] * a[2] + a[1] * a[3], denom);
      return {
        angle: angle / PiBy180,
        scaleX: scaleX,
        scaleY: scaleY,
        skewX: skewX / PiBy180,
        skewY: 0,
        translateX: a[4],
        translateY: a[5]
      };
    },

    /**
     * Returns a transform matrix starting from an object of the same kind of
     * the one returned from qrDecompose, useful also if you want to calculate some
     * transformations from an object that is not enlived yet
     * @static
     * @memberOf fabric.util
     * @param  {Object} options
     * @param  {Number} [options.angle] angle in degrees
     * @return {Number[]} transform matrix
     */
    calcRotateMatrix: function(options) {
      if (!options.angle) {
        return fabric.iMatrix.concat();
      }
      var theta = fabric.util.degreesToRadians(options.angle),
        cos = fabric.util.cos(theta),
        sin = fabric.util.sin(theta);
      return [cos, sin, -sin, cos, 0, 0];
    },

    /**
     * Returns a transform matrix starting from an object of the same kind of
     * the one returned from qrDecompose, useful also if you want to calculate some
     * transformations from an object that is not enlived yet.
     * is called DimensionsTransformMatrix because those properties are the one that influence
     * the size of the resulting box of the object.
     * @static
     * @memberOf fabric.util
     * @param  {Object} options
     * @param  {Number} [options.scaleX]
     * @param  {Number} [options.scaleY]
     * @param  {Boolean} [options.flipX]
     * @param  {Boolean} [options.flipY]
     * @param  {Number} [options.skewX]
     * @param  {Number} [options.skewX]
     * @return {Number[]} transform matrix
     */
    calcDimensionsMatrix: function(options) {
      var scaleX = typeof options.scaleX === 'undefined' ? 1 : options.scaleX,
        scaleY = typeof options.scaleY === 'undefined' ? 1 : options.scaleY,
        scaleMatrix = [
          options.flipX ? -scaleX : scaleX,
          0,
          0,
          options.flipY ? -scaleY : scaleY,
          0,
          0
        ],
        multiply = fabric.util.multiplyTransformMatrices,
        degreesToRadians = fabric.util.degreesToRadians;
      if (options.skewX) {
        scaleMatrix = multiply(
          scaleMatrix,
          [1, 0, Math.tan(degreesToRadians(options.skewX)), 1],
          true
        );
      }
      if (options.skewY) {
        scaleMatrix = multiply(
          scaleMatrix,
          [1, Math.tan(degreesToRadians(options.skewY)), 0, 1],
          true
        );
      }
      return scaleMatrix;
    },

    /**
     * Returns a transform matrix starting from an object of the same kind of
     * the one returned from qrDecompose, useful also if you want to calculate some
     * transformations from an object that is not enlived yet
     * @static
     * @memberOf fabric.util
     * @param  {Object} options
     * @param  {Number} [options.angle]
     * @param  {Number} [options.scaleX]
     * @param  {Number} [options.scaleY]
     * @param  {Boolean} [options.flipX]
     * @param  {Boolean} [options.flipY]
     * @param  {Number} [options.skewX]
     * @param  {Number} [options.skewX]
     * @param  {Number} [options.translateX]
     * @param  {Number} [options.translateY]
     * @return {Number[]} transform matrix
     */
    composeMatrix: function(options) {
      var matrix = [
          1,
          0,
          0,
          1,
          options.translateX || 0,
          options.translateY || 0
        ],
        multiply = fabric.util.multiplyTransformMatrices;
      if (options.angle) {
        matrix = multiply(matrix, fabric.util.calcRotateMatrix(options));
      }
      if (
        options.scaleX !== 1 ||
        options.scaleY !== 1 ||
        options.skewX ||
        options.skewY ||
        options.flipX ||
        options.flipY
      ) {
        matrix = multiply(matrix, fabric.util.calcDimensionsMatrix(options));
      }
      return matrix;
    },

    /**
     * reset an object transform state to neutral. Top and left are not accounted for
     * @static
     * @memberOf fabric.util
     * @param  {fabric.Object} target object to transform
     */
    resetObjectTransform: function(target) {
      target.scaleX = 1;
      target.scaleY = 1;
      target.skewX = 0;
      target.skewY = 0;
      target.flipX = false;
      target.flipY = false;
      target.rotate(0);
    },

    /**
     * Extract Object transform values
     * @static
     * @memberOf fabric.util
     * @param  {fabric.Object} target object to read from
     * @return {Object} Components of transform
     */
    saveObjectTransform: function(target) {
      return {
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        skewX: target.skewX,
        skewY: target.skewY,
        angle: target.angle,
        left: target.left,
        flipX: target.flipX,
        flipY: target.flipY,
        top: target.top
      };
    },

    /**
     * Returns true if context has transparent pixel
     * at specified location (taking tolerance into account)
     * @param {CanvasRenderingContext2D} ctx context
     * @param {Number} x x coordinate
     * @param {Number} y y coordinate
     * @param {Number} tolerance Tolerance
     */
    isTransparent: function(ctx, x, y, tolerance) {
      // If tolerance is > 0 adjust start coords to take into account.
      // If moves off Canvas fix to 0
      if (tolerance > 0) {
        if (x > tolerance) {
          x -= tolerance;
        } else {
          x = 0;
        }
        if (y > tolerance) {
          y -= tolerance;
        } else {
          y = 0;
        }
      }

      var _isTransparent = true,
        i,
        temp,
        imageData = ctx.getImageData(
          x,
          y,
          tolerance * 2 || 1,
          tolerance * 2 || 1
        ),
        l = imageData.data.length;

      // Split image data - for tolerance > 1, pixelDataSize = 4;
      for (i = 3; i < l; i += 4) {
        temp = imageData.data[i];
        _isTransparent = temp <= 0;
        if (_isTransparent === false) {
          break; // Stop if colour found
        }
      }

      imageData = null;

      return _isTransparent;
    },

    /**
     * Parse preserveAspectRatio attribute from element
     * @param {string} attribute to be parsed
     * @return {Object} an object containing align and meetOrSlice attribute
     */
    parsePreserveAspectRatioAttribute: function(attribute) {
      var meetOrSlice = 'meet',
        alignX = 'Mid',
        alignY = 'Mid',
        aspectRatioAttrs = attribute.split(' '),
        align;

      if (aspectRatioAttrs && aspectRatioAttrs.length) {
        meetOrSlice = aspectRatioAttrs.pop();
        if (meetOrSlice !== 'meet' && meetOrSlice !== 'slice') {
          align = meetOrSlice;
          meetOrSlice = 'meet';
        } else if (aspectRatioAttrs.length) {
          align = aspectRatioAttrs.pop();
        }
      }
      //divide align in alignX and alignY
      alignX = align !== 'none' ? align.slice(1, 4) : 'none';
      alignY = align !== 'none' ? align.slice(5, 8) : 'none';
      return {
        meetOrSlice: meetOrSlice,
        alignX: alignX,
        alignY: alignY
      };
    },

    /**
     * Clear char widths cache for the given font family or all the cache if no
     * fontFamily is specified.
     * Use it if you know you are loading fonts in a lazy way and you are not waiting
     * for custom fonts to load properly when adding text objects to the canvas.
     * If a text object is added when its own font is not loaded yet, you will get wrong
     * measurement and so wrong bounding boxes.
     * After the font cache is cleared, either change the textObject text content or call
     * initDimensions() to trigger a recalculation
     * @memberOf fabric.util
     * @param {String} [fontFamily] font family to clear
     */
    clearFabricFontCache: function(fontFamily) {
      fontFamily = (fontFamily || '').toLowerCase();
      if (!fontFamily) {
        fabric.charWidthsCache = {};
      } else if (fabric.charWidthsCache[fontFamily]) {
        delete fabric.charWidthsCache[fontFamily];
      }
    },

    /**
     * Given current aspect ratio, determines the max width and height that can
     * respect the total allowed area for the cache.
     * @memberOf fabric.util
     * @param {Number} ar aspect ratio
     * @param {Number} maximumArea Maximum area you want to achieve
     * @return {Object.x} Limited dimensions by X
     * @return {Object.y} Limited dimensions by Y
     */
    limitDimsByArea: function(ar, maximumArea) {
      var roughWidth = Math.sqrt(maximumArea * ar),
        perfLimitSizeY = Math.floor(maximumArea / roughWidth);
      return { x: Math.floor(roughWidth), y: perfLimitSizeY };
    },

    capValue: function(min, value, max) {
      return Math.max(min, Math.min(value, max));
    },

    /**
     * Finds the scale for the object source to fit inside the object destination,
     * keeping aspect ratio intact.
     * respect the total allowed area for the cache.
     * @memberOf fabric.util
     * @param {Object | fabric.Object} source
     * @param {Number} source.height natural unscaled height of the object
     * @param {Number} source.width natural unscaled width of the object
     * @param {Object | fabric.Object} destination
     * @param {Number} destination.height natural unscaled height of the object
     * @param {Number} destination.width natural unscaled width of the object
     * @return {Number} scale factor to apply to source to fit into destination
     */
    findScaleToFit: function(source, destination) {
      return Math.min(
        destination.width / source.width,
        destination.height / source.height
      );
    },

    /**
     * Finds the scale for the object source to cover entirely the object destination,
     * keeping aspect ratio intact.
     * respect the total allowed area for the cache.
     * @memberOf fabric.util
     * @param {Object | fabric.Object} source
     * @param {Number} source.height natural unscaled height of the object
     * @param {Number} source.width natural unscaled width of the object
     * @param {Object | fabric.Object} destination
     * @param {Number} destination.height natural unscaled height of the object
     * @param {Number} destination.width natural unscaled width of the object
     * @return {Number} scale factor to apply to source to cover destination
     */
    findScaleToCover: function(source, destination) {
      return Math.max(
        destination.width / source.width,
        destination.height / source.height
      );
    },

    /**
     * given an array of 6 number returns something like `"matrix(...numbers)"`
     * @memberOf fabric.util
     * @param {Array} transform an array with 6 numbers
     * @return {String} transform matrix for svg
     * @return {Object.y} Limited dimensions by Y
     */
    matrixToSVG: function(transform) {
      return (
        'matrix(' +
        transform
          .map(function(value) {
            return fabric.util.toFixed(
              value,
              fabric.Object.NUM_FRACTION_DIGITS
            );
          })
          .join(' ') +
        ')'
      );
    },

    /**
     * given an object and a transform, apply the inverse transform to the object,
     * this is equivalent to remove from that object that transformation, so that
     * added in a space with the removed transform, the object will be the same as before.
     * Removing from an object a transform that scale by 2 is like scaling it by 1/2.
     * Removing from an object a transfrom that rotate by 30deg is like rotating by 30deg
     * in the opposite direction.
     * This util is used to add objects inside transformed groups or nested groups.
     * @memberOf fabric.util
     * @param {fabric.Object} object the object you want to transform
     * @param {Array} transform the destination transform
     */
    removeTransformFromObject: function(object, transform) {
      var inverted = fabric.util.invertTransform(transform),
        finalTransform = fabric.util.multiplyTransformMatrices(
          inverted,
          object.calcOwnMatrix()
        );
      fabric.util.applyTransformToObject(object, finalTransform);
    },

    /**
     * given an object and a transform, apply the transform to the object.
     * this is equivalent to change the space where the object is drawn.
     * Adding to an object a transform that scale by 2 is like scaling it by 2.
     * This is used when removing an object from an active selection for example.
     * @memberOf fabric.util
     * @param {fabric.Object} object the object you want to transform
     * @param {Array} transform the destination transform
     */
    addTransformToObject: function(object, transform) {
      fabric.util.applyTransformToObject(
        object,
        fabric.util.multiplyTransformMatrices(transform, object.calcOwnMatrix())
      );
    },

    /**
     * discard an object transform state and apply the one from the matrix.
     * @memberOf fabric.util
     * @param {fabric.Object} object the object you want to transform
     * @param {Array} transform the destination transform
     */
    applyTransformToObject: function(object, transform) {
      var options = fabric.util.qrDecompose(transform),
        center = new fabric.Point(options.translateX, options.translateY);
      object.flipX = false;
      object.flipY = false;
      object.set('scaleX', options.scaleX);
      object.set('scaleY', options.scaleY);
      object.skewX = options.skewX;
      object.skewY = options.skewY;
      object.angle = options.angle;
      object.setPositionByOrigin(center, 'center', 'center');
    },

    /**
     * given a width and height, return the size of the bounding box
     * that can contains the box with width/height with applied transform
     * described in options.
     * Use to calculate the boxes around objects for controls.
     * @memberOf fabric.util
     * @param {Number} width
     * @param {Number} height
     * @param {Object} options
     * @param {Number} options.scaleX
     * @param {Number} options.scaleY
     * @param {Number} options.skewX
     * @param {Number} options.skewY
     * @return {Object.x} width of containing
     * @return {Object.y} height of containing
     */
    sizeAfterTransform: function(width, height, options) {
      var dimX = width / 2,
        dimY = height / 2,
        points = [
          {
            x: -dimX,
            y: -dimY
          },
          {
            x: dimX,
            y: -dimY
          },
          {
            x: -dimX,
            y: dimY
          },
          {
            x: dimX,
            y: dimY
          }
        ],
        transformMatrix = fabric.util.calcDimensionsMatrix(options),
        bbox = fabric.util.makeBoundingBoxFromPoints(points, transformMatrix);
      return {
        x: bbox.width,
        y: bbox.height
      };
    }
  };
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  var slice = Array.prototype.slice;

  /**
   * Invokes method on all items in a given array
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} method Name of a method to invoke
   * @return {Array}
   */
  function invoke(array, method) {
    var args = slice.call(arguments, 2),
      result = [];
    for (var i = 0, len = array.length; i < len; i++) {
      result[i] = args.length
        ? array[i][method].apply(array[i], args)
        : array[i][method].call(array[i]);
    }
    return result;
  }

  /**
   * Finds maximum value in array (not necessarily "first" one)
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} byProperty
   * @return {*}
   */
  function max(array, byProperty) {
    return find(array, byProperty, function(value1, value2) {
      return value1 >= value2;
    });
  }

  /**
   * Finds minimum value in array (not necessarily "first" one)
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} byProperty
   * @return {*}
   */
  function min(array, byProperty) {
    return find(array, byProperty, function(value1, value2) {
      return value1 < value2;
    });
  }

  /**
   * @private
   */
  function fill(array, value) {
    var k = array.length;
    while (k--) {
      array[k] = value;
    }
    return array;
  }

  /**
   * @private
   */
  function find(array, byProperty, condition) {
    if (!array || array.length === 0) {
      return;
    }

    var i = array.length - 1,
      result = byProperty ? array[i][byProperty] : array[i];
    if (byProperty) {
      while (i--) {
        if (condition(array[i][byProperty], result)) {
          result = array[i][byProperty];
        }
      }
    } else {
      while (i--) {
        if (condition(array[i], result)) {
          result = array[i];
        }
      }
    }
    return result;
  }

  /**
   * @namespace fabric.util.array
   */
  fabric.util.array = {
    fill: fill,
    invoke: invoke,
    min: min,
    max: max
  };
})();
(function() {
  /**
   * Copies all enumerable properties of one js object to another
   * this does not and cannot compete with generic utils.
   * Does not clone or extend fabric.Object subclasses.
   * This is mostly for internal use and has extra handling for fabricJS objects
   * it skips the canvas and group properties in deep cloning.
   * @memberOf fabric.util.object
   * @param {Object} destination Where to copy to
   * @param {Object} source Where to copy from
   * @return {Object}
   */

  function extend(destination, source, deep) {
    // JScript DontEnum bug is not taken care of
    // the deep clone is for internal use, is not meant to avoid
    // javascript traps or cloning html element or self referenced objects.
    if (deep) {
      if (!fabric.isLikelyNode && source instanceof Element) {
        // avoid cloning deep images, canvases,
        destination = source;
      } else if (source instanceof Array) {
        destination = [];
        for (var i = 0, len = source.length; i < len; i++) {
          destination[i] = extend({}, source[i], deep);
        }
      } else if (source && typeof source === 'object') {
        for (var property in source) {
          if (property === 'canvas' || property === 'group') {
            // we do not want to clone this props at all.
            // we want to keep the keys in the copy
            destination[property] = null;
          } else if (source.hasOwnProperty(property)) {
            destination[property] = extend({}, source[property], deep);
          }
        }
      } else {
        // this sounds odd for an extend but is ok for recursive use
        destination = source;
      }
    } else {
      for (var property in source) {
        destination[property] = source[property];
      }
    }
    return destination;
  }

  /**
   * Creates an empty object and copies all enumerable properties of another object to it
   * @memberOf fabric.util.object
   * TODO: this function return an empty object if you try to clone null
   * @param {Object} object Object to clone
   * @return {Object}
   */
  function clone(object, deep) {
    return extend({}, object, deep);
  }

  /** @namespace fabric.util.object */
  fabric.util.object = {
    extend: extend,
    clone: clone
  };
  fabric.util.object.extend(fabric.util, fabric.Observable);
})();
(function() {
  /**
   * Camelizes a string
   * @memberOf fabric.util.string
   * @param {String} string String to camelize
   * @return {String} Camelized version of a string
   */
  function camelize(string) {
    return string.replace(/-+(.)?/g, function(match, character) {
      return character ? character.toUpperCase() : '';
    });
  }

  /**
   * Capitalizes a string
   * @memberOf fabric.util.string
   * @param {String} string String to capitalize
   * @param {Boolean} [firstLetterOnly] If true only first letter is capitalized
   * and other letters stay untouched, if false first letter is capitalized
   * and other letters are converted to lowercase.
   * @return {String} Capitalized version of a string
   */
  function capitalize(string, firstLetterOnly) {
    return (
      string.charAt(0).toUpperCase() +
      (firstLetterOnly ? string.slice(1) : string.slice(1).toLowerCase())
    );
  }

  /**
   * Escapes XML in a string
   * @memberOf fabric.util.string
   * @param {String} string String to escape
   * @return {String} Escaped version of a string
   */
  function escapeXml(string) {
    return string
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Divide a string in the user perceived single units
   * @memberOf fabric.util.string
   * @param {String} textstring String to escape
   * @return {Array} array containing the graphemes
   */
  function graphemeSplit(textstring) {
    var i = 0,
      chr,
      graphemes = [];
    for (i = 0, chr; i < textstring.length; i++) {
      if ((chr = getWholeChar(textstring, i)) === false) {
        continue;
      }
      graphemes.push(chr);
    }
    return graphemes;
  }

  // taken from mdn in the charAt doc page.
  function getWholeChar(str, i) {
    var code = str.charCodeAt(i);

    if (isNaN(code)) {
      return ''; // Position not found
    }
    if (code < 0xd800 || code > 0xdfff) {
      return str.charAt(i);
    }

    // High surrogate (could change last hex to 0xDB7F to treat high private
    // surrogates as single characters)
    if (0xd800 <= code && code <= 0xdbff) {
      if (str.length <= i + 1) {
        throw 'High surrogate without following low surrogate';
      }
      var next = str.charCodeAt(i + 1);
      if (0xdc00 > next || next > 0xdfff) {
        throw 'High surrogate without following low surrogate';
      }
      return str.charAt(i) + str.charAt(i + 1);
    }
    // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
    if (i === 0) {
      throw 'Low surrogate without preceding high surrogate';
    }
    var prev = str.charCodeAt(i - 1);

    // (could change last hex to 0xDB7F to treat high private
    // surrogates as single characters)
    if (0xd800 > prev || prev > 0xdbff) {
      throw 'Low surrogate without preceding high surrogate';
    }
    // We can pass over low surrogates now as the second component
    // in a pair which we have already processed
    return false;
  }

  /**
   * String utilities
   * @namespace fabric.util.string
   */
  fabric.util.string = {
    camelize: camelize,
    capitalize: capitalize,
    escapeXml: escapeXml,
    graphemeSplit: graphemeSplit
  };
})();
(function() {
  var slice = Array.prototype.slice,
    emptyFunction = function() {},
    IS_DONTENUM_BUGGY = (function() {
      for (var p in { toString: 1 }) {
        if (p === 'toString') {
          return false;
        }
      }
      return true;
    })(),
    /** @ignore */
    addMethods = function(klass, source, parent) {
      for (var property in source) {
        if (
          property in klass.prototype &&
          typeof klass.prototype[property] === 'function' &&
          (source[property] + '').indexOf('callSuper') > -1
        ) {
          klass.prototype[property] = (function(property) {
            return function() {
              var superclass = this.constructor.superclass;
              this.constructor.superclass = parent;
              var returnValue = source[property].apply(this, arguments);
              this.constructor.superclass = superclass;

              if (property !== 'initialize') {
                return returnValue;
              }
            };
          })(property);
        } else {
          klass.prototype[property] = source[property];
        }

        if (IS_DONTENUM_BUGGY) {
          if (source.toString !== Object.prototype.toString) {
            klass.prototype.toString = source.toString;
          }
          if (source.valueOf !== Object.prototype.valueOf) {
            klass.prototype.valueOf = source.valueOf;
          }
        }
      }
    };

  function Subclass() {}

  function callSuper(methodName) {
    var parentMethod = null,
      _this = this;

    // climb prototype chain to find method not equal to callee's method
    while (_this.constructor.superclass) {
      var superClassMethod = _this.constructor.superclass.prototype[methodName];
      if (_this[methodName] !== superClassMethod) {
        parentMethod = superClassMethod;
        break;
      }
      // eslint-disable-next-line
      _this = _this.constructor.superclass.prototype;
    }

    if (!parentMethod) {
      return console.log(
        'tried to callSuper ' +
          methodName +
          ', method not found in prototype chain',
        this
      );
    }

    return arguments.length > 1
      ? parentMethod.apply(this, slice.call(arguments, 1))
      : parentMethod.call(this);
  }

  /**
   * Helper for creation of "classes".
   * @memberOf fabric.util
   * @param {Function} [parent] optional "Class" to inherit from
   * @param {Object} [properties] Properties shared by all instances of this class
   *                  (be careful modifying objects defined here as this would affect all instances)
   */
  function createClass() {
    var parent = null,
      properties = slice.call(arguments, 0);

    if (typeof properties[0] === 'function') {
      parent = properties.shift();
    }
    function klass() {
      this.initialize.apply(this, arguments);
    }

    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      Subclass.prototype = parent.prototype;
      klass.prototype = new Subclass();
      parent.subclasses.push(klass);
    }
    for (var i = 0, length = properties.length; i < length; i++) {
      addMethods(klass, properties[i], parent);
    }
    if (!klass.prototype.initialize) {
      klass.prototype.initialize = emptyFunction;
    }
    klass.prototype.constructor = klass;
    klass.prototype.callSuper = callSuper;
    return klass;
  }

  fabric.util.createClass = createClass;
})();
(function() {
  // since ie11 can use addEventListener but they do not support options, i need to check
  var couldUseAttachEvent = !!fabric.document.createElement('div').attachEvent,
    touchEvents = ['touchstart', 'touchmove', 'touchend'];
  /**
   * Adds an event listener to an element
   * @function
   * @memberOf fabric.util
   * @param {HTMLElement} element
   * @param {String} eventName
   * @param {Function} handler
   */
  fabric.util.addListener = function(element, eventName, handler, options) {
    element &&
      element.addEventListener(
        eventName,
        handler,
        couldUseAttachEvent ? false : options
      );
  };

  /**
   * Removes an event listener from an element
   * @function
   * @memberOf fabric.util
   * @param {HTMLElement} element
   * @param {String} eventName
   * @param {Function} handler
   */
  fabric.util.removeListener = function(element, eventName, handler, options) {
    element &&
      element.removeEventListener(
        eventName,
        handler,
        couldUseAttachEvent ? false : options
      );
  };

  function getTouchInfo(event) {
    var touchProp = event.changedTouches;
    if (touchProp && touchProp[0]) {
      return touchProp[0];
    }
    return event;
  }

  fabric.util.getPointer = function(event) {
    var element = event.target,
      scroll = fabric.util.getScrollLeftTop(element),
      _evt = getTouchInfo(event);
    return {
      x: _evt.clientX + scroll.left,
      y: _evt.clientY + scroll.top
    };
  };

  fabric.util.isTouchEvent = function(event) {
    return (
      touchEvents.indexOf(event.type) > -1 || event.pointerType === 'touch'
    );
  };
})();
(function() {
  /**
   * Cross-browser wrapper for setting element's style
   * @memberOf fabric.util
   * @param {HTMLElement} element
   * @param {Object} styles
   * @return {HTMLElement} Element that was passed as a first argument
   */
  function setStyle(element, styles) {
    var elementStyle = element.style;
    if (!elementStyle) {
      return element;
    }
    if (typeof styles === 'string') {
      element.style.cssText += ';' + styles;
      return styles.indexOf('opacity') > -1
        ? setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
        : element;
    }
    for (var property in styles) {
      if (property === 'opacity') {
        setOpacity(element, styles[property]);
      } else {
        var normalizedProperty =
          property === 'float' || property === 'cssFloat'
            ? typeof elementStyle.styleFloat === 'undefined'
              ? 'cssFloat'
              : 'styleFloat'
            : property;
        elementStyle[normalizedProperty] = styles[property];
      }
    }
    return element;
  }

  var parseEl = fabric.document.createElement('div'),
    supportsOpacity = typeof parseEl.style.opacity === 'string',
    supportsFilters = typeof parseEl.style.filter === 'string',
    reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/,
    /** @ignore */
    setOpacity = function(element) {
      return element;
    };

  if (supportsOpacity) {
    /** @ignore */
    setOpacity = function(element, value) {
      element.style.opacity = value;
      return element;
    };
  } else if (supportsFilters) {
    /** @ignore */
    setOpacity = function(element, value) {
      var es = element.style;
      if (element.currentStyle && !element.currentStyle.hasLayout) {
        es.zoom = 1;
      }
      if (reOpacity.test(es.filter)) {
        value = value >= 0.9999 ? '' : 'alpha(opacity=' + value * 100 + ')';
        es.filter = es.filter.replace(reOpacity, value);
      } else {
        es.filter += ' alpha(opacity=' + value * 100 + ')';
      }
      return element;
    };
  }

  fabric.util.setStyle = setStyle;
})();
(function() {
  var _slice = Array.prototype.slice;

  /**
   * Takes id and returns an element with that id (if one exists in a document)
   * @memberOf fabric.util
   * @param {String|HTMLElement} id
   * @return {HTMLElement|null}
   */
  function getById(id) {
    return typeof id === 'string' ? fabric.document.getElementById(id) : id;
  }

  var sliceCanConvertNodelists,
    /**
     * Converts an array-like object (e.g. arguments or NodeList) to an array
     * @memberOf fabric.util
     * @param {Object} arrayLike
     * @return {Array}
     */
    toArray = function(arrayLike) {
      return _slice.call(arrayLike, 0);
    };

  try {
    sliceCanConvertNodelists =
      toArray(fabric.document.childNodes) instanceof Array;
  } catch (err) {}

  if (!sliceCanConvertNodelists) {
    toArray = function(arrayLike) {
      var arr = new Array(arrayLike.length),
        i = arrayLike.length;
      while (i--) {
        arr[i] = arrayLike[i];
      }
      return arr;
    };
  }

  /**
   * Creates specified element with specified attributes
   * @memberOf fabric.util
   * @param {String} tagName Type of an element to create
   * @param {Object} [attributes] Attributes to set on an element
   * @return {HTMLElement} Newly created element
   */
  function makeElement(tagName, attributes) {
    var el = fabric.document.createElement(tagName);
    for (var prop in attributes) {
      if (prop === 'class') {
        el.className = attributes[prop];
      } else if (prop === 'for') {
        el.htmlFor = attributes[prop];
      } else {
        el.setAttribute(prop, attributes[prop]);
      }
    }
    return el;
  }

  /**
   * Adds class to an element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to add class to
   * @param {String} className Class to add to an element
   */
  function addClass(element, className) {
    if (
      element &&
      (' ' + element.className + ' ').indexOf(' ' + className + ' ') === -1
    ) {
      element.className += (element.className ? ' ' : '') + className;
    }
  }

  /**
   * Wraps element with another element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to wrap
   * @param {HTMLElement|String} wrapper Element to wrap with
   * @param {Object} [attributes] Attributes to set on a wrapper
   * @return {HTMLElement} wrapper
   */
  function wrapElement(element, wrapper, attributes) {
    if (typeof wrapper === 'string') {
      wrapper = makeElement(wrapper, attributes);
    }
    if (element.parentNode) {
      element.parentNode.replaceChild(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  /**
   * Returns element scroll offsets
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to operate on
   * @return {Object} Object with left/top values
   */
  function getScrollLeftTop(element) {
    var left = 0,
      top = 0,
      docElement = fabric.document.documentElement,
      body = fabric.document.body || {
        scrollLeft: 0,
        scrollTop: 0
      };

    // While loop checks (and then sets element to) .parentNode OR .host
    //  to account for ShadowDOM. We still want to traverse up out of ShadowDOM,
    //  but the .parentNode of a root ShadowDOM node will always be null, instead
    //  it should be accessed through .host. See http://stackoverflow.com/a/24765528/4383938
    while (element && (element.parentNode || element.host)) {
      // Set element to element parent, or 'host' in case of ShadowDOM
      element = element.parentNode || element.host;

      if (element === fabric.document) {
        left = body.scrollLeft || docElement.scrollLeft || 0;
        top = body.scrollTop || docElement.scrollTop || 0;
      } else {
        left += element.scrollLeft || 0;
        top += element.scrollTop || 0;
      }

      if (element.nodeType === 1 && element.style.position === 'fixed') {
        break;
      }
    }

    return { left: left, top: top };
  }

  /**
   * Returns offset for a given element
   * @function
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to get offset for
   * @return {Object} Object with "left" and "top" properties
   */
  function getElementOffset(element) {
    var docElem,
      doc = element && element.ownerDocument,
      box = { left: 0, top: 0 },
      offset = { left: 0, top: 0 },
      scrollLeftTop,
      offsetAttributes = {
        borderLeftWidth: 'left',
        borderTopWidth: 'top',
        paddingLeft: 'left',
        paddingTop: 'top'
      };

    if (!doc) {
      return offset;
    }

    for (var attr in offsetAttributes) {
      offset[offsetAttributes[attr]] +=
        parseInt(getElementStyle(element, attr), 10) || 0;
    }

    docElem = doc.documentElement;
    if (typeof element.getBoundingClientRect !== 'undefined') {
      box = element.getBoundingClientRect();
    }

    scrollLeftTop = getScrollLeftTop(element);

    return {
      left:
        box.left + scrollLeftTop.left - (docElem.clientLeft || 0) + offset.left,
      top: box.top + scrollLeftTop.top - (docElem.clientTop || 0) + offset.top
    };
  }

  /**
   * Returns style attribute value of a given element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to get style attribute for
   * @param {String} attr Style attribute to get for element
   * @return {String} Style attribute value of the given element.
   */
  var getElementStyle;
  if (
    fabric.document.defaultView &&
    fabric.document.defaultView.getComputedStyle
  ) {
    getElementStyle = function(element, attr) {
      var style = fabric.document.defaultView.getComputedStyle(element, null);
      return style ? style[attr] : undefined;
    };
  } else {
    getElementStyle = function(element, attr) {
      var value = element.style[attr];
      if (!value && element.currentStyle) {
        value = element.currentStyle[attr];
      }
      return value;
    };
  }

  (function() {
    var style = fabric.document.documentElement.style,
      selectProp =
        'userSelect' in style
          ? 'userSelect'
          : 'MozUserSelect' in style
          ? 'MozUserSelect'
          : 'WebkitUserSelect' in style
          ? 'WebkitUserSelect'
          : 'KhtmlUserSelect' in style
          ? 'KhtmlUserSelect'
          : '';

    /**
     * Makes element unselectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make unselectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementUnselectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = fabric.util.falseFunction;
      }
      if (selectProp) {
        element.style[selectProp] = 'none';
      } else if (typeof element.unselectable === 'string') {
        element.unselectable = 'on';
      }
      return element;
    }

    /**
     * Makes element selectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make selectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementSelectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = null;
      }
      if (selectProp) {
        element.style[selectProp] = '';
      } else if (typeof element.unselectable === 'string') {
        element.unselectable = '';
      }
      return element;
    }

    fabric.util.makeElementUnselectable = makeElementUnselectable;
    fabric.util.makeElementSelectable = makeElementSelectable;
  })();

  function getNodeCanvas(element) {
    var impl = fabric.jsdomImplForWrapper(element);
    return impl._canvas || impl._image;
  }

  function cleanUpJsdomNode(element) {
    if (!fabric.isLikelyNode) {
      return;
    }
    var impl = fabric.jsdomImplForWrapper(element);
    if (impl) {
      impl._image = null;
      impl._canvas = null;
      // unsure if necessary
      impl._currentSrc = null;
      impl._attributes = null;
      impl._classList = null;
    }
  }

  function setImageSmoothing(ctx, value) {
    ctx.imageSmoothingEnabled =
      ctx.imageSmoothingEnabled ||
      ctx.webkitImageSmoothingEnabled ||
      ctx.mozImageSmoothingEnabled ||
      ctx.msImageSmoothingEnabled ||
      ctx.oImageSmoothingEnabled;
    ctx.imageSmoothingEnabled = value;
  }

  /**
   * setImageSmoothing sets the context imageSmoothingEnabled property.
   * Used by canvas and by ImageObject.
   * @memberOf fabric.util
   * @since 4.0.0
   * @param {HTMLRenderingContext2D} ctx to set on
   * @param {Boolean} value true or false
   */
  fabric.util.setImageSmoothing = setImageSmoothing;
  fabric.util.getById = getById;
  fabric.util.toArray = toArray;
  fabric.util.addClass = addClass;
  fabric.util.makeElement = makeElement;
  fabric.util.wrapElement = wrapElement;
  fabric.util.getScrollLeftTop = getScrollLeftTop;
  fabric.util.getElementOffset = getElementOffset;
  fabric.util.getNodeCanvas = getNodeCanvas;
  fabric.util.cleanUpJsdomNode = cleanUpJsdomNode;
})();
(function() {
  function addParamToUrl(url, param) {
    return url + (/\?/.test(url) ? '&' : '?') + param;
  }

  function emptyFn() {}

  /**
   * Cross-browser abstraction for sending XMLHttpRequest
   * @memberOf fabric.util
   * @param {String} url URL to send XMLHttpRequest to
   * @param {Object} [options] Options object
   * @param {String} [options.method="GET"]
   * @param {String} [options.parameters] parameters to append to url in GET or in body
   * @param {String} [options.body] body to send with POST or PUT request
   * @param {Function} options.onComplete Callback to invoke when request is completed
   * @return {XMLHttpRequest} request
   */
  function request(url, options) {
    options || (options = {});

    var method = options.method ? options.method.toUpperCase() : 'GET',
      onComplete = options.onComplete || function() {},
      xhr = new fabric.window.XMLHttpRequest(),
      body = options.body || options.parameters;

    /** @ignore */
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        onComplete(xhr);
        xhr.onreadystatechange = emptyFn;
      }
    };

    if (method === 'GET') {
      body = null;
      if (typeof options.parameters === 'string') {
        url = addParamToUrl(url, options.parameters);
      }
    }

    xhr.open(method, url, true);

    if (method === 'POST' || method === 'PUT') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.send(body);
    return xhr;
  }

  fabric.util.request = request;
})();
/**
 * Wrapper around `console.log` (when available)
 * @param {*} [values] Values to log
 */
fabric.log = console.log;

/**
 * Wrapper around `console.warn` (when available)
 * @param {*} [values] Values to log as a warning
 */
fabric.warn = console.warn;
(function(global) {
  'use strict';

  /* Adaptation of work of Kevin Lindsey (kevin@kevlindev.com) */

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.Point) {
    fabric.warn('fabric.Point is already defined');
    return;
  }

  fabric.Point = Point;

  /**
   * Point class
   * @class fabric.Point
   * @memberOf fabric
   * @constructor
   * @param {Number} x
   * @param {Number} y
   * @return {fabric.Point} thisArg
   */
  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  Point.prototype = /** @lends fabric.Point.prototype */ {
    type: 'point',

    constructor: Point,

    /**
     * Adds another point to this one and returns another one
     * @param {fabric.Point} that
     * @return {fabric.Point} new Point instance with added values
     */
    add: function(that) {
      return new Point(this.x + that.x, this.y + that.y);
    },

    /**
     * Adds another point to this one
     * @param {fabric.Point} that
     * @return {fabric.Point} thisArg
     * @chainable
     */
    addEquals: function(that) {
      this.x += that.x;
      this.y += that.y;
      return this;
    },

    /**
     * Adds value to this point and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point} new Point with added value
     */
    scalarAdd: function(scalar) {
      return new Point(this.x + scalar, this.y + scalar);
    },

    /**
     * Adds value to this point
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     * @chainable
     */
    scalarAddEquals: function(scalar) {
      this.x += scalar;
      this.y += scalar;
      return this;
    },

    /**
     * Subtracts another point from this point and returns a new one
     * @param {fabric.Point} that
     * @return {fabric.Point} new Point object with subtracted values
     */
    subtract: function(that) {
      return new Point(this.x - that.x, this.y - that.y);
    },

    /**
     * Subtracts another point from this point
     * @param {fabric.Point} that
     * @return {fabric.Point} thisArg
     * @chainable
     */
    subtractEquals: function(that) {
      this.x -= that.x;
      this.y -= that.y;
      return this;
    },

    /**
     * Subtracts value from this point and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    scalarSubtract: function(scalar) {
      return new Point(this.x - scalar, this.y - scalar);
    },

    /**
     * Subtracts value from this point
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     * @chainable
     */
    scalarSubtractEquals: function(scalar) {
      this.x -= scalar;
      this.y -= scalar;
      return this;
    },

    /**
     * Multiplies this point by a value and returns a new one
     * TODO: rename in scalarMultiply in 2.0
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    multiply: function(scalar) {
      return new Point(this.x * scalar, this.y * scalar);
    },

    /**
     * Multiplies this point by a value
     * TODO: rename in scalarMultiplyEquals in 2.0
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     * @chainable
     */
    multiplyEquals: function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    },

    /**
     * Divides this point by a value and returns a new one
     * TODO: rename in scalarDivide in 2.0
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    divide: function(scalar) {
      return new Point(this.x / scalar, this.y / scalar);
    },

    /**
     * Divides this point by a value
     * TODO: rename in scalarDivideEquals in 2.0
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     * @chainable
     */
    divideEquals: function(scalar) {
      this.x /= scalar;
      this.y /= scalar;
      return this;
    },

    /**
     * Returns true if this point is equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    eq: function(that) {
      return this.x === that.x && this.y === that.y;
    },

    /**
     * Returns true if this point is less than another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    lt: function(that) {
      return this.x < that.x && this.y < that.y;
    },

    /**
     * Returns true if this point is less than or equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    lte: function(that) {
      return this.x <= that.x && this.y <= that.y;
    },

    /**

     * Returns true if this point is greater another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    gt: function(that) {
      return this.x > that.x && this.y > that.y;
    },

    /**
     * Returns true if this point is greater than or equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    gte: function(that) {
      return this.x >= that.x && this.y >= that.y;
    },

    /**
     * Returns new point which is the result of linear interpolation with this one and another one
     * @param {fabric.Point} that
     * @param {Number} t , position of interpolation, between 0 and 1 default 0.5
     * @return {fabric.Point}
     */
    lerp: function(that, t) {
      if (typeof t === 'undefined') {
        t = 0.5;
      }
      t = Math.max(Math.min(1, t), 0);
      return new Point(
        this.x + (that.x - this.x) * t,
        this.y + (that.y - this.y) * t
      );
    },

    /**
     * Returns distance from this point and another one
     * @param {fabric.Point} that
     * @return {Number}
     */
    distanceFrom: function(that) {
      var dx = this.x - that.x,
        dy = this.y - that.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Returns the point between this point and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    midPointFrom: function(that) {
      return this.lerp(that);
    },

    /**
     * Returns a new point which is the min of this and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    min: function(that) {
      return new Point(Math.min(this.x, that.x), Math.min(this.y, that.y));
    },

    /**
     * Returns a new point which is the max of this and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    max: function(that) {
      return new Point(Math.max(this.x, that.x), Math.max(this.y, that.y));
    },

    /**
     * Returns string representation of this point
     * @return {String}
     */
    toString: function() {
      return this.x + ',' + this.y;
    },

    /**
     * Sets x/y of this point
     * @param {Number} x
     * @param {Number} y
     * @chainable
     */
    setXY: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    /**
     * Sets x of this point
     * @param {Number} x
     * @chainable
     */
    setX: function(x) {
      this.x = x;
      return this;
    },

    /**
     * Sets y of this point
     * @param {Number} y
     * @chainable
     */
    setY: function(y) {
      this.y = y;
      return this;
    },

    /**
     * Sets x/y of this point from another point
     * @param {fabric.Point} that
     * @chainable
     */
    setFromPoint: function(that) {
      this.x = that.x;
      this.y = that.y;
      return this;
    },

    /**
     * Swaps x/y of this point and another point
     * @param {fabric.Point} that
     */
    swap: function(that) {
      var x = this.x,
        y = this.y;
      this.x = that.x;
      this.y = that.y;
      that.x = x;
      that.y = y;
    },

    /**
     * return a cloned instance of the point
     * @return {fabric.Point}
     */
    clone: function() {
      return new Point(this.x, this.y);
    }
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  /* Adaptation of work of Kevin Lindsey (kevin@kevlindev.com) */
  var fabric = global.fabric || (global.fabric = {});

  if (fabric.Intersection) {
    fabric.warn('fabric.Intersection is already defined');
    return;
  }

  /**
   * Intersection class
   * @class fabric.Intersection
   * @memberOf fabric
   * @constructor
   */
  function Intersection(status) {
    this.status = status;
    this.points = [];
  }

  fabric.Intersection = Intersection;

  fabric.Intersection.prototype = /** @lends fabric.Intersection.prototype */ {
    constructor: Intersection,

    /**
     * Appends a point to intersection
     * @param {fabric.Point} point
     * @return {fabric.Intersection} thisArg
     * @chainable
     */
    appendPoint: function(point) {
      this.points.push(point);
      return this;
    },

    /**
     * Appends points to intersection
     * @param {Array} points
     * @return {fabric.Intersection} thisArg
     * @chainable
     */
    appendPoints: function(points) {
      this.points = this.points.concat(points);
      return this;
    }
  };

  /**
   * Checks if one line intersects another
   * TODO: rename in intersectSegmentSegment
   * @static
   * @param {fabric.Point} a1
   * @param {fabric.Point} a2
   * @param {fabric.Point} b1
   * @param {fabric.Point} b2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectLineLine = function(a1, a2, b1, b2) {
    var result,
      uaT = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
      ubT = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
      uB = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (uB !== 0) {
      var ua = uaT / uB,
        ub = ubT / uB;
      if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        result = new Intersection('Intersection');
        result.appendPoint(
          new fabric.Point(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y))
        );
      } else {
        result = new Intersection();
      }
    } else {
      if (uaT === 0 || ubT === 0) {
        result = new Intersection('Coincident');
      } else {
        result = new Intersection('Parallel');
      }
    }
    return result;
  };

  /**
   * Checks if line intersects polygon
   * TODO: rename in intersectSegmentPolygon
   * fix detection of coincident
   * @static
   * @param {fabric.Point} a1
   * @param {fabric.Point} a2
   * @param {Array} points
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectLinePolygon = function(a1, a2, points) {
    var result = new Intersection(),
      length = points.length,
      b1,
      b2,
      inter,
      i;

    for (i = 0; i < length; i++) {
      b1 = points[i];
      b2 = points[(i + 1) % length];
      inter = Intersection.intersectLineLine(a1, a2, b1, b2);

      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = 'Intersection';
    }
    return result;
  };

  /**
   * Checks if polygon intersects another polygon
   * @static
   * @param {Array} points1
   * @param {Array} points2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectPolygonPolygon = function(points1, points2) {
    var result = new Intersection(),
      length = points1.length,
      i;

    for (i = 0; i < length; i++) {
      var a1 = points1[i],
        a2 = points1[(i + 1) % length],
        inter = Intersection.intersectLinePolygon(a1, a2, points2);

      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = 'Intersection';
    }
    return result;
  };

  /**
   * Checks if polygon intersects rectangle
   * @static
   * @param {Array} points
   * @param {fabric.Point} r1
   * @param {fabric.Point} r2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectPolygonRectangle = function(points, r1, r2) {
    var min = r1.min(r2),
      max = r1.max(r2),
      topRight = new fabric.Point(max.x, min.y),
      bottomLeft = new fabric.Point(min.x, max.y),
      inter1 = Intersection.intersectLinePolygon(min, topRight, points),
      inter2 = Intersection.intersectLinePolygon(topRight, max, points),
      inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points),
      inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points),
      result = new Intersection();

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = 'Intersection';
    }
    return result;
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.Color) {
    fabric.warn('fabric.Color is already defined.');
    return;
  }

  /**
   * Color class
   * The purpose of {@link fabric.Color} is to abstract and encapsulate common color operations;
   * {@link fabric.Color} is a constructor and creates instances of {@link fabric.Color} objects.
   *
   * @class fabric.Color
   * @param {String} color optional in hex or rgb(a) or hsl format or from known color list
   * @return {fabric.Color} thisArg
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2/#colors}
   */
  function Color(color) {
    if (!color) {
      this.setSource([0, 0, 0, 1]);
    } else {
      this._tryParsingColor(color);
    }
  }

  fabric.Color = Color;

  fabric.Color.prototype = /** @lends fabric.Color.prototype */ {
    /**
     * @private
     * @param {String|Array} color Color value to parse
     */
    _tryParsingColor: function(color) {
      var source;

      if (color in Color.colorNameMap) {
        color = Color.colorNameMap[color];
      }

      if (color === 'transparent') {
        source = [255, 255, 255, 0];
      }

      if (!source) {
        source = Color.sourceFromHex(color);
      }
      if (!source) {
        source = Color.sourceFromRgb(color);
      }
      if (!source) {
        source = Color.sourceFromHsl(color);
      }
      if (!source) {
        //if color is not recognize let's make black as canvas does
        source = [0, 0, 0, 1];
      }
      if (source) {
        this.setSource(source);
      }
    },

    /**
     * Adapted from <a href="https://rawgithub.com/mjijackson/mjijackson.github.com/master/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript.html">https://github.com/mjijackson</a>
     * @private
     * @param {Number} r Red color value
     * @param {Number} g Green color value
     * @param {Number} b Blue color value
     * @return {Array} Hsl color
     */
    _rgbToHsl: function(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      var h,
        s,
        l,
        max = fabric.util.array.max([r, g, b]),
        min = fabric.util.array.min([r, g, b]);

      l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },

    /**
     * Returns source of this color (where source is an array representation; ex: [200, 200, 100, 1])
     * @return {Array}
     */
    getSource: function() {
      return this._source;
    },

    /**
     * Sets source of this color (where source is an array representation; ex: [200, 200, 100, 1])
     * @param {Array} source
     */
    setSource: function(source) {
      this._source = source;
    },

    /**
     * Returns color representation in RGB format
     * @return {String} ex: rgb(0-255,0-255,0-255)
     */
    toRgb: function() {
      var source = this.getSource();
      return 'rgb(' + source[0] + ',' + source[1] + ',' + source[2] + ')';
    },

    /**
     * Returns color representation in RGBA format
     * @return {String} ex: rgba(0-255,0-255,0-255,0-1)
     */
    toRgba: function() {
      var source = this.getSource();
      return (
        'rgba(' +
        source[0] +
        ',' +
        source[1] +
        ',' +
        source[2] +
        ',' +
        source[3] +
        ')'
      );
    },

    /**
     * Returns color representation in HSL format
     * @return {String} ex: hsl(0-360,0%-100%,0%-100%)
     */
    toHsl: function() {
      var source = this.getSource(),
        hsl = this._rgbToHsl(source[0], source[1], source[2]);

      return 'hsl(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%)';
    },

    /**
     * Returns color representation in HSLA format
     * @return {String} ex: hsla(0-360,0%-100%,0%-100%,0-1)
     */
    toHsla: function() {
      var source = this.getSource(),
        hsl = this._rgbToHsl(source[0], source[1], source[2]);

      return (
        'hsla(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%,' + source[3] + ')'
      );
    },

    /**
     * Returns color representation in HEX format
     * @return {String} ex: FF5555
     */
    toHex: function() {
      var source = this.getSource(),
        r,
        g,
        b;

      r = source[0].toString(16);
      r = r.length === 1 ? '0' + r : r;

      g = source[1].toString(16);
      g = g.length === 1 ? '0' + g : g;

      b = source[2].toString(16);
      b = b.length === 1 ? '0' + b : b;

      return r.toUpperCase() + g.toUpperCase() + b.toUpperCase();
    },

    /**
     * Returns color representation in HEXA format
     * @return {String} ex: FF5555CC
     */
    toHexa: function() {
      var source = this.getSource(),
        a;

      a = Math.round(source[3] * 255);
      a = a.toString(16);
      a = a.length === 1 ? '0' + a : a;

      return this.toHex() + a.toUpperCase();
    },

    /**
     * Gets value of alpha channel for this color
     * @return {Number} 0-1
     */
    getAlpha: function() {
      return this.getSource()[3];
    },

    /**
     * Sets value of alpha channel for this color
     * @param {Number} alpha Alpha value 0-1
     * @return {fabric.Color} thisArg
     */
    setAlpha: function(alpha) {
      var source = this.getSource();
      source[3] = alpha;
      this.setSource(source);
      return this;
    },

    /**
     * Transforms color to its grayscale representation
     * @return {fabric.Color} thisArg
     */
    toGrayscale: function() {
      var source = this.getSource(),
        average = parseInt(
          (source[0] * 0.3 + source[1] * 0.59 + source[2] * 0.11).toFixed(0),
          10
        ),
        currentAlpha = source[3];
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },

    /**
     * Transforms color to its black and white representation
     * @param {Number} threshold
     * @return {fabric.Color} thisArg
     */
    toBlackWhite: function(threshold) {
      var source = this.getSource(),
        average = (
          source[0] * 0.3 +
          source[1] * 0.59 +
          source[2] * 0.11
        ).toFixed(0),
        currentAlpha = source[3];

      threshold = threshold || 127;

      average = Number(average) < Number(threshold) ? 0 : 255;
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },

    /**
     * Overlays color with another color
     * @param {String|fabric.Color} otherColor
     * @return {fabric.Color} thisArg
     */
    overlayWith: function(otherColor) {
      if (!(otherColor instanceof Color)) {
        otherColor = new Color(otherColor);
      }

      var result = [],
        alpha = this.getAlpha(),
        otherAlpha = 0.5,
        source = this.getSource(),
        otherSource = otherColor.getSource(),
        i;

      for (i = 0; i < 3; i++) {
        result.push(
          Math.round(source[i] * (1 - otherAlpha) + otherSource[i] * otherAlpha)
        );
      }

      result[3] = alpha;
      this.setSource(result);
      return this;
    }
  };

  /**
   * Regex matching color in RGB or RGBA formats (ex: rgb(0, 0, 0), rgba(255, 100, 10, 0.5), rgba( 255 , 100 , 10 , 0.5 ), rgb(1,1,1), rgba(100%, 60%, 10%, 0.5))
   * @static
   * @field
   * @memberOf fabric.Color
   */
  // eslint-disable-next-line max-len
  fabric.Color.reRGBa = /^rgba?\(\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*(?:\s*,\s*((?:\d*\.?\d+)?)\s*)?\)$/i;

  /**
   * Regex matching color in HSL or HSLA formats (ex: hsl(200, 80%, 10%), hsla(300, 50%, 80%, 0.5), hsla( 300 , 50% , 80% , 0.5 ))
   * @static
   * @field
   * @memberOf fabric.Color
   */
  fabric.Color.reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/i;

  /**
   * Regex matching color in HEX format (ex: #FF5544CC, #FF5555, 010155, aff)
   * @static
   * @field
   * @memberOf fabric.Color
   */
  fabric.Color.reHex = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;

  /**
   * Map of the 148 color names with HEX code
   * @static
   * @field
   * @memberOf fabric.Color
   * @see: https://www.w3.org/TR/css3-color/#svg-color
   */
  fabric.Color.colorNameMap = {
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgrey: '#A9A9A9',
    darkgreen: '#006400',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgrey: '#D3D3D3',
    lightgreen: '#90EE90',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32'
  };

  /**
   * @private
   * @param {Number} p
   * @param {Number} q
   * @param {Number} t
   * @return {Number}
   */
  function hue2rgb(p, q, t) {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  }

  /**
   * Returns new color object, when given a color in RGB format
   * @memberOf fabric.Color
   * @param {String} color Color value ex: rgb(0-255,0-255,0-255)
   * @return {fabric.Color}
   */
  fabric.Color.fromRgb = function(color) {
    return Color.fromSource(Color.sourceFromRgb(color));
  };

  /**
   * Returns array representation (ex: [100, 100, 200, 1]) of a color that's in RGB or RGBA format
   * @memberOf fabric.Color
   * @param {String} color Color value ex: rgb(0-255,0-255,0-255), rgb(0%-100%,0%-100%,0%-100%)
   * @return {Array} source
   */
  fabric.Color.sourceFromRgb = function(color) {
    var match = color.match(Color.reRGBa);
    if (match) {
      var r =
          (parseInt(match[1], 10) / (/%$/.test(match[1]) ? 100 : 1)) *
          (/%$/.test(match[1]) ? 255 : 1),
        g =
          (parseInt(match[2], 10) / (/%$/.test(match[2]) ? 100 : 1)) *
          (/%$/.test(match[2]) ? 255 : 1),
        b =
          (parseInt(match[3], 10) / (/%$/.test(match[3]) ? 100 : 1)) *
          (/%$/.test(match[3]) ? 255 : 1);

      return [
        parseInt(r, 10),
        parseInt(g, 10),
        parseInt(b, 10),
        match[4] ? parseFloat(match[4]) : 1
      ];
    }
  };

  /**
   * Returns new color object, when given a color in RGBA format
   * @static
   * @function
   * @memberOf fabric.Color
   * @param {String} color
   * @return {fabric.Color}
   */
  fabric.Color.fromRgba = Color.fromRgb;

  /**
   * Returns new color object, when given a color in HSL format
   * @param {String} color Color value ex: hsl(0-260,0%-100%,0%-100%)
   * @memberOf fabric.Color
   * @return {fabric.Color}
   */
  fabric.Color.fromHsl = function(color) {
    return Color.fromSource(Color.sourceFromHsl(color));
  };

  /**
   * Returns array representation (ex: [100, 100, 200, 1]) of a color that's in HSL or HSLA format.
   * Adapted from <a href="https://rawgithub.com/mjijackson/mjijackson.github.com/master/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript.html">https://github.com/mjijackson</a>
   * @memberOf fabric.Color
   * @param {String} color Color value ex: hsl(0-360,0%-100%,0%-100%) or hsla(0-360,0%-100%,0%-100%, 0-1)
   * @return {Array} source
   * @see http://http://www.w3.org/TR/css3-color/#hsl-color
   */
  fabric.Color.sourceFromHsl = function(color) {
    var match = color.match(Color.reHSLa);
    if (!match) {
      return;
    }

    var h = (((parseFloat(match[1]) % 360) + 360) % 360) / 360,
      s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1),
      l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1),
      r,
      g,
      b;

    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l <= 0.5 ? l * (s + 1) : l + s - l * s,
        p = l * 2 - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      match[4] ? parseFloat(match[4]) : 1
    ];
  };

  /**
   * Returns new color object, when given a color in HSLA format
   * @static
   * @function
   * @memberOf fabric.Color
   * @param {String} color
   * @return {fabric.Color}
   */
  fabric.Color.fromHsla = Color.fromHsl;

  /**
   * Returns new color object, when given a color in HEX format
   * @static
   * @memberOf fabric.Color
   * @param {String} color Color value ex: FF5555
   * @return {fabric.Color}
   */
  fabric.Color.fromHex = function(color) {
    return Color.fromSource(Color.sourceFromHex(color));
  };

  /**
   * Returns array representation (ex: [100, 100, 200, 1]) of a color that's in HEX format
   * @static
   * @memberOf fabric.Color
   * @param {String} color ex: FF5555 or FF5544CC (RGBa)
   * @return {Array} source
   */
  fabric.Color.sourceFromHex = function(color) {
    if (color.match(Color.reHex)) {
      var value = color.slice(color.indexOf('#') + 1),
        isShortNotation = value.length === 3 || value.length === 4,
        isRGBa = value.length === 8 || value.length === 4,
        r = isShortNotation
          ? value.charAt(0) + value.charAt(0)
          : value.substring(0, 2),
        g = isShortNotation
          ? value.charAt(1) + value.charAt(1)
          : value.substring(2, 4),
        b = isShortNotation
          ? value.charAt(2) + value.charAt(2)
          : value.substring(4, 6),
        a = isRGBa
          ? isShortNotation
            ? value.charAt(3) + value.charAt(3)
            : value.substring(6, 8)
          : 'FF';

      return [
        parseInt(r, 16),
        parseInt(g, 16),
        parseInt(b, 16),
        parseFloat((parseInt(a, 16) / 255).toFixed(2))
      ];
    }
  };

  /**
   * Returns new color object, when given color in array representation (ex: [200, 100, 100, 0.5])
   * @static
   * @memberOf fabric.Color
   * @param {Array} source
   * @return {fabric.Color}
   */
  fabric.Color.fromSource = function(source) {
    var oColor = new Color();
    oColor.setSource(source);
    return oColor;
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {}),
    scaleMap = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne', 'e'],
    skewMap = ['ns', 'nesw', 'ew', 'nwse'],
    controls = {},
    LEFT = 'left',
    TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    CENTER = 'center',
    opposite = {
      top: BOTTOM,
      bottom: TOP,
      left: RIGHT,
      right: LEFT,
      center: CENTER
    },
    radiansToDegrees = fabric.util.radiansToDegrees,
    sign =
      Math.sign ||
      function(x) {
        return (x > 0) - (x < 0) || +x;
      };

  /**
   * Combine control position and object angle to find the control direction compared
   * to the object center.
   * @param {fabric.Object} fabricObject the fabric object for which we are rendering controls
   * @param {fabric.Control} control the control class
   * @return {Number} 0 - 7 a quadrant number
   */
  function findCornerQuadrant(fabricObject, control) {
    var cornerAngle =
      fabricObject.angle +
      radiansToDegrees(Math.atan2(control.y, control.x)) +
      360;
    return Math.round((cornerAngle % 360) / 45);
  }

  function fireEvent(eventName, options) {
    var target = options.transform.target,
      canvas = target.canvas,
      canvasOptions = fabric.util.object.clone(options);
    canvasOptions.target = target;
    canvas && canvas.fire('object:' + eventName, canvasOptions);
    target.fire(eventName, options);
  }

  /**
   * Inspect event and fabricObject properties to understand if the scaling action
   * @param {Event} eventData from the user action
   * @param {fabric.Object} fabricObject the fabric object about to scale
   * @return {Boolean} true if scale is proportional
   */
  function scaleIsProportional(eventData, fabricObject) {
    var canvas = fabricObject.canvas,
      uniScaleKey = canvas.uniScaleKey,
      uniformIsToggled = eventData[uniScaleKey];
    return (
      (canvas.uniformScaling && !uniformIsToggled) ||
      (!canvas.uniformScaling && uniformIsToggled)
    );
  }

  /**
   * Checks if transform is centered
   * @param {Object} transform transform data
   * @return {Boolean} true if transform is centered
   */
  function isTransformCentered(transform) {
    return transform.originX === CENTER && transform.originY === CENTER;
  }

  /**
   * Inspect fabricObject to understand if the current scaling action is allowed
   * @param {fabric.Object} fabricObject the fabric object about to scale
   * @param {String} by 'x' or 'y' or ''
   * @param {Boolean} scaleProportionally true if we are trying to scale proportionally
   * @return {Boolean} true if scaling is not allowed at current conditions
   */
  function scalingIsForbidden(fabricObject, by, scaleProportionally) {
    var lockX = fabricObject.lockScalingX,
      lockY = fabricObject.lockScalingY;
    if (lockX && lockY) {
      return true;
    }
    if (!by && (lockX || lockY) && scaleProportionally) {
      return true;
    }
    if (lockX && by === 'x') {
      return true;
    }
    if (lockY && by === 'y') {
      return true;
    }
    return false;
  }

  /**
   * return the correct cursor style for the scale action
   * @param {Event} eventData the javascript event that is causing the scale
   * @param {fabric.Control} control the control that is interested in the action
   * @param {fabric.Object} fabricObject the fabric object that is interested in the action
   * @return {String} a valid css string for the cursor
   */
  function scaleCursorStyleHandler(eventData, control, fabricObject) {
    var notAllowed = 'not-allowed',
      scaleProportionally = scaleIsProportional(eventData, fabricObject),
      by = '';
    if (control.x !== 0 && control.y === 0) {
      by = 'x';
    } else if (control.x === 0 && control.y !== 0) {
      by = 'y';
    }
    if (scalingIsForbidden(fabricObject, by, scaleProportionally)) {
      return notAllowed;
    }
    var n = findCornerQuadrant(fabricObject, control);
    return scaleMap[n] + '-resize';
  }

  /**
   * return the correct cursor style for the skew action
   * @param {Event} eventData the javascript event that is causing the scale
   * @param {fabric.Control} control the control that is interested in the action
   * @param {fabric.Object} fabricObject the fabric object that is interested in the action
   * @return {String} a valid css string for the cursor
   */
  function skewCursorStyleHandler(eventData, control, fabricObject) {
    var notAllowed = 'not-allowed';
    if (control.x !== 0 && fabricObject.lockSkewingY) {
      return notAllowed;
    }
    if (control.y !== 0 && fabricObject.lockSkewingX) {
      return notAllowed;
    }
    var n = findCornerQuadrant(fabricObject, control) % 4;
    return skewMap[n] + '-resize';
  }

  /**
   * Combine skew and scale style handlers to cover fabric standard use case
   * @param {Event} eventData the javascript event that is causing the scale
   * @param {fabric.Control} control the control that is interested in the action
   * @param {fabric.Object} fabricObject the fabric object that is interested in the action
   * @return {String} a valid css string for the cursor
   */
  function scaleSkewCursorStyleHandler(eventData, control, fabricObject) {
    if (eventData[fabricObject.canvas.altActionKey]) {
      return controls.skewCursorStyleHandler(eventData, control, fabricObject);
    }
    return controls.scaleCursorStyleHandler(eventData, control, fabricObject);
  }

  /**
   * Inspect event, control and fabricObject to return the correct action name
   * @param {Event} eventData the javascript event that is causing the scale
   * @param {fabric.Control} control the control that is interested in the action
   * @param {fabric.Object} fabricObject the fabric object that is interested in the action
   * @return {String} an action name
   */
  function scaleOrSkewActionName(eventData, control, fabricObject) {
    var isAlternative = eventData[fabricObject.canvas.altActionKey];
    if (control.x === 0) {
      // then is scaleY or skewX
      return isAlternative ? 'skewX' : 'scaleY';
    }
    if (control.y === 0) {
      // then is scaleY or skewX
      return isAlternative ? 'skewY' : 'scaleX';
    }
  }

  /**
   * Find the correct style for the control that is used for rotation.
   * this function is very simple and it just take care of not-allowed or standard cursor
   * @param {Event} eventData the javascript event that is causing the scale
   * @param {fabric.Control} control the control that is interested in the action
   * @param {fabric.Object} fabricObject the fabric object that is interested in the action
   * @return {String} a valid css string for the cursor
   */
  function rotationStyleHandler(eventData, control, fabricObject) {
    if (fabricObject.lockRotation) {
      return 'not-allowed';
    }
    return control.cursorStyle;
  }

  function commonEventInfo(eventData, transform, x, y) {
    return {
      e: eventData,
      transform: transform,
      pointer: {
        x: x,
        y: y
      }
    };
  }

  /**
   * Wrap an action handler with saving/restoring object position on the transform.
   * this is the code that permits to objects to keep their position while transforming.
   * @param {Function} actionHandler the function to wrap
   * @return {Function} a function with an action handler signature
   */
  function wrapWithFixedAnchor(actionHandler) {
    return function(eventData, transform, x, y) {
      var target = transform.target,
        centerPoint = target.getCenterPoint(),
        constraint = target.translateToOriginPoint(
          centerPoint,
          transform.originX,
          transform.originY
        ),
        actionPerformed = actionHandler(eventData, transform, x, y);
      target.setPositionByOrigin(
        constraint,
        transform.originX,
        transform.originY
      );
      return actionPerformed;
    };
  }

  /**
   * Transforms a point described by x and y in a distance from the top left corner of the object
   * bounding box.
   * @param {Object} transform
   * @param {String} originX
   * @param {String} originY
   * @param {number} x
   * @param {number} y
   * @return {Fabric.Point} the normalized point
   */
  function getLocalPoint(transform, originX, originY, x, y) {
    var target = transform.target,
      control = target.controls[transform.corner],
      zoom = target.canvas.getZoom(),
      padding = target.padding / zoom,
      localPoint = target.toLocalPoint(
        new fabric.Point(x, y),
        originX,
        originY
      );
    if (localPoint.x >= padding) {
      localPoint.x -= padding;
    }
    if (localPoint.x <= -padding) {
      localPoint.x += padding;
    }
    if (localPoint.y >= padding) {
      localPoint.y -= padding;
    }
    if (localPoint.y <= padding) {
      localPoint.y += padding;
    }
    localPoint.x -= control.offsetX;
    localPoint.y -= control.offsetY;
    return localPoint;
  }

  /**
   * Detect if the fabric object is flipped on one side.
   * @param {fabric.Object} target
   * @return {Boolean} true if one flip, but not two.
   */
  function targetHasOneFlip(target) {
    return target.flipX !== target.flipY;
  }

  /**
   * Utility function to compensate the scale factor when skew is applied on both axes
   * @private
   */
  function compensateScaleForSkew(
    target,
    oppositeSkew,
    scaleToCompensate,
    axis,
    reference
  ) {
    if (target[oppositeSkew] !== 0) {
      var newDim = target._getTransformedDimensions()[axis];
      var newValue = (reference / newDim) * target[scaleToCompensate];
      target.set(scaleToCompensate, newValue);
    }
  }

  /**
   * Action handler for skewing on the X axis
   * @private
   */
  function skewObjectX(eventData, transform, x, y) {
    var target = transform.target,
      // find how big the object would be, if there was no skewX. takes in account scaling
      dimNoSkew = target._getTransformedDimensions(0, target.skewY),
      localPoint = getLocalPoint(
        transform,
        transform.originX,
        transform.originY,
        x,
        y
      ),
      // the mouse is in the center of the object, and we want it to stay there.
      // so the object will grow twice as much as the mouse.
      // this makes the skew growth to localPoint * 2 - dimNoSkew.
      totalSkewSize = Math.abs(localPoint.x * 2) - dimNoSkew.x,
      currentSkew = target.skewX,
      newSkew;
    if (totalSkewSize < 2) {
      // let's make it easy to go back to position 0.
      newSkew = 0;
    } else {
      newSkew = radiansToDegrees(
        Math.atan2(totalSkewSize / target.scaleX, dimNoSkew.y / target.scaleY)
      );
      // now we have to find the sign of the skew.
      // it mostly depend on the origin of transformation.
      if (transform.originX === LEFT && transform.originY === BOTTOM) {
        newSkew = -newSkew;
      }
      if (transform.originX === RIGHT && transform.originY === TOP) {
        newSkew = -newSkew;
      }
      if (targetHasOneFlip(target)) {
        newSkew = -newSkew;
      }
    }
    var hasSkewed = currentSkew !== newSkew;
    if (hasSkewed) {
      var dimBeforeSkewing = target._getTransformedDimensions().y;
      target.set('skewX', newSkew);
      compensateScaleForSkew(target, 'skewY', 'scaleY', 'y', dimBeforeSkewing);
      fireEvent('skewing', commonEventInfo(eventData, transform, x, y));
    }
    return hasSkewed;
  }

  /**
   * Action handler for skewing on the Y axis
   * @private
   */
  function skewObjectY(eventData, transform, x, y) {
    var target = transform.target,
      // find how big the object would be, if there was no skewX. takes in account scaling
      dimNoSkew = target._getTransformedDimensions(target.skewX, 0),
      localPoint = getLocalPoint(
        transform,
        transform.originX,
        transform.originY,
        x,
        y
      ),
      // the mouse is in the center of the object, and we want it to stay there.
      // so the object will grow twice as much as the mouse.
      // this makes the skew growth to localPoint * 2 - dimNoSkew.
      totalSkewSize = Math.abs(localPoint.y * 2) - dimNoSkew.y,
      currentSkew = target.skewY,
      newSkew;
    if (totalSkewSize < 2) {
      // let's make it easy to go back to position 0.
      newSkew = 0;
    } else {
      newSkew = radiansToDegrees(
        Math.atan2(totalSkewSize / target.scaleY, dimNoSkew.x / target.scaleX)
      );
      // now we have to find the sign of the skew.
      // it mostly depend on the origin of transformation.
      if (transform.originX === LEFT && transform.originY === BOTTOM) {
        newSkew = -newSkew;
      }
      if (transform.originX === RIGHT && transform.originY === TOP) {
        newSkew = -newSkew;
      }
      if (targetHasOneFlip(target)) {
        newSkew = -newSkew;
      }
    }
    var hasSkewed = currentSkew !== newSkew;
    if (hasSkewed) {
      var dimBeforeSkewing = target._getTransformedDimensions().x;
      target.set('skewY', newSkew);
      compensateScaleForSkew(target, 'skewX', 'scaleX', 'x', dimBeforeSkewing);
      fireEvent('skewing', commonEventInfo(eventData, transform, x, y));
    }
    return hasSkewed;
  }

  /**
   * Wrapped Action handler for skewing on the Y axis, takes care of the
   * skew direction and determine the correct transform origin for the anchor point
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function skewHandlerX(eventData, transform, x, y) {
    // step1 figure out and change transform origin.
    // if skewX > 0 and originY bottom we anchor on right
    // if skewX > 0 and originY top we anchor on left
    // if skewX < 0 and originY bottom we anchor on left
    // if skewX < 0 and originY top we anchor on right
    // if skewX is 0, we look for mouse position to understand where are we going.
    var target = transform.target,
      currentSkew = target.skewX,
      originX,
      originY = transform.originY;
    if (target.lockSkewingX) {
      return false;
    }
    if (currentSkew === 0) {
      var localPointFromCenter = getLocalPoint(transform, CENTER, CENTER, x, y);
      if (localPointFromCenter.x > 0) {
        // we are pulling right, anchor left;
        originX = LEFT;
      } else {
        // we are pulling right, anchor right
        originX = RIGHT;
      }
    } else {
      if (currentSkew > 0) {
        originX = originY === TOP ? LEFT : RIGHT;
      }
      if (currentSkew < 0) {
        originX = originY === TOP ? RIGHT : LEFT;
      }
      // is the object flipped on one side only? swap the origin.
      if (targetHasOneFlip(target)) {
        originX = originX === LEFT ? RIGHT : LEFT;
      }
    }

    // once we have the origin, we find the anchor point
    transform.originX = originX;
    var finalHandler = wrapWithFixedAnchor(skewObjectX);
    return finalHandler(eventData, transform, x, y);
  }

  /**
   * Wrapped Action handler for skewing on the Y axis, takes care of the
   * skew direction and determine the correct transform origin for the anchor point
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function skewHandlerY(eventData, transform, x, y) {
    // step1 figure out and change transform origin.
    // if skewY > 0 and originX left we anchor on top
    // if skewY > 0 and originX right we anchor on bottom
    // if skewY < 0 and originX left we anchor on bottom
    // if skewY < 0 and originX right we anchor on top
    // if skewY is 0, we look for mouse position to understand where are we going.
    var target = transform.target,
      currentSkew = target.skewY,
      originY,
      originX = transform.originX;
    if (target.lockSkewingY) {
      return false;
    }
    if (currentSkew === 0) {
      var localPointFromCenter = getLocalPoint(transform, CENTER, CENTER, x, y);
      if (localPointFromCenter.y > 0) {
        // we are pulling down, anchor up;
        originY = TOP;
      } else {
        // we are pulling up, anchor down
        originY = BOTTOM;
      }
    } else {
      if (currentSkew > 0) {
        originY = originX === LEFT ? TOP : BOTTOM;
      }
      if (currentSkew < 0) {
        originY = originX === LEFT ? BOTTOM : TOP;
      }
      // is the object flipped on one side only? swap the origin.
      if (targetHasOneFlip(target)) {
        originY = originY === TOP ? BOTTOM : TOP;
      }
    }

    // once we have the origin, we find the anchor point
    transform.originY = originY;
    var finalHandler = wrapWithFixedAnchor(skewObjectY);
    return finalHandler(eventData, transform, x, y);
  }

  /**
   * Action handler for rotation and snapping, without anchor point.
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   * @private
   */
  function rotationWithSnapping(eventData, transform, x, y) {
    var t = transform,
      target = t.target,
      pivotPoint = target.translateToOriginPoint(
        target.getCenterPoint(),
        t.originX,
        t.originY
      );

    if (target.lockRotation) {
      return false;
    }

    var lastAngle = Math.atan2(t.ey - pivotPoint.y, t.ex - pivotPoint.x),
      curAngle = Math.atan2(y - pivotPoint.y, x - pivotPoint.x),
      angle = radiansToDegrees(curAngle - lastAngle + t.theta),
      hasRotated = true;

    if (target.snapAngle > 0) {
      var snapAngle = target.snapAngle,
        snapThreshold = target.snapThreshold || snapAngle,
        rightAngleLocked = Math.ceil(angle / snapAngle) * snapAngle,
        leftAngleLocked = Math.floor(angle / snapAngle) * snapAngle;

      if (Math.abs(angle - leftAngleLocked) < snapThreshold) {
        angle = leftAngleLocked;
      } else if (Math.abs(angle - rightAngleLocked) < snapThreshold) {
        angle = rightAngleLocked;
      }
    }

    // normalize angle to positive value
    if (angle < 0) {
      angle = 360 + angle;
    }
    angle %= 360;

    hasRotated = target.angle !== angle;
    target.angle = angle;
    if (hasRotated) {
      fireEvent('rotating', commonEventInfo(eventData, transform, x, y));
    }
    return hasRotated;
  }

  /**
   * Basic scaling logic, reused with different constrain for scaling X,Y, freely or equally.
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @param {Object} options additional information for scaling
   * @param {String} options.by 'x', 'y', 'equally' or '' to indicate type of scaling
   * @return {Boolean} true if some change happened
   * @private
   */
  function scaleObject(eventData, transform, x, y, options) {
    options = options || {};
    var target = transform.target,
      lockScalingX = target.lockScalingX,
      lockScalingY = target.lockScalingY,
      by = options.by,
      newPoint,
      scaleX,
      scaleY,
      dim,
      scaleProportionally = scaleIsProportional(eventData, target),
      forbidScaling = scalingIsForbidden(target, by, scaleProportionally),
      signX,
      signY,
      gestureScale = transform.gestureScale;

    if (forbidScaling) {
      return false;
    }
    if (gestureScale) {
      scaleX = transform.scaleX * gestureScale;
      scaleY = transform.scaleY * gestureScale;
    } else {
      newPoint = getLocalPoint(
        transform,
        transform.originX,
        transform.originY,
        x,
        y
      );
      // use of sign: We use sign to detect change of direction of an action. sign usually change when
      // we cross the origin point with the mouse. So a scale flip for example. There is an issue when scaling
      // by center and scaling using one middle control ( default: mr, mt, ml, mb), the mouse movement can easily
      // cross many time the origin point and flip the object. so we need a way to filter out the noise.
      // This ternary here should be ok to filter out X scaling when we want Y only and vice versa.
      signX = by !== 'y' ? sign(newPoint.x) : 1;
      signY = by !== 'x' ? sign(newPoint.y) : 1;
      if (!transform.signX) {
        transform.signX = signX;
      }
      if (!transform.signY) {
        transform.signY = signY;
      }

      if (
        target.lockScalingFlip &&
        (transform.signX !== signX || transform.signY !== signY)
      ) {
        return false;
      }

      dim = target._getTransformedDimensions();
      // missing detection of flip and logic to switch the origin
      if (scaleProportionally && !by) {
        // uniform scaling
        var distance = Math.abs(newPoint.x) + Math.abs(newPoint.y),
          original = transform.original,
          originalDistance =
            Math.abs((dim.x * original.scaleX) / target.scaleX) +
            Math.abs((dim.y * original.scaleY) / target.scaleY),
          scale = distance / originalDistance,
          hasScaled;
        scaleX = original.scaleX * scale;
        scaleY = original.scaleY * scale;
      } else {
        scaleX = Math.abs((newPoint.x * target.scaleX) / dim.x);
        scaleY = Math.abs((newPoint.y * target.scaleY) / dim.y);
      }
      // if we are scaling by center, we need to double the scale
      if (isTransformCentered(transform)) {
        scaleX *= 2;
        scaleY *= 2;
      }
      if (transform.signX !== signX && by !== 'y') {
        transform.originX = opposite[transform.originX];
        scaleX *= -1;
        transform.signX = signX;
      }
      if (transform.signY !== signY && by !== 'x') {
        transform.originY = opposite[transform.originY];
        scaleY *= -1;
        transform.signY = signY;
      }
    }
    // minScale is taken are in the setter.
    var oldScaleX = target.scaleX,
      oldScaleY = target.scaleY;
    if (!by) {
      !lockScalingX && target.set('scaleX', scaleX);
      !lockScalingY && target.set('scaleY', scaleY);
    } else {
      // forbidden cases already handled on top here.
      by === 'x' && target.set('scaleX', scaleX);
      by === 'y' && target.set('scaleY', scaleY);
    }
    hasScaled = oldScaleX !== target.scaleX || oldScaleY !== target.scaleY;
    if (hasScaled) {
      fireEvent('scaling', commonEventInfo(eventData, transform, x, y));
    }
    return hasScaled;
  }

  /**
   * Generic scaling logic, to scale from corners either equally or freely.
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function scaleObjectFromCorner(eventData, transform, x, y) {
    return scaleObject(eventData, transform, x, y);
  }

  /**
   * Scaling logic for the X axis.
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function scaleObjectX(eventData, transform, x, y) {
    return scaleObject(eventData, transform, x, y, { by: 'x' });
  }

  /**
   * Scaling logic for the Y axis.
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function scaleObjectY(eventData, transform, x, y) {
    return scaleObject(eventData, transform, x, y, { by: 'y' });
  }

  /**
   * Composed action handler to either scale Y or skew X
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function scalingYOrSkewingX(eventData, transform, x, y) {
    // ok some safety needed here.
    if (eventData[transform.target.canvas.altActionKey]) {
      return controls.skewHandlerX(eventData, transform, x, y);
    }
    return controls.scalingY(eventData, transform, x, y);
  }

  /**
   * Composed action handler to either scale X or skew Y
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function scalingXOrSkewingY(eventData, transform, x, y) {
    // ok some safety needed here.
    if (eventData[transform.target.canvas.altActionKey]) {
      return controls.skewHandlerY(eventData, transform, x, y);
    }
    return controls.scalingX(eventData, transform, x, y);
  }

  /**
   * Action handler to change textbox width
   * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if some change happened
   */
  function changeWidth(eventData, transform, x, y) {
    var target = transform.target,
      localPoint = getLocalPoint(
        transform,
        transform.originX,
        transform.originY,
        x,
        y
      ),
      strokePadding =
        target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldWidth = target.width,
      hasResized,
      newWidth =
        Math.abs((localPoint.x * multiplier) / target.scaleX) - strokePadding;
    target.set('width', Math.max(newWidth, 0));
    hasResized = oldWidth !== newWidth;
    if (hasResized) {
      fireEvent('resizing', commonEventInfo(eventData, transform, x, y));
    }
    return hasResized;
  }

  /**
   * Action handler
   * @private
   * @param {Event} eventData javascript event that is doing the transform
   * @param {Object} transform javascript object containing a series of information around the current transform
   * @param {number} x current mouse x position, canvas normalized
   * @param {number} y current mouse y position, canvas normalized
   * @return {Boolean} true if the translation occurred
   */
  function dragHandler(eventData, transform, x, y) {
    var target = transform.target,
      newLeft = x - transform.offsetX,
      newTop = y - transform.offsetY,
      moveX = !target.get('lockMovementX') && target.left !== newLeft,
      moveY = !target.get('lockMovementY') && target.top !== newTop;
    moveX && target.set('left', newLeft);
    moveY && target.set('top', newTop);
    if (moveX || moveY) {
      fireEvent('moving', commonEventInfo(eventData, transform, x, y));
    }
    return moveX || moveY;
  }

  controls.scaleCursorStyleHandler = scaleCursorStyleHandler;
  controls.skewCursorStyleHandler = skewCursorStyleHandler;
  controls.scaleSkewCursorStyleHandler = scaleSkewCursorStyleHandler;
  controls.rotationWithSnapping = wrapWithFixedAnchor(rotationWithSnapping);
  controls.scalingEqually = wrapWithFixedAnchor(scaleObjectFromCorner);
  controls.scalingX = wrapWithFixedAnchor(scaleObjectX);
  controls.scalingY = wrapWithFixedAnchor(scaleObjectY);
  controls.scalingYOrSkewingX = scalingYOrSkewingX;
  controls.scalingXOrSkewingY = scalingXOrSkewingY;
  controls.changeWidth = wrapWithFixedAnchor(changeWidth);
  controls.skewHandlerX = skewHandlerX;
  controls.skewHandlerY = skewHandlerY;
  controls.dragHandler = dragHandler;
  controls.scaleOrSkewActionName = scaleOrSkewActionName;
  controls.rotationStyleHandler = rotationStyleHandler;
  controls.fireEvent = fireEvent;
  controls.wrapWithFixedAnchor = wrapWithFixedAnchor;
  controls.getLocalPoint = getLocalPoint;
  fabric.controlsUtils = controls;
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {}),
    degreesToRadians = fabric.util.degreesToRadians,
    controls = fabric.controlsUtils;

  /**
   * Render a round control, as per fabric features.
   * This function is written to respect object properties like transparentCorners, cornerSize
   * cornerColor, cornerStrokeColor
   * plus the addition of offsetY and offsetX.
   * @param {CanvasRenderingContext2D} ctx context to render on
   * @param {Number} left x coordinate where the control center should be
   * @param {Number} top y coordinate where the control center should be
   * @param {Object} styleOverride override for fabric.Object controls style
   * @param {fabric.Object} fabricObject the fabric object for which we are rendering controls
   */
  function renderCircleControl(ctx, left, top, styleOverride, fabricObject) {
    styleOverride = styleOverride || {};
    var xSize =
        this.sizeX || styleOverride.cornerSize || fabricObject.cornerSize,
      ySize = this.sizeY || styleOverride.cornerSize || fabricObject.cornerSize,
      transparentCorners =
        typeof styleOverride.transparentCorners !== 'undefined'
          ? styleOverride.transparentCorners
          : this.transparentCorners,
      methodName = transparentCorners ? 'stroke' : 'fill',
      stroke =
        !transparentCorners &&
        (styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor),
      myLeft = left,
      myTop = top,
      size;
    ctx.save();
    ctx.fillStyle = styleOverride.cornerColor || fabricObject.cornerColor;
    ctx.strokeStyle =
      styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor;
    // as soon as fabric react v5, remove ie11, use proper ellipse code.
    if (xSize > ySize) {
      size = xSize;
      ctx.scale(1.0, ySize / xSize);
      myTop = (top * xSize) / ySize;
    } else if (ySize > xSize) {
      size = ySize;
      ctx.scale(xSize / ySize, 1.0);
      myLeft = (left * ySize) / xSize;
    } else {
      size = xSize;
    }
    // this is still wrong
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(myLeft, myTop, size / 2, 0, 2 * Math.PI, false);
    ctx[methodName]();
    if (stroke) {
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Render a square control, as per fabric features.
   * This function is written to respect object properties like transparentCorners, cornerSize
   * cornerColor, cornerStrokeColor
   * plus the addition of offsetY and offsetX.
   * @param {CanvasRenderingContext2D} ctx context to render on
   * @param {Number} left x coordinate where the control center should be
   * @param {Number} top y coordinate where the control center should be
   * @param {Object} styleOverride override for fabric.Object controls style
   * @param {fabric.Object} fabricObject the fabric object for which we are rendering controls
   */
  function renderSquareControl(ctx, left, top, styleOverride, fabricObject) {
    styleOverride = styleOverride || {};
    var xSize =
        this.sizeX || styleOverride.cornerSize || fabricObject.cornerSize,
      ySize = this.sizeY || styleOverride.cornerSize || fabricObject.cornerSize,
      transparentCorners =
        typeof styleOverride.transparentCorners !== 'undefined'
          ? styleOverride.transparentCorners
          : fabricObject.transparentCorners,
      methodName = transparentCorners ? 'stroke' : 'fill',
      stroke =
        !transparentCorners &&
        (styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor),
      xSizeBy2 = xSize / 2,
      ySizeBy2 = ySize / 2;
    ctx.save();
    ctx.fillStyle = styleOverride.cornerColor || fabricObject.cornerColor;
    ctx.strokeStyle =
      styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor;
    // this is still wrong
    ctx.lineWidth = 1;
    ctx.translate(left, top);
    ctx.rotate(degreesToRadians(fabricObject.angle));
    // this does not work, and fixed with ( && ) does not make sense.
    // to have real transparent corners we need the controls on upperCanvas
    // transparentCorners || ctx.clearRect(-xSizeBy2, -ySizeBy2, xSize, ySize);
    ctx[methodName + 'Rect'](-xSizeBy2, -ySizeBy2, xSize, ySize);
    if (stroke) {
      ctx.strokeRect(-xSizeBy2, -ySizeBy2, xSize, ySize);
    }
    ctx.restore();
  }

  controls.renderCircleControl = renderCircleControl;
  controls.renderSquareControl = renderSquareControl;
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {});

  function Control(options) {
    for (var i in options) {
      this[i] = options[i];
    }
  }

  fabric.Control = Control;

  fabric.Control.prototype = /** @lends fabric.Control.prototype */ {
    /**
     * keep track of control visibility.
     * mainly for backward compatibility.
     * if you do not want to see a control, you can remove it
     * from the controlset.
     * @type {Boolean}
     * @default true
     */
    visible: true,

    /**
     * Name of the action that the control will likely execute.
     * This is optional. FabricJS uses to identify what the user is doing for some
     * extra optimizations. If you are writing a custom control and you want to know
     * somewhere else in the code what is going on, you can use this string here.
     * you can also provide a custom getActionName if your control run multiple actions
     * depending on some external state.
     * default to scale since is the most common, used on 4 corners by default
     * @type {String}
     * @default 'scale'
     */
    actionName: 'scale',

    /**
     * Drawing angle of the control.
     * NOT used for now, but name marked as needed for internal logic
     * example: to reuse the same drawing function for different rotated controls
     * @type {Number}
     * @default 0
     */
    angle: 0,

    /**
     * Relative position of the control. X
     * 0,0 is the center of the Object, while -0.5 (left) or 0.5 (right) are the extremities
     * of the bounding box.
     * @type {Number}
     * @default 0
     */
    x: 0,

    /**
     * Relative position of the control. Y
     * 0,0 is the center of the Object, while -0.5 (top) or 0.5 (bottom) are the extremities
     * of the bounding box.
     * @type {Number}
     * @default 0
     */
    y: 0,

    /**
     * Horizontal offset of the control from the defined position. In pixels
     * Positive offset moves the control to the right, negative to the left.
     * It used when you want to have position of control that does not scale with
     * the bounding box. Example: rotation control is placed at x:0, y: 0.5 on
     * the boundindbox, with an offset of 30 pixels vertically. Those 30 pixels will
     * stay 30 pixels no matter how the object is big. Another example is having 2
     * controls in the corner, that stay in the same position when the object scale.
     * of the bounding box.
     * @type {Number}
     * @default 0
     */
    offsetX: 0,

    /**
     * Vertical offset of the control from the defined position. In pixels
     * Positive offset moves the control to the bottom, negative to the top.
     * @type {Number}
     * @default 0
     */
    offsetY: 0,

    /**
     * Sets the length of the control. If null, defaults to object's cornerSize.
     * Expects both sizeX and sizeY to be set when set.
     * @type {?Number}
     * @default null
     */
    sizeX: null,

    /**
     * Sets the height of the control. If null, defaults to object's cornerSize.
     * Expects both sizeX and sizeY to be set when set.
     * @type {?Number}
     * @default null
     */
    sizeY: null,

    /**
     * Sets the length of the touch area of the control. If null, defaults to object's touchCornerSize.
     * Expects both touchSizeX and touchSizeY to be set when set.
     * @type {?Number}
     * @default null
     */
    touchSizeX: null,

    /**
     * Sets the height of the touch area of the control. If null, defaults to object's touchCornerSize.
     * Expects both touchSizeX and touchSizeY to be set when set.
     * @type {?Number}
     * @default null
     */
    touchSizeY: null,

    /**
     * Css cursor style to display when the control is hovered.
     * if the method `cursorStyleHandler` is provided, this property is ignored.
     * @type {String}
     * @default 'crosshair'
     */
    cursorStyle: 'crosshair',

    /**
     * If controls has an offsetY or offsetX, draw a line that connects
     * the control to the bounding box
     * @type {Boolean}
     * @default false
     */
    withConnection: false,

    /**
     * The control actionHandler, provide one to handle action ( control being moved )
     * @param {Event} eventData the native mouse event
     * @param {Object} transformData properties of the current transform
     * @param {Number} x x position of the cursor
     * @param {Number} y y position of the cursor
     * @return {Boolean} true if the action/event modified the object
     */
    actionHandler: function(/* eventData, transformData, x, y */) {},

    /**
     * The control handler for mouse down, provide one to handle mouse down on control
     * @param {Event} eventData the native mouse event
     * @param {Object} transformData properties of the current transform
     * @param {Number} x x position of the cursor
     * @param {Number} y y position of the cursor
     * @return {Boolean} true if the action/event modified the object
     */
    mouseDownHandler: function(/* eventData, transformData, x, y */) {},

    /**
     * The control mouseUpHandler, provide one to handle an effect on mouse up.
     * @param {Event} eventData the native mouse event
     * @param {Object} transformData properties of the current transform
     * @param {Number} x x position of the cursor
     * @param {Number} y y position of the cursor
     * @return {Boolean} true if the action/event modified the object
     */
    mouseUpHandler: function(/* eventData, transformData, x, y */) {},

    /**
     * Returns control actionHandler
     * @param {Event} eventData the native mouse event
     * @param {fabric.Object} fabricObject on which the control is displayed
     * @param {fabric.Control} control control for which the action handler is being asked
     * @return {Function} the action handler
     */
    getActionHandler: function(/* eventData, fabricObject, control */) {
      return this.actionHandler;
    },

    /**
     * Returns control mouseDown handler
     * @param {Event} eventData the native mouse event
     * @param {fabric.Object} fabricObject on which the control is displayed
     * @param {fabric.Control} control control for which the action handler is being asked
     * @return {Function} the action handler
     */
    getMouseDownHandler: function(/* eventData, fabricObject, control */) {
      return this.mouseDownHandler;
    },

    /**
     * Returns control mouseUp handler
     * @param {Event} eventData the native mouse event
     * @param {fabric.Object} fabricObject on which the control is displayed
     * @param {fabric.Control} control control for which the action handler is being asked
     * @return {Function} the action handler
     */
    getMouseUpHandler: function(/* eventData, fabricObject, control */) {
      return this.mouseUpHandler;
    },

    /**
     * Returns control cursorStyle for css using cursorStyle. If you need a more elaborate
     * function you can pass one in the constructor
     * the cursorStyle property
     * @param {Event} eventData the native mouse event
     * @param {fabric.Control} control the current control ( likely this)
     * @param {fabric.Object} object on which the control is displayed
     * @return {String}
     */
    cursorStyleHandler: function(eventData, control /* fabricObject */) {
      return control.cursorStyle;
    },

    /**
     * Returns the action name. The basic implementation just return the actionName property.
     * @param {Event} eventData the native mouse event
     * @param {fabric.Control} control the current control ( likely this)
     * @param {fabric.Object} object on which the control is displayed
     * @return {String}
     */
    getActionName: function(eventData, control /* fabricObject */) {
      return control.actionName;
    },

    /**
     * Returns controls visibility
     * @param {fabric.Object} object on which the control is displayed
     * @param {String} controlKey key where the control is memorized on the
     * @return {Boolean}
     */
    getVisibility: function(fabricObject, controlKey) {
      var objectVisibility = fabricObject._controlsVisibility;
      if (
        objectVisibility &&
        typeof objectVisibility[controlKey] !== 'undefined'
      ) {
        return objectVisibility[controlKey];
      }
      return this.visible;
    },

    /**
     * Sets controls visibility
     * @param {Boolean} visibility for the object
     * @return {Void}
     */
    setVisibility: function(visibility /* name, fabricObject */) {
      this.visible = visibility;
    },

    positionHandler: function(
      dim,
      finalMatrix /*, fabricObject, currentControl */
    ) {
      var point = fabric.util.transformPoint(
        {
          x: this.x * dim.x + this.offsetX,
          y: this.y * dim.y + this.offsetY
        },
        finalMatrix
      );
      return point;
    },

    /**
     * Returns the coords for this control based on object values.
     * @param {Number} objectAngle angle from the fabric object holding the control
     * @param {Number} objectCornerSize cornerSize from the fabric object holding the control (or touchCornerSize if
     *   isTouch is true)
     * @param {Number} centerX x coordinate where the control center should be
     * @param {Number} centerY y coordinate where the control center should be
     * @param {boolean} isTouch true if touch corner, false if normal corner
     */
    calcCornerCoords: function(
      objectAngle,
      objectCornerSize,
      centerX,
      centerY,
      isTouch
    ) {
      var cosHalfOffset,
        sinHalfOffset,
        cosHalfOffsetComp,
        sinHalfOffsetComp,
        xSize = isTouch ? this.touchSizeX : this.sizeX,
        ySize = isTouch ? this.touchSizeY : this.sizeY;
      if (xSize && ySize && xSize !== ySize) {
        // handle rectangular corners
        var controlTriangleAngle = Math.atan2(ySize, xSize);
        var cornerHypotenuse = Math.sqrt(xSize * xSize + ySize * ySize) / 2;
        var newTheta =
          controlTriangleAngle - fabric.util.degreesToRadians(objectAngle);
        var newThetaComp =
          Math.PI / 2 -
          controlTriangleAngle -
          fabric.util.degreesToRadians(objectAngle);
        cosHalfOffset = cornerHypotenuse * fabric.util.cos(newTheta);
        sinHalfOffset = cornerHypotenuse * fabric.util.sin(newTheta);
        // use complementary angle for two corners
        cosHalfOffsetComp = cornerHypotenuse * fabric.util.cos(newThetaComp);
        sinHalfOffsetComp = cornerHypotenuse * fabric.util.sin(newThetaComp);
      } else {
        // handle square corners
        // use default object corner size unless size is defined
        var cornerSize = xSize && ySize ? xSize : objectCornerSize;
        /* 0.7071067812 stands for sqrt(2)/2 */
        cornerHypotenuse = cornerSize * 0.7071067812;
        // complementary angles are equal since they're both 45 degrees
        var newTheta = fabric.util.degreesToRadians(45 - objectAngle);
        cosHalfOffset = cosHalfOffsetComp =
          cornerHypotenuse * fabric.util.cos(newTheta);
        sinHalfOffset = sinHalfOffsetComp =
          cornerHypotenuse * fabric.util.sin(newTheta);
      }

      return {
        tl: {
          x: centerX - sinHalfOffsetComp,
          y: centerY - cosHalfOffsetComp
        },
        tr: {
          x: centerX + cosHalfOffset,
          y: centerY - sinHalfOffset
        },
        bl: {
          x: centerX - cosHalfOffset,
          y: centerY + sinHalfOffset
        },
        br: {
          x: centerX + sinHalfOffsetComp,
          y: centerY + cosHalfOffsetComp
        }
      };
    },

    /**
     * Render function for the control.
     * When this function runs the context is unscaled. unrotate. Just retina scaled.
     * all the functions will have to translate to the point left,top before starting Drawing
     * if they want to draw a control where the position is detected.
     * left and top are the result of the positionHandler function
     * @param {RenderingContext2D} ctx the context where the control will be drawn
     * @param {Number} left position of the canvas where we are about to render the control.
     * @param {Number} top position of the canvas where we are about to render the control.
     * @param {Object} styleOverride
     * @param {fabric.Object} fabricObject the object where the control is about to be rendered
     */
    render: function(ctx, left, top, styleOverride, fabricObject) {
      styleOverride = styleOverride || {};
      switch (styleOverride.cornerStyle || fabricObject.cornerStyle) {
        case 'circle':
          fabric.controlsUtils.renderCircleControl.call(
            this,
            ctx,
            left,
            top,
            styleOverride,
            fabricObject
          );
          break;
        default:
          fabric.controlsUtils.renderSquareControl.call(
            this,
            ctx,
            left,
            top,
            styleOverride,
            fabricObject
          );
      }
    }
  };
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  'use strict';

  if (fabric.StaticCanvas) {
    fabric.warn('fabric.StaticCanvas is already defined.');
    return;
  }

  // aliases for faster resolution
  var extend = fabric.util.object.extend,
    getElementOffset = fabric.util.getElementOffset,
    removeFromArray = fabric.util.removeFromArray,
    toFixed = fabric.util.toFixed,
    transformPoint = fabric.util.transformPoint,
    invertTransform = fabric.util.invertTransform,
    getNodeCanvas = fabric.util.getNodeCanvas,
    createCanvasElement = fabric.util.createCanvasElement,
    CANVAS_INIT_ERROR = new Error('Could not initialize `canvas` element');

  /**
   * Static canvas class
   * @class fabric.StaticCanvas
   * @mixes fabric.Collection
   * @mixes fabric.Observable
   * @see {@link http://fabricjs.com/static_canvas|StaticCanvas demo}
   * @see {@link fabric.StaticCanvas#initialize} for constructor definition
   * @fires before:render
   * @fires after:render
   * @fires canvas:cleared
   * @fires object:added
   * @fires object:removed
   */
  fabric.StaticCanvas = fabric.util.createClass(
    fabric.CommonMethods,
    /** @lends fabric.StaticCanvas.prototype */ {
      /**
       * Constructor
       * @param {HTMLElement | String} el &lt;canvas> element to initialize instance on
       * @param {Object} [options] Options object
       * @return {Object} thisArg
       */
      initialize: function(el, options) {
        options || (options = {});
        this.renderAndResetBound = this.renderAndReset.bind(this);
        this.requestRenderAllBound = this.requestRenderAll.bind(this);
        this._initStatic(el, options);
      },

      /**
       * Background color of canvas instance.
       * Should be set via {@link fabric.StaticCanvas#setBackgroundColor}.
       * @type {(String|fabric.Pattern)}
       * @default
       */
      backgroundColor: '',

      /**
       * Background image of canvas instance.
       * since 2.4.0 image caching is active, please when putting an image as background, add to the
       * canvas property a reference to the canvas it is on. Otherwise the image cannot detect the zoom
       * vale. As an alternative you can disable image objectCaching
       * @type fabric.Image
       * @default
       */
      backgroundImage: null,

      /**
       * Overlay color of canvas instance.
       * Should be set via {@link fabric.StaticCanvas#setOverlayColor}
       * @since 1.3.9
       * @type {(String|fabric.Pattern)}
       * @default
       */
      overlayColor: '',

      /**
       * Overlay image of canvas instance.
       * since 2.4.0 image caching is active, please when putting an image as overlay, add to the
       * canvas property a reference to the canvas it is on. Otherwise the image cannot detect the zoom
       * vale. As an alternative you can disable image objectCaching
       * @type fabric.Image
       * @default
       */
      overlayImage: null,

      /**
       * Indicates whether toObject/toDatalessObject should include default values
       * if set to false, takes precedence over the object value.
       * @type Boolean
       * @default
       */
      includeDefaultValues: true,

      /**
       * Indicates whether objects' state should be saved
       * @type Boolean
       * @default
       */
      stateful: false,

      /**
       * Indicates whether {@link fabric.Collection.add}, {@link fabric.Collection.insertAt} and {@link fabric.Collection.remove},
       * {@link fabric.StaticCanvas.moveTo}, {@link fabric.StaticCanvas.clear} and many more, should also re-render canvas.
       * Disabling this option will not give a performance boost when adding/removing a lot of objects to/from canvas at once
       * since the renders are quequed and executed one per frame.
       * Disabling is suggested anyway and managing the renders of the app manually is not a big effort ( canvas.requestRenderAll() )
       * Left default to true to do not break documentation and old app, fiddles.
       * @type Boolean
       * @default
       */
      renderOnAddRemove: true,

      /**
       * Indicates whether object controls (borders/controls) are rendered above overlay image
       * @type Boolean
       * @default
       */
      controlsAboveOverlay: false,

      /**
       * Indicates whether the browser can be scrolled when using a touchscreen and dragging on the canvas
       * @type Boolean
       * @default
       */
      allowTouchScrolling: false,

      /**
       * Indicates whether this canvas will use image smoothing, this is on by default in browsers
       * @type Boolean
       * @default
       */
      imageSmoothingEnabled: true,

      /**
       * The transformation (in the format of Canvas transform) which focuses the viewport
       * @type Array
       * @default
       */
      viewportTransform: fabric.iMatrix.concat(),

      /**
       * if set to false background image is not affected by viewport transform
       * @since 1.6.3
       * @type Boolean
       * @default
       */
      backgroundVpt: true,

      /**
       * if set to false overlya image is not affected by viewport transform
       * @since 1.6.3
       * @type Boolean
       * @default
       */
      overlayVpt: true,

      /**
       * When true, canvas is scaled by devicePixelRatio for better rendering on retina screens
       * @type Boolean
       * @default
       */
      enableRetinaScaling: true,

      /**
       * Describe canvas element extension over design
       * properties are tl,tr,bl,br.
       * if canvas is not zoomed/panned those points are the four corner of canvas
       * if canvas is viewportTransformed you those points indicate the extension
       * of canvas element in plain untrasformed coordinates
       * The coordinates get updated with @method calcViewportBoundaries.
       * @memberOf fabric.StaticCanvas.prototype
       */
      vptCoords: {},

      /**
       * Based on vptCoords and object.aCoords, skip rendering of objects that
       * are not included in current viewport.
       * May greatly help in applications with crowded canvas and use of zoom/pan
       * If One of the corner of the bounding box of the object is on the canvas
       * the objects get rendered.
       * @memberOf fabric.StaticCanvas.prototype
       * @type Boolean
       * @default
       */
      skipOffscreen: true,

      /**
       * a fabricObject that, without stroke define a clipping area with their shape. filled in black
       * the clipPath object gets used when the canvas has rendered, and the context is placed in the
       * top left corner of the canvas.
       * clipPath will clip away controls, if you do not want this to happen use controlsAboveOverlay = true
       * @type fabric.Object
       */
      clipPath: undefined,

      /**
       * @private
       * @param {HTMLElement | String} el &lt;canvas> element to initialize instance on
       * @param {Object} [options] Options object
       */
      _initStatic: function(el, options) {
        var cb = this.requestRenderAllBound;
        this._objects = [];
        this._createLowerCanvas(el);
        this._initOptions(options);
        // only initialize retina scaling once
        if (!this.interactive) {
          this._initRetinaScaling();
        }

        if (options.overlayImage) {
          this.setOverlayImage(options.overlayImage, cb);
        }
        if (options.backgroundImage) {
          this.setBackgroundImage(options.backgroundImage, cb);
        }
        if (options.backgroundColor) {
          this.setBackgroundColor(options.backgroundColor, cb);
        }
        if (options.overlayColor) {
          this.setOverlayColor(options.overlayColor, cb);
        }
        this.calcOffset();
      },

      /**
       * @private
       */
      _isRetinaScaling: function() {
        return fabric.devicePixelRatio !== 1 && this.enableRetinaScaling;
      },

      /**
       * @private
       * @return {Number} retinaScaling if applied, otherwise 1;
       */
      getRetinaScaling: function() {
        return this._isRetinaScaling() ? fabric.devicePixelRatio : 1;
      },

      /**
       * @private
       */
      _initRetinaScaling: function() {
        if (!this._isRetinaScaling()) {
          return;
        }
        var scaleRatio = fabric.devicePixelRatio;
        this.__initRetinaScaling(
          scaleRatio,
          this.lowerCanvasEl,
          this.contextContainer
        );
        if (this.upperCanvasEl) {
          this.__initRetinaScaling(
            scaleRatio,
            this.upperCanvasEl,
            this.contextTop
          );
        }
      },

      __initRetinaScaling: function(scaleRatio, canvas, context) {
        canvas.setAttribute('width', this.width * scaleRatio);
        canvas.setAttribute('height', this.height * scaleRatio);
        context.scale(scaleRatio, scaleRatio);
      },

      /**
       * Calculates canvas element offset relative to the document
       * This method is also attached as "resize" event handler of window
       * @return {fabric.Canvas} instance
       * @chainable
       */
      calcOffset: function() {
        this._offset = getElementOffset(this.lowerCanvasEl);
        return this;
      },

      /**
       * Sets {@link fabric.StaticCanvas#overlayImage|overlay image} for this canvas
       * @param {(fabric.Image|String)} image fabric.Image instance or URL of an image to set overlay to
       * @param {Function} callback callback to invoke when image is loaded and set as an overlay
       * @param {Object} [options] Optional options to set for the {@link fabric.Image|overlay image}.
       * @return {fabric.Canvas} thisArg
       * @chainable
       * @see {@link http://jsfiddle.net/fabricjs/MnzHT/|jsFiddle demo}
       * @example <caption>Normal overlayImage with left/top = 0</caption>
       * canvas.setOverlayImage('http://fabricjs.com/assets/jail_cell_bars.png', canvas.renderAll.bind(canvas), {
       *   // Needed to position overlayImage at 0/0
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>overlayImage with different properties</caption>
       * canvas.setOverlayImage('http://fabricjs.com/assets/jail_cell_bars.png', canvas.renderAll.bind(canvas), {
       *   opacity: 0.5,
       *   angle: 45,
       *   left: 400,
       *   top: 400,
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>Stretched overlayImage #1 - width/height correspond to canvas width/height</caption>
       * fabric.Image.fromURL('http://fabricjs.com/assets/jail_cell_bars.png', function(img, isError) {
       *    img.set({width: canvas.width, height: canvas.height, originX: 'left', originY: 'top'});
       *    canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
       * });
       * @example <caption>Stretched overlayImage #2 - width/height correspond to canvas width/height</caption>
       * canvas.setOverlayImage('http://fabricjs.com/assets/jail_cell_bars.png', canvas.renderAll.bind(canvas), {
       *   width: canvas.width,
       *   height: canvas.height,
       *   // Needed to position overlayImage at 0/0
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>overlayImage loaded from cross-origin</caption>
       * canvas.setOverlayImage('http://fabricjs.com/assets/jail_cell_bars.png', canvas.renderAll.bind(canvas), {
       *   opacity: 0.5,
       *   angle: 45,
       *   left: 400,
       *   top: 400,
       *   originX: 'left',
       *   originY: 'top',
       *   crossOrigin: 'anonymous'
       * });
       */
      setOverlayImage: function(image, callback, options) {
        return this.__setBgOverlayImage(
          'overlayImage',
          image,
          callback,
          options
        );
      },

      /**
       * Sets {@link fabric.StaticCanvas#backgroundImage|background image} for this canvas
       * @param {(fabric.Image|String)} image fabric.Image instance or URL of an image to set background to
       * @param {Function} callback Callback to invoke when image is loaded and set as background
       * @param {Object} [options] Optional options to set for the {@link fabric.Image|background image}.
       * @return {fabric.Canvas} thisArg
       * @chainable
       * @see {@link http://jsfiddle.net/djnr8o7a/28/|jsFiddle demo}
       * @example <caption>Normal backgroundImage with left/top = 0</caption>
       * canvas.setBackgroundImage('http://fabricjs.com/assets/honey_im_subtle.png', canvas.renderAll.bind(canvas), {
       *   // Needed to position backgroundImage at 0/0
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>backgroundImage with different properties</caption>
       * canvas.setBackgroundImage('http://fabricjs.com/assets/honey_im_subtle.png', canvas.renderAll.bind(canvas), {
       *   opacity: 0.5,
       *   angle: 45,
       *   left: 400,
       *   top: 400,
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>Stretched backgroundImage #1 - width/height correspond to canvas width/height</caption>
       * fabric.Image.fromURL('http://fabricjs.com/assets/honey_im_subtle.png', function(img, isError) {
       *    img.set({width: canvas.width, height: canvas.height, originX: 'left', originY: 'top'});
       *    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
       * });
       * @example <caption>Stretched backgroundImage #2 - width/height correspond to canvas width/height</caption>
       * canvas.setBackgroundImage('http://fabricjs.com/assets/honey_im_subtle.png', canvas.renderAll.bind(canvas), {
       *   width: canvas.width,
       *   height: canvas.height,
       *   // Needed to position backgroundImage at 0/0
       *   originX: 'left',
       *   originY: 'top'
       * });
       * @example <caption>backgroundImage loaded from cross-origin</caption>
       * canvas.setBackgroundImage('http://fabricjs.com/assets/honey_im_subtle.png', canvas.renderAll.bind(canvas), {
       *   opacity: 0.5,
       *   angle: 45,
       *   left: 400,
       *   top: 400,
       *   originX: 'left',
       *   originY: 'top',
       *   crossOrigin: 'anonymous'
       * });
       */
      // TODO: fix stretched examples
      setBackgroundImage: function(image, callback, options) {
        return this.__setBgOverlayImage(
          'backgroundImage',
          image,
          callback,
          options
        );
      },

      /**
       * Sets {@link fabric.StaticCanvas#overlayColor|foreground color} for this canvas
       * @param {(String|fabric.Pattern)} overlayColor Color or pattern to set foreground color to
       * @param {Function} callback Callback to invoke when foreground color is set
       * @return {fabric.Canvas} thisArg
       * @chainable
       * @see {@link http://jsfiddle.net/fabricjs/pB55h/|jsFiddle demo}
       * @example <caption>Normal overlayColor - color value</caption>
       * canvas.setOverlayColor('rgba(255, 73, 64, 0.6)', canvas.renderAll.bind(canvas));
       * @example <caption>fabric.Pattern used as overlayColor</caption>
       * canvas.setOverlayColor({
       *   source: 'http://fabricjs.com/assets/escheresque_ste.png'
       * }, canvas.renderAll.bind(canvas));
       * @example <caption>fabric.Pattern used as overlayColor with repeat and offset</caption>
       * canvas.setOverlayColor({
       *   source: 'http://fabricjs.com/assets/escheresque_ste.png',
       *   repeat: 'repeat',
       *   offsetX: 200,
       *   offsetY: 100
       * }, canvas.renderAll.bind(canvas));
       */
      setOverlayColor: function(overlayColor, callback) {
        return this.__setBgOverlayColor('overlayColor', overlayColor, callback);
      },

      /**
       * Sets {@link fabric.StaticCanvas#backgroundColor|background color} for this canvas
       * @param {(String|fabric.Pattern)} backgroundColor Color or pattern to set background color to
       * @param {Function} callback Callback to invoke when background color is set
       * @return {fabric.Canvas} thisArg
       * @chainable
       * @see {@link http://jsfiddle.net/fabricjs/hXzvk/|jsFiddle demo}
       * @example <caption>Normal backgroundColor - color value</caption>
       * canvas.setBackgroundColor('rgba(255, 73, 64, 0.6)', canvas.renderAll.bind(canvas));
       * @example <caption>fabric.Pattern used as backgroundColor</caption>
       * canvas.setBackgroundColor({
       *   source: 'http://fabricjs.com/assets/escheresque_ste.png'
       * }, canvas.renderAll.bind(canvas));
       * @example <caption>fabric.Pattern used as backgroundColor with repeat and offset</caption>
       * canvas.setBackgroundColor({
       *   source: 'http://fabricjs.com/assets/escheresque_ste.png',
       *   repeat: 'repeat',
       *   offsetX: 200,
       *   offsetY: 100
       * }, canvas.renderAll.bind(canvas));
       */
      setBackgroundColor: function(backgroundColor, callback) {
        return this.__setBgOverlayColor(
          'backgroundColor',
          backgroundColor,
          callback
        );
      },

      /**
       * @private
       * @param {String} property Property to set ({@link fabric.StaticCanvas#backgroundImage|backgroundImage}
       * or {@link fabric.StaticCanvas#overlayImage|overlayImage})
       * @param {(fabric.Image|String|null)} image fabric.Image instance, URL of an image or null to set background or overlay to
       * @param {Function} callback Callback to invoke when image is loaded and set as background or overlay. The first argument is the created image, the second argument is a flag indicating whether an error occurred or not.
       * @param {Object} [options] Optional options to set for the {@link fabric.Image|image}.
       */
      __setBgOverlayImage: function(property, image, callback, options) {
        if (typeof image === 'string') {
          fabric.util.loadImage(
            image,
            function(img, isError) {
              if (img) {
                var instance = new fabric.Image(img, options);
                this[property] = instance;
                instance.canvas = this;
              }
              callback && callback(img, isError);
            },
            this,
            options && options.crossOrigin
          );
        } else {
          options && image.setOptions(options);
          this[property] = image;
          image && (image.canvas = this);
          callback && callback(image, false);
        }

        return this;
      },

      /**
       * @private
       * @param {String} property Property to set ({@link fabric.StaticCanvas#backgroundColor|backgroundColor}
       * or {@link fabric.StaticCanvas#overlayColor|overlayColor})
       * @param {(Object|String|null)} color Object with pattern information, color value or null
       * @param {Function} [callback] Callback is invoked when color is set
       */
      __setBgOverlayColor: function(property, color, callback) {
        this[property] = color;
        this._initGradient(color, property);
        this._initPattern(color, property, callback);
        return this;
      },

      /**
       * @private
       */
      _createCanvasElement: function() {
        var element = createCanvasElement();
        if (!element) {
          throw CANVAS_INIT_ERROR;
        }
        if (!element.style) {
          element.style = {};
        }
        if (typeof element.getContext === 'undefined') {
          throw CANVAS_INIT_ERROR;
        }
        return element;
      },

      /**
       * @private
       * @param {Object} [options] Options object
       */
      _initOptions: function(options) {
        var lowerCanvasEl = this.lowerCanvasEl;
        this._setOptions(options);

        this.width = this.width || parseInt(lowerCanvasEl.width, 10) || 0;
        this.height = this.height || parseInt(lowerCanvasEl.height, 10) || 0;

        if (!this.lowerCanvasEl.style) {
          return;
        }

        lowerCanvasEl.width = this.width;
        lowerCanvasEl.height = this.height;

        lowerCanvasEl.style.width = this.width + 'px';
        lowerCanvasEl.style.height = this.height + 'px';

        this.viewportTransform = this.viewportTransform.slice();
      },

      /**
       * Creates a bottom canvas
       * @private
       * @param {HTMLElement} [canvasEl]
       */
      _createLowerCanvas: function(canvasEl) {
        // canvasEl === 'HTMLCanvasElement' does not work on jsdom/node
        if (canvasEl && canvasEl.getContext) {
          this.lowerCanvasEl = canvasEl;
        } else {
          this.lowerCanvasEl =
            fabric.util.getById(canvasEl) || this._createCanvasElement();
        }

        fabric.util.addClass(this.lowerCanvasEl, 'lower-canvas');

        if (this.interactive) {
          this._applyCanvasStyle(this.lowerCanvasEl);
        }

        this.contextContainer = this.lowerCanvasEl.getContext('2d');
      },

      /**
       * Returns canvas width (in px)
       * @return {Number}
       */
      getWidth: function() {
        return this.width;
      },

      /**
       * Returns canvas height (in px)
       * @return {Number}
       */
      getHeight: function() {
        return this.height;
      },

      /**
       * Sets width of this canvas instance
       * @param {Number|String} value                         Value to set width to
       * @param {Object}        [options]                     Options object
       * @param {Boolean}       [options.backstoreOnly=false] Set the given dimensions only as canvas backstore dimensions
       * @param {Boolean}       [options.cssOnly=false]       Set the given dimensions only as css dimensions
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      setWidth: function(value, options) {
        return this.setDimensions({ width: value }, options);
      },

      /**
       * Sets height of this canvas instance
       * @param {Number|String} value                         Value to set height to
       * @param {Object}        [options]                     Options object
       * @param {Boolean}       [options.backstoreOnly=false] Set the given dimensions only as canvas backstore dimensions
       * @param {Boolean}       [options.cssOnly=false]       Set the given dimensions only as css dimensions
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      setHeight: function(value, options) {
        return this.setDimensions({ height: value }, options);
      },

      /**
       * Sets dimensions (width, height) of this canvas instance. when options.cssOnly flag active you should also supply the unit of measure (px/%/em)
       * @param {Object}        dimensions                    Object with width/height properties
       * @param {Number|String} [dimensions.width]            Width of canvas element
       * @param {Number|String} [dimensions.height]           Height of canvas element
       * @param {Object}        [options]                     Options object
       * @param {Boolean}       [options.backstoreOnly=false] Set the given dimensions only as canvas backstore dimensions
       * @param {Boolean}       [options.cssOnly=false]       Set the given dimensions only as css dimensions
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      setDimensions: function(dimensions, options) {
        var cssValue;

        options = options || {};

        for (var prop in dimensions) {
          cssValue = dimensions[prop];

          if (!options.cssOnly) {
            this._setBackstoreDimension(prop, dimensions[prop]);
            cssValue += 'px';
            this.hasLostContext = true;
          }

          if (!options.backstoreOnly) {
            this._setCssDimension(prop, cssValue);
          }
        }
        if (this._isCurrentlyDrawing) {
          this.freeDrawingBrush && this.freeDrawingBrush._setBrushStyles();
        }
        this._initRetinaScaling();
        this.calcOffset();

        if (!options.cssOnly) {
          this.requestRenderAll();
        }

        return this;
      },

      /**
       * Helper for setting width/height
       * @private
       * @param {String} prop property (width|height)
       * @param {Number} value value to set property to
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      _setBackstoreDimension: function(prop, value) {
        this.lowerCanvasEl[prop] = value;

        if (this.upperCanvasEl) {
          this.upperCanvasEl[prop] = value;
        }

        if (this.cacheCanvasEl) {
          this.cacheCanvasEl[prop] = value;
        }

        this[prop] = value;

        return this;
      },

      /**
       * Helper for setting css width/height
       * @private
       * @param {String} prop property (width|height)
       * @param {String} value value to set property to
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      _setCssDimension: function(prop, value) {
        this.lowerCanvasEl.style[prop] = value;

        if (this.upperCanvasEl) {
          this.upperCanvasEl.style[prop] = value;
        }

        if (this.wrapperEl) {
          this.wrapperEl.style[prop] = value;
        }

        return this;
      },

      /**
       * Returns canvas zoom level
       * @return {Number}
       */
      getZoom: function() {
        return this.viewportTransform[0];
      },

      /**
       * Sets viewport transform of this canvas instance
       * @param {Array} vpt the transform in the form of context.transform
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      setViewportTransform: function(vpt) {
        var activeObject = this._activeObject,
          backgroundObject = this.backgroundImage,
          overlayObject = this.overlayImage,
          object,
          i,
          len;
        this.viewportTransform = vpt;
        for (i = 0, len = this._objects.length; i < len; i++) {
          object = this._objects[i];
          object.group || object.setCoords(true);
        }
        if (activeObject) {
          activeObject.setCoords();
        }
        if (backgroundObject) {
          backgroundObject.setCoords(true);
        }
        if (overlayObject) {
          overlayObject.setCoords(true);
        }
        this.calcViewportBoundaries();
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * Sets zoom level of this canvas instance, the zoom centered around point
       * meaning that following zoom to point with the same point will have the visual
       * effect of the zoom originating from that point. The point won't move.
       * It has nothing to do with canvas center or visual center of the viewport.
       * @param {fabric.Point} point to zoom with respect to
       * @param {Number} value to set zoom to, less than 1 zooms out
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      zoomToPoint: function(point, value) {
        // TODO: just change the scale, preserve other transformations
        var before = point,
          vpt = this.viewportTransform.slice(0);
        point = transformPoint(point, invertTransform(this.viewportTransform));
        vpt[0] = value;
        vpt[3] = value;
        var after = transformPoint(point, vpt);
        vpt[4] += before.x - after.x;
        vpt[5] += before.y - after.y;
        return this.setViewportTransform(vpt);
      },

      /**
       * Sets zoom level of this canvas instance
       * @param {Number} value to set zoom to, less than 1 zooms out
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      setZoom: function(value) {
        this.zoomToPoint(new fabric.Point(0, 0), value);
        return this;
      },

      /**
       * Pan viewport so as to place point at top left corner of canvas
       * @param {fabric.Point} point to move to
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      absolutePan: function(point) {
        var vpt = this.viewportTransform.slice(0);
        vpt[4] = -point.x;
        vpt[5] = -point.y;
        return this.setViewportTransform(vpt);
      },

      /**
       * Pans viewpoint relatively
       * @param {fabric.Point} point (position vector) to move by
       * @return {fabric.Canvas} instance
       * @chainable true
       */
      relativePan: function(point) {
        return this.absolutePan(
          new fabric.Point(
            -point.x - this.viewportTransform[4],
            -point.y - this.viewportTransform[5]
          )
        );
      },

      /**
       * Returns &lt;canvas> element corresponding to this instance
       * @return {HTMLCanvasElement}
       */
      getElement: function() {
        return this.lowerCanvasEl;
      },

      /**
       * @private
       * @param {fabric.Object} obj Object that was added
       */
      _onObjectAdded: function(obj) {
        this.stateful && obj.setupState();
        obj._set('canvas', this);
        obj.setCoords();
        this.fire('object:added', { target: obj });
        obj.fire('added');
      },

      /**
       * @private
       * @param {fabric.Object} obj Object that was removed
       */
      _onObjectRemoved: function(obj) {
        this.fire('object:removed', { target: obj });
        obj.fire('removed');
        delete obj.canvas;
      },

      /**
       * Clears specified context of canvas element
       * @param {CanvasRenderingContext2D} ctx Context to clear
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      clearContext: function(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        return this;
      },

      /**
       * Returns context of canvas where objects are drawn
       * @return {CanvasRenderingContext2D}
       */
      getContext: function() {
        return this.contextContainer;
      },

      /**
       * Clears all contexts (background, main, top) of an instance
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      clear: function() {
        this._objects.length = 0;
        this.backgroundImage = null;
        this.overlayImage = null;
        this.backgroundColor = '';
        this.overlayColor = '';
        if (this._hasITextHandlers) {
          this.off('mouse:up', this._mouseUpITextHandler);
          this._iTextInstances = null;
          this._hasITextHandlers = false;
        }
        this.clearContext(this.contextContainer);
        this.fire('canvas:cleared');
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * Renders the canvas
       * @return {fabric.Canvas} instance
       * @chainable
       */
      renderAll: function() {
        var canvasToDrawOn = this.contextContainer;
        this.renderCanvas(canvasToDrawOn, this._objects);
        return this;
      },

      /**
       * Function created to be instance bound at initialization
       * used in requestAnimationFrame rendering
       * Let the fabricJS call it. If you call it manually you could have more
       * animationFrame stacking on to of each other
       * for an imperative rendering, use canvas.renderAll
       * @private
       * @return {fabric.Canvas} instance
       * @chainable
       */
      renderAndReset: function() {
        this.isRendering = 0;
        this.renderAll();
      },

      /**
       * Append a renderAll request to next animation frame.
       * unless one is already in progress, in that case nothing is done
       * a boolean flag will avoid appending more.
       * @return {fabric.Canvas} instance
       * @chainable
       */
      requestRenderAll: function() {
        if (!this.isRendering) {
          this.isRendering = fabric.util.requestAnimFrame(
            this.renderAndResetBound
          );
        }
        return this;
      },

      /**
       * Calculate the position of the 4 corner of canvas with current viewportTransform.
       * helps to determinate when an object is in the current rendering viewport using
       * object absolute coordinates ( aCoords )
       * @return {Object} points.tl
       * @chainable
       */
      calcViewportBoundaries: function() {
        var points = {},
          width = this.width,
          height = this.height,
          iVpt = invertTransform(this.viewportTransform);
        points.tl = transformPoint({ x: 0, y: 0 }, iVpt);
        points.br = transformPoint({ x: width, y: height }, iVpt);
        points.tr = new fabric.Point(points.br.x, points.tl.y);
        points.bl = new fabric.Point(points.tl.x, points.br.y);
        this.vptCoords = points;
        return points;
      },

      cancelRequestedRender: function() {
        if (this.isRendering) {
          fabric.util.cancelAnimFrame(this.isRendering);
          this.isRendering = 0;
        }
      },

      /**
       * Renders background, objects, overlay and controls.
       * @param {CanvasRenderingContext2D} ctx
       * @param {Array} objects to render
       * @return {fabric.Canvas} instance
       * @chainable
       */
      renderCanvas: function(ctx, objects) {
        var v = this.viewportTransform,
          path = this.clipPath;
        this.cancelRequestedRender();
        this.calcViewportBoundaries();
        this.clearContext(ctx);
        fabric.util.setImageSmoothing(ctx, this.imageSmoothingEnabled);
        this.fire('before:render', { ctx: ctx });
        this._renderBackground(ctx);

        ctx.save();
        //apply viewport transform once for all rendering process
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        this._renderObjects(ctx, objects);
        ctx.restore();
        if (!this.controlsAboveOverlay && this.interactive) {
          this.drawControls(ctx);
        }
        if (path) {
          path.canvas = this;
          // needed to setup a couple of variables
          path.shouldCache();
          path._transformDone = true;
          path.renderCache({ forClipping: true });
          this.drawClipPathOnCanvas(ctx);
        }
        this._renderOverlay(ctx);
        if (this.controlsAboveOverlay && this.interactive) {
          this.drawControls(ctx);
        }
        this.fire('after:render', { ctx: ctx });
      },

      /**
       * Paint the cached clipPath on the lowerCanvasEl
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawClipPathOnCanvas: function(ctx) {
        var v = this.viewportTransform,
          path = this.clipPath;
        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        // DEBUG: uncomment this line, comment the following
        // ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = 'destination-in';
        path.transform(ctx);
        ctx.scale(1 / path.zoomX, 1 / path.zoomY);
        ctx.drawImage(
          path._cacheCanvas,
          -path.cacheTranslationX,
          -path.cacheTranslationY
        );
        ctx.restore();
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {Array} objects to render
       */
      _renderObjects: function(ctx, objects) {
        var i, len;
        for (i = 0, len = objects.length; i < len; ++i) {
          objects[i] && objects[i].render(ctx);
        }
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {string} property 'background' or 'overlay'
       */
      _renderBackgroundOrOverlay: function(ctx, property) {
        var fill = this[property + 'Color'],
          object = this[property + 'Image'],
          v = this.viewportTransform,
          needsVpt = this[property + 'Vpt'];
        if (!fill && !object) {
          return;
        }
        if (fill) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.width, 0);
          ctx.lineTo(this.width, this.height);
          ctx.lineTo(0, this.height);
          ctx.closePath();
          ctx.fillStyle = fill.toLive ? fill.toLive(ctx, this) : fill;
          if (needsVpt) {
            ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
          }
          ctx.transform(1, 0, 0, 1, fill.offsetX || 0, fill.offsetY || 0);
          var m = fill.gradientTransform || fill.patternTransform;
          m && ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
          ctx.fill();
          ctx.restore();
        }
        if (object) {
          ctx.save();
          if (needsVpt) {
            ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
          }
          object.render(ctx);
          ctx.restore();
        }
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderBackground: function(ctx) {
        this._renderBackgroundOrOverlay(ctx, 'background');
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderOverlay: function(ctx) {
        this._renderBackgroundOrOverlay(ctx, 'overlay');
      },

      /**
       * Returns coordinates of a center of canvas.
       * Returned value is an object with top and left properties
       * @return {Object} object with "top" and "left" number values
       */
      getCenter: function() {
        return {
          top: this.height / 2,
          left: this.width / 2
        };
      },

      /**
       * Centers object horizontally in the canvas
       * @param {fabric.Object} object Object to center horizontally
       * @return {fabric.Canvas} thisArg
       */
      centerObjectH: function(object) {
        return this._centerObject(
          object,
          new fabric.Point(this.getCenter().left, object.getCenterPoint().y)
        );
      },

      /**
       * Centers object vertically in the canvas
       * @param {fabric.Object} object Object to center vertically
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      centerObjectV: function(object) {
        return this._centerObject(
          object,
          new fabric.Point(object.getCenterPoint().x, this.getCenter().top)
        );
      },

      /**
       * Centers object vertically and horizontally in the canvas
       * @param {fabric.Object} object Object to center vertically and horizontally
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      centerObject: function(object) {
        var center = this.getCenter();

        return this._centerObject(
          object,
          new fabric.Point(center.left, center.top)
        );
      },

      /**
       * Centers object vertically and horizontally in the viewport
       * @param {fabric.Object} object Object to center vertically and horizontally
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      viewportCenterObject: function(object) {
        var vpCenter = this.getVpCenter();

        return this._centerObject(object, vpCenter);
      },

      /**
       * Centers object horizontally in the viewport, object.top is unchanged
       * @param {fabric.Object} object Object to center vertically and horizontally
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      viewportCenterObjectH: function(object) {
        var vpCenter = this.getVpCenter();
        this._centerObject(
          object,
          new fabric.Point(vpCenter.x, object.getCenterPoint().y)
        );
        return this;
      },

      /**
       * Centers object Vertically in the viewport, object.top is unchanged
       * @param {fabric.Object} object Object to center vertically and horizontally
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      viewportCenterObjectV: function(object) {
        var vpCenter = this.getVpCenter();

        return this._centerObject(
          object,
          new fabric.Point(object.getCenterPoint().x, vpCenter.y)
        );
      },

      /**
       * Calculate the point in canvas that correspond to the center of actual viewport.
       * @return {fabric.Point} vpCenter, viewport center
       * @chainable
       */
      getVpCenter: function() {
        var center = this.getCenter(),
          iVpt = invertTransform(this.viewportTransform);
        return transformPoint({ x: center.left, y: center.top }, iVpt);
      },

      /**
       * @private
       * @param {fabric.Object} object Object to center
       * @param {fabric.Point} center Center point
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      _centerObject: function(object, center) {
        object.setPositionByOrigin(center, 'center', 'center');
        object.setCoords();
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * Returns dataless JSON representation of canvas
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {String} json string
       */
      toDatalessJSON: function(propertiesToInclude) {
        return this.toDatalessObject(propertiesToInclude);
      },

      /**
       * Returns object representation of canvas
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} object representation of an instance
       */
      toObject: function(propertiesToInclude) {
        return this._toObjectMethod('toObject', propertiesToInclude);
      },

      /**
       * Returns dataless object representation of canvas
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} object representation of an instance
       */
      toDatalessObject: function(propertiesToInclude) {
        return this._toObjectMethod('toDatalessObject', propertiesToInclude);
      },

      /**
       * @private
       */
      _toObjectMethod: function(methodName, propertiesToInclude) {
        var clipPath = this.clipPath,
          data = {
            version: fabric.version,
            objects: this._toObjects(methodName, propertiesToInclude)
          };
        if (clipPath) {
          data.clipPath = this._toObject(
            this.clipPath,
            methodName,
            propertiesToInclude
          );
        }
        extend(
          data,
          this.__serializeBgOverlay(methodName, propertiesToInclude)
        );

        fabric.util.populateWithProperties(this, data, propertiesToInclude);

        return data;
      },

      /**
       * @private
       */
      _toObjects: function(methodName, propertiesToInclude) {
        return this._objects
          .filter(function(object) {
            return !object.excludeFromExport;
          })
          .map(function(instance) {
            return this._toObject(instance, methodName, propertiesToInclude);
          }, this);
      },

      /**
       * @private
       */
      _toObject: function(instance, methodName, propertiesToInclude) {
        var originalValue;

        if (!this.includeDefaultValues) {
          originalValue = instance.includeDefaultValues;
          instance.includeDefaultValues = false;
        }

        var object = instance[methodName](propertiesToInclude);
        if (!this.includeDefaultValues) {
          instance.includeDefaultValues = originalValue;
        }
        return object;
      },

      /**
       * @private
       */
      __serializeBgOverlay: function(methodName, propertiesToInclude) {
        var data = {},
          bgImage = this.backgroundImage,
          overlay = this.overlayImage;

        if (this.backgroundColor) {
          data.background = this.backgroundColor.toObject
            ? this.backgroundColor.toObject(propertiesToInclude)
            : this.backgroundColor;
        }

        if (this.overlayColor) {
          data.overlay = this.overlayColor.toObject
            ? this.overlayColor.toObject(propertiesToInclude)
            : this.overlayColor;
        }
        if (bgImage && !bgImage.excludeFromExport) {
          data.backgroundImage = this._toObject(
            bgImage,
            methodName,
            propertiesToInclude
          );
        }
        if (overlay && !overlay.excludeFromExport) {
          data.overlayImage = this._toObject(
            overlay,
            methodName,
            propertiesToInclude
          );
        }

        return data;
      },

      /* _TO_SVG_START_ */
      /**
       * When true, getSvgTransform() will apply the StaticCanvas.viewportTransform to the SVG transformation. When true,
       * a zoomed canvas will then produce zoomed SVG output.
       * @type Boolean
       * @default
       */
      svgViewportTransformation: true,

      /**
       * Returns SVG representation of canvas
       * @function
       * @param {Object} [options] Options object for SVG output
       * @param {Boolean} [options.suppressPreamble=false] If true xml tag is not included
       * @param {Object} [options.viewBox] SVG viewbox object
       * @param {Number} [options.viewBox.x] x-coordinate of viewbox
       * @param {Number} [options.viewBox.y] y-coordinate of viewbox
       * @param {Number} [options.viewBox.width] Width of viewbox
       * @param {Number} [options.viewBox.height] Height of viewbox
       * @param {String} [options.encoding=UTF-8] Encoding of SVG output
       * @param {String} [options.width] desired width of svg with or without units
       * @param {String} [options.height] desired height of svg with or without units
       * @param {Function} [reviver] Method for further parsing of svg elements, called after each fabric object converted into svg representation.
       * @return {String} SVG string
       * @tutorial {@link http://fabricjs.com/fabric-intro-part-3#serialization}
       * @see {@link http://jsfiddle.net/fabricjs/jQ3ZZ/|jsFiddle demo}
       * @example <caption>Normal SVG output</caption>
       * var svg = canvas.toSVG();
       * @example <caption>SVG output without preamble (without &lt;?xml ../>)</caption>
       * var svg = canvas.toSVG({suppressPreamble: true});
       * @example <caption>SVG output with viewBox attribute</caption>
       * var svg = canvas.toSVG({
       *   viewBox: {
       *     x: 100,
       *     y: 100,
       *     width: 200,
       *     height: 300
       *   }
       * });
       * @example <caption>SVG output with different encoding (default: UTF-8)</caption>
       * var svg = canvas.toSVG({encoding: 'ISO-8859-1'});
       * @example <caption>Modify SVG output with reviver function</caption>
       * var svg = canvas.toSVG(null, function(svg) {
       *   return svg.replace('stroke-dasharray: ; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; ', '');
       * });
       */
      toSVG: function(options, reviver) {
        options || (options = {});
        options.reviver = reviver;
        var markup = [];

        this._setSVGPreamble(markup, options);
        this._setSVGHeader(markup, options);
        if (this.clipPath) {
          markup.push(
            '<g clip-path="url(#' + this.clipPath.clipPathId + ')" >\n'
          );
        }
        this._setSVGBgOverlayColor(markup, 'background');
        this._setSVGBgOverlayImage(markup, 'backgroundImage', reviver);
        this._setSVGObjects(markup, reviver);
        if (this.clipPath) {
          markup.push('</g>\n');
        }
        this._setSVGBgOverlayColor(markup, 'overlay');
        this._setSVGBgOverlayImage(markup, 'overlayImage', reviver);

        markup.push('</svg>');

        return markup.join('');
      },

      /**
       * @private
       */
      _setSVGPreamble: function(markup, options) {
        if (options.suppressPreamble) {
          return;
        }
        markup.push(
          '<?xml version="1.0" encoding="',
          options.encoding || 'UTF-8',
          '" standalone="no" ?>\n',
          '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
          '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
        );
      },

      /**
       * @private
       */
      _setSVGHeader: function(markup, options) {
        var width = options.width || this.width,
          height = options.height || this.height,
          vpt,
          viewBox = 'viewBox="0 0 ' + this.width + ' ' + this.height + '" ',
          NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

        if (options.viewBox) {
          viewBox =
            'viewBox="' +
            options.viewBox.x +
            ' ' +
            options.viewBox.y +
            ' ' +
            options.viewBox.width +
            ' ' +
            options.viewBox.height +
            '" ';
        } else {
          if (this.svgViewportTransformation) {
            vpt = this.viewportTransform;
            viewBox =
              'viewBox="' +
              toFixed(-vpt[4] / vpt[0], NUM_FRACTION_DIGITS) +
              ' ' +
              toFixed(-vpt[5] / vpt[3], NUM_FRACTION_DIGITS) +
              ' ' +
              toFixed(this.width / vpt[0], NUM_FRACTION_DIGITS) +
              ' ' +
              toFixed(this.height / vpt[3], NUM_FRACTION_DIGITS) +
              '" ';
          }
        }

        markup.push(
          '<svg ',
          'xmlns="http://www.w3.org/2000/svg" ',
          'xmlns:xlink="http://www.w3.org/1999/xlink" ',
          'version="1.1" ',
          'width="',
          width,
          '" ',
          'height="',
          height,
          '" ',
          viewBox,
          'xml:space="preserve">\n',
          '<desc>Created with Fabric.js ',
          fabric.version,
          '</desc>\n',
          '<defs>\n',
          this.createSVGFontFacesMarkup(),
          this.createSVGRefElementsMarkup(),
          this.createSVGClipPathMarkup(options),
          '</defs>\n'
        );
      },

      createSVGClipPathMarkup: function(options) {
        var clipPath = this.clipPath;
        if (clipPath) {
          clipPath.clipPathId = 'CLIPPATH_' + fabric.Object.__uid++;
          return (
            '<clipPath id="' +
            clipPath.clipPathId +
            '" >\n' +
            this.clipPath.toClipPathSVG(options.reviver) +
            '</clipPath>\n'
          );
        }
        return '';
      },

      /**
       * Creates markup containing SVG referenced elements like patterns, gradients etc.
       * @return {String}
       */
      createSVGRefElementsMarkup: function() {
        var _this = this,
          markup = ['background', 'overlay'].map(function(prop) {
            var fill = _this[prop + 'Color'];
            if (fill && fill.toLive) {
              var shouldTransform = _this[prop + 'Vpt'],
                vpt = _this.viewportTransform,
                object = {
                  width: _this.width / (shouldTransform ? vpt[0] : 1),
                  height: _this.height / (shouldTransform ? vpt[3] : 1)
                };
              return fill.toSVG(object, {
                additionalTransform: shouldTransform
                  ? fabric.util.matrixToSVG(vpt)
                  : ''
              });
            }
          });
        return markup.join('');
      },

      /**
       * Creates markup containing SVG font faces,
       * font URLs for font faces must be collected by developers
       * and are not extracted from the DOM by fabricjs
       * @param {Array} objects Array of fabric objects
       * @return {String}
       */
      createSVGFontFacesMarkup: function() {
        var markup = '',
          fontList = {},
          obj,
          fontFamily,
          style,
          row,
          rowIndex,
          _char,
          charIndex,
          i,
          len,
          fontPaths = fabric.fontPaths,
          objects = [];

        this._objects.forEach(function add(object) {
          objects.push(object);
          if (object._objects) {
            object._objects.forEach(add);
          }
        });

        for (i = 0, len = objects.length; i < len; i++) {
          obj = objects[i];
          fontFamily = obj.fontFamily;
          if (
            obj.type.indexOf('text') === -1 ||
            fontList[fontFamily] ||
            !fontPaths[fontFamily]
          ) {
            continue;
          }
          fontList[fontFamily] = true;
          if (!obj.styles) {
            continue;
          }
          style = obj.styles;
          for (rowIndex in style) {
            row = style[rowIndex];
            for (charIndex in row) {
              _char = row[charIndex];
              fontFamily = _char.fontFamily;
              if (!fontList[fontFamily] && fontPaths[fontFamily]) {
                fontList[fontFamily] = true;
              }
            }
          }
        }

        for (var j in fontList) {
          markup += [
            '\t\t@font-face {\n',
            "\t\t\tfont-family: '",
            j,
            "';\n",
            "\t\t\tsrc: url('",
            fontPaths[j],
            "');\n",
            '\t\t}\n'
          ].join('');
        }

        if (markup) {
          markup = [
            '\t<style type="text/css">',
            '<![CDATA[\n',
            markup,
            ']]>',
            '</style>\n'
          ].join('');
        }

        return markup;
      },

      /**
       * @private
       */
      _setSVGObjects: function(markup, reviver) {
        var instance,
          i,
          len,
          objects = this._objects;
        for (i = 0, len = objects.length; i < len; i++) {
          instance = objects[i];
          if (instance.excludeFromExport) {
            continue;
          }
          this._setSVGObject(markup, instance, reviver);
        }
      },

      /**
       * @private
       */
      _setSVGObject: function(markup, instance, reviver) {
        markup.push(instance.toSVG(reviver));
      },

      /**
       * @private
       */
      _setSVGBgOverlayImage: function(markup, property, reviver) {
        if (
          this[property] &&
          !this[property].excludeFromExport &&
          this[property].toSVG
        ) {
          markup.push(this[property].toSVG(reviver));
        }
      },

      /**
       * @private
       */
      _setSVGBgOverlayColor: function(markup, property) {
        var filler = this[property + 'Color'],
          vpt = this.viewportTransform,
          finalWidth = this.width,
          finalHeight = this.height;
        if (!filler) {
          return;
        }
        if (filler.toLive) {
          var repeat = filler.repeat,
            iVpt = fabric.util.invertTransform(vpt),
            shouldInvert = this[property + 'Vpt'],
            additionalTransform = shouldInvert
              ? fabric.util.matrixToSVG(iVpt)
              : '';
          markup.push(
            '<rect transform="' + additionalTransform + ' translate(',
            finalWidth / 2,
            ',',
            finalHeight / 2,
            ')"',
            ' x="',
            filler.offsetX - finalWidth / 2,
            '" y="',
            filler.offsetY - finalHeight / 2,
            '" ',
            'width="',
            repeat === 'repeat-y' || repeat === 'no-repeat'
              ? filler.source.width
              : finalWidth,
            '" height="',
            repeat === 'repeat-x' || repeat === 'no-repeat'
              ? filler.source.height
              : finalHeight,
            '" fill="url(#SVGID_' + filler.id + ')"',
            '></rect>\n'
          );
        } else {
          markup.push(
            '<rect x="0" y="0" width="100%" height="100%" ',
            'fill="',
            filler,
            '"',
            '></rect>\n'
          );
        }
      },
      /* _TO_SVG_END_ */

      /**
       * Moves an object or the objects of a multiple selection
       * to the bottom of the stack of drawn objects
       * @param {fabric.Object} object Object to send to back
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      sendToBack: function(object) {
        if (!object) {
          return this;
        }
        var activeSelection = this._activeObject,
          i,
          obj,
          objs;
        if (object === activeSelection && object.type === 'activeSelection') {
          objs = activeSelection._objects;
          for (i = objs.length; i--; ) {
            obj = objs[i];
            removeFromArray(this._objects, obj);
            this._objects.unshift(obj);
          }
        } else {
          removeFromArray(this._objects, object);
          this._objects.unshift(object);
        }
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * Moves an object or the objects of a multiple selection
       * to the top of the stack of drawn objects
       * @param {fabric.Object} object Object to send
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      bringToFront: function(object) {
        if (!object) {
          return this;
        }
        var activeSelection = this._activeObject,
          i,
          obj,
          objs;
        if (object === activeSelection && object.type === 'activeSelection') {
          objs = activeSelection._objects;
          for (i = 0; i < objs.length; i++) {
            obj = objs[i];
            removeFromArray(this._objects, obj);
            this._objects.push(obj);
          }
        } else {
          removeFromArray(this._objects, object);
          this._objects.push(object);
        }
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * Moves an object or a selection down in stack of drawn objects
       * An optional parameter, intersecting allows to move the object in behind
       * the first intersecting object. Where intersection is calculated with
       * bounding box. If no intersection is found, there will not be change in the
       * stack.
       * @param {fabric.Object} object Object to send
       * @param {Boolean} [intersecting] If `true`, send object behind next lower intersecting object
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      sendBackwards: function(object, intersecting) {
        if (!object) {
          return this;
        }
        var activeSelection = this._activeObject,
          i,
          obj,
          idx,
          newIdx,
          objs,
          objsMoved = 0;

        if (object === activeSelection && object.type === 'activeSelection') {
          objs = activeSelection._objects;
          for (i = 0; i < objs.length; i++) {
            obj = objs[i];
            idx = this._objects.indexOf(obj);
            if (idx > 0 + objsMoved) {
              newIdx = idx - 1;
              removeFromArray(this._objects, obj);
              this._objects.splice(newIdx, 0, obj);
            }
            objsMoved++;
          }
        } else {
          idx = this._objects.indexOf(object);
          if (idx !== 0) {
            // if object is not on the bottom of stack
            newIdx = this._findNewLowerIndex(object, idx, intersecting);
            removeFromArray(this._objects, object);
            this._objects.splice(newIdx, 0, object);
          }
        }
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * @private
       */
      _findNewLowerIndex: function(object, idx, intersecting) {
        var newIdx, i;

        if (intersecting) {
          newIdx = idx;

          // traverse down the stack looking for the nearest intersecting object
          for (i = idx - 1; i >= 0; --i) {
            var isIntersecting =
              object.intersectsWithObject(this._objects[i]) ||
              object.isContainedWithinObject(this._objects[i]) ||
              this._objects[i].isContainedWithinObject(object);

            if (isIntersecting) {
              newIdx = i;
              break;
            }
          }
        } else {
          newIdx = idx - 1;
        }

        return newIdx;
      },

      /**
       * Moves an object or a selection up in stack of drawn objects
       * An optional parameter, intersecting allows to move the object in front
       * of the first intersecting object. Where intersection is calculated with
       * bounding box. If no intersection is found, there will not be change in the
       * stack.
       * @param {fabric.Object} object Object to send
       * @param {Boolean} [intersecting] If `true`, send object in front of next upper intersecting object
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      bringForward: function(object, intersecting) {
        if (!object) {
          return this;
        }
        var activeSelection = this._activeObject,
          i,
          obj,
          idx,
          newIdx,
          objs,
          objsMoved = 0;

        if (object === activeSelection && object.type === 'activeSelection') {
          objs = activeSelection._objects;
          for (i = objs.length; i--; ) {
            obj = objs[i];
            idx = this._objects.indexOf(obj);
            if (idx < this._objects.length - 1 - objsMoved) {
              newIdx = idx + 1;
              removeFromArray(this._objects, obj);
              this._objects.splice(newIdx, 0, obj);
            }
            objsMoved++;
          }
        } else {
          idx = this._objects.indexOf(object);
          if (idx !== this._objects.length - 1) {
            // if object is not on top of stack (last item in an array)
            newIdx = this._findNewUpperIndex(object, idx, intersecting);
            removeFromArray(this._objects, object);
            this._objects.splice(newIdx, 0, object);
          }
        }
        this.renderOnAddRemove && this.requestRenderAll();
        return this;
      },

      /**
       * @private
       */
      _findNewUpperIndex: function(object, idx, intersecting) {
        var newIdx, i, len;

        if (intersecting) {
          newIdx = idx;

          // traverse up the stack looking for the nearest intersecting object
          for (i = idx + 1, len = this._objects.length; i < len; ++i) {
            var isIntersecting =
              object.intersectsWithObject(this._objects[i]) ||
              object.isContainedWithinObject(this._objects[i]) ||
              this._objects[i].isContainedWithinObject(object);

            if (isIntersecting) {
              newIdx = i;
              break;
            }
          }
        } else {
          newIdx = idx + 1;
        }

        return newIdx;
      },

      /**
       * Moves an object to specified level in stack of drawn objects
       * @param {fabric.Object} object Object to send
       * @param {Number} index Position to move to
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      moveTo: function(object, index) {
        removeFromArray(this._objects, object);
        this._objects.splice(index, 0, object);
        return this.renderOnAddRemove && this.requestRenderAll();
      },

      /**
       * Clears a canvas element and dispose objects
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      dispose: function() {
        // cancel eventually ongoing renders
        if (this.isRendering) {
          fabric.util.cancelAnimFrame(this.isRendering);
          this.isRendering = 0;
        }
        this.forEachObject(function(object) {
          object.dispose && object.dispose();
        });
        this._objects = [];
        if (this.backgroundImage && this.backgroundImage.dispose) {
          this.backgroundImage.dispose();
        }
        this.backgroundImage = null;
        if (this.overlayImage && this.overlayImage.dispose) {
          this.overlayImage.dispose();
        }
        this.overlayImage = null;
        this._iTextInstances = null;
        this.contextContainer = null;
        fabric.util.cleanUpJsdomNode(this.lowerCanvasEl);
        this.lowerCanvasEl = undefined;
        return this;
      },

      /**
       * Returns a string representation of an instance
       * @return {String} string representation of an instance
       */
      toString: function() {
        return (
          '#<fabric.Canvas (' +
          this.complexity() +
          '): ' +
          '{ objects: ' +
          this._objects.length +
          ' }>'
        );
      }
    }
  );

  extend(fabric.StaticCanvas.prototype, fabric.Observable);
  extend(fabric.StaticCanvas.prototype, fabric.Collection);
  extend(fabric.StaticCanvas.prototype, fabric.DataURLExporter);

  extend(
    fabric.StaticCanvas,
    /** @lends fabric.StaticCanvas */ {
      /**
       * @static
       * @type String
       * @default
       */
      EMPTY_JSON: '{"objects": [], "background": "white"}',

      /**
       * Provides a way to check support of some of the canvas methods
       * (either those of HTMLCanvasElement itself, or rendering context)
       *
       * @param {String} methodName Method to check support for;
       *                            Could be one of "setLineDash"
       * @return {Boolean | null} `true` if method is supported (or at least exists),
       *                          `null` if canvas element or context can not be initialized
       */
      supports: function(methodName) {
        var el = createCanvasElement();

        if (!el || !el.getContext) {
          return null;
        }

        var ctx = el.getContext('2d');
        if (!ctx) {
          return null;
        }

        switch (methodName) {
          case 'setLineDash':
            return typeof ctx.setLineDash !== 'undefined';

          default:
            return null;
        }
      }
    }
  );

  /**
   * Returns Object representation of canvas
   * this alias is provided because if you call JSON.stringify on an instance,
   * the toJSON object will be invoked if it exists.
   * Having a toJSON method means you can do JSON.stringify(myCanvas)
   * @function
   * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
   * @return {Object} JSON compatible object
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-3#serialization}
   * @see {@link http://jsfiddle.net/fabricjs/pec86/|jsFiddle demo}
   * @example <caption>JSON without additional properties</caption>
   * var json = canvas.toJSON();
   * @example <caption>JSON with additional properties included</caption>
   * var json = canvas.toJSON(['lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY']);
   * @example <caption>JSON without default values</caption>
   * canvas.includeDefaultValues = false;
   * var json = canvas.toJSON();
   */
  fabric.StaticCanvas.prototype.toJSON = fabric.StaticCanvas.prototype.toObject;

  if (fabric.isLikelyNode) {
    fabric.StaticCanvas.prototype.createPNGStream = function() {
      var impl = getNodeCanvas(this.lowerCanvasEl);
      return impl && impl.createPNGStream();
    };
    fabric.StaticCanvas.prototype.createJPEGStream = function(opts) {
      var impl = getNodeCanvas(this.lowerCanvasEl);
      return impl && impl.createJPEGStream(opts);
    };
  }
})();
(function() {
  var getPointer = fabric.util.getPointer,
    degreesToRadians = fabric.util.degreesToRadians,
    abs = Math.abs,
    supportLineDash = fabric.StaticCanvas.supports('setLineDash'),
    isTouchEvent = fabric.util.isTouchEvent,
    STROKE_OFFSET = 0.5;

  /**
   * Canvas class
   * @class fabric.Canvas
   * @extends fabric.StaticCanvas
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-1#canvas}
   * @see {@link fabric.Canvas#initialize} for constructor definition
   *
   * @fires object:modified at the end of a transform or any change when statefull is true
   * @fires object:rotating while an object is being rotated from the control
   * @fires object:scaling while an object is being scaled by controls
   * @fires object:moving while an object is being dragged
   * @fires object:skewing while an object is being skewed from the controls
   *
   * @fires before:transform before a transform is is started
   * @fires before:selection:cleared
   * @fires selection:cleared
   * @fires selection:updated
   * @fires selection:created
   *
   * @fires path:created after a drawing operation ends and the path is added
   * @fires mouse:down
   * @fires mouse:move
   * @fires mouse:up
   * @fires mouse:down:before  on mouse down, before the inner fabric logic runs
   * @fires mouse:move:before on mouse move, before the inner fabric logic runs
   * @fires mouse:up:before on mouse up, before the inner fabric logic runs
   * @fires mouse:over
   * @fires mouse:out
   * @fires mouse:dblclick whenever a native dbl click event fires on the canvas.
   *
   * @fires dragover
   * @fires dragenter
   * @fires dragleave
   * @fires drop
   * @fires after:render at the end of the render process, receives the context in the callback
   * @fires before:render at start the render process, receives the context in the callback
   *
   * the following events are deprecated:
   * @fires object:rotated at the end of a rotation transform
   * @fires object:scaled at the end of a scale transform
   * @fires object:moved at the end of translation transform
   * @fires object:skewed at the end of a skew transform
   */
  fabric.Canvas = fabric.util.createClass(
    fabric.StaticCanvas,
    /** @lends fabric.Canvas.prototype */ {
      /**
       * Constructor
       * @param {HTMLElement | String} el &lt;canvas> element to initialize instance on
       * @param {Object} [options] Options object
       * @return {Object} thisArg
       */
      initialize: function(el, options) {
        options || (options = {});
        this.renderAndResetBound = this.renderAndReset.bind(this);
        this.requestRenderAllBound = this.requestRenderAll.bind(this);
        this._initStatic(el, options);
        this._initInteractive();
        this._createCacheCanvas();
      },

      /**
       * When true, objects can be transformed by one side (unproportionally)
       * when dragged on the corners that normally would not do that.
       * @type Boolean
       * @default
       * @since fabric 4.0 // changed name and default value
       */
      uniformScaling: true,

      /**
       * Indicates which key switches uniform scaling.
       * values: 'altKey', 'shiftKey', 'ctrlKey'.
       * If `null` or 'none' or any other string that is not a modifier key
       * feature is disabled.
       * totally wrong named. this sounds like `uniform scaling`
       * if Canvas.uniformScaling is true, pressing this will set it to false
       * and viceversa.
       * @since 1.6.2
       * @type String
       * @default
       */
      uniScaleKey: 'shiftKey',

      /**
       * When true, objects use center point as the origin of scale transformation.
       * <b>Backwards incompatibility note:</b> This property replaces "centerTransform" (Boolean).
       * @since 1.3.4
       * @type Boolean
       * @default
       */
      centeredScaling: false,

      /**
       * When true, objects use center point as the origin of rotate transformation.
       * <b>Backwards incompatibility note:</b> This property replaces "centerTransform" (Boolean).
       * @since 1.3.4
       * @type Boolean
       * @default
       */
      centeredRotation: false,

      /**
       * Indicates which key enable centered Transform
       * values: 'altKey', 'shiftKey', 'ctrlKey'.
       * If `null` or 'none' or any other string that is not a modifier key
       * feature is disabled feature disabled.
       * @since 1.6.2
       * @type String
       * @default
       */
      centeredKey: 'altKey',

      /**
       * Indicates which key enable alternate action on corner
       * values: 'altKey', 'shiftKey', 'ctrlKey'.
       * If `null` or 'none' or any other string that is not a modifier key
       * feature is disabled feature disabled.
       * @since 1.6.2
       * @type String
       * @default
       */
      altActionKey: 'shiftKey',

      /**
       * Indicates that canvas is interactive. This property should not be changed.
       * @type Boolean
       * @default
       */
      interactive: true,

      /**
       * Indicates whether group selection should be enabled
       * @type Boolean
       * @default
       */
      selection: true,

      /**
       * Indicates which key or keys enable multiple click selection
       * Pass value as a string or array of strings
       * values: 'altKey', 'shiftKey', 'ctrlKey'.
       * If `null` or empty or containing any other string that is not a modifier key
       * feature is disabled.
       * @since 1.6.2
       * @type String|Array
       * @default
       */
      selectionKey: 'shiftKey',

      /**
       * Indicates which key enable alternative selection
       * in case of target overlapping with active object
       * values: 'altKey', 'shiftKey', 'ctrlKey'.
       * For a series of reason that come from the general expectations on how
       * things should work, this feature works only for preserveObjectStacking true.
       * If `null` or 'none' or any other string that is not a modifier key
       * feature is disabled.
       * @since 1.6.5
       * @type null|String
       * @default
       */
      altSelectionKey: null,

      /**
       * Color of selection
       * @type String
       * @default
       */
      selectionColor: 'rgba(100, 100, 255, 0.3)', // blue

      /**
       * Default dash array pattern
       * If not empty the selection border is dashed
       * @type Array
       */
      selectionDashArray: [],

      /**
       * Color of the border of selection (usually slightly darker than color of selection itself)
       * @type String
       * @default
       */
      selectionBorderColor: 'rgba(255, 255, 255, 0.3)',

      /**
       * Width of a line used in object/group selection
       * @type Number
       * @default
       */
      selectionLineWidth: 1,

      /**
       * Select only shapes that are fully contained in the dragged selection rectangle.
       * @type Boolean
       * @default
       */
      selectionFullyContained: false,

      /**
       * Default cursor value used when hovering over an object on canvas
       * @type String
       * @default
       */
      hoverCursor: 'move',

      /**
       * Default cursor value used when moving an object on canvas
       * @type String
       * @default
       */
      moveCursor: 'move',

      /**
       * Default cursor value used for the entire canvas
       * @type String
       * @default
       */
      defaultCursor: 'default',

      /**
       * Cursor value used during free drawing
       * @type String
       * @default
       */
      freeDrawingCursor: 'crosshair',

      /**
       * Cursor value used for rotation point
       * @type String
       * @default
       */
      rotationCursor: 'crosshair',

      /**
       * Cursor value used for disabled elements ( corners with disabled action )
       * @type String
       * @since 2.0.0
       * @default
       */
      notAllowedCursor: 'not-allowed',

      /**
       * Default element class that's given to wrapper (div) element of canvas
       * @type String
       * @default
       */
      containerClass: 'canvas-container',

      /**
       * When true, object detection happens on per-pixel basis rather than on per-bounding-box
       * @type Boolean
       * @default
       */
      perPixelTargetFind: false,

      /**
       * Number of pixels around target pixel to tolerate (consider active) during object detection
       * @type Number
       * @default
       */
      targetFindTolerance: 0,

      /**
       * When true, target detection is skipped. Target detection will return always undefined.
       * click selection won't work anymore, events will fire with no targets.
       * if something is selected before setting it to true, it will be deselected at the first click.
       * area selection will still work. check the `selection` property too.
       * if you deactivate both, you should look into staticCanvas.
       * @type Boolean
       * @default
       */
      skipTargetFind: false,

      /**
       * When true, mouse events on canvas (mousedown/mousemove/mouseup) result in free drawing.
       * After mousedown, mousemove creates a shape,
       * and then mouseup finalizes it and adds an instance of `fabric.Path` onto canvas.
       * @tutorial {@link http://fabricjs.com/fabric-intro-part-4#free_drawing}
       * @type Boolean
       * @default
       */
      isDrawingMode: false,

      /**
       * Indicates whether objects should remain in current stack position when selected.
       * When false objects are brought to top and rendered as part of the selection group
       * @type Boolean
       * @default
       */
      preserveObjectStacking: false,

      /**
       * Indicates the angle that an object will lock to while rotating.
       * @type Number
       * @since 1.6.7
       * @default
       */
      snapAngle: 0,

      /**
       * Indicates the distance from the snapAngle the rotation will lock to the snapAngle.
       * When `null`, the snapThreshold will default to the snapAngle.
       * @type null|Number
       * @since 1.6.7
       * @default
       */
      snapThreshold: null,

      /**
       * Indicates if the right click on canvas can output the context menu or not
       * @type Boolean
       * @since 1.6.5
       * @default
       */
      stopContextMenu: false,

      /**
       * Indicates if the canvas can fire right click events
       * @type Boolean
       * @since 1.6.5
       * @default
       */
      fireRightClick: false,

      /**
       * Indicates if the canvas can fire middle click events
       * @type Boolean
       * @since 1.7.8
       * @default
       */
      fireMiddleClick: false,

      /**
       * Keep track of the subTargets for Mouse Events
       * @type fabric.Object[]
       */
      targets: [],

      /**
       * Keep track of the hovered target
       * @type fabric.Object
       * @private
       */
      _hoveredTarget: null,

      /**
       * hold the list of nested targets hovered
       * @type fabric.Object[]
       * @private
       */
      _hoveredTargets: [],

      /**
       * @private
       */
      _initInteractive: function() {
        this._currentTransform = null;
        this._groupSelector = null;
        this._initWrapperElement();
        this._createUpperCanvas();
        this._initEventListeners();

        this._initRetinaScaling();

        this.freeDrawingBrush =
          fabric.PencilBrush && new fabric.PencilBrush(this);

        this.calcOffset();
      },

      /**
       * Divides objects in two groups, one to render immediately
       * and one to render as activeGroup.
       * @return {Array} objects to render immediately and pushes the other in the activeGroup.
       */
      _chooseObjectsToRender: function() {
        var activeObjects = this.getActiveObjects(),
          object,
          objsToRender,
          activeGroupObjects;

        if (activeObjects.length > 0 && !this.preserveObjectStacking) {
          objsToRender = [];
          activeGroupObjects = [];
          for (var i = 0, length = this._objects.length; i < length; i++) {
            object = this._objects[i];
            if (activeObjects.indexOf(object) === -1) {
              objsToRender.push(object);
            } else {
              activeGroupObjects.push(object);
            }
          }
          if (activeObjects.length > 1) {
            this._activeObject._objects = activeGroupObjects;
          }
          objsToRender.push.apply(objsToRender, activeGroupObjects);
        } else {
          objsToRender = this._objects;
        }
        return objsToRender;
      },

      /**
       * Renders both the top canvas and the secondary container canvas.
       * @return {fabric.Canvas} instance
       * @chainable
       */
      renderAll: function() {
        if (
          this.contextTopDirty &&
          !this._groupSelector &&
          !this.isDrawingMode
        ) {
          this.clearContext(this.contextTop);
          this.contextTopDirty = false;
        }
        if (this.hasLostContext) {
          this.renderTopLayer(this.contextTop);
        }
        var canvasToDrawOn = this.contextContainer;
        this.renderCanvas(canvasToDrawOn, this._chooseObjectsToRender());
        return this;
      },

      renderTopLayer: function(ctx) {
        ctx.save();
        if (this.isDrawingMode && this._isCurrentlyDrawing) {
          this.freeDrawingBrush && this.freeDrawingBrush._render();
          this.contextTopDirty = true;
        }
        // we render the top context - last object
        if (this.selection && this._groupSelector) {
          this._drawSelection(ctx);
          this.contextTopDirty = true;
        }
        ctx.restore();
      },

      /**
       * Method to render only the top canvas.
       * Also used to render the group selection box.
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      renderTop: function() {
        var ctx = this.contextTop;
        this.clearContext(ctx);
        this.renderTopLayer(ctx);
        this.fire('after:render');
        return this;
      },

      /**
       * @private
       */
      _normalizePointer: function(object, pointer) {
        var m = object.calcTransformMatrix(),
          invertedM = fabric.util.invertTransform(m),
          vptPointer = this.restorePointerVpt(pointer);
        return fabric.util.transformPoint(vptPointer, invertedM);
      },

      /**
       * Returns true if object is transparent at a certain location
       * @param {fabric.Object} target Object to check
       * @param {Number} x Left coordinate
       * @param {Number} y Top coordinate
       * @return {Boolean}
       */
      isTargetTransparent: function(target, x, y) {
        // in case the target is the activeObject, we cannot execute this optimization
        // because we need to draw controls too.
        if (
          target.shouldCache() &&
          target._cacheCanvas &&
          target !== this._activeObject
        ) {
          var normalizedPointer = this._normalizePointer(target, {
              x: x,
              y: y
            }),
            targetRelativeX = Math.max(
              target.cacheTranslationX + normalizedPointer.x * target.zoomX,
              0
            ),
            targetRelativeY = Math.max(
              target.cacheTranslationY + normalizedPointer.y * target.zoomY,
              0
            );

          var isTransparent = fabric.util.isTransparent(
            target._cacheContext,
            Math.round(targetRelativeX),
            Math.round(targetRelativeY),
            this.targetFindTolerance
          );

          return isTransparent;
        }

        var ctx = this.contextCache,
          originalColor = target.selectionBackgroundColor,
          v = this.viewportTransform;

        target.selectionBackgroundColor = '';

        this.clearContext(ctx);

        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        target.render(ctx);
        ctx.restore();

        target.selectionBackgroundColor = originalColor;

        var isTransparent = fabric.util.isTransparent(
          ctx,
          x,
          y,
          this.targetFindTolerance
        );

        return isTransparent;
      },

      /**
       * takes an event and determines if selection key has been pressed
       * @private
       * @param {Event} e Event object
       */
      _isSelectionKeyPressed: function(e) {
        var selectionKeyPressed = false;

        if (
          Object.prototype.toString.call(this.selectionKey) === '[object Array]'
        ) {
          selectionKeyPressed = !!this.selectionKey.find(function(key) {
            return e[key] === true;
          });
        } else {
          selectionKeyPressed = e[this.selectionKey];
        }

        return selectionKeyPressed;
      },

      /**
       * @private
       * @param {Event} e Event object
       * @param {fabric.Object} target
       */
      _shouldClearSelection: function(e, target) {
        var activeObjects = this.getActiveObjects(),
          activeObject = this._activeObject;

        return (
          !target ||
          (target &&
            activeObject &&
            activeObjects.length > 1 &&
            activeObjects.indexOf(target) === -1 &&
            activeObject !== target &&
            !this._isSelectionKeyPressed(e)) ||
          (target && !target.evented) ||
          (target &&
            !target.selectable &&
            activeObject &&
            activeObject !== target)
        );
      },

      /**
       * centeredScaling from object can't override centeredScaling from canvas.
       * this should be fixed, since object setting should take precedence over canvas.
       * also this should be something that will be migrated in the control properties.
       * as ability to define the origin of the transformation that the control provide.
       * @private
       * @param {fabric.Object} target
       * @param {String} action
       * @param {Boolean} altKey
       */
      _shouldCenterTransform: function(target, action, altKey) {
        if (!target) {
          return;
        }

        var centerTransform;

        if (
          action === 'scale' ||
          action === 'scaleX' ||
          action === 'scaleY' ||
          action === 'resizing'
        ) {
          centerTransform = this.centeredScaling || target.centeredScaling;
        } else if (action === 'rotate') {
          centerTransform = this.centeredRotation || target.centeredRotation;
        }

        return centerTransform ? !altKey : altKey;
      },

      /**
       * should disappear before release 4.0
       * @private
       */
      _getOriginFromCorner: function(target, corner) {
        var origin = {
          x: target.originX,
          y: target.originY
        };

        if (corner === 'ml' || corner === 'tl' || corner === 'bl') {
          origin.x = 'right';
        } else if (corner === 'mr' || corner === 'tr' || corner === 'br') {
          origin.x = 'left';
        }

        if (corner === 'tl' || corner === 'mt' || corner === 'tr') {
          origin.y = 'bottom';
        } else if (corner === 'bl' || corner === 'mb' || corner === 'br') {
          origin.y = 'top';
        }
        return origin;
      },

      /**
       * @private
       * @param {Boolean} alreadySelected true if target is already selected
       * @param {String} corner a string representing the corner ml, mr, tl ...
       * @param {Event} e Event object
       * @param {fabric.Object} [target] inserted back to help overriding. Unused
       */
      _getActionFromCorner: function(alreadySelected, corner, e, target) {
        if (!corner || !alreadySelected) {
          return 'drag';
        }
        var control = target.controls[corner];
        return control.getActionName(e, control, target);
      },

      /**
       * @private
       * @param {Event} e Event object
       * @param {fabric.Object} target
       */
      _setupCurrentTransform: function(e, target, alreadySelected) {
        if (!target) {
          return;
        }

        var pointer = this.getPointer(e),
          corner = target.__corner,
          control = target.controls[corner],
          actionHandler =
            alreadySelected && corner
              ? control.getActionHandler(e, target, control)
              : fabric.controlsUtils.dragHandler,
          action = this._getActionFromCorner(
            alreadySelected,
            corner,
            e,
            target
          ),
          origin = this._getOriginFromCorner(target, corner),
          altKey = e[this.centeredKey],
          transform = {
            target: target,
            action: action,
            actionHandler: actionHandler,
            corner: corner,
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            skewX: target.skewX,
            skewY: target.skewY,
            // used by transation
            offsetX: pointer.x - target.left,
            offsetY: pointer.y - target.top,
            originX: origin.x,
            originY: origin.y,
            ex: pointer.x,
            ey: pointer.y,
            lastX: pointer.x,
            lastY: pointer.y,
            // unsure they are useful anymore.
            // left: target.left,
            // top: target.top,
            theta: degreesToRadians(target.angle),
            // end of unsure
            width: target.width * target.scaleX,
            shiftKey: e.shiftKey,
            altKey: altKey,
            original: fabric.util.saveObjectTransform(target)
          };

        if (this._shouldCenterTransform(target, action, altKey)) {
          transform.originX = 'center';
          transform.originY = 'center';
        }
        transform.original.originX = origin.x;
        transform.original.originY = origin.y;
        this._currentTransform = transform;
        this._beforeTransform(e);
      },

      /**
       * Set the cursor type of the canvas element
       * @param {String} value Cursor type of the canvas element.
       * @see http://www.w3.org/TR/css3-ui/#cursor
       */
      setCursor: function(value) {
        this.upperCanvasEl.style.cursor = value;
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx to draw the selection on
       */
      _drawSelection: function(ctx) {
        var groupSelector = this._groupSelector,
          left = groupSelector.left,
          top = groupSelector.top,
          aleft = abs(left),
          atop = abs(top);

        if (this.selectionColor) {
          ctx.fillStyle = this.selectionColor;

          ctx.fillRect(
            groupSelector.ex - (left > 0 ? 0 : -left),
            groupSelector.ey - (top > 0 ? 0 : -top),
            aleft,
            atop
          );
        }

        if (!this.selectionLineWidth || !this.selectionBorderColor) {
          return;
        }
        ctx.lineWidth = this.selectionLineWidth;
        ctx.strokeStyle = this.selectionBorderColor;

        // selection border
        if (this.selectionDashArray.length > 1 && !supportLineDash) {
          var px = groupSelector.ex + STROKE_OFFSET - (left > 0 ? 0 : aleft),
            py = groupSelector.ey + STROKE_OFFSET - (top > 0 ? 0 : atop);

          ctx.beginPath();

          fabric.util.drawDashedLine(
            ctx,
            px,
            py,
            px + aleft,
            py,
            this.selectionDashArray
          );
          fabric.util.drawDashedLine(
            ctx,
            px,
            py + atop - 1,
            px + aleft,
            py + atop - 1,
            this.selectionDashArray
          );
          fabric.util.drawDashedLine(
            ctx,
            px,
            py,
            px,
            py + atop,
            this.selectionDashArray
          );
          fabric.util.drawDashedLine(
            ctx,
            px + aleft - 1,
            py,
            px + aleft - 1,
            py + atop,
            this.selectionDashArray
          );

          ctx.closePath();
          ctx.stroke();
        } else {
          fabric.Object.prototype._setLineDash.call(
            this,
            ctx,
            this.selectionDashArray
          );
          ctx.strokeRect(
            groupSelector.ex + STROKE_OFFSET - (left > 0 ? 0 : aleft),
            groupSelector.ey + STROKE_OFFSET - (top > 0 ? 0 : atop),
            aleft,
            atop
          );
        }
      },

      /**
       * Method that determines what object we are clicking on
       * the skipGroup parameter is for internal use, is needed for shift+click action
       * 11/09/2018 TODO: would be cool if findTarget could discern between being a full target
       * or the outside part of the corner.
       * @param {Event} e mouse event
       * @param {Boolean} skipGroup when true, activeGroup is skipped and only objects are traversed through
       * @return {fabric.Object} the target found
       */
      findTarget: function(e, skipGroup) {
        if (this.skipTargetFind) {
          return;
        }

        var ignoreZoom = true,
          pointer = this.getPointer(e, ignoreZoom),
          activeObject = this._activeObject,
          aObjects = this.getActiveObjects(),
          activeTarget,
          activeTargetSubs,
          isTouch = isTouchEvent(e),
          shouldLookForActive =
            (aObjects.length > 1 && !skipGroup) || aObjects.length === 1;

        // first check current group (if one exists)
        // active group does not check sub targets like normal groups.
        // if active group just exits.
        this.targets = [];

        // if we hit the corner of an activeObject, let's return that.
        if (
          shouldLookForActive &&
          activeObject._findTargetCorner(pointer, isTouch)
        ) {
          return activeObject;
        }
        if (
          aObjects.length > 1 &&
          !skipGroup &&
          activeObject === this._searchPossibleTargets([activeObject], pointer)
        ) {
          return activeObject;
        }
        if (
          aObjects.length === 1 &&
          activeObject === this._searchPossibleTargets([activeObject], pointer)
        ) {
          if (!this.preserveObjectStacking) {
            return activeObject;
          } else {
            activeTarget = activeObject;
            activeTargetSubs = this.targets;
            this.targets = [];
          }
        }
        var target = this._searchPossibleTargets(this._objects, pointer);
        if (
          e[this.altSelectionKey] &&
          target &&
          activeTarget &&
          target !== activeTarget
        ) {
          target = activeTarget;
          this.targets = activeTargetSubs;
        }
        return target;
      },

      /**
       * Checks point is inside the object.
       * @param {Object} [pointer] x,y object of point coordinates we want to check.
       * @param {fabric.Object} obj Object to test against
       * @param {Object} [globalPointer] x,y object of point coordinates relative to canvas used to search per pixel target.
       * @return {Boolean} true if point is contained within an area of given object
       * @private
       */
      _checkTarget: function(pointer, obj, globalPointer) {
        if (
          obj &&
          obj.visible &&
          obj.evented &&
          // http://www.geog.ubc.ca/courses/klink/gis.notes/ncgia/u32.html
          // http://idav.ucdavis.edu/~okreylos/TAship/Spring2000/PointInPolygon.html
          obj.containsPoint(pointer)
        ) {
          if (
            (this.perPixelTargetFind || obj.perPixelTargetFind) &&
            !obj.isEditing
          ) {
            var isTransparent = this.isTargetTransparent(
              obj,
              globalPointer.x,
              globalPointer.y
            );
            if (!isTransparent) {
              return true;
            }
          } else {
            return true;
          }
        }
      },

      /**
       * Function used to search inside objects an object that contains pointer in bounding box or that contains pointerOnCanvas when painted
       * @param {Array} [objects] objects array to look into
       * @param {Object} [pointer] x,y object of point coordinates we want to check.
       * @return {fabric.Object} object that contains pointer
       * @private
       */
      _searchPossibleTargets: function(objects, pointer) {
        // Cache all targets where their bounding box contains point.
        var target,
          i = objects.length,
          subTarget;
        // Do not check for currently grouped objects, since we check the parent group itself.
        // until we call this function specifically to search inside the activeGroup
        while (i--) {
          var objToCheck = objects[i];
          var pointerToUse = objToCheck.group
            ? this._normalizePointer(objToCheck.group, pointer)
            : pointer;
          if (this._checkTarget(pointerToUse, objToCheck, pointer)) {
            target = objects[i];
            if (target.subTargetCheck && target instanceof fabric.Group) {
              subTarget = this._searchPossibleTargets(target._objects, pointer);
              subTarget && this.targets.push(subTarget);
            }
            break;
          }
        }
        return target;
      },

      /**
       * Returns pointer coordinates without the effect of the viewport
       * @param {Object} pointer with "x" and "y" number values
       * @return {Object} object with "x" and "y" number values
       */
      restorePointerVpt: function(pointer) {
        return fabric.util.transformPoint(
          pointer,
          fabric.util.invertTransform(this.viewportTransform)
        );
      },

      /**
       * Returns pointer coordinates relative to canvas.
       * Can return coordinates with or without viewportTransform.
       * ignoreZoom false gives back coordinates that represent
       * the point clicked on canvas element.
       * ignoreZoom true gives back coordinates after being processed
       * by the viewportTransform ( sort of coordinates of what is displayed
       * on the canvas where you are clicking.
       * ignoreZoom true = HTMLElement coordinates relative to top,left
       * ignoreZoom false, default = fabric space coordinates, the same used for shape position
       * To interact with your shapes top and left you want to use ignoreZoom true
       * most of the time, while ignoreZoom false will give you coordinates
       * compatible with the object.oCoords system.
       * of the time.
       * @param {Event} e
       * @param {Boolean} ignoreZoom
       * @return {Object} object with "x" and "y" number values
       */
      getPointer: function(e, ignoreZoom) {
        // return cached values if we are in the event processing chain
        if (this._absolutePointer && !ignoreZoom) {
          return this._absolutePointer;
        }
        if (this._pointer && ignoreZoom) {
          return this._pointer;
        }

        var pointer = getPointer(e),
          upperCanvasEl = this.upperCanvasEl,
          bounds = upperCanvasEl.getBoundingClientRect(),
          boundsWidth = bounds.width || 0,
          boundsHeight = bounds.height || 0,
          cssScale;

        if (!boundsWidth || !boundsHeight) {
          if ('top' in bounds && 'bottom' in bounds) {
            boundsHeight = Math.abs(bounds.top - bounds.bottom);
          }
          if ('right' in bounds && 'left' in bounds) {
            boundsWidth = Math.abs(bounds.right - bounds.left);
          }
        }

        this.calcOffset();
        pointer.x = pointer.x - this._offset.left;
        pointer.y = pointer.y - this._offset.top;
        if (!ignoreZoom) {
          pointer = this.restorePointerVpt(pointer);
        }

        var retinaScaling = this.getRetinaScaling();
        if (retinaScaling !== 1) {
          pointer.x /= retinaScaling;
          pointer.y /= retinaScaling;
        }

        if (boundsWidth === 0 || boundsHeight === 0) {
          // If bounds are not available (i.e. not visible), do not apply scale.
          cssScale = { width: 1, height: 1 };
        } else {
          cssScale = {
            width: upperCanvasEl.width / boundsWidth,
            height: upperCanvasEl.height / boundsHeight
          };
        }

        return {
          x: pointer.x * cssScale.width,
          y: pointer.y * cssScale.height
        };
      },

      /**
       * @private
       * @throws {CANVAS_INIT_ERROR} If canvas can not be initialized
       */
      _createUpperCanvas: function() {
        var lowerCanvasClass = this.lowerCanvasEl.className.replace(
            /\s*lower-canvas\s*/,
            ''
          ),
          lowerCanvasEl = this.lowerCanvasEl,
          upperCanvasEl = this.upperCanvasEl;

        // there is no need to create a new upperCanvas element if we have already one.
        if (upperCanvasEl) {
          upperCanvasEl.className = '';
        } else {
          upperCanvasEl = this._createCanvasElement();
          this.upperCanvasEl = upperCanvasEl;
        }
        fabric.util.addClass(upperCanvasEl, 'upper-canvas ' + lowerCanvasClass);

        this.wrapperEl.appendChild(upperCanvasEl);

        this._copyCanvasStyle(lowerCanvasEl, upperCanvasEl);
        this._applyCanvasStyle(upperCanvasEl);
        this.contextTop = upperCanvasEl.getContext('2d');
      },

      /**
       * @private
       */
      _createCacheCanvas: function() {
        this.cacheCanvasEl = this._createCanvasElement();
        this.cacheCanvasEl.setAttribute('width', this.width);
        this.cacheCanvasEl.setAttribute('height', this.height);
        this.contextCache = this.cacheCanvasEl.getContext('2d');
      },

      /**
       * @private
       */
      _initWrapperElement: function() {
        this.wrapperEl = fabric.util.wrapElement(this.lowerCanvasEl, 'div', {
          class: this.containerClass
        });
        fabric.util.setStyle(this.wrapperEl, {
          width: this.width + 'px',
          height: this.height + 'px',
          position: 'relative'
        });
        fabric.util.makeElementUnselectable(this.wrapperEl);
      },

      /**
       * @private
       * @param {HTMLElement} element canvas element to apply styles on
       */
      _applyCanvasStyle: function(element) {
        var width = this.width || element.width,
          height = this.height || element.height;

        fabric.util.setStyle(element, {
          position: 'absolute',
          width: width + 'px',
          height: height + 'px',
          left: 0,
          top: 0,
          'touch-action': this.allowTouchScrolling ? 'manipulation' : 'none',
          '-ms-touch-action': this.allowTouchScrolling ? 'manipulation' : 'none'
        });
        element.width = width;
        element.height = height;
        fabric.util.makeElementUnselectable(element);
      },

      /**
       * Copy the entire inline style from one element (fromEl) to another (toEl)
       * @private
       * @param {Element} fromEl Element style is copied from
       * @param {Element} toEl Element copied style is applied to
       */
      _copyCanvasStyle: function(fromEl, toEl) {
        toEl.style.cssText = fromEl.style.cssText;
      },

      /**
       * Returns context of canvas where object selection is drawn
       * @return {CanvasRenderingContext2D}
       */
      getSelectionContext: function() {
        return this.contextTop;
      },

      /**
       * Returns &lt;canvas> element on which object selection is drawn
       * @return {HTMLCanvasElement}
       */
      getSelectionElement: function() {
        return this.upperCanvasEl;
      },

      /**
       * Returns currently active object
       * @return {fabric.Object} active object
       */
      getActiveObject: function() {
        return this._activeObject;
      },

      /**
       * Returns an array with the current selected objects
       * @return {fabric.Object} active object
       */
      getActiveObjects: function() {
        var active = this._activeObject;
        if (active) {
          if (active.type === 'activeSelection' && active._objects) {
            return active._objects.slice(0);
          } else {
            return [active];
          }
        }
        return [];
      },

      /**
       * @private
       * @param {fabric.Object} obj Object that was removed
       */
      _onObjectRemoved: function(obj) {
        // removing active object should fire "selection:cleared" events
        if (obj === this._activeObject) {
          this.fire('before:selection:cleared', { target: obj });
          this._discardActiveObject();
          this.fire('selection:cleared', { target: obj });
          obj.fire('deselected');
        }
        if (obj === this._hoveredTarget) {
          this._hoveredTarget = null;
          this._hoveredTargets = [];
        }
        this.callSuper('_onObjectRemoved', obj);
      },

      /**
       * @private
       * Compares the old activeObject with the current one and fires correct events
       * @param {fabric.Object} obj old activeObject
       */
      _fireSelectionEvents: function(oldObjects, e) {
        var somethingChanged = false,
          objects = this.getActiveObjects(),
          added = [],
          removed = [];
        oldObjects.forEach(function(oldObject) {
          if (objects.indexOf(oldObject) === -1) {
            somethingChanged = true;
            oldObject.fire('deselected', {
              e: e,
              target: oldObject
            });
            removed.push(oldObject);
          }
        });
        objects.forEach(function(object) {
          if (oldObjects.indexOf(object) === -1) {
            somethingChanged = true;
            object.fire('selected', {
              e: e,
              target: object
            });
            added.push(object);
          }
        });
        if (oldObjects.length > 0 && objects.length > 0) {
          somethingChanged &&
            this.fire('selection:updated', {
              e: e,
              selected: added,
              deselected: removed,
              // added for backward compatibility
              // deprecated
              updated: added[0] || removed[0],
              target: this._activeObject
            });
        } else if (objects.length > 0) {
          this.fire('selection:created', {
            e: e,
            selected: added,
            target: this._activeObject
          });
        } else if (oldObjects.length > 0) {
          this.fire('selection:cleared', {
            e: e,
            deselected: removed
          });
        }
      },

      /**
       * Sets given object as the only active object on canvas
       * @param {fabric.Object} object Object to set as an active one
       * @param {Event} [e] Event (passed along when firing "object:selected")
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      setActiveObject: function(object, e) {
        var currentActives = this.getActiveObjects();
        this._setActiveObject(object, e);
        this._fireSelectionEvents(currentActives, e);
        return this;
      },

      /**
       * This is a private method for now.
       * This is supposed to be equivalent to setActiveObject but without firing
       * any event. There is commitment to have this stay this way.
       * This is the functional part of setActiveObject.
       * @private
       * @param {Object} object to set as active
       * @param {Event} [e] Event (passed along when firing "object:selected")
       * @return {Boolean} true if the selection happened
       */
      _setActiveObject: function(object, e) {
        if (this._activeObject === object) {
          return false;
        }
        if (!this._discardActiveObject(e, object)) {
          return false;
        }
        if (object.onSelect({ e: e })) {
          return false;
        }
        this._activeObject = object;
        return true;
      },

      /**
       * This is a private method for now.
       * This is supposed to be equivalent to discardActiveObject but without firing
       * any events. There is commitment to have this stay this way.
       * This is the functional part of discardActiveObject.
       * @param {Event} [e] Event (passed along when firing "object:deselected")
       * @param {Object} object to set as active
       * @return {Boolean} true if the selection happened
       * @private
       */
      _discardActiveObject: function(e, object) {
        var obj = this._activeObject;
        if (obj) {
          // onDeselect return TRUE to cancel selection;
          if (obj.onDeselect({ e: e, object: object })) {
            return false;
          }
          this._activeObject = null;
        }
        return true;
      },

      /**
       * Discards currently active object and fire events. If the function is called by fabric
       * as a consequence of a mouse event, the event is passed as a parameter and
       * sent to the fire function for the custom events. When used as a method the
       * e param does not have any application.
       * @param {event} e
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      discardActiveObject: function(e) {
        var currentActives = this.getActiveObjects(),
          activeObject = this.getActiveObject();
        if (currentActives.length) {
          this.fire('before:selection:cleared', { target: activeObject, e: e });
        }
        this._discardActiveObject(e);
        this._fireSelectionEvents(currentActives, e);
        return this;
      },

      /**
       * Clears a canvas element and removes all event listeners
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      dispose: function() {
        var wrapper = this.wrapperEl;
        this.removeListeners();
        wrapper.removeChild(this.upperCanvasEl);
        wrapper.removeChild(this.lowerCanvasEl);
        this.contextCache = null;
        this.contextTop = null;
        ['upperCanvasEl', 'cacheCanvasEl'].forEach(
          function(element) {
            fabric.util.cleanUpJsdomNode(this[element]);
            this[element] = undefined;
          }.bind(this)
        );
        if (wrapper.parentNode) {
          wrapper.parentNode.replaceChild(this.lowerCanvasEl, this.wrapperEl);
        }
        delete this.wrapperEl;
        fabric.StaticCanvas.prototype.dispose.call(this);
        return this;
      },

      /**
       * Clears all contexts (background, main, top) of an instance
       * @return {fabric.Canvas} thisArg
       * @chainable
       */
      clear: function() {
        // this.discardActiveGroup();
        this.discardActiveObject();
        this.clearContext(this.contextTop);
        return this.callSuper('clear');
      },

      /**
       * Draws objects' controls (borders/controls)
       * @param {CanvasRenderingContext2D} ctx Context to render controls on
       */
      drawControls: function(ctx) {
        var activeObject = this._activeObject;

        if (activeObject) {
          activeObject._renderControls(ctx);
        }
      },

      /**
       * @private
       */
      _toObject: function(instance, methodName, propertiesToInclude) {
        //If the object is part of the current selection group, it should
        //be transformed appropriately
        //i.e. it should be serialised as it would appear if the selection group
        //were to be destroyed.
        var originalProperties = this._realizeGroupTransformOnObject(instance),
          object = this.callSuper(
            '_toObject',
            instance,
            methodName,
            propertiesToInclude
          );
        //Undo the damage we did by changing all of its properties
        this._unwindGroupTransformOnObject(instance, originalProperties);
        return object;
      },

      /**
       * Realises an object's group transformation on it
       * @private
       * @param {fabric.Object} [instance] the object to transform (gets mutated)
       * @returns the original values of instance which were changed
       */
      _realizeGroupTransformOnObject: function(instance) {
        if (
          instance.group &&
          instance.group.type === 'activeSelection' &&
          this._activeObject === instance.group
        ) {
          var layoutProps = [
            'angle',
            'flipX',
            'flipY',
            'left',
            'scaleX',
            'scaleY',
            'skewX',
            'skewY',
            'top'
          ];
          //Copy all the positionally relevant properties across now
          var originalValues = {};
          layoutProps.forEach(function(prop) {
            originalValues[prop] = instance[prop];
          });
          fabric.util.addTransformToObject(
            instance,
            this._activeObject.calcOwnMatrix()
          );
          return originalValues;
        } else {
          return null;
        }
      },

      /**
       * Restores the changed properties of instance
       * @private
       * @param {fabric.Object} [instance] the object to un-transform (gets mutated)
       * @param {Object} [originalValues] the original values of instance, as returned by _realizeGroupTransformOnObject
       */
      _unwindGroupTransformOnObject: function(instance, originalValues) {
        if (originalValues) {
          instance.set(originalValues);
        }
      },

      /**
       * @private
       */
      _setSVGObject: function(markup, instance, reviver) {
        //If the object is in a selection group, simulate what would happen to that
        //object when the group is deselected
        var originalProperties = this._realizeGroupTransformOnObject(instance);
        this.callSuper('_setSVGObject', markup, instance, reviver);
        this._unwindGroupTransformOnObject(instance, originalProperties);
      },

      setViewportTransform: function(vpt) {
        if (
          this.renderOnAddRemove &&
          this._activeObject &&
          this._activeObject.isEditing
        ) {
          this._activeObject.clearContextTop();
        }
        fabric.StaticCanvas.prototype.setViewportTransform.call(this, vpt);
      }
    }
  );

  // copying static properties manually to work around Opera's bug,
  // where "prototype" property is enumerable and overrides existing prototype
  for (var prop in fabric.StaticCanvas) {
    if (prop !== 'prototype') {
      fabric.Canvas[prop] = fabric.StaticCanvas[prop];
    }
  }
})();
(function() {
  var addListener = fabric.util.addListener,
    removeListener = fabric.util.removeListener,
    RIGHT_CLICK = 3,
    MIDDLE_CLICK = 2,
    LEFT_CLICK = 1,
    addEventOptions = { passive: false };

  function checkClick(e, value) {
    return e.button && e.button === value - 1;
  }

  fabric.util.object.extend(
    fabric.Canvas.prototype,
    /** @lends fabric.Canvas.prototype */ {
      /**
       * Contains the id of the touch event that owns the fabric transform
       * @type Number
       * @private
       */
      mainTouchId: null,

      /**
       * Adds mouse listeners to canvas
       * @private
       */
      _initEventListeners: function() {
        // in case we initialized the class twice. This should not happen normally
        // but in some kind of applications where the canvas element may be changed
        // this is a workaround to having double listeners.
        this.removeListeners();
        this._bindEvents();
        this.addOrRemove(addListener, 'add');
      },

      /**
       * return an event prefix pointer or mouse.
       * @private
       */
      _getEventPrefix: function() {
        return this.enablePointerEvents ? 'pointer' : 'mouse';
      },

      addOrRemove: function(functor, eventjsFunctor) {
        var canvasElement = this.upperCanvasEl,
          eventTypePrefix = this._getEventPrefix();
        functor(fabric.window, 'resize', this._onResize);
        functor(canvasElement, eventTypePrefix + 'down', this._onMouseDown);
        functor(
          canvasElement,
          eventTypePrefix + 'move',
          this._onMouseMove,
          addEventOptions
        );
        functor(canvasElement, eventTypePrefix + 'out', this._onMouseOut);
        functor(canvasElement, eventTypePrefix + 'enter', this._onMouseEnter);
        functor(canvasElement, 'wheel', this._onMouseWheel);
        functor(canvasElement, 'contextmenu', this._onContextMenu);
        functor(canvasElement, 'dblclick', this._onDoubleClick);
        functor(canvasElement, 'dragover', this._onDragOver);
        functor(canvasElement, 'dragenter', this._onDragEnter);
        functor(canvasElement, 'dragleave', this._onDragLeave);
        functor(canvasElement, 'drop', this._onDrop);
        if (!this.enablePointerEvents) {
          functor(
            canvasElement,
            'touchstart',
            this._onTouchStart,
            addEventOptions
          );
        }
        if (typeof eventjs !== 'undefined' && eventjsFunctor in eventjs) {
          eventjs[eventjsFunctor](canvasElement, 'gesture', this._onGesture);
          eventjs[eventjsFunctor](canvasElement, 'drag', this._onDrag);
          eventjs[eventjsFunctor](
            canvasElement,
            'orientation',
            this._onOrientationChange
          );
          eventjs[eventjsFunctor](canvasElement, 'shake', this._onShake);
          eventjs[eventjsFunctor](
            canvasElement,
            'longpress',
            this._onLongPress
          );
        }
      },

      /**
       * Removes all event listeners
       */
      removeListeners: function() {
        this.addOrRemove(removeListener, 'remove');
        // if you dispose on a mouseDown, before mouse up, you need to clean document to...
        var eventTypePrefix = this._getEventPrefix();
        removeListener(
          fabric.document,
          eventTypePrefix + 'up',
          this._onMouseUp
        );
        removeListener(
          fabric.document,
          'touchend',
          this._onTouchEnd,
          addEventOptions
        );
        removeListener(
          fabric.document,
          eventTypePrefix + 'move',
          this._onMouseMove,
          addEventOptions
        );
        removeListener(
          fabric.document,
          'touchmove',
          this._onMouseMove,
          addEventOptions
        );
      },

      /**
       * @private
       */
      _bindEvents: function() {
        if (this.eventsBound) {
          // for any reason we pass here twice we do not want to bind events twice.
          return;
        }
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onGesture = this._onGesture.bind(this);
        this._onDrag = this._onDrag.bind(this);
        this._onShake = this._onShake.bind(this);
        this._onLongPress = this._onLongPress.bind(this);
        this._onOrientationChange = this._onOrientationChange.bind(this);
        this._onMouseWheel = this._onMouseWheel.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
        this._onDragOver = this._onDragOver.bind(this);
        this._onDragEnter = this._simpleEventHandler.bind(this, 'dragenter');
        this._onDragLeave = this._simpleEventHandler.bind(this, 'dragleave');
        this._onDrop = this._simpleEventHandler.bind(this, 'drop');
        this.eventsBound = true;
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on Event.js gesture
       * @param {Event} [self] Inner Event object
       */
      _onGesture: function(e, self) {
        this.__onTransformGesture && this.__onTransformGesture(e, self);
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on Event.js drag
       * @param {Event} [self] Inner Event object
       */
      _onDrag: function(e, self) {
        this.__onDrag && this.__onDrag(e, self);
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on wheel event
       */
      _onMouseWheel: function(e) {
        this.__onMouseWheel(e);
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onMouseOut: function(e) {
        var target = this._hoveredTarget;
        this.fire('mouse:out', { target: target, e: e });
        this._hoveredTarget = null;
        target && target.fire('mouseout', { e: e });

        var _this = this;
        this._hoveredTargets.forEach(function(_target) {
          _this.fire('mouse:out', { target: target, e: e });
          _target && target.fire('mouseout', { e: e });
        });
        this._hoveredTargets = [];

        if (this._iTextInstances) {
          this._iTextInstances.forEach(function(obj) {
            if (obj.isEditing) {
              obj.hiddenTextarea.focus();
            }
          });
        }
      },

      /**
       * @private
       * @param {Event} e Event object fired on mouseenter
       */
      _onMouseEnter: function(e) {
        // This find target and consequent 'mouse:over' is used to
        // clear old instances on hovered target.
        // calling findTarget has the side effect of killing target.__corner.
        // as a short term fix we are not firing this if we are currently transforming.
        // as a long term fix we need to separate the action of finding a target with the
        // side effects we added to it.
        if (!this._currentTransform && !this.findTarget(e)) {
          this.fire('mouse:over', { target: null, e: e });
          this._hoveredTarget = null;
          this._hoveredTargets = [];
        }
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on Event.js orientation change
       * @param {Event} [self] Inner Event object
       */
      _onOrientationChange: function(e, self) {
        this.__onOrientationChange && this.__onOrientationChange(e, self);
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on Event.js shake
       * @param {Event} [self] Inner Event object
       */
      _onShake: function(e, self) {
        this.__onShake && this.__onShake(e, self);
      },

      /**
       * @private
       * @param {Event} [e] Event object fired on Event.js shake
       * @param {Event} [self] Inner Event object
       */
      _onLongPress: function(e, self) {
        this.__onLongPress && this.__onLongPress(e, self);
      },

      /**
       * prevent default to allow drop event to be fired
       * @private
       * @param {Event} [e] Event object fired on Event.js shake
       */
      _onDragOver: function(e) {
        e.preventDefault();
        var target = this._simpleEventHandler('dragover', e);
        this._fireEnterLeaveEvents(target, e);
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onContextMenu: function(e) {
        if (this.stopContextMenu) {
          e.stopPropagation();
          e.preventDefault();
        }
        return false;
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onDoubleClick: function(e) {
        this._cacheTransformEventData(e);
        this._handleEvent(e, 'dblclick');
        this._resetTransformEventData(e);
      },

      /**
       * Return a the id of an event.
       * returns either the pointerId or the identifier or 0 for the mouse event
       * @private
       * @param {Event} evt Event object
       */
      getPointerId: function(evt) {
        var changedTouches = evt.changedTouches;

        if (changedTouches) {
          return changedTouches[0] && changedTouches[0].identifier;
        }

        if (this.enablePointerEvents) {
          return evt.pointerId;
        }

        return -1;
      },

      /**
       * Determines if an event has the id of the event that is considered main
       * @private
       * @param {evt} event Event object
       */
      _isMainEvent: function(evt) {
        if (evt.isPrimary === true) {
          return true;
        }
        if (evt.isPrimary === false) {
          return false;
        }
        if (evt.type === 'touchend' && evt.touches.length === 0) {
          return true;
        }
        if (evt.changedTouches) {
          return evt.changedTouches[0].identifier === this.mainTouchId;
        }
        return true;
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onTouchStart: function(e) {
        e.preventDefault();
        if (this.mainTouchId === null) {
          this.mainTouchId = this.getPointerId(e);
        }
        this.__onMouseDown(e);
        this._resetTransformEventData();
        var canvasElement = this.upperCanvasEl,
          eventTypePrefix = this._getEventPrefix();
        addListener(
          fabric.document,
          'touchend',
          this._onTouchEnd,
          addEventOptions
        );
        addListener(
          fabric.document,
          'touchmove',
          this._onMouseMove,
          addEventOptions
        );
        // Unbind mousedown to prevent double triggers from touch devices
        removeListener(
          canvasElement,
          eventTypePrefix + 'down',
          this._onMouseDown
        );
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onMouseDown: function(e) {
        this.__onMouseDown(e);
        this._resetTransformEventData();
        var canvasElement = this.upperCanvasEl,
          eventTypePrefix = this._getEventPrefix();
        removeListener(
          canvasElement,
          eventTypePrefix + 'move',
          this._onMouseMove,
          addEventOptions
        );
        addListener(fabric.document, eventTypePrefix + 'up', this._onMouseUp);
        addListener(
          fabric.document,
          eventTypePrefix + 'move',
          this._onMouseMove,
          addEventOptions
        );
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onTouchEnd: function(e) {
        if (e.touches.length > 0) {
          // if there are still touches stop here
          return;
        }
        this.__onMouseUp(e);
        this._resetTransformEventData();
        this.mainTouchId = null;
        var eventTypePrefix = this._getEventPrefix();
        removeListener(
          fabric.document,
          'touchend',
          this._onTouchEnd,
          addEventOptions
        );
        removeListener(
          fabric.document,
          'touchmove',
          this._onMouseMove,
          addEventOptions
        );
        var _this = this;
        if (this._willAddMouseDown) {
          clearTimeout(this._willAddMouseDown);
        }
        this._willAddMouseDown = setTimeout(function() {
          // Wait 400ms before rebinding mousedown to prevent double triggers
          // from touch devices
          addListener(
            _this.upperCanvasEl,
            eventTypePrefix + 'down',
            _this._onMouseDown
          );
          _this._willAddMouseDown = 0;
        }, 400);
      },

      /**
       * @private
       * @param {Event} e Event object fired on mouseup
       */
      _onMouseUp: function(e) {
        this.__onMouseUp(e);
        this._resetTransformEventData();
        var canvasElement = this.upperCanvasEl,
          eventTypePrefix = this._getEventPrefix();
        if (this._isMainEvent(e)) {
          removeListener(
            fabric.document,
            eventTypePrefix + 'up',
            this._onMouseUp
          );
          removeListener(
            fabric.document,
            eventTypePrefix + 'move',
            this._onMouseMove,
            addEventOptions
          );
          addListener(
            canvasElement,
            eventTypePrefix + 'move',
            this._onMouseMove,
            addEventOptions
          );
        }
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousemove
       */
      _onMouseMove: function(e) {
        !this.allowTouchScrolling && e.preventDefault && e.preventDefault();
        this.__onMouseMove(e);
      },

      /**
       * @private
       */
      _onResize: function() {
        this.calcOffset();
      },

      /**
       * Decides whether the canvas should be redrawn in mouseup and mousedown events.
       * @private
       * @param {Object} target
       */
      _shouldRender: function(target) {
        var activeObject = this._activeObject;

        if (
          !!activeObject !== !!target ||
          (activeObject && target && activeObject !== target)
        ) {
          // this covers: switch of target, from target to no target, selection of target
          // multiSelection with key and mouse
          return true;
        } else if (activeObject && activeObject.isEditing) {
          // if we mouse up/down over a editing textbox a cursor change,
          // there is no need to re render
          return false;
        }
        return false;
      },

      /**
       * Method that defines the actions when mouse is released on canvas.
       * The method resets the currentTransform parameters, store the image corner
       * position in the image object and render the canvas on top.
       * @private
       * @param {Event} e Event object fired on mouseup
       */
      __onMouseUp: function(e) {
        var target,
          transform = this._currentTransform,
          groupSelector = this._groupSelector,
          shouldRender = false,
          isClick =
            !groupSelector ||
            (groupSelector.left === 0 && groupSelector.top === 0);
        this._cacheTransformEventData(e);
        target = this._target;
        this._handleEvent(e, 'up:before');
        // if right/middle click just fire events and return
        // target undefined will make the _handleEvent search the target
        if (checkClick(e, RIGHT_CLICK)) {
          if (this.fireRightClick) {
            this._handleEvent(e, 'up', RIGHT_CLICK, isClick);
          }
          return;
        }

        if (checkClick(e, MIDDLE_CLICK)) {
          if (this.fireMiddleClick) {
            this._handleEvent(e, 'up', MIDDLE_CLICK, isClick);
          }
          this._resetTransformEventData();
          return;
        }

        if (this.isDrawingMode && this._isCurrentlyDrawing) {
          this._onMouseUpInDrawingMode(e);
          return;
        }

        if (!this._isMainEvent(e)) {
          return;
        }
        if (transform) {
          this._finalizeCurrentTransform(e);
          shouldRender = transform.actionPerformed;
        }
        if (!isClick) {
          var targetWasActive = target === this._activeObject;
          this._maybeGroupObjects(e);
          if (!shouldRender) {
            shouldRender =
              this._shouldRender(target) ||
              (!targetWasActive && target === this._activeObject);
          }
        }
        if (target) {
          if (
            target.selectable &&
            target !== this._activeObject &&
            target.activeOn === 'up'
          ) {
            this.setActiveObject(target, e);
            shouldRender = true;
          } else {
            var corner = target._findTargetCorner(
              this.getPointer(e, true),
              fabric.util.isTouchEvent(e)
            );
            var control = target.controls[corner],
              mouseUpHandler =
                control && control.getMouseUpHandler(e, target, control);
            if (mouseUpHandler) {
              var pointer = this.getPointer(e);
              mouseUpHandler(e, transform, pointer.x, pointer.y);
            }
          }
          target.isMoving = false;
        }
        this._setCursorFromEvent(e, target);
        this._handleEvent(e, 'up', LEFT_CLICK, isClick);
        this._groupSelector = null;
        this._currentTransform = null;
        // reset the target information about which corner is selected
        target && (target.__corner = 0);
        if (shouldRender) {
          this.requestRenderAll();
        } else if (!isClick) {
          this.renderTop();
        }
      },

      /**
       * @private
       * Handle event firing for target and subtargets
       * @param {Event} e event from mouse
       * @param {String} eventType event to fire (up, down or move)
       * @return {Fabric.Object} target return the the target found, for internal reasons.
       */
      _simpleEventHandler: function(eventType, e) {
        var target = this.findTarget(e),
          targets = this.targets,
          options = {
            e: e,
            target: target,
            subTargets: targets
          };
        this.fire(eventType, options);
        target && target.fire(eventType, options);
        if (!targets) {
          return target;
        }
        for (var i = 0; i < targets.length; i++) {
          targets[i].fire(eventType, options);
        }
        return target;
      },

      /**
       * @private
       * Handle event firing for target and subtargets
       * @param {Event} e event from mouse
       * @param {String} eventType event to fire (up, down or move)
       * @param {fabric.Object} targetObj receiving event
       * @param {Number} [button] button used in the event 1 = left, 2 = middle, 3 = right
       * @param {Boolean} isClick for left button only, indicates that the mouse up happened without move.
       */
      _handleEvent: function(e, eventType, button, isClick) {
        var target = this._target,
          targets = this.targets || [],
          options = {
            e: e,
            target: target,
            subTargets: targets,
            button: button || LEFT_CLICK,
            isClick: isClick || false,
            pointer: this._pointer,
            absolutePointer: this._absolutePointer,
            transform: this._currentTransform
          };
        if (eventType === 'up') {
          options.currentTarget = this.findTarget(e);
          options.currentSubTargets = this.targets;
        }
        this.fire('mouse:' + eventType, options);
        target && target.fire('mouse' + eventType, options);
        for (var i = 0; i < targets.length; i++) {
          targets[i].fire('mouse' + eventType, options);
        }
      },

      /**
       * @private
       * @param {Event} e send the mouse event that generate the finalize down, so it can be used in the event
       */
      _finalizeCurrentTransform: function(e) {
        var transform = this._currentTransform,
          target = transform.target,
          eventName,
          options = {
            e: e,
            target: target,
            transform: transform,
            action: transform.action
          };

        if (target._scaling) {
          target._scaling = false;
        }

        target.setCoords();

        if (
          transform.actionPerformed ||
          (this.stateful && target.hasStateChanged())
        ) {
          if (transform.actionPerformed) {
            // this is not friendly to the new control api.
            // is deprecated.
            eventName = this._addEventOptions(options, transform);
            this._fire(eventName, options);
          }
          this._fire('modified', options);
        }
      },

      /**
       * Mutate option object in order to add by property and give back the event name.
       * @private
       * @deprecated since 4.2.0
       * @param {Object} options to mutate
       * @param {Object} transform to inspect action from
       */
      _addEventOptions: function(options, transform) {
        // we can probably add more details at low cost
        // scale change, rotation changes, translation changes
        var eventName, by;
        switch (transform.action) {
          case 'scaleX':
            eventName = 'scaled';
            by = 'x';
            break;
          case 'scaleY':
            eventName = 'scaled';
            by = 'y';
            break;
          case 'skewX':
            eventName = 'skewed';
            by = 'x';
            break;
          case 'skewY':
            eventName = 'skewed';
            by = 'y';
            break;
          case 'scale':
            eventName = 'scaled';
            by = 'equally';
            break;
          case 'rotate':
            eventName = 'rotated';
            break;
          case 'drag':
            eventName = 'moved';
            break;
        }
        options.by = by;
        return eventName;
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      _onMouseDownInDrawingMode: function(e) {
        this._isCurrentlyDrawing = true;
        if (this.getActiveObject()) {
          this.discardActiveObject(e).requestRenderAll();
        }
        var pointer = this.getPointer(e);
        this.freeDrawingBrush.onMouseDown(pointer, { e: e, pointer: pointer });
        this._handleEvent(e, 'down');
      },

      /**
       * @private
       * @param {Event} e Event object fired on mousemove
       */
      _onMouseMoveInDrawingMode: function(e) {
        if (this._isCurrentlyDrawing) {
          var pointer = this.getPointer(e);
          this.freeDrawingBrush.onMouseMove(pointer, {
            e: e,
            pointer: pointer
          });
        }
        this.setCursor(this.freeDrawingCursor);
        this._handleEvent(e, 'move');
      },

      /**
       * @private
       * @param {Event} e Event object fired on mouseup
       */
      _onMouseUpInDrawingMode: function(e) {
        var pointer = this.getPointer(e);
        this._isCurrentlyDrawing = this.freeDrawingBrush.onMouseUp({
          e: e,
          pointer: pointer
        });
        this._handleEvent(e, 'up');
      },

      /**
       * Method that defines the actions when mouse is clicked on canvas.
       * The method inits the currentTransform parameters and renders all the
       * canvas so the current image can be placed on the top canvas and the rest
       * in on the container one.
       * @private
       * @param {Event} e Event object fired on mousedown
       */
      __onMouseDown: function(e) {
        this._cacheTransformEventData(e);
        this._handleEvent(e, 'down:before');
        var target = this._target;
        // if right click just fire events
        if (checkClick(e, RIGHT_CLICK)) {
          if (this.fireRightClick) {
            this._handleEvent(e, 'down', RIGHT_CLICK);
          }
          return;
        }

        if (checkClick(e, MIDDLE_CLICK)) {
          if (this.fireMiddleClick) {
            this._handleEvent(e, 'down', MIDDLE_CLICK);
          }
          return;
        }

        if (this.isDrawingMode) {
          this._onMouseDownInDrawingMode(e);
          return;
        }

        if (!this._isMainEvent(e)) {
          return;
        }

        // ignore if some object is being transformed at this moment
        if (this._currentTransform) {
          return;
        }

        var pointer = this._pointer;
        // save pointer for check in __onMouseUp event
        this._previousPointer = pointer;
        var shouldRender = this._shouldRender(target),
          shouldGroup = this._shouldGroup(e, target);
        if (this._shouldClearSelection(e, target)) {
          this.discardActiveObject(e);
        } else if (shouldGroup) {
          this._handleGrouping(e, target);
          target = this._activeObject;
        }

        if (
          this.selection &&
          (!target ||
            (!target.selectable &&
              !target.isEditing &&
              target !== this._activeObject))
        ) {
          this._groupSelector = {
            ex: pointer.x,
            ey: pointer.y,
            top: 0,
            left: 0
          };
        }

        if (target) {
          var alreadySelected = target === this._activeObject;
          if (target.selectable && target.activeOn === 'down') {
            this.setActiveObject(target, e);
          }
          var corner = target._findTargetCorner(
            this.getPointer(e, true),
            fabric.util.isTouchEvent(e)
          );
          target.__corner = corner;
          if (target === this._activeObject && (corner || !shouldGroup)) {
            this._setupCurrentTransform(e, target, alreadySelected);
            var control = target.controls[corner],
              pointer = this.getPointer(e),
              mouseDownHandler =
                control && control.getMouseDownHandler(e, target, control);
            if (mouseDownHandler) {
              mouseDownHandler(e, this._currentTransform, pointer.x, pointer.y);
            }
          }
        }
        this._handleEvent(e, 'down');
        // we must renderAll so that we update the visuals
        (shouldRender || shouldGroup) && this.requestRenderAll();
      },

      /**
       * reset cache form common information needed during event processing
       * @private
       */
      _resetTransformEventData: function() {
        this._target = null;
        this._pointer = null;
        this._absolutePointer = null;
      },

      /**
       * Cache common information needed during event processing
       * @private
       * @param {Event} e Event object fired on event
       */
      _cacheTransformEventData: function(e) {
        // reset in order to avoid stale caching
        this._resetTransformEventData();
        this._pointer = this.getPointer(e, true);
        this._absolutePointer = this.restorePointerVpt(this._pointer);
        this._target = this._currentTransform
          ? this._currentTransform.target
          : this.findTarget(e) || null;
      },

      /**
       * @private
       */
      _beforeTransform: function(e) {
        var t = this._currentTransform;
        this.stateful && t.target.saveState();
        this.fire('before:transform', {
          e: e,
          transform: t
        });
      },

      /**
       * Method that defines the actions when mouse is hovering the canvas.
       * The currentTransform parameter will define whether the user is rotating/scaling/translating
       * an image or neither of them (only hovering). A group selection is also possible and would cancel
       * all any other type of action.
       * In case of an image transformation only the top canvas will be rendered.
       * @private
       * @param {Event} e Event object fired on mousemove
       */
      __onMouseMove: function(e) {
        this._handleEvent(e, 'move:before');
        this._cacheTransformEventData(e);
        var target, pointer;

        if (this.isDrawingMode) {
          this._onMouseMoveInDrawingMode(e);
          return;
        }

        if (!this._isMainEvent(e)) {
          return;
        }

        var groupSelector = this._groupSelector;

        // We initially clicked in an empty area, so we draw a box for multiple selection
        if (groupSelector) {
          pointer = this._pointer;

          groupSelector.left = pointer.x - groupSelector.ex;
          groupSelector.top = pointer.y - groupSelector.ey;

          this.renderTop();
        } else if (!this._currentTransform) {
          target = this.findTarget(e) || null;
          this._setCursorFromEvent(e, target);
          this._fireOverOutEvents(target, e);
        } else {
          this._transformObject(e);
        }
        this._handleEvent(e, 'move');
        this._resetTransformEventData();
      },

      /**
       * Manage the mouseout, mouseover events for the fabric object on the canvas
       * @param {Fabric.Object} target the target where the target from the mousemove event
       * @param {Event} e Event object fired on mousemove
       * @private
       */
      _fireOverOutEvents: function(target, e) {
        var _hoveredTarget = this._hoveredTarget,
          _hoveredTargets = this._hoveredTargets,
          targets = this.targets,
          length = Math.max(_hoveredTargets.length, targets.length);

        this.fireSyntheticInOutEvents(target, e, {
          oldTarget: _hoveredTarget,
          evtOut: 'mouseout',
          canvasEvtOut: 'mouse:out',
          evtIn: 'mouseover',
          canvasEvtIn: 'mouse:over'
        });
        for (var i = 0; i < length; i++) {
          this.fireSyntheticInOutEvents(targets[i], e, {
            oldTarget: _hoveredTargets[i],
            evtOut: 'mouseout',
            evtIn: 'mouseover'
          });
        }
        this._hoveredTarget = target;
        this._hoveredTargets = this.targets.concat();
      },

      /**
       * Manage the dragEnter, dragLeave events for the fabric objects on the canvas
       * @param {Fabric.Object} target the target where the target from the onDrag event
       * @param {Event} e Event object fired on ondrag
       * @private
       */
      _fireEnterLeaveEvents: function(target, e) {
        var _draggedoverTarget = this._draggedoverTarget,
          _hoveredTargets = this._hoveredTargets,
          targets = this.targets,
          length = Math.max(_hoveredTargets.length, targets.length);

        this.fireSyntheticInOutEvents(target, e, {
          oldTarget: _draggedoverTarget,
          evtOut: 'dragleave',
          evtIn: 'dragenter'
        });
        for (var i = 0; i < length; i++) {
          this.fireSyntheticInOutEvents(targets[i], e, {
            oldTarget: _hoveredTargets[i],
            evtOut: 'dragleave',
            evtIn: 'dragenter'
          });
        }
        this._draggedoverTarget = target;
      },

      /**
       * Manage the synthetic in/out events for the fabric objects on the canvas
       * @param {Fabric.Object} target the target where the target from the supported events
       * @param {Event} e Event object fired
       * @param {Object} config configuration for the function to work
       * @param {String} config.targetName property on the canvas where the old target is stored
       * @param {String} [config.canvasEvtOut] name of the event to fire at canvas level for out
       * @param {String} config.evtOut name of the event to fire for out
       * @param {String} [config.canvasEvtIn] name of the event to fire at canvas level for in
       * @param {String} config.evtIn name of the event to fire for in
       * @private
       */
      fireSyntheticInOutEvents: function(target, e, config) {
        var inOpt,
          outOpt,
          oldTarget = config.oldTarget,
          outFires,
          inFires,
          targetChanged = oldTarget !== target,
          canvasEvtIn = config.canvasEvtIn,
          canvasEvtOut = config.canvasEvtOut;
        if (targetChanged) {
          inOpt = { e: e, target: target, previousTarget: oldTarget };
          outOpt = { e: e, target: oldTarget, nextTarget: target };
        }
        inFires = target && targetChanged;
        outFires = oldTarget && targetChanged;
        if (outFires) {
          canvasEvtOut && this.fire(canvasEvtOut, outOpt);
          oldTarget.fire(config.evtOut, outOpt);
        }
        if (inFires) {
          canvasEvtIn && this.fire(canvasEvtIn, inOpt);
          target.fire(config.evtIn, inOpt);
        }
      },

      /**
       * Method that defines actions when an Event Mouse Wheel
       * @param {Event} e Event object fired on mouseup
       */
      __onMouseWheel: function(e) {
        this._cacheTransformEventData(e);
        this._handleEvent(e, 'wheel');
        this._resetTransformEventData();
      },

      /**
       * @private
       * @param {Event} e Event fired on mousemove
       */
      _transformObject: function(e) {
        var pointer = this.getPointer(e),
          transform = this._currentTransform;

        transform.reset = false;
        transform.shiftKey = e.shiftKey;
        transform.altKey = e[this.centeredKey];

        this._performTransformAction(e, transform, pointer);
        transform.actionPerformed && this.requestRenderAll();
      },

      /**
       * @private
       */
      _performTransformAction: function(e, transform, pointer) {
        var x = pointer.x,
          y = pointer.y,
          action = transform.action,
          actionPerformed = false,
          actionHandler = transform.actionHandler;
        // this object could be created from the function in the control handlers

        if (actionHandler) {
          actionPerformed = actionHandler(e, transform, x, y);
        }
        if (action === 'drag' && actionPerformed) {
          transform.target.isMoving = true;
          this.setCursor(transform.target.moveCursor || this.moveCursor);
        }
        transform.actionPerformed =
          transform.actionPerformed || actionPerformed;
      },

      /**
       * @private
       */
      _fire: fabric.controlsUtils.fireEvent,

      /**
       * Sets the cursor depending on where the canvas is being hovered.
       * Note: very buggy in Opera
       * @param {Event} e Event object
       * @param {Object} target Object that the mouse is hovering, if so.
       */
      _setCursorFromEvent: function(e, target) {
        if (!target) {
          this.setCursor(this.defaultCursor);
          return false;
        }
        var hoverCursor = target.hoverCursor || this.hoverCursor,
          activeSelection =
            this._activeObject && this._activeObject.type === 'activeSelection'
              ? this._activeObject
              : null,
          // only show proper corner when group selection is not active
          corner =
            (!activeSelection || !activeSelection.contains(target)) &&
            // here we call findTargetCorner always with undefined for the touch parameter.
            // we assume that if you are using a cursor you do not need to interact with
            // the bigger touch area.
            target._findTargetCorner(this.getPointer(e, true));

        if (!corner) {
          if (target.subTargetCheck) {
            // hoverCursor should come from top-most subTarget,
            // so we walk the array backwards
            this.targets
              .concat()
              .reverse()
              .map(function(_target) {
                hoverCursor = _target.hoverCursor || hoverCursor;
              });
          }
          this.setCursor(hoverCursor);
        } else {
          this.setCursor(this.getCornerCursor(corner, target, e));
        }
      },

      /**
       * @private
       */
      getCornerCursor: function(corner, target, e) {
        var control = target.controls[corner];
        return control.cursorStyleHandler(e, control, target);
      }
    }
  );
})();
(function() {
  var min = Math.min,
    max = Math.max;

  fabric.util.object.extend(
    fabric.Canvas.prototype,
    /** @lends fabric.Canvas.prototype */ {
      /**
       * @private
       * @param {Event} e Event object
       * @param {fabric.Object} target
       * @return {Boolean}
       */
      _shouldGroup: function(e, target) {
        var activeObject = this._activeObject;
        return (
          activeObject &&
          this._isSelectionKeyPressed(e) &&
          target &&
          target.selectable &&
          this.selection &&
          (activeObject !== target ||
            activeObject.type === 'activeSelection') &&
          !target.onSelect({ e: e })
        );
      },

      /**
       * @private
       * @param {Event} e Event object
       * @param {fabric.Object} target
       */
      _handleGrouping: function(e, target) {
        var activeObject = this._activeObject;
        // avoid multi select when shift click on a corner
        if (activeObject.__corner) {
          return;
        }
        if (target === activeObject) {
          // if it's a group, find target again, using activeGroup objects
          target = this.findTarget(e, true);
          // if even object is not found or we are on activeObjectCorner, bail out
          if (!target || !target.selectable) {
            return;
          }
        }
        if (activeObject && activeObject.type === 'activeSelection') {
          this._updateActiveSelection(target, e);
        } else {
          this._createActiveSelection(target, e);
        }
      },

      /**
       * @private
       */
      _updateActiveSelection: function(target, e) {
        var activeSelection = this._activeObject,
          currentActiveObjects = activeSelection._objects.slice(0);
        if (activeSelection.contains(target)) {
          activeSelection.removeWithUpdate(target);
          this._hoveredTarget = target;
          this._hoveredTargets = this.targets.concat();
          if (activeSelection.size() === 1) {
            // activate last remaining object
            this._setActiveObject(activeSelection.item(0), e);
          }
        } else {
          activeSelection.addWithUpdate(target);
          this._hoveredTarget = activeSelection;
          this._hoveredTargets = this.targets.concat();
        }
        this._fireSelectionEvents(currentActiveObjects, e);
      },

      /**
       * @private
       */
      _createActiveSelection: function(target, e) {
        var currentActives = this.getActiveObjects(),
          group = this._createGroup(target);
        this._hoveredTarget = group;
        // ISSUE 4115: should we consider subTargets here?
        // this._hoveredTargets = [];
        // this._hoveredTargets = this.targets.concat();
        this._setActiveObject(group, e);
        this._fireSelectionEvents(currentActives, e);
      },

      /**
       * @private
       * @param {Object} target
       */
      _createGroup: function(target) {
        var objects = this._objects,
          isActiveLower =
            objects.indexOf(this._activeObject) < objects.indexOf(target),
          groupObjects = isActiveLower
            ? [this._activeObject, target]
            : [target, this._activeObject];
        this._activeObject.isEditing && this._activeObject.exitEditing();
        return new fabric.ActiveSelection(groupObjects, {
          canvas: this
        });
      },

      /**
       * @private
       * @param {Event} e mouse event
       */
      _groupSelectedObjects: function(e) {
        var group = this._collectObjects(e),
          aGroup;

        // do not create group for 1 element only
        if (group.length === 1) {
          this.setActiveObject(group[0], e);
        } else if (group.length > 1) {
          aGroup = new fabric.ActiveSelection(group.reverse(), {
            canvas: this
          });
          this.setActiveObject(aGroup, e);
        }
      },

      /**
       * @private
       */
      _collectObjects: function(e) {
        var group = [],
          currentObject,
          x1 = this._groupSelector.ex,
          y1 = this._groupSelector.ey,
          x2 = x1 + this._groupSelector.left,
          y2 = y1 + this._groupSelector.top,
          selectionX1Y1 = new fabric.Point(min(x1, x2), min(y1, y2)),
          selectionX2Y2 = new fabric.Point(max(x1, x2), max(y1, y2)),
          allowIntersect = !this.selectionFullyContained,
          isClick = x1 === x2 && y1 === y2;
        // we iterate reverse order to collect top first in case of click.
        for (var i = this._objects.length; i--; ) {
          currentObject = this._objects[i];

          if (
            !currentObject ||
            !currentObject.selectable ||
            !currentObject.visible
          ) {
            continue;
          }

          if (
            (allowIntersect &&
              currentObject.intersectsWithRect(selectionX1Y1, selectionX2Y2)) ||
            currentObject.isContainedWithinRect(selectionX1Y1, selectionX2Y2) ||
            (allowIntersect && currentObject.containsPoint(selectionX1Y1)) ||
            (allowIntersect && currentObject.containsPoint(selectionX2Y2))
          ) {
            group.push(currentObject);
            // only add one object if it's a click
            if (isClick) {
              break;
            }
          }
        }

        if (group.length > 1) {
          group = group.filter(function(object) {
            return !object.onSelect({ e: e });
          });
        }

        return group;
      },

      /**
       * @private
       */
      _maybeGroupObjects: function(e) {
        if (this.selection && this._groupSelector) {
          this._groupSelectedObjects(e);
        }
        this.setCursor(this.defaultCursor);
        // clear selection and current transformation
        this._groupSelector = null;
      }
    }
  );
})();
(function() {
  fabric.util.object.extend(
    fabric.StaticCanvas.prototype,
    /** @lends fabric.StaticCanvas.prototype */ {
      /**
       * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
       * @param {Object} [options] Options object
       * @param {String} [options.format=png] The format of the output image. Either "jpeg" or "png"
       * @param {Number} [options.quality=1] Quality level (0..1). Only used for jpeg.
       * @param {Number} [options.multiplier=1] Multiplier to scale by, to have consistent
       * @param {Number} [options.left] Cropping left offset. Introduced in v1.2.14
       * @param {Number} [options.top] Cropping top offset. Introduced in v1.2.14
       * @param {Number} [options.width] Cropping width. Introduced in v1.2.14
       * @param {Number} [options.height] Cropping height. Introduced in v1.2.14
       * @param {Boolean} [options.enableRetinaScaling] Enable retina scaling for clone image. Introduce in 2.0.0
       * @return {String} Returns a data: URL containing a representation of the object in the format specified by options.format
       * @see {@link http://jsfiddle.net/fabricjs/NfZVb/|jsFiddle demo}
       * @example <caption>Generate jpeg dataURL with lower quality</caption>
       * var dataURL = canvas.toDataURL({
       *   format: 'jpeg',
       *   quality: 0.8
       * });
       * @example <caption>Generate cropped png dataURL (clipping of canvas)</caption>
       * var dataURL = canvas.toDataURL({
       *   format: 'png',
       *   left: 100,
       *   top: 100,
       *   width: 200,
       *   height: 200
       * });
       * @example <caption>Generate double scaled png dataURL</caption>
       * var dataURL = canvas.toDataURL({
       *   format: 'png',
       *   multiplier: 2
       * });
       */
      toDataURL: function(options) {
        options || (options = {});

        var format = options.format || 'png',
          quality = options.quality || 1,
          multiplier =
            (options.multiplier || 1) *
            (options.enableRetinaScaling ? this.getRetinaScaling() : 1),
          canvasEl = this.toCanvasElement(multiplier, options);
        return fabric.util.toDataURL(canvasEl, format, quality);
      },

      /**
       * Create a new HTMLCanvas element painted with the current canvas content.
       * No need to resize the actual one or repaint it.
       * Will transfer object ownership to a new canvas, paint it, and set everything back.
       * This is an intermediary step used to get to a dataUrl but also it is useful to
       * create quick image copies of a canvas without passing for the dataUrl string
       * @param {Number} [multiplier] a zoom factor.
       * @param {Object} [cropping] Cropping informations
       * @param {Number} [cropping.left] Cropping left offset.
       * @param {Number} [cropping.top] Cropping top offset.
       * @param {Number} [cropping.width] Cropping width.
       * @param {Number} [cropping.height] Cropping height.
       */
      toCanvasElement: function(multiplier, cropping) {
        multiplier = multiplier || 1;
        cropping = cropping || {};
        var scaledWidth = (cropping.width || this.width) * multiplier,
          scaledHeight = (cropping.height || this.height) * multiplier,
          zoom = this.getZoom(),
          originalWidth = this.width,
          originalHeight = this.height,
          newZoom = zoom * multiplier,
          vp = this.viewportTransform,
          translateX = (vp[4] - (cropping.left || 0)) * multiplier,
          translateY = (vp[5] - (cropping.top || 0)) * multiplier,
          originalInteractive = this.interactive,
          newVp = [newZoom, 0, 0, newZoom, translateX, translateY],
          originalRetina = this.enableRetinaScaling,
          canvasEl = fabric.util.createCanvasElement(),
          originalContextTop = this.contextTop;
        canvasEl.width = scaledWidth;
        canvasEl.height = scaledHeight;
        this.contextTop = null;
        this.enableRetinaScaling = false;
        this.interactive = false;
        this.viewportTransform = newVp;
        this.width = scaledWidth;
        this.height = scaledHeight;
        this.calcViewportBoundaries();
        this.renderCanvas(canvasEl.getContext('2d'), this._objects);
        this.viewportTransform = vp;
        this.width = originalWidth;
        this.height = originalHeight;
        this.calcViewportBoundaries();
        this.interactive = originalInteractive;
        this.enableRetinaScaling = originalRetina;
        this.contextTop = originalContextTop;
        return canvasEl;
      }
    }
  );
})();
fabric.util.object.extend(
  fabric.StaticCanvas.prototype,
  /** @lends fabric.StaticCanvas.prototype */ {
    /**
     * Populates canvas with data from the specified JSON.
     * JSON format must conform to the one of {@link fabric.Canvas#toJSON}
     * @param {String|Object} json JSON string or object
     * @param {Function} callback Callback, invoked when json is parsed
     *                            and corresponding objects (e.g: {@link fabric.Image})
     *                            are initialized
     * @param {Function} [reviver] Method for further parsing of JSON elements, called after each fabric object created.
     * @return {fabric.Canvas} instance
     * @chainable
     * @tutorial {@link http://fabricjs.com/fabric-intro-part-3#deserialization}
     * @see {@link http://jsfiddle.net/fabricjs/fmgXt/|jsFiddle demo}
     * @example <caption>loadFromJSON</caption>
     * canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
     * @example <caption>loadFromJSON with reviver</caption>
     * canvas.loadFromJSON(json, canvas.renderAll.bind(canvas), function(o, object) {
     *   // `o` = json object
     *   // `object` = fabric.Object instance
     *   // ... do some stuff ...
     * });
     */
    loadFromJSON: function(json, callback, reviver) {
      if (!json) {
        return;
      }

      // serialize if it wasn't already
      var serialized =
        typeof json === 'string'
          ? JSON.parse(json)
          : fabric.util.object.clone(json);

      var _this = this,
        clipPath = serialized.clipPath,
        renderOnAddRemove = this.renderOnAddRemove;

      this.renderOnAddRemove = false;

      delete serialized.clipPath;

      this._enlivenObjects(
        serialized.objects,
        function(enlivenedObjects) {
          _this.clear();
          _this._setBgOverlay(serialized, function() {
            if (clipPath) {
              _this._enlivenObjects([clipPath], function(enlivenedCanvasClip) {
                _this.clipPath = enlivenedCanvasClip[0];
                _this.__setupCanvas.call(
                  _this,
                  serialized,
                  enlivenedObjects,
                  renderOnAddRemove,
                  callback
                );
              });
            } else {
              _this.__setupCanvas.call(
                _this,
                serialized,
                enlivenedObjects,
                renderOnAddRemove,
                callback
              );
            }
          });
        },
        reviver
      );
      return this;
    },

    /**
     * @private
     * @param {Object} serialized Object with background and overlay information
     * @param {Array} restored canvas objects
     * @param {Function} cached renderOnAddRemove callback
     * @param {Function} callback Invoked after all background and overlay images/patterns loaded
     */
    __setupCanvas: function(
      serialized,
      enlivenedObjects,
      renderOnAddRemove,
      callback
    ) {
      var _this = this;
      enlivenedObjects.forEach(function(obj, index) {
        // we splice the array just in case some custom classes restored from JSON
        // will add more object to canvas at canvas init.
        _this.insertAt(obj, index);
      });
      this.renderOnAddRemove = renderOnAddRemove;
      // remove parts i cannot set as options
      delete serialized.objects;
      delete serialized.backgroundImage;
      delete serialized.overlayImage;
      delete serialized.background;
      delete serialized.overlay;
      // this._initOptions does too many things to just
      // call it. Normally loading an Object from JSON
      // create the Object instance. Here the Canvas is
      // already an instance and we are just loading things over it
      this._setOptions(serialized);
      this.renderAll();
      callback && callback();
    },

    /**
     * @private
     * @param {Object} serialized Object with background and overlay information
     * @param {Function} callback Invoked after all background and overlay images/patterns loaded
     */
    _setBgOverlay: function(serialized, callback) {
      var loaded = {
        backgroundColor: false,
        overlayColor: false,
        backgroundImage: false,
        overlayImage: false
      };

      if (
        !serialized.backgroundImage &&
        !serialized.overlayImage &&
        !serialized.background &&
        !serialized.overlay
      ) {
        callback && callback();
        return;
      }

      var cbIfLoaded = function() {
        if (
          loaded.backgroundImage &&
          loaded.overlayImage &&
          loaded.backgroundColor &&
          loaded.overlayColor
        ) {
          callback && callback();
        }
      };

      this.__setBgOverlay(
        'backgroundImage',
        serialized.backgroundImage,
        loaded,
        cbIfLoaded
      );
      this.__setBgOverlay(
        'overlayImage',
        serialized.overlayImage,
        loaded,
        cbIfLoaded
      );
      this.__setBgOverlay(
        'backgroundColor',
        serialized.background,
        loaded,
        cbIfLoaded
      );
      this.__setBgOverlay(
        'overlayColor',
        serialized.overlay,
        loaded,
        cbIfLoaded
      );
    },

    /**
     * @private
     * @param {String} property Property to set (backgroundImage, overlayImage, backgroundColor, overlayColor)
     * @param {(Object|String)} value Value to set
     * @param {Object} loaded Set loaded property to true if property is set
     * @param {Object} callback Callback function to invoke after property is set
     */
    __setBgOverlay: function(property, value, loaded, callback) {
      var _this = this;

      if (!value) {
        loaded[property] = true;
        callback && callback();
        return;
      }

      if (property === 'backgroundImage' || property === 'overlayImage') {
        fabric.util.enlivenObjects([value], function(enlivedObject) {
          _this[property] = enlivedObject[0];
          loaded[property] = true;
          callback && callback();
        });
      } else {
        this['set' + fabric.util.string.capitalize(property, true)](
          value,
          function() {
            loaded[property] = true;
            callback && callback();
          }
        );
      }
    },

    /**
     * @private
     * @param {Array} objects
     * @param {Function} callback
     * @param {Function} [reviver]
     */
    _enlivenObjects: function(objects, callback, reviver) {
      if (!objects || objects.length === 0) {
        callback && callback([]);
        return;
      }

      fabric.util.enlivenObjects(
        objects,
        function(enlivenedObjects) {
          callback && callback(enlivenedObjects);
        },
        null,
        reviver
      );
    },

    /**
     * @private
     * @param {String} format
     * @param {Function} callback
     */
    _toDataURL: function(format, callback) {
      this.clone(function(clone) {
        callback(clone.toDataURL(format));
      });
    },

    /**
     * @private
     * @param {String} format
     * @param {Number} multiplier
     * @param {Function} callback
     */
    _toDataURLWithMultiplier: function(format, multiplier, callback) {
      this.clone(function(clone) {
        callback(clone.toDataURLWithMultiplier(format, multiplier));
      });
    },

    /**
     * Clones canvas instance
     * @param {Object} [callback] Receives cloned instance as a first argument
     * @param {Array} [properties] Array of properties to include in the cloned canvas and children
     */
    clone: function(callback, properties) {
      var data = JSON.stringify(this.toJSON(properties));
      this.cloneWithoutData(function(clone) {
        clone.loadFromJSON(data, function() {
          callback && callback(clone);
        });
      });
    },

    /**
     * Clones canvas instance without cloning existing data.
     * This essentially copies canvas dimensions, clipping properties, etc.
     * but leaves data empty (so that you can populate it with your own)
     * @param {Object} [callback] Receives cloned instance as a first argument
     */
    cloneWithoutData: function(callback) {
      var el = fabric.util.createCanvasElement();

      el.width = this.width;
      el.height = this.height;

      var clone = new fabric.Canvas(el);
      if (this.backgroundImage) {
        clone.setBackgroundImage(this.backgroundImage.src, function() {
          clone.renderAll();
          callback && callback(clone);
        });
        clone.backgroundImageOpacity = this.backgroundImageOpacity;
        clone.backgroundImageStretch = this.backgroundImageStretch;
      } else {
        callback && callback(clone);
      }
    }
  }
);
/**
 * Adds support for multi-touch gestures using the Event.js library.
 * Fires the following custom events:
 * - touch:gesture
 * - touch:drag
 * - touch:orientation
 * - touch:shake
 * - touch:longpress
 */
(function() {
  var degreesToRadians = fabric.util.degreesToRadians,
    radiansToDegrees = fabric.util.radiansToDegrees;

  fabric.util.object.extend(
    fabric.Canvas.prototype,
    /** @lends fabric.Canvas.prototype */ {
      /**
       * Method that defines actions when an Event.js gesture is detected on an object. Currently only supports
       * 2 finger gestures.
       * @param {Event} e Event object by Event.js
       * @param {Event} self Event proxy object by Event.js
       */
      __onTransformGesture: function(e, self) {
        if (
          this.isDrawingMode ||
          !e.touches ||
          e.touches.length !== 2 ||
          'gesture' !== self.gesture
        ) {
          return;
        }

        var target = this.findTarget(e);
        if ('undefined' !== typeof target) {
          this.__gesturesParams = {
            e: e,
            self: self,
            target: target
          };

          this.__gesturesRenderer();
        }

        this.fire('touch:gesture', {
          target: target,
          e: e,
          self: self
        });
      },
      __gesturesParams: null,
      __gesturesRenderer: function() {
        if (this.__gesturesParams === null || this._currentTransform === null) {
          return;
        }

        var self = this.__gesturesParams.self,
          t = this._currentTransform,
          e = this.__gesturesParams.e;

        t.action = 'scale';
        t.originX = t.originY = 'center';

        this._scaleObjectBy(self.scale, e);

        if (self.rotation !== 0) {
          t.action = 'rotate';
          this._rotateObjectByAngle(self.rotation, e);
        }

        this.requestRenderAll();

        t.action = 'drag';
      },

      /**
       * Method that defines actions when an Event.js drag is detected.
       *
       * @param {Event} e Event object by Event.js
       * @param {Event} self Event proxy object by Event.js
       */
      __onDrag: function(e, self) {
        this.fire('touch:drag', {
          e: e,
          self: self
        });
      },

      /**
       * Method that defines actions when an Event.js orientation event is detected.
       *
       * @param {Event} e Event object by Event.js
       * @param {Event} self Event proxy object by Event.js
       */
      __onOrientationChange: function(e, self) {
        this.fire('touch:orientation', {
          e: e,
          self: self
        });
      },

      /**
       * Method that defines actions when an Event.js shake event is detected.
       *
       * @param {Event} e Event object by Event.js
       * @param {Event} self Event proxy object by Event.js
       */
      __onShake: function(e, self) {
        this.fire('touch:shake', {
          e: e,
          self: self
        });
      },

      /**
       * Method that defines actions when an Event.js longpress event is detected.
       *
       * @param {Event} e Event object by Event.js
       * @param {Event} self Event proxy object by Event.js
       */
      __onLongPress: function(e, self) {
        this.fire('touch:longpress', {
          e: e,
          self: self
        });
      },

      /**
       * Scales an object by a factor
       * @param {Number} s The scale factor to apply to the current scale level
       * @param {Event} e Event object by Event.js
       */
      _scaleObjectBy: function(s, e) {
        var t = this._currentTransform,
          target = t.target;
        t.gestureScale = s;
        target._scaling = true;
        return fabric.controlsUtils.scalingEqually(e, t, 0, 0);
      },

      /**
       * Rotates object by an angle
       * @param {Number} curAngle The angle of rotation in degrees
       * @param {Event} e Event object by Event.js
       */
      _rotateObjectByAngle: function(curAngle, e) {
        var t = this._currentTransform;

        if (t.target.get('lockRotation')) {
          return;
        }
        t.target.rotate(radiansToDegrees(degreesToRadians(curAngle) + t.theta));
        this._fire('rotating', {
          target: t.target,
          e: e,
          transform: t
        });
      }
    }
  );
})();
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    clone = fabric.util.object.clone,
    toFixed = fabric.util.toFixed,
    capitalize = fabric.util.string.capitalize,
    degreesToRadians = fabric.util.degreesToRadians,
    supportsLineDash = fabric.StaticCanvas.supports('setLineDash'),
    objectCaching = !fabric.isLikelyNode,
    ALIASING_LIMIT = 2;

  if (fabric.Object) {
    return;
  }

  /**
   * Root object class from which all 2d shape classes inherit from
   * @class fabric.Object
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-1#objects}
   * @see {@link fabric.Object#initialize} for constructor definition
   *
   * @fires added
   * @fires removed
   *
   * @fires selected
   * @fires deselected
   * @fires modified
   * @fires modified
   * @fires moved
   * @fires scaled
   * @fires rotated
   * @fires skewed
   *
   * @fires rotating
   * @fires scaling
   * @fires moving
   * @fires skewing
   *
   * @fires mousedown
   * @fires mouseup
   * @fires mouseover
   * @fires mouseout
   * @fires mousewheel
   * @fires mousedblclick
   *
   * @fires dragover
   * @fires dragenter
   * @fires dragleave
   * @fires drop
   */
  fabric.Object = fabric.util.createClass(
    fabric.CommonMethods,
    /** @lends fabric.Object.prototype */ {
      /**
       * Type of an object (rect, circle, path, etc.).
       * Note that this property is meant to be read-only and not meant to be modified.
       * If you modify, certain parts of Fabric (such as JSON loading) won't work correctly.
       * @type String
       * @default
       */
      type: 'object',

      /**
       * Horizontal origin of transformation of an object (one of "left", "right", "center")
       * See http://jsfiddle.net/1ow02gea/244/ on how originX/originY affect objects in groups
       * @type String
       * @default
       */
      originX: 'left',

      /**
       * Vertical origin of transformation of an object (one of "top", "bottom", "center")
       * See http://jsfiddle.net/1ow02gea/244/ on how originX/originY affect objects in groups
       * @type String
       * @default
       */
      originY: 'top',

      /**
       * Top position of an object. Note that by default it's relative to object top. You can change this by setting originY={top/center/bottom}
       * @type Number
       * @default
       */
      top: 0,

      /**
       * Left position of an object. Note that by default it's relative to object left. You can change this by setting originX={left/center/right}
       * @type Number
       * @default
       */
      left: 0,

      /**
       * Object width
       * @type Number
       * @default
       */
      width: 0,

      /**
       * Object height
       * @type Number
       * @default
       */
      height: 0,

      /**
       * Object scale factor (horizontal)
       * @type Number
       * @default
       */
      scaleX: 1,

      /**
       * Object scale factor (vertical)
       * @type Number
       * @default
       */
      scaleY: 1,

      /**
       * When true, an object is rendered as flipped horizontally
       * @type Boolean
       * @default
       */
      flipX: false,

      /**
       * When true, an object is rendered as flipped vertically
       * @type Boolean
       * @default
       */
      flipY: false,

      /**
       * Opacity of an object
       * @type Number
       * @default
       */
      opacity: 1,

      /**
       * Angle of rotation of an object (in degrees)
       * @type Number
       * @default
       */
      angle: 0,

      /**
       * Angle of skew on x axes of an object (in degrees)
       * @type Number
       * @default
       */
      skewX: 0,

      /**
       * Angle of skew on y axes of an object (in degrees)
       * @type Number
       * @default
       */
      skewY: 0,

      /**
       * Size of object's controlling corners (in pixels)
       * @type Number
       * @default
       */
      cornerSize: 13,

      /**
       * Size of object's controlling corners when touch interaction is detected
       * @type Number
       * @default
       */
      touchCornerSize: 24,

      /**
       * When true, object's controlling corners are rendered as transparent inside (i.e. stroke instead of fill)
       * @type Boolean
       * @default
       */
      transparentCorners: true,

      /**
       * Default cursor value used when hovering over this object on canvas
       * @type String
       * @default
       */
      hoverCursor: null,

      /**
       * Default cursor value used when moving this object on canvas
       * @type String
       * @default
       */
      moveCursor: null,

      /**
       * Padding between object and its controlling borders (in pixels)
       * @type Number
       * @default
       */
      padding: 0,

      /**
       * Color of controlling borders of an object (when it's active)
       * @type String
       * @default
       */
      borderColor: 'rgb(178,204,255)',

      /**
       * Array specifying dash pattern of an object's borders (hasBorder must be true)
       * @since 1.6.2
       * @type Array
       */
      borderDashArray: null,

      /**
       * Color of controlling corners of an object (when it's active)
       * @type String
       * @default
       */
      cornerColor: 'rgb(178,204,255)',

      /**
       * Color of controlling corners of an object (when it's active and transparentCorners false)
       * @since 1.6.2
       * @type String
       * @default
       */
      cornerStrokeColor: null,

      /**
       * Specify style of control, 'rect' or 'circle'
       * @since 1.6.2
       * @type String
       */
      cornerStyle: 'rect',

      /**
       * Array specifying dash pattern of an object's control (hasBorder must be true)
       * @since 1.6.2
       * @type Array
       */
      cornerDashArray: null,

      /**
       * When true, this object will use center point as the origin of transformation
       * when being scaled via the controls.
       * <b>Backwards incompatibility note:</b> This property replaces "centerTransform" (Boolean).
       * @since 1.3.4
       * @type Boolean
       * @default
       */
      centeredScaling: false,

      /**
       * When true, this object will use center point as the origin of transformation
       * when being rotated via the controls.
       * <b>Backwards incompatibility note:</b> This property replaces "centerTransform" (Boolean).
       * @since 1.3.4
       * @type Boolean
       * @default
       */
      centeredRotation: true,

      /**
       * Color of object's fill
       * takes css colors https://www.w3.org/TR/css-color-3/
       * @type String
       * @default
       */
      fill: 'rgb(0,0,0)',

      /**
       * Fill rule used to fill an object
       * accepted values are nonzero, evenodd
       * <b>Backwards incompatibility note:</b> This property was used for setting globalCompositeOperation until v1.4.12 (use `fabric.Object#globalCompositeOperation` instead)
       * @type String
       * @default
       */
      fillRule: 'nonzero',

      /**
       * Composite rule used for canvas globalCompositeOperation
       * @type String
       * @default
       */
      globalCompositeOperation: 'source-over',

      /**
       * Background color of an object.
       * takes css colors https://www.w3.org/TR/css-color-3/
       * @type String
       * @default
       */
      backgroundColor: '',

      /**
       * Selection Background color of an object. colored layer behind the object when it is active.
       * does not mix good with globalCompositeOperation methods.
       * @type String
       * @default
       */
      selectionBackgroundColor: '',

      /**
       * When defined, an object is rendered via stroke and this property specifies its color
       * takes css colors https://www.w3.org/TR/css-color-3/
       * @type String
       * @default
       */
      stroke: null,

      /**
       * Width of a stroke used to render this object
       * @type Number
       * @default
       */
      strokeWidth: 1,

      /**
       * Array specifying dash pattern of an object's stroke (stroke must be defined)
       * @type Array
       */
      strokeDashArray: null,

      /**
       * Line offset of an object's stroke
       * @type Number
       * @default
       */
      strokeDashOffset: 0,

      /**
       * Line endings style of an object's stroke (one of "butt", "round", "square")
       * @type String
       * @default
       */
      strokeLineCap: 'butt',

      /**
       * Corner style of an object's stroke (one of "bevel", "round", "miter")
       * @type String
       * @default
       */
      strokeLineJoin: 'miter',

      /**
       * Maximum miter length (used for strokeLineJoin = "miter") of an object's stroke
       * @type Number
       * @default
       */
      strokeMiterLimit: 4,

      /**
       * Shadow object representing shadow of this shape
       * @type fabric.Shadow
       * @default
       */
      shadow: null,

      /**
       * Opacity of object's controlling borders when object is active and moving
       * @type Number
       * @default
       */
      borderOpacityWhenMoving: 0.4,

      /**
       * Scale factor of object's controlling borders
       * bigger number will make a thicker border
       * border is 1, so this is basically a border thickness
       * since there is no way to change the border itself.
       * @type Number
       * @default
       */
      borderScaleFactor: 1,

      /**
       * Minimum allowed scale value of an object
       * @type Number
       * @default
       */
      minScaleLimit: 0,

      /**
       * When set to `false`, an object can not be selected for modification (using either point-click-based or group-based selection).
       * But events still fire on it.
       * @type Boolean
       * @default
       */
      selectable: true,

      /**
       * When set to `false`, an object can not be a target of events. All events propagate through it. Introduced in v1.3.4
       * @type Boolean
       * @default
       */
      evented: true,

      /**
       * When set to `false`, an object is not rendered on canvas
       * @type Boolean
       * @default
       */
      visible: true,

      /**
       * When set to `false`, object's controls are not displayed and can not be used to manipulate object
       * @type Boolean
       * @default
       */
      hasControls: true,

      /**
       * When set to `false`, object's controlling borders are not rendered
       * @type Boolean
       * @default
       */
      hasBorders: true,

      /**
       * When set to `true`, objects are "found" on canvas on per-pixel basis rather than according to bounding box
       * @type Boolean
       * @default
       */
      perPixelTargetFind: false,

      /**
       * When `false`, default object's values are not included in its serialization
       * @type Boolean
       * @default
       */
      includeDefaultValues: true,

      /**
       * When `true`, object horizontal movement is locked
       * @type Boolean
       * @default
       */
      lockMovementX: false,

      /**
       * When `true`, object vertical movement is locked
       * @type Boolean
       * @default
       */
      lockMovementY: false,

      /**
       * When `true`, object rotation is locked
       * @type Boolean
       * @default
       */
      lockRotation: false,

      /**
       * When `true`, object horizontal scaling is locked
       * @type Boolean
       * @default
       */
      lockScalingX: false,

      /**
       * When `true`, object vertical scaling is locked
       * @type Boolean
       * @default
       */
      lockScalingY: false,

      /**
       * When `true`, object horizontal skewing is locked
       * @type Boolean
       * @default
       */
      lockSkewingX: false,

      /**
       * When `true`, object vertical skewing is locked
       * @type Boolean
       * @default
       */
      lockSkewingY: false,

      /**
       * When `true`, object cannot be flipped by scaling into negative values
       * @type Boolean
       * @default
       */
      lockScalingFlip: false,

      /**
       * When `true`, object is not exported in OBJECT/JSON
       * @since 1.6.3
       * @type Boolean
       * @default
       */
      excludeFromExport: false,

      /**
       * When `true`, object is cached on an additional canvas.
       * When `false`, object is not cached unless necessary ( clipPath )
       * default to true
       * @since 1.7.0
       * @type Boolean
       * @default true
       */
      objectCaching: objectCaching,

      /**
       * When `true`, object properties are checked for cache invalidation. In some particular
       * situation you may want this to be disabled ( spray brush, very big, groups)
       * or if your application does not allow you to modify properties for groups child you want
       * to disable it for groups.
       * default to false
       * since 1.7.0
       * @type Boolean
       * @default false
       */
      statefullCache: false,

      /**
       * When `true`, cache does not get updated during scaling. The picture will get blocky if scaled
       * too much and will be redrawn with correct details at the end of scaling.
       * this setting is performance and application dependant.
       * default to true
       * since 1.7.0
       * @type Boolean
       * @default true
       */
      noScaleCache: true,

      /**
       * When `false`, the stoke width will scale with the object.
       * When `true`, the stroke will always match the exact pixel size entered for stroke width.
       * default to false
       * @since 2.6.0
       * @type Boolean
       * @default false
       * @type Boolean
       * @default false
       */
      strokeUniform: false,

      /**
       * When set to `true`, object's cache will be rerendered next render call.
       * since 1.7.0
       * @type Boolean
       * @default true
       */
      dirty: true,

      /**
       * keeps the value of the last hovered corner during mouse move.
       * 0 is no corner, or 'mt', 'ml', 'mtr' etc..
       * It should be private, but there is no harm in using it as
       * a read-only property.
       * @type number|string|any
       * @default 0
       */
      __corner: 0,

      /**
       * Determines if the fill or the stroke is drawn first (one of "fill" or "stroke")
       * @type String
       * @default
       */
      paintFirst: 'fill',

      /**
       * When 'down', object is set to active on mousedown/touchstart
       * When 'up', object is set to active on mouseup/touchend
       * Experimental. Let's see if this breaks anything before supporting officially
       * @private
       * since 4.4.0
       * @type String
       * @default 'down'
       */
      activeOn: 'down',

      /**
       * List of properties to consider when checking if state
       * of an object is changed (fabric.Object#hasStateChanged)
       * as well as for history (undo/redo) purposes
       * @type Array
       */
      stateProperties: (
        'top left width height scaleX scaleY flipX flipY originX originY transformMatrix ' +
        'stroke strokeWidth strokeDashArray strokeLineCap strokeDashOffset strokeLineJoin strokeMiterLimit ' +
        'angle opacity fill globalCompositeOperation shadow visible backgroundColor ' +
        'skewX skewY fillRule paintFirst clipPath strokeUniform'
      ).split(' '),

      /**
       * List of properties to consider when checking if cache needs refresh
       * Those properties are checked by statefullCache ON ( or lazy mode if we want ) or from single
       * calls to Object.set(key, value). If the key is in this list, the object is marked as dirty
       * and refreshed at the next render
       * @type Array
       */
      cacheProperties: (
        'fill stroke strokeWidth strokeDashArray width height paintFirst strokeUniform' +
        ' strokeLineCap strokeDashOffset strokeLineJoin strokeMiterLimit backgroundColor clipPath'
      ).split(' '),

      /**
       * List of properties to consider for animating colors.
       * @type Array
       */
      colorProperties: 'fill stroke backgroundColor'.split(' '),

      /**
       * a fabricObject that, without stroke define a clipping area with their shape. filled in black
       * the clipPath object gets used when the object has rendered, and the context is placed in the center
       * of the object cacheCanvas.
       * If you want 0,0 of a clipPath to align with an object center, use clipPath.originX/Y to 'center'
       * @type fabric.Object
       */
      clipPath: undefined,

      /**
       * Meaningful ONLY when the object is used as clipPath.
       * if true, the clipPath will make the object clip to the outside of the clipPath
       * since 2.4.0
       * @type boolean
       * @default false
       */
      inverted: false,

      /**
       * Meaningful ONLY when the object is used as clipPath.
       * if true, the clipPath will have its top and left relative to canvas, and will
       * not be influenced by the object transform. This will make the clipPath relative
       * to the canvas, but clipping just a particular object.
       * WARNING this is beta, this feature may change or be renamed.
       * since 2.4.0
       * @type boolean
       * @default false
       */
      absolutePositioned: false,

      /**
       * Constructor
       * @param {Object} [options] Options object
       */
      initialize: function(options) {
        if (options) {
          this.setOptions(options);
        }
      },

      /**
       * Create a the canvas used to keep the cached copy of the object
       * @private
       */
      _createCacheCanvas: function() {
        this._cacheProperties = {};
        this._cacheCanvas = fabric.util.createCanvasElement();
        this._cacheContext = this._cacheCanvas.getContext('2d');
        this._updateCacheCanvas();
        // if canvas gets created, is empty, so dirty.
        this.dirty = true;
      },

      /**
       * Limit the cache dimensions so that X * Y do not cross fabric.perfLimitSizeTotal
       * and each side do not cross fabric.cacheSideLimit
       * those numbers are configurable so that you can get as much detail as you want
       * making bargain with performances.
       * @param {Object} dims
       * @param {Object} dims.width width of canvas
       * @param {Object} dims.height height of canvas
       * @param {Object} dims.zoomX zoomX zoom value to unscale the canvas before drawing cache
       * @param {Object} dims.zoomY zoomY zoom value to unscale the canvas before drawing cache
       * @return {Object}.width width of canvas
       * @return {Object}.height height of canvas
       * @return {Object}.zoomX zoomX zoom value to unscale the canvas before drawing cache
       * @return {Object}.zoomY zoomY zoom value to unscale the canvas before drawing cache
       */
      _limitCacheSize: function(dims) {
        var perfLimitSizeTotal = fabric.perfLimitSizeTotal,
          width = dims.width,
          height = dims.height,
          max = fabric.maxCacheSideLimit,
          min = fabric.minCacheSideLimit;
        if (
          width <= max &&
          height <= max &&
          width * height <= perfLimitSizeTotal
        ) {
          if (width < min) {
            dims.width = min;
          }
          if (height < min) {
            dims.height = min;
          }
          return dims;
        }
        var ar = width / height,
          limitedDims = fabric.util.limitDimsByArea(ar, perfLimitSizeTotal),
          capValue = fabric.util.capValue,
          x = capValue(min, limitedDims.x, max),
          y = capValue(min, limitedDims.y, max);
        if (width > x) {
          dims.zoomX /= width / x;
          dims.width = x;
          dims.capped = true;
        }
        if (height > y) {
          dims.zoomY /= height / y;
          dims.height = y;
          dims.capped = true;
        }
        return dims;
      },

      /**
       * Return the dimension and the zoom level needed to create a cache canvas
       * big enough to host the object to be cached.
       * @private
       * @return {Object}.x width of object to be cached
       * @return {Object}.y height of object to be cached
       * @return {Object}.width width of canvas
       * @return {Object}.height height of canvas
       * @return {Object}.zoomX zoomX zoom value to unscale the canvas before drawing cache
       * @return {Object}.zoomY zoomY zoom value to unscale the canvas before drawing cache
       */
      _getCacheCanvasDimensions: function() {
        var objectScale = this.getTotalObjectScaling(),
          // caculate dimensions without skewing
          dim = this._getTransformedDimensions(0, 0),
          neededX = (dim.x * objectScale.scaleX) / this.scaleX,
          neededY = (dim.y * objectScale.scaleY) / this.scaleY;
        return {
          // for sure this ALIASING_LIMIT is slightly creating problem
          // in situation in which the cache canvas gets an upper limit
          // also objectScale contains already scaleX and scaleY
          width: neededX + ALIASING_LIMIT,
          height: neededY + ALIASING_LIMIT,
          zoomX: objectScale.scaleX,
          zoomY: objectScale.scaleY,
          x: neededX,
          y: neededY
        };
      },

      /**
       * Update width and height of the canvas for cache
       * returns true or false if canvas needed resize.
       * @private
       * @return {Boolean} true if the canvas has been resized
       */
      _updateCacheCanvas: function() {
        var targetCanvas = this.canvas;
        if (
          this.noScaleCache &&
          targetCanvas &&
          targetCanvas._currentTransform
        ) {
          var target = targetCanvas._currentTransform.target,
            action = targetCanvas._currentTransform.action;
          if (
            this === target &&
            action.slice &&
            action.slice(0, 5) === 'scale'
          ) {
            return false;
          }
        }
        var canvas = this._cacheCanvas,
          dims = this._limitCacheSize(this._getCacheCanvasDimensions()),
          minCacheSize = fabric.minCacheSideLimit,
          width = dims.width,
          height = dims.height,
          drawingWidth,
          drawingHeight,
          zoomX = dims.zoomX,
          zoomY = dims.zoomY,
          dimensionsChanged =
            width !== this.cacheWidth || height !== this.cacheHeight,
          zoomChanged = this.zoomX !== zoomX || this.zoomY !== zoomY,
          shouldRedraw = dimensionsChanged || zoomChanged,
          additionalWidth = 0,
          additionalHeight = 0,
          shouldResizeCanvas = false;
        if (dimensionsChanged) {
          var canvasWidth = this._cacheCanvas.width,
            canvasHeight = this._cacheCanvas.height,
            sizeGrowing = width > canvasWidth || height > canvasHeight,
            sizeShrinking =
              (width < canvasWidth * 0.9 || height < canvasHeight * 0.9) &&
              canvasWidth > minCacheSize &&
              canvasHeight > minCacheSize;
          shouldResizeCanvas = sizeGrowing || sizeShrinking;
          if (
            sizeGrowing &&
            !dims.capped &&
            (width > minCacheSize || height > minCacheSize)
          ) {
            additionalWidth = width * 0.1;
            additionalHeight = height * 0.1;
          }
        }
        if (shouldRedraw) {
          if (shouldResizeCanvas) {
            canvas.width = Math.ceil(width + additionalWidth);
            canvas.height = Math.ceil(height + additionalHeight);
          } else {
            this._cacheContext.setTransform(1, 0, 0, 1, 0, 0);
            this._cacheContext.clearRect(0, 0, canvas.width, canvas.height);
          }
          drawingWidth = dims.x / 2;
          drawingHeight = dims.y / 2;
          this.cacheTranslationX =
            Math.round(canvas.width / 2 - drawingWidth) + drawingWidth;
          this.cacheTranslationY =
            Math.round(canvas.height / 2 - drawingHeight) + drawingHeight;
          this.cacheWidth = width;
          this.cacheHeight = height;
          this._cacheContext.translate(
            this.cacheTranslationX,
            this.cacheTranslationY
          );
          this._cacheContext.scale(zoomX, zoomY);
          this.zoomX = zoomX;
          this.zoomY = zoomY;
          return true;
        }
        return false;
      },

      /**
       * Sets object's properties from options
       * @param {Object} [options] Options object
       */
      setOptions: function(options) {
        this._setOptions(options);
        this._initGradient(options.fill, 'fill');
        this._initGradient(options.stroke, 'stroke');
        this._initPattern(options.fill, 'fill');
        this._initPattern(options.stroke, 'stroke');
      },

      /**
       * Transforms context when rendering an object
       * @param {CanvasRenderingContext2D} ctx Context
       */
      transform: function(ctx) {
        var needFullTransform =
          (this.group && !this.group._transformDone) ||
          (this.group && this.canvas && ctx === this.canvas.contextTop);
        var m = this.calcTransformMatrix(!needFullTransform);
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      },

      /**
       * Returns an object representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} Object representation of an instance
       */
      toObject: function(propertiesToInclude) {
        var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS,
          object = {
            type: this.type,
            version: fabric.version,
            originX: this.originX,
            originY: this.originY,
            left: toFixed(this.left, NUM_FRACTION_DIGITS),
            top: toFixed(this.top, NUM_FRACTION_DIGITS),
            width: toFixed(this.width, NUM_FRACTION_DIGITS),
            height: toFixed(this.height, NUM_FRACTION_DIGITS),
            fill:
              this.fill && this.fill.toObject
                ? this.fill.toObject()
                : this.fill,
            stroke:
              this.stroke && this.stroke.toObject
                ? this.stroke.toObject()
                : this.stroke,
            strokeWidth: toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
            strokeDashArray: this.strokeDashArray
              ? this.strokeDashArray.concat()
              : this.strokeDashArray,
            strokeLineCap: this.strokeLineCap,
            strokeDashOffset: this.strokeDashOffset,
            strokeLineJoin: this.strokeLineJoin,
            strokeUniform: this.strokeUniform,
            strokeMiterLimit: toFixed(
              this.strokeMiterLimit,
              NUM_FRACTION_DIGITS
            ),
            scaleX: toFixed(this.scaleX, NUM_FRACTION_DIGITS),
            scaleY: toFixed(this.scaleY, NUM_FRACTION_DIGITS),
            angle: toFixed(this.angle, NUM_FRACTION_DIGITS),
            flipX: this.flipX,
            flipY: this.flipY,
            opacity: toFixed(this.opacity, NUM_FRACTION_DIGITS),
            shadow:
              this.shadow && this.shadow.toObject
                ? this.shadow.toObject()
                : this.shadow,
            visible: this.visible,
            backgroundColor: this.backgroundColor,
            fillRule: this.fillRule,
            paintFirst: this.paintFirst,
            globalCompositeOperation: this.globalCompositeOperation,
            skewX: toFixed(this.skewX, NUM_FRACTION_DIGITS),
            skewY: toFixed(this.skewY, NUM_FRACTION_DIGITS)
          };

        if (this.clipPath) {
          object.clipPath = this.clipPath.toObject(propertiesToInclude);
          object.clipPath.inverted = this.clipPath.inverted;
          object.clipPath.absolutePositioned = this.clipPath.absolutePositioned;
        }

        fabric.util.populateWithProperties(this, object, propertiesToInclude);
        if (!this.includeDefaultValues) {
          object = this._removeDefaultValues(object);
        }

        return object;
      },

      /**
       * Returns (dataless) object representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} Object representation of an instance
       */
      toDatalessObject: function(propertiesToInclude) {
        // will be overwritten by subclasses
        return this.toObject(propertiesToInclude);
      },

      /**
       * @private
       * @param {Object} object
       */
      _removeDefaultValues: function(object) {
        var prototype = fabric.util.getKlass(object.type).prototype,
          stateProperties = prototype.stateProperties;
        stateProperties.forEach(function(prop) {
          if (prop === 'left' || prop === 'top') {
            return;
          }
          if (object[prop] === prototype[prop]) {
            delete object[prop];
          }
          var isArray =
            Object.prototype.toString.call(object[prop]) === '[object Array]' &&
            Object.prototype.toString.call(prototype[prop]) ===
              '[object Array]';

          // basically a check for [] === []
          if (
            isArray &&
            object[prop].length === 0 &&
            prototype[prop].length === 0
          ) {
            delete object[prop];
          }
        });

        return object;
      },

      /**
       * Returns a string representation of an instance
       * @return {String}
       */
      toString: function() {
        return '#<fabric.' + capitalize(this.type) + '>';
      },

      /**
       * Return the object scale factor counting also the group scaling
       * @return {Object} object with scaleX and scaleY properties
       */
      getObjectScaling: function() {
        var options = fabric.util.qrDecompose(this.calcTransformMatrix());
        return {
          scaleX: Math.abs(options.scaleX),
          scaleY: Math.abs(options.scaleY)
        };
      },

      /**
       * Return the object scale factor counting also the group scaling, zoom and retina
       * @return {Object} object with scaleX and scaleY properties
       */
      getTotalObjectScaling: function() {
        var scale = this.getObjectScaling(),
          scaleX = scale.scaleX,
          scaleY = scale.scaleY;
        if (this.canvas) {
          var zoom = this.canvas.getZoom();
          var retina = this.canvas.getRetinaScaling();
          scaleX *= zoom * retina;
          scaleY *= zoom * retina;
        }
        return { scaleX: scaleX, scaleY: scaleY };
      },

      /**
       * Return the object opacity counting also the group property
       * @return {Number}
       */
      getObjectOpacity: function() {
        var opacity = this.opacity;
        if (this.group) {
          opacity *= this.group.getObjectOpacity();
        }
        return opacity;
      },

      /**
       * @private
       * @param {String} key
       * @param {*} value
       * @return {fabric.Object} thisArg
       */
      _set: function(key, value) {
        var shouldConstrainValue = key === 'scaleX' || key === 'scaleY',
          isChanged = this[key] !== value,
          groupNeedsUpdate = false;

        if (shouldConstrainValue) {
          value = this._constrainScale(value);
        }
        if (key === 'scaleX' && value < 0) {
          this.flipX = !this.flipX;
          value *= -1;
        } else if (key === 'scaleY' && value < 0) {
          this.flipY = !this.flipY;
          value *= -1;
        } else if (
          key === 'shadow' &&
          value &&
          !(value instanceof fabric.Shadow)
        ) {
          value = new fabric.Shadow(value);
        } else if (key === 'dirty' && this.group) {
          this.group.set('dirty', value);
        }

        this[key] = value;

        if (isChanged) {
          groupNeedsUpdate = this.group && this.group.isOnACache();
          if (this.cacheProperties.indexOf(key) > -1) {
            this.dirty = true;
            groupNeedsUpdate && this.group.set('dirty', true);
          } else if (
            groupNeedsUpdate &&
            this.stateProperties.indexOf(key) > -1
          ) {
            this.group.set('dirty', true);
          }
        }
        return this;
      },

      /**
       * This callback function is called by the parent group of an object every
       * time a non-delegated property changes on the group. It is passed the key
       * and value as parameters. Not adding in this function's signature to avoid
       * Travis build error about unused variables.
       */
      setOnGroup: function() {
        // implemented by sub-classes, as needed.
      },

      /**
       * Retrieves viewportTransform from Object's canvas if possible
       * @method getViewportTransform
       * @memberOf fabric.Object.prototype
       * @return {Array}
       */
      getViewportTransform: function() {
        if (this.canvas && this.canvas.viewportTransform) {
          return this.canvas.viewportTransform;
        }
        return fabric.iMatrix.concat();
      },

      /*
       * @private
       * return if the object would be visible in rendering
       * @memberOf fabric.Object.prototype
       * @return {Boolean}
       */
      isNotVisible: function() {
        return (
          this.opacity === 0 ||
          (!this.width && !this.height && this.strokeWidth === 0) ||
          !this.visible
        );
      },

      /**
       * Renders an object on a specified context
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      render: function(ctx) {
        // do not render if width/height are zeros or object is not visible
        if (this.isNotVisible()) {
          return;
        }
        if (
          this.canvas &&
          this.canvas.skipOffscreen &&
          !this.group &&
          !this.isOnScreen()
        ) {
          return;
        }
        ctx.save();
        this._setupCompositeOperation(ctx);
        this.drawSelectionBackground(ctx);
        this.transform(ctx);
        this._setOpacity(ctx);
        this._setShadow(ctx, this);
        if (this.shouldCache()) {
          this.renderCache();
          this.drawCacheOnCanvas(ctx);
        } else {
          this._removeCacheCanvas();
          this.dirty = false;
          this.drawObject(ctx);
          if (this.objectCaching && this.statefullCache) {
            this.saveState({ propertySet: 'cacheProperties' });
          }
        }
        ctx.restore();
      },

      renderCache: function(options) {
        options = options || {};
        if (!this._cacheCanvas) {
          this._createCacheCanvas();
        }
        if (this.isCacheDirty()) {
          this.statefullCache &&
            this.saveState({ propertySet: 'cacheProperties' });
          this.drawObject(this._cacheContext, options.forClipping);
          this.dirty = false;
        }
      },

      /**
       * Remove cacheCanvas and its dimensions from the objects
       */
      _removeCacheCanvas: function() {
        this._cacheCanvas = null;
        this.cacheWidth = 0;
        this.cacheHeight = 0;
      },

      /**
       * return true if the object will draw a stroke
       * Does not consider text styles. This is just a shortcut used at rendering time
       * We want it to be an approximation and be fast.
       * wrote to avoid extra caching, it has to return true when stroke happens,
       * can guess when it will not happen at 100% chance, does not matter if it misses
       * some use case where the stroke is invisible.
       * @since 3.0.0
       * @returns Boolean
       */
      hasStroke: function() {
        return (
          this.stroke && this.stroke !== 'transparent' && this.strokeWidth !== 0
        );
      },

      /**
       * return true if the object will draw a fill
       * Does not consider text styles. This is just a shortcut used at rendering time
       * We want it to be an approximation and be fast.
       * wrote to avoid extra caching, it has to return true when fill happens,
       * can guess when it will not happen at 100% chance, does not matter if it misses
       * some use case where the fill is invisible.
       * @since 3.0.0
       * @returns Boolean
       */
      hasFill: function() {
        return this.fill && this.fill !== 'transparent';
      },

      /**
       * When set to `true`, force the object to have its own cache, even if it is inside a group
       * it may be needed when your object behave in a particular way on the cache and always needs
       * its own isolated canvas to render correctly.
       * Created to be overridden
       * since 1.7.12
       * @returns Boolean
       */
      needsItsOwnCache: function() {
        if (
          this.paintFirst === 'stroke' &&
          this.hasFill() &&
          this.hasStroke() &&
          typeof this.shadow === 'object'
        ) {
          return true;
        }
        if (this.clipPath) {
          return true;
        }
        return false;
      },

      /**
       * Decide if the object should cache or not. Create its own cache level
       * objectCaching is a global flag, wins over everything
       * needsItsOwnCache should be used when the object drawing method requires
       * a cache step. None of the fabric classes requires it.
       * Generally you do not cache objects in groups because the group outside is cached.
       * Read as: cache if is needed, or if the feature is enabled but we are not already caching.
       * @return {Boolean}
       */
      shouldCache: function() {
        this.ownCaching =
          this.needsItsOwnCache() ||
          (this.objectCaching && (!this.group || !this.group.isOnACache()));
        return this.ownCaching;
      },

      /**
       * Check if this object or a child object will cast a shadow
       * used by Group.shouldCache to know if child has a shadow recursively
       * @return {Boolean}
       */
      willDrawShadow: function() {
        return (
          !!this.shadow &&
          (this.shadow.offsetX !== 0 || this.shadow.offsetY !== 0)
        );
      },

      /**
       * Execute the drawing operation for an object clipPath
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawClipPathOnCache: function(ctx) {
        var path = this.clipPath;
        ctx.save();
        // DEBUG: uncomment this line, comment the following
        // ctx.globalAlpha = 0.4
        if (path.inverted) {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'destination-in';
        }
        //ctx.scale(1 / 2, 1 / 2);
        if (path.absolutePositioned) {
          var m = fabric.util.invertTransform(this.calcTransformMatrix());
          ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        }
        path.transform(ctx);
        ctx.scale(1 / path.zoomX, 1 / path.zoomY);
        ctx.drawImage(
          path._cacheCanvas,
          -path.cacheTranslationX,
          -path.cacheTranslationY
        );
        ctx.restore();
      },

      /**
       * Execute the drawing operation for an object on a specified context
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawObject: function(ctx, forClipping) {
        var originalFill = this.fill,
          originalStroke = this.stroke;
        if (forClipping) {
          this.fill = 'black';
          this.stroke = '';
          this._setClippingProperties(ctx);
        } else {
          this._renderBackground(ctx);
        }
        this._render(ctx);
        this._drawClipPath(ctx);
        this.fill = originalFill;
        this.stroke = originalStroke;
      },

      _drawClipPath: function(ctx) {
        var path = this.clipPath;
        if (!path) {
          return;
        }
        // needed to setup a couple of variables
        // path canvas gets overridden with this one.
        // TODO find a better solution?
        path.canvas = this.canvas;
        path.shouldCache();
        path._transformDone = true;
        path.renderCache({ forClipping: true });
        this.drawClipPathOnCache(ctx);
      },

      /**
       * Paint the cached copy of the object on the target context.
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawCacheOnCanvas: function(ctx) {
        ctx.scale(1 / this.zoomX, 1 / this.zoomY);
        ctx.drawImage(
          this._cacheCanvas,
          -this.cacheTranslationX,
          -this.cacheTranslationY
        );
      },

      /**
       * Check if cache is dirty
       * @param {Boolean} skipCanvas skip canvas checks because this object is painted
       * on parent canvas.
       */
      isCacheDirty: function(skipCanvas) {
        if (this.isNotVisible()) {
          return false;
        }
        if (this._cacheCanvas && !skipCanvas && this._updateCacheCanvas()) {
          // in this case the context is already cleared.
          return true;
        } else {
          if (
            this.dirty ||
            (this.clipPath && this.clipPath.absolutePositioned) ||
            (this.statefullCache && this.hasStateChanged('cacheProperties'))
          ) {
            if (this._cacheCanvas && !skipCanvas) {
              var width = this.cacheWidth / this.zoomX;
              var height = this.cacheHeight / this.zoomY;
              this._cacheContext.clearRect(
                -width / 2,
                -height / 2,
                width,
                height
              );
            }
            return true;
          }
        }
        return false;
      },

      /**
       * Draws a background for the object big as its untransformed dimensions
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderBackground: function(ctx) {
        if (!this.backgroundColor) {
          return;
        }
        var dim = this._getNonTransformedDimensions();
        ctx.fillStyle = this.backgroundColor;

        ctx.fillRect(-dim.x / 2, -dim.y / 2, dim.x, dim.y);
        // if there is background color no other shadows
        // should be casted
        this._removeShadow(ctx);
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _setOpacity: function(ctx) {
        if (this.group && !this.group._transformDone) {
          ctx.globalAlpha = this.getObjectOpacity();
        } else {
          ctx.globalAlpha *= this.opacity;
        }
      },

      _setStrokeStyles: function(ctx, decl) {
        var stroke = decl.stroke;
        if (stroke) {
          ctx.lineWidth = decl.strokeWidth;
          ctx.lineCap = decl.strokeLineCap;
          ctx.lineDashOffset = decl.strokeDashOffset;
          ctx.lineJoin = decl.strokeLineJoin;
          ctx.miterLimit = decl.strokeMiterLimit;
          if (stroke.toLive) {
            if (
              stroke.gradientUnits === 'percentage' ||
              stroke.gradientTrasnform ||
              stroke.patternTransform
            ) {
              // need to transform gradient in a pattern.
              // this is a slow process. If you are hitting this codepath, and the object
              // is not using caching, you should consider switching it on.
              // we need a canvas as big as the current object caching canvas.
              this._applyPatternForTransformedGradient(ctx, stroke);
            } else {
              // is a simple gradient or pattern
              ctx.strokeStyle = stroke.toLive(ctx, this);
              this._applyPatternGradientTransform(ctx, stroke);
            }
          } else {
            // is a color
            ctx.strokeStyle = decl.stroke;
          }
        }
      },

      _setFillStyles: function(ctx, decl) {
        var fill = decl.fill;
        if (fill) {
          if (fill.toLive) {
            ctx.fillStyle = fill.toLive(ctx, this);
            this._applyPatternGradientTransform(ctx, decl.fill);
          } else {
            ctx.fillStyle = fill;
          }
        }
      },

      _setClippingProperties: function(ctx) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'transparent';
        ctx.fillStyle = '#000000';
      },

      /**
       * @private
       * Sets line dash
       * @param {CanvasRenderingContext2D} ctx Context to set the dash line on
       * @param {Array} dashArray array representing dashes
       * @param {Function} alternative function to call if browser does not support lineDash
       */
      _setLineDash: function(ctx, dashArray, alternative) {
        if (!dashArray || dashArray.length === 0) {
          return;
        }
        // Spec requires the concatenation of two copies the dash list when the number of elements is odd
        if (1 & dashArray.length) {
          dashArray.push.apply(dashArray, dashArray);
        }
        if (supportsLineDash) {
          ctx.setLineDash(dashArray);
        } else {
          alternative && alternative(ctx);
        }
      },

      /**
       * Renders controls and borders for the object
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {Object} [styleOverride] properties to override the object style
       */
      _renderControls: function(ctx, styleOverride) {
        var vpt = this.getViewportTransform(),
          matrix = this.calcTransformMatrix(),
          options,
          drawBorders,
          drawControls;
        styleOverride = styleOverride || {};
        drawBorders =
          typeof styleOverride.hasBorders !== 'undefined'
            ? styleOverride.hasBorders
            : this.hasBorders;
        drawControls =
          typeof styleOverride.hasControls !== 'undefined'
            ? styleOverride.hasControls
            : this.hasControls;
        matrix = fabric.util.multiplyTransformMatrices(vpt, matrix);
        options = fabric.util.qrDecompose(matrix);
        ctx.save();
        ctx.translate(options.translateX, options.translateY);
        ctx.lineWidth = 1 * this.borderScaleFactor;
        if (!this.group) {
          ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
        }
        if (styleOverride.forActiveSelection) {
          ctx.rotate(degreesToRadians(options.angle));
          drawBorders && this.drawBordersInGroup(ctx, options, styleOverride);
        } else {
          ctx.rotate(degreesToRadians(this.angle));
          drawBorders && this.drawBorders(ctx, styleOverride);
        }
        drawControls && this.drawControls(ctx, styleOverride);
        ctx.restore();
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _setShadow: function(ctx) {
        if (!this.shadow) {
          return;
        }

        var shadow = this.shadow,
          canvas = this.canvas,
          scaling,
          multX = (canvas && canvas.viewportTransform[0]) || 1,
          multY = (canvas && canvas.viewportTransform[3]) || 1;
        if (shadow.nonScaling) {
          scaling = { scaleX: 1, scaleY: 1 };
        } else {
          scaling = this.getObjectScaling();
        }
        if (canvas && canvas._isRetinaScaling()) {
          multX *= fabric.devicePixelRatio;
          multY *= fabric.devicePixelRatio;
        }
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur =
          (shadow.blur *
            fabric.browserShadowBlurConstant *
            (multX + multY) *
            (scaling.scaleX + scaling.scaleY)) /
          4;
        ctx.shadowOffsetX = shadow.offsetX * multX * scaling.scaleX;
        ctx.shadowOffsetY = shadow.offsetY * multY * scaling.scaleY;
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _removeShadow: function(ctx) {
        if (!this.shadow) {
          return;
        }

        ctx.shadowColor = '';
        ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {Object} filler fabric.Pattern or fabric.Gradient
       * @return {Object} offset.offsetX offset for text rendering
       * @return {Object} offset.offsetY offset for text rendering
       */
      _applyPatternGradientTransform: function(ctx, filler) {
        if (!filler || !filler.toLive) {
          return { offsetX: 0, offsetY: 0 };
        }
        var t = filler.gradientTransform || filler.patternTransform;
        var offsetX = -this.width / 2 + filler.offsetX || 0,
          offsetY = -this.height / 2 + filler.offsetY || 0;

        if (filler.gradientUnits === 'percentage') {
          ctx.transform(this.width, 0, 0, this.height, offsetX, offsetY);
        } else {
          ctx.transform(1, 0, 0, 1, offsetX, offsetY);
        }
        if (t) {
          ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
        }
        return { offsetX: offsetX, offsetY: offsetY };
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderPaintInOrder: function(ctx) {
        if (this.paintFirst === 'stroke') {
          this._renderStroke(ctx);
          this._renderFill(ctx);
        } else {
          this._renderFill(ctx);
          this._renderStroke(ctx);
        }
      },

      /**
       * @private
       * function that actually render something on the context.
       * empty here to allow Obects to work on tests to benchmark fabric functionalites
       * not related to rendering
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _render: function(/* ctx */) {},

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderFill: function(ctx) {
        if (!this.fill) {
          return;
        }

        ctx.save();
        this._setFillStyles(ctx, this);
        if (this.fillRule === 'evenodd') {
          ctx.fill('evenodd');
        } else {
          ctx.fill();
        }
        ctx.restore();
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderStroke: function(ctx) {
        if (!this.stroke || this.strokeWidth === 0) {
          return;
        }

        if (this.shadow && !this.shadow.affectStroke) {
          this._removeShadow(ctx);
        }

        ctx.save();
        if (this.strokeUniform && this.group) {
          var scaling = this.getObjectScaling();
          ctx.scale(1 / scaling.scaleX, 1 / scaling.scaleY);
        } else if (this.strokeUniform) {
          ctx.scale(1 / this.scaleX, 1 / this.scaleY);
        }
        this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke);
        this._setStrokeStyles(ctx, this);
        ctx.stroke();
        ctx.restore();
      },

      /**
       * This function try to patch the missing gradientTransform on canvas gradients.
       * transforming a context to transform the gradient, is going to transform the stroke too.
       * we want to transform the gradient but not the stroke operation, so we create
       * a transformed gradient on a pattern and then we use the pattern instead of the gradient.
       * this method has drwabacks: is slow, is in low resolution, needs a patch for when the size
       * is limited.
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {fabric.Gradient} filler a fabric gradient instance
       */
      _applyPatternForTransformedGradient: function(ctx, filler) {
        var dims = this._limitCacheSize(this._getCacheCanvasDimensions()),
          pCanvas = fabric.util.createCanvasElement(),
          pCtx,
          retinaScaling = this.canvas.getRetinaScaling(),
          width = dims.x / this.scaleX / retinaScaling,
          height = dims.y / this.scaleY / retinaScaling;
        pCanvas.width = width;
        pCanvas.height = height;
        pCtx = pCanvas.getContext('2d');
        pCtx.beginPath();
        pCtx.moveTo(0, 0);
        pCtx.lineTo(width, 0);
        pCtx.lineTo(width, height);
        pCtx.lineTo(0, height);
        pCtx.closePath();
        pCtx.translate(width / 2, height / 2);
        pCtx.scale(
          dims.zoomX / this.scaleX / retinaScaling,
          dims.zoomY / this.scaleY / retinaScaling
        );
        this._applyPatternGradientTransform(pCtx, filler);
        pCtx.fillStyle = filler.toLive(ctx);
        pCtx.fill();
        ctx.translate(
          -this.width / 2 - this.strokeWidth / 2,
          -this.height / 2 - this.strokeWidth / 2
        );
        ctx.scale(
          (retinaScaling * this.scaleX) / dims.zoomX,
          (retinaScaling * this.scaleY) / dims.zoomY
        );
        ctx.strokeStyle = pCtx.createPattern(pCanvas, 'no-repeat');
      },

      /**
       * This function is an helper for svg import. it returns the center of the object in the svg
       * untransformed coordinates
       * @private
       * @return {Object} center point from element coordinates
       */
      _findCenterFromElement: function() {
        return { x: this.left + this.width / 2, y: this.top + this.height / 2 };
      },

      /**
       * This function is an helper for svg import. it decompose the transformMatrix
       * and assign properties to object.
       * untransformed coordinates
       * @private
       * @chainable
       */
      _assignTransformMatrixProps: function() {
        if (this.transformMatrix) {
          var options = fabric.util.qrDecompose(this.transformMatrix);
          this.flipX = false;
          this.flipY = false;
          this.set('scaleX', options.scaleX);
          this.set('scaleY', options.scaleY);
          this.angle = options.angle;
          this.skewX = options.skewX;
          this.skewY = 0;
        }
      },

      /**
       * This function is an helper for svg import. it removes the transform matrix
       * and set to object properties that fabricjs can handle
       * @private
       * @param {Object} preserveAspectRatioOptions
       * @return {thisArg}
       */
      _removeTransformMatrix: function(preserveAspectRatioOptions) {
        var center = this._findCenterFromElement();
        if (this.transformMatrix) {
          this._assignTransformMatrixProps();
          center = fabric.util.transformPoint(center, this.transformMatrix);
        }
        this.transformMatrix = null;
        if (preserveAspectRatioOptions) {
          this.scaleX *= preserveAspectRatioOptions.scaleX;
          this.scaleY *= preserveAspectRatioOptions.scaleY;
          this.cropX = preserveAspectRatioOptions.cropX;
          this.cropY = preserveAspectRatioOptions.cropY;
          center.x += preserveAspectRatioOptions.offsetLeft;
          center.y += preserveAspectRatioOptions.offsetTop;
          this.width = preserveAspectRatioOptions.width;
          this.height = preserveAspectRatioOptions.height;
        }
        this.setPositionByOrigin(center, 'center', 'center');
      },

      /**
       * Clones an instance, using a callback method will work for every object.
       * @param {Function} callback Callback is invoked with a clone as a first argument
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       */
      clone: function(callback, propertiesToInclude) {
        var objectForm = this.toObject(propertiesToInclude);
        if (this.constructor.fromObject) {
          this.constructor.fromObject(objectForm, callback);
        } else {
          fabric.Object._fromObject('Object', objectForm, callback);
        }
      },

      /**
       * Creates an instance of fabric.Image out of an object
       * makes use of toCanvasElement.
       * Once this method was based on toDataUrl and loadImage, so it also had a quality
       * and format option. toCanvasElement is faster and produce no loss of quality.
       * If you need to get a real Jpeg or Png from an object, using toDataURL is the right way to do it.
       * toCanvasElement and then toBlob from the obtained canvas is also a good option.
       * This method is sync now, but still support the callback because we did not want to break.
       * When fabricJS 5.0 will be planned, this will probably be changed to not have a callback.
       * @param {Function} callback callback, invoked with an instance as a first argument
       * @param {Object} [options] for clone as image, passed to toDataURL
       * @param {Number} [options.multiplier=1] Multiplier to scale by
       * @param {Number} [options.left] Cropping left offset. Introduced in v1.2.14
       * @param {Number} [options.top] Cropping top offset. Introduced in v1.2.14
       * @param {Number} [options.width] Cropping width. Introduced in v1.2.14
       * @param {Number} [options.height] Cropping height. Introduced in v1.2.14
       * @param {Boolean} [options.enableRetinaScaling] Enable retina scaling for clone image. Introduce in 1.6.4
       * @param {Boolean} [options.withoutTransform] Remove current object transform ( no scale , no angle, no flip, no skew ). Introduced in 2.3.4
       * @param {Boolean} [options.withoutShadow] Remove current object shadow. Introduced in 2.4.2
       * @return {fabric.Object} thisArg
       */
      cloneAsImage: function(callback, options) {
        var canvasEl = this.toCanvasElement(options);
        if (callback) {
          callback(new fabric.Image(canvasEl));
        }
        return this;
      },

      /**
       * Converts an object into a HTMLCanvas element
       * @param {Object} options Options object
       * @param {Number} [options.multiplier=1] Multiplier to scale by
       * @param {Number} [options.left] Cropping left offset. Introduced in v1.2.14
       * @param {Number} [options.top] Cropping top offset. Introduced in v1.2.14
       * @param {Number} [options.width] Cropping width. Introduced in v1.2.14
       * @param {Number} [options.height] Cropping height. Introduced in v1.2.14
       * @param {Boolean} [options.enableRetinaScaling] Enable retina scaling for clone image. Introduce in 1.6.4
       * @param {Boolean} [options.withoutTransform] Remove current object transform ( no scale , no angle, no flip, no skew ). Introduced in 2.3.4
       * @param {Boolean} [options.withoutShadow] Remove current object shadow. Introduced in 2.4.2
       * @return {HTMLCanvasElement} Returns DOM element <canvas> with the fabric.Object
       */
      toCanvasElement: function(options) {
        options || (options = {});

        var utils = fabric.util,
          origParams = utils.saveObjectTransform(this),
          originalGroup = this.group,
          originalShadow = this.shadow,
          abs = Math.abs,
          multiplier =
            (options.multiplier || 1) *
            (options.enableRetinaScaling ? fabric.devicePixelRatio : 1);
        delete this.group;
        if (options.withoutTransform) {
          utils.resetObjectTransform(this);
        }
        if (options.withoutShadow) {
          this.shadow = null;
        }

        var el = fabric.util.createCanvasElement(),
          // skip canvas zoom and calculate with setCoords now.
          boundingRect = this.getBoundingRect(true, true),
          shadow = this.shadow,
          scaling,
          shadowOffset = { x: 0, y: 0 },
          shadowBlur,
          width,
          height;

        if (shadow) {
          shadowBlur = shadow.blur;
          if (shadow.nonScaling) {
            scaling = { scaleX: 1, scaleY: 1 };
          } else {
            scaling = this.getObjectScaling();
          }
          // consider non scaling shadow.
          shadowOffset.x =
            2 *
            Math.round(abs(shadow.offsetX) + shadowBlur) *
            abs(scaling.scaleX);
          shadowOffset.y =
            2 *
            Math.round(abs(shadow.offsetY) + shadowBlur) *
            abs(scaling.scaleY);
        }
        width = boundingRect.width + shadowOffset.x;
        height = boundingRect.height + shadowOffset.y;
        // if the current width/height is not an integer
        // we need to make it so.
        el.width = Math.ceil(width);
        el.height = Math.ceil(height);
        var canvas = new fabric.StaticCanvas(el, {
          enableRetinaScaling: false,
          renderOnAddRemove: false,
          skipOffscreen: false
        });
        if (options.format === 'jpeg') {
          canvas.backgroundColor = '#fff';
        }
        this.setPositionByOrigin(
          new fabric.Point(canvas.width / 2, canvas.height / 2),
          'center',
          'center'
        );

        var originalCanvas = this.canvas;
        canvas.add(this);
        var canvasEl = canvas.toCanvasElement(multiplier || 1, options);
        this.shadow = originalShadow;
        this.set('canvas', originalCanvas);
        if (originalGroup) {
          this.group = originalGroup;
        }
        this.set(origParams).setCoords();
        // canvas.dispose will call image.dispose that will nullify the elements
        // since this canvas is a simple element for the process, we remove references
        // to objects in this way in order to avoid object trashing.
        canvas._objects = [];
        canvas.dispose();
        canvas = null;

        return canvasEl;
      },

      /**
       * Converts an object into a data-url-like string
       * @param {Object} options Options object
       * @param {String} [options.format=png] The format of the output image. Either "jpeg" or "png"
       * @param {Number} [options.quality=1] Quality level (0..1). Only used for jpeg.
       * @param {Number} [options.multiplier=1] Multiplier to scale by
       * @param {Number} [options.left] Cropping left offset. Introduced in v1.2.14
       * @param {Number} [options.top] Cropping top offset. Introduced in v1.2.14
       * @param {Number} [options.width] Cropping width. Introduced in v1.2.14
       * @param {Number} [options.height] Cropping height. Introduced in v1.2.14
       * @param {Boolean} [options.enableRetinaScaling] Enable retina scaling for clone image. Introduce in 1.6.4
       * @param {Boolean} [options.withoutTransform] Remove current object transform ( no scale , no angle, no flip, no skew ). Introduced in 2.3.4
       * @param {Boolean} [options.withoutShadow] Remove current object shadow. Introduced in 2.4.2
       * @return {String} Returns a data: URL containing a representation of the object in the format specified by options.format
       */
      toDataURL: function(options) {
        options || (options = {});
        return fabric.util.toDataURL(
          this.toCanvasElement(options),
          options.format || 'png',
          options.quality || 1
        );
      },

      /**
       * Returns true if specified type is identical to the type of an instance
       * @param {String} type Type to check against
       * @return {Boolean}
       */
      isType: function(type) {
        return this.type === type;
      },

      /**
       * Returns complexity of an instance
       * @return {Number} complexity of this instance (is 1 unless subclassed)
       */
      complexity: function() {
        return 1;
      },

      /**
       * Returns a JSON representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} JSON
       */
      toJSON: function(propertiesToInclude) {
        // delegate, not alias
        return this.toObject(propertiesToInclude);
      },

      /**
       * Sets "angle" of an instance with centered rotation
       * @param {Number} angle Angle value (in degrees)
       * @return {fabric.Object} thisArg
       * @chainable
       */
      rotate: function(angle) {
        var shouldCenterOrigin =
          (this.originX !== 'center' || this.originY !== 'center') &&
          this.centeredRotation;

        if (shouldCenterOrigin) {
          this._setOriginToCenter();
        }

        this.set('angle', angle);

        if (shouldCenterOrigin) {
          this._resetOrigin();
        }

        return this;
      },

      /**
       * Centers object horizontally on canvas to which it was added last.
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      centerH: function() {
        this.canvas && this.canvas.centerObjectH(this);
        return this;
      },

      /**
       * Centers object horizontally on current viewport of canvas to which it was added last.
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      viewportCenterH: function() {
        this.canvas && this.canvas.viewportCenterObjectH(this);
        return this;
      },

      /**
       * Centers object vertically on canvas to which it was added last.
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      centerV: function() {
        this.canvas && this.canvas.centerObjectV(this);
        return this;
      },

      /**
       * Centers object vertically on current viewport of canvas to which it was added last.
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      viewportCenterV: function() {
        this.canvas && this.canvas.viewportCenterObjectV(this);
        return this;
      },

      /**
       * Centers object vertically and horizontally on canvas to which is was added last
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      center: function() {
        this.canvas && this.canvas.centerObject(this);
        return this;
      },

      /**
       * Centers object on current viewport of canvas to which it was added last.
       * You might need to call `setCoords` on an object after centering, to update controls area.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      viewportCenter: function() {
        this.canvas && this.canvas.viewportCenterObject(this);
        return this;
      },

      /**
       * Returns coordinates of a pointer relative to an object
       * @param {Event} e Event to operate upon
       * @param {Object} [pointer] Pointer to operate upon (instead of event)
       * @return {Object} Coordinates of a pointer (x, y)
       */
      getLocalPointer: function(e, pointer) {
        pointer = pointer || this.canvas.getPointer(e);
        var pClicked = new fabric.Point(pointer.x, pointer.y),
          objectLeftTop = this._getLeftTopCoords();
        if (this.angle) {
          pClicked = fabric.util.rotatePoint(
            pClicked,
            objectLeftTop,
            degreesToRadians(-this.angle)
          );
        }
        return {
          x: pClicked.x - objectLeftTop.x,
          y: pClicked.y - objectLeftTop.y
        };
      },

      /**
       * Sets canvas globalCompositeOperation for specific object
       * custom composition operation for the particular object can be specified using globalCompositeOperation property
       * @param {CanvasRenderingContext2D} ctx Rendering canvas context
       */
      _setupCompositeOperation: function(ctx) {
        if (this.globalCompositeOperation) {
          ctx.globalCompositeOperation = this.globalCompositeOperation;
        }
      }
    }
  );

  fabric.util.createAccessors && fabric.util.createAccessors(fabric.Object);

  extend(fabric.Object.prototype, fabric.Observable);

  /**
   * Defines the number of fraction digits to use when serializing object values.
   * You can use it to increase/decrease precision of such values like left, top, scaleX, scaleY, etc.
   * @static
   * @memberOf fabric.Object
   * @constant
   * @type Number
   */
  fabric.Object.NUM_FRACTION_DIGITS = 2;

  fabric.Object._fromObject = function(
    className,
    object,
    callback,
    extraParam
  ) {
    var klass = fabric[className];
    object = clone(object, true);
    fabric.util.enlivenPatterns([object.fill, object.stroke], function(
      patterns
    ) {
      if (typeof patterns[0] !== 'undefined') {
        object.fill = patterns[0];
      }
      if (typeof patterns[1] !== 'undefined') {
        object.stroke = patterns[1];
      }
      fabric.util.enlivenObjects([object.clipPath], function(enlivedProps) {
        object.clipPath = enlivedProps[0];
        var instance = extraParam
          ? new klass(object[extraParam], object)
          : new klass(object);
        callback && callback(instance);
      });
    });
  };

  /**
   * Unique id used internally when creating SVG elements
   * @static
   * @memberOf fabric.Object
   * @type Number
   */
  fabric.Object.__uid = 0;
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  var degreesToRadians = fabric.util.degreesToRadians,
    originXOffset = {
      left: -0.5,
      center: 0,
      right: 0.5
    },
    originYOffset = {
      top: -0.5,
      center: 0,
      bottom: 0.5
    };

  fabric.util.object.extend(
    fabric.Object.prototype,
    /** @lends fabric.Object.prototype */ {
      /**
       * Translates the coordinates from a set of origin to another (based on the object's dimensions)
       * @param {fabric.Point} point The point which corresponds to the originX and originY params
       * @param {String} fromOriginX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} fromOriginY Vertical origin: 'top', 'center' or 'bottom'
       * @param {String} toOriginX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} toOriginY Vertical origin: 'top', 'center' or 'bottom'
       * @return {fabric.Point}
       */
      translateToGivenOrigin: function(
        point,
        fromOriginX,
        fromOriginY,
        toOriginX,
        toOriginY
      ) {
        var x = point.x,
          y = point.y,
          offsetX,
          offsetY,
          dim;

        if (typeof fromOriginX === 'string') {
          fromOriginX = originXOffset[fromOriginX];
        } else {
          fromOriginX -= 0.5;
        }

        if (typeof toOriginX === 'string') {
          toOriginX = originXOffset[toOriginX];
        } else {
          toOriginX -= 0.5;
        }

        offsetX = toOriginX - fromOriginX;

        if (typeof fromOriginY === 'string') {
          fromOriginY = originYOffset[fromOriginY];
        } else {
          fromOriginY -= 0.5;
        }

        if (typeof toOriginY === 'string') {
          toOriginY = originYOffset[toOriginY];
        } else {
          toOriginY -= 0.5;
        }

        offsetY = toOriginY - fromOriginY;

        if (offsetX || offsetY) {
          dim = this._getTransformedDimensions();
          x = point.x + offsetX * dim.x;
          y = point.y + offsetY * dim.y;
        }

        return new fabric.Point(x, y);
      },

      /**
       * Translates the coordinates from origin to center coordinates (based on the object's dimensions)
       * @param {fabric.Point} point The point which corresponds to the originX and originY params
       * @param {String} originX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} originY Vertical origin: 'top', 'center' or 'bottom'
       * @return {fabric.Point}
       */
      translateToCenterPoint: function(point, originX, originY) {
        var p = this.translateToGivenOrigin(
          point,
          originX,
          originY,
          'center',
          'center'
        );
        if (this.angle) {
          return fabric.util.rotatePoint(
            p,
            point,
            degreesToRadians(this.angle)
          );
        }
        return p;
      },

      /**
       * Translates the coordinates from center to origin coordinates (based on the object's dimensions)
       * @param {fabric.Point} center The point which corresponds to center of the object
       * @param {String} originX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} originY Vertical origin: 'top', 'center' or 'bottom'
       * @return {fabric.Point}
       */
      translateToOriginPoint: function(center, originX, originY) {
        var p = this.translateToGivenOrigin(
          center,
          'center',
          'center',
          originX,
          originY
        );
        if (this.angle) {
          return fabric.util.rotatePoint(
            p,
            center,
            degreesToRadians(this.angle)
          );
        }
        return p;
      },

      /**
       * Returns the real center coordinates of the object
       * @return {fabric.Point}
       */
      getCenterPoint: function() {
        var leftTop = new fabric.Point(this.left, this.top);
        return this.translateToCenterPoint(leftTop, this.originX, this.originY);
      },

      /**
       * Returns the coordinates of the object based on center coordinates
       * @param {fabric.Point} point The point which corresponds to the originX and originY params
       * @return {fabric.Point}
       */
      // getOriginPoint: function(center) {
      //   return this.translateToOriginPoint(center, this.originX, this.originY);
      // },

      /**
       * Returns the coordinates of the object as if it has a different origin
       * @param {String} originX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} originY Vertical origin: 'top', 'center' or 'bottom'
       * @return {fabric.Point}
       */
      getPointByOrigin: function(originX, originY) {
        var center = this.getCenterPoint();
        return this.translateToOriginPoint(center, originX, originY);
      },

      /**
       * Returns the point in local coordinates
       * @param {fabric.Point} point The point relative to the global coordinate system
       * @param {String} originX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} originY Vertical origin: 'top', 'center' or 'bottom'
       * @return {fabric.Point}
       */
      toLocalPoint: function(point, originX, originY) {
        var center = this.getCenterPoint(),
          p,
          p2;

        if (typeof originX !== 'undefined' && typeof originY !== 'undefined') {
          p = this.translateToGivenOrigin(
            center,
            'center',
            'center',
            originX,
            originY
          );
        } else {
          p = new fabric.Point(this.left, this.top);
        }

        p2 = new fabric.Point(point.x, point.y);
        if (this.angle) {
          p2 = fabric.util.rotatePoint(
            p2,
            center,
            -degreesToRadians(this.angle)
          );
        }
        return p2.subtractEquals(p);
      },

      /**
       * Returns the point in global coordinates
       * @param {fabric.Point} The point relative to the local coordinate system
       * @return {fabric.Point}
       */
      // toGlobalPoint: function(point) {
      //   return fabric.util.rotatePoint(point, this.getCenterPoint(), degreesToRadians(this.angle)).addEquals(new fabric.Point(this.left, this.top));
      // },

      /**
       * Sets the position of the object taking into consideration the object's origin
       * @param {fabric.Point} pos The new position of the object
       * @param {String} originX Horizontal origin: 'left', 'center' or 'right'
       * @param {String} originY Vertical origin: 'top', 'center' or 'bottom'
       * @return {void}
       */
      setPositionByOrigin: function(pos, originX, originY) {
        var center = this.translateToCenterPoint(pos, originX, originY),
          position = this.translateToOriginPoint(
            center,
            this.originX,
            this.originY
          );
        this.set('left', position.x);
        this.set('top', position.y);
      },

      /**
       * @param {String} to One of 'left', 'center', 'right'
       */
      adjustPosition: function(to) {
        var angle = degreesToRadians(this.angle),
          hypotFull = this.getScaledWidth(),
          xFull = fabric.util.cos(angle) * hypotFull,
          yFull = fabric.util.sin(angle) * hypotFull,
          offsetFrom,
          offsetTo;

        //TODO: this function does not consider mixed situation like top, center.
        if (typeof this.originX === 'string') {
          offsetFrom = originXOffset[this.originX];
        } else {
          offsetFrom = this.originX - 0.5;
        }
        if (typeof to === 'string') {
          offsetTo = originXOffset[to];
        } else {
          offsetTo = to - 0.5;
        }
        this.left += xFull * (offsetTo - offsetFrom);
        this.top += yFull * (offsetTo - offsetFrom);
        this.setCoords();
        this.originX = to;
      },

      /**
       * Sets the origin/position of the object to it's center point
       * @private
       * @return {void}
       */
      _setOriginToCenter: function() {
        this._originalOriginX = this.originX;
        this._originalOriginY = this.originY;

        var center = this.getCenterPoint();

        this.originX = 'center';
        this.originY = 'center';

        this.left = center.x;
        this.top = center.y;
      },

      /**
       * Resets the origin/position of the object to it's original origin
       * @private
       * @return {void}
       */
      _resetOrigin: function() {
        var originPoint = this.translateToOriginPoint(
          this.getCenterPoint(),
          this._originalOriginX,
          this._originalOriginY
        );

        this.originX = this._originalOriginX;
        this.originY = this._originalOriginY;

        this.left = originPoint.x;
        this.top = originPoint.y;

        this._originalOriginX = null;
        this._originalOriginY = null;
      },

      /**
       * @private
       */
      _getLeftTopCoords: function() {
        return this.translateToOriginPoint(
          this.getCenterPoint(),
          'left',
          'top'
        );
      }
    }
  );
})();
(function() {
  function arrayFromCoords(coords) {
    return [
      new fabric.Point(coords.tl.x, coords.tl.y),
      new fabric.Point(coords.tr.x, coords.tr.y),
      new fabric.Point(coords.br.x, coords.br.y),
      new fabric.Point(coords.bl.x, coords.bl.y)
    ];
  }

  var util = fabric.util,
    degreesToRadians = util.degreesToRadians,
    multiplyMatrices = util.multiplyTransformMatrices,
    transformPoint = util.transformPoint;

  util.object.extend(
    fabric.Object.prototype,
    /** @lends fabric.Object.prototype */ {
      /**
       * Describe object's corner position in canvas element coordinates.
       * properties are depending on control keys and padding the main controls.
       * each property is an object with x, y and corner.
       * The `corner` property contains in a similar manner the 4 points of the
       * interactive area of the corner.
       * The coordinates depends from the controls positionHandler and are used
       * to draw and locate controls
       * @memberOf fabric.Object.prototype
       */
      oCoords: null,

      /**
       * Describe object's corner position in canvas object absolute coordinates
       * properties are tl,tr,bl,br and describe the four main corner.
       * each property is an object with x, y, instance of Fabric.Point.
       * The coordinates depends from this properties: width, height, scaleX, scaleY
       * skewX, skewY, angle, strokeWidth, top, left.
       * Those coordinates are useful to understand where an object is. They get updated
       * with oCoords but they do not need to be updated when zoom or panning change.
       * The coordinates get updated with @method setCoords.
       * You can calculate them without updating with @method calcACoords();
       * @memberOf fabric.Object.prototype
       */
      aCoords: null,

      /**
       * Describe object's corner position in canvas element coordinates.
       * includes padding. Used of object detection.
       * set and refreshed with setCoords and calcCoords.
       * @memberOf fabric.Object.prototype
       */
      lineCoords: null,

      /**
       * storage for object transform matrix
       */
      ownMatrixCache: null,

      /**
       * storage for object full transform matrix
       */
      matrixCache: null,

      /**
       * custom controls interface
       * controls are added by default_controls.js
       */
      controls: {},

      /**
       * return correct set of coordinates for intersection
       * this will return either aCoords or lineCoords.
       * @param {Boolean} absolute will return aCoords if true or lineCoords
       * @return {Object} {tl, tr, br, bl} points
       */
      _getCoords: function(absolute, calculate) {
        if (calculate) {
          return absolute ? this.calcACoords() : this.calcLineCoords();
        }
        if (!this.aCoords || !this.lineCoords) {
          this.setCoords(true);
        }
        return absolute ? this.aCoords : this.lineCoords;
      },

      /**
       * return correct set of coordinates for intersection
       * this will return either aCoords or lineCoords.
       * The coords are returned in an array.
       * @return {Array} [tl, tr, br, bl] of points
       */
      getCoords: function(absolute, calculate) {
        return arrayFromCoords(this._getCoords(absolute, calculate));
      },

      /**
       * Checks if object intersects with an area formed by 2 points
       * @param {Object} pointTL top-left point of area
       * @param {Object} pointBR bottom-right point of area
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if object intersects with an area formed by 2 points
       */
      intersectsWithRect: function(pointTL, pointBR, absolute, calculate) {
        var coords = this.getCoords(absolute, calculate),
          intersection = fabric.Intersection.intersectPolygonRectangle(
            coords,
            pointTL,
            pointBR
          );
        return intersection.status === 'Intersection';
      },

      /**
       * Checks if object intersects with another object
       * @param {Object} other Object to test
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if object intersects with another object
       */
      intersectsWithObject: function(other, absolute, calculate) {
        var intersection = fabric.Intersection.intersectPolygonPolygon(
          this.getCoords(absolute, calculate),
          other.getCoords(absolute, calculate)
        );

        return (
          intersection.status === 'Intersection' ||
          other.isContainedWithinObject(this, absolute, calculate) ||
          this.isContainedWithinObject(other, absolute, calculate)
        );
      },

      /**
       * Checks if object is fully contained within area of another object
       * @param {Object} other Object to test
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if object is fully contained within area of another object
       */
      isContainedWithinObject: function(other, absolute, calculate) {
        var points = this.getCoords(absolute, calculate),
          otherCoords = absolute ? other.aCoords : other.lineCoords,
          i = 0,
          lines = other._getImageLines(otherCoords);
        for (; i < 4; i++) {
          if (!other.containsPoint(points[i], lines)) {
            return false;
          }
        }
        return true;
      },

      /**
       * Checks if object is fully contained within area formed by 2 points
       * @param {Object} pointTL top-left point of area
       * @param {Object} pointBR bottom-right point of area
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if object is fully contained within area formed by 2 points
       */
      isContainedWithinRect: function(pointTL, pointBR, absolute, calculate) {
        var boundingRect = this.getBoundingRect(absolute, calculate);

        return (
          boundingRect.left >= pointTL.x &&
          boundingRect.left + boundingRect.width <= pointBR.x &&
          boundingRect.top >= pointTL.y &&
          boundingRect.top + boundingRect.height <= pointBR.y
        );
      },

      /**
       * Checks if point is inside the object
       * @param {fabric.Point} point Point to check against
       * @param {Object} [lines] object returned from @method _getImageLines
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if point is inside the object
       */
      containsPoint: function(point, lines, absolute, calculate) {
        var coords = this._getCoords(absolute, calculate),
          lines = lines || this._getImageLines(coords),
          xPoints = this._findCrossPoints(point, lines);
        // if xPoints is odd then point is inside the object
        return xPoints !== 0 && xPoints % 2 === 1;
      },

      /**
       * Checks if object is contained within the canvas with current viewportTransform
       * the check is done stopping at first point that appears on screen
       * @param {Boolean} [calculate] use coordinates of current position instead of .aCoords
       * @return {Boolean} true if object is fully or partially contained within canvas
       */
      isOnScreen: function(calculate) {
        if (!this.canvas) {
          return false;
        }
        var pointTL = this.canvas.vptCoords.tl,
          pointBR = this.canvas.vptCoords.br;
        var points = this.getCoords(true, calculate);
        // if some point is on screen, the object is on screen.
        if (
          points.some(function(point) {
            return (
              point.x <= pointBR.x &&
              point.x >= pointTL.x &&
              point.y <= pointBR.y &&
              point.y >= pointTL.y
            );
          })
        ) {
          return true;
        }
        // no points on screen, check intersection with absolute coordinates
        if (this.intersectsWithRect(pointTL, pointBR, true, calculate)) {
          return true;
        }
        return this._containsCenterOfCanvas(pointTL, pointBR, calculate);
      },

      /**
       * Checks if the object contains the midpoint between canvas extremities
       * Does not make sense outside the context of isOnScreen and isPartiallyOnScreen
       * @private
       * @param {Fabric.Point} pointTL Top Left point
       * @param {Fabric.Point} pointBR Top Right point
       * @param {Boolean} calculate use coordinates of current position instead of .oCoords
       * @return {Boolean} true if the object contains the point
       */
      _containsCenterOfCanvas: function(pointTL, pointBR, calculate) {
        // worst case scenario the object is so big that contains the screen
        var centerPoint = {
          x: (pointTL.x + pointBR.x) / 2,
          y: (pointTL.y + pointBR.y) / 2
        };
        if (this.containsPoint(centerPoint, null, true, calculate)) {
          return true;
        }
        return false;
      },

      /**
       * Checks if object is partially contained within the canvas with current viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords
       * @return {Boolean} true if object is partially contained within canvas
       */
      isPartiallyOnScreen: function(calculate) {
        if (!this.canvas) {
          return false;
        }
        var pointTL = this.canvas.vptCoords.tl,
          pointBR = this.canvas.vptCoords.br;
        if (this.intersectsWithRect(pointTL, pointBR, true, calculate)) {
          return true;
        }
        var allPointsAreOutside = this.getCoords(true, calculate).every(
          function(point) {
            return (
              (point.x >= pointBR.x || point.x <= pointTL.x) &&
              (point.y >= pointBR.y || point.y <= pointTL.y)
            );
          }
        );
        return (
          allPointsAreOutside &&
          this._containsCenterOfCanvas(pointTL, pointBR, calculate)
        );
      },

      /**
       * Method that returns an object with the object edges in it, given the coordinates of the corners
       * @private
       * @param {Object} oCoords Coordinates of the object corners
       */
      _getImageLines: function(oCoords) {
        var lines = {
          topline: {
            o: oCoords.tl,
            d: oCoords.tr
          },
          rightline: {
            o: oCoords.tr,
            d: oCoords.br
          },
          bottomline: {
            o: oCoords.br,
            d: oCoords.bl
          },
          leftline: {
            o: oCoords.bl,
            d: oCoords.tl
          }
        };

        // // debugging
        // if (this.canvas.contextTop) {
        //   this.canvas.contextTop.fillRect(lines.bottomline.d.x, lines.bottomline.d.y, 2, 2);
        //   this.canvas.contextTop.fillRect(lines.bottomline.o.x, lines.bottomline.o.y, 2, 2);
        //
        //   this.canvas.contextTop.fillRect(lines.leftline.d.x, lines.leftline.d.y, 2, 2);
        //   this.canvas.contextTop.fillRect(lines.leftline.o.x, lines.leftline.o.y, 2, 2);
        //
        //   this.canvas.contextTop.fillRect(lines.topline.d.x, lines.topline.d.y, 2, 2);
        //   this.canvas.contextTop.fillRect(lines.topline.o.x, lines.topline.o.y, 2, 2);
        //
        //   this.canvas.contextTop.fillRect(lines.rightline.d.x, lines.rightline.d.y, 2, 2);
        //   this.canvas.contextTop.fillRect(lines.rightline.o.x, lines.rightline.o.y, 2, 2);
        // }

        return lines;
      },

      /**
       * Helper method to determine how many cross points are between the 4 object edges
       * and the horizontal line determined by a point on canvas
       * @private
       * @param {fabric.Point} point Point to check
       * @param {Object} lines Coordinates of the object being evaluated
       */
      // remove yi, not used but left code here just in case.
      _findCrossPoints: function(point, lines) {
        var b1,
          b2,
          a1,
          a2,
          xi, // yi,
          xcount = 0,
          iLine;

        for (var lineKey in lines) {
          iLine = lines[lineKey];
          // optimisation 1: line below point. no cross
          if (iLine.o.y < point.y && iLine.d.y < point.y) {
            continue;
          }
          // optimisation 2: line above point. no cross
          if (iLine.o.y >= point.y && iLine.d.y >= point.y) {
            continue;
          }
          // optimisation 3: vertical line case
          if (iLine.o.x === iLine.d.x && iLine.o.x >= point.x) {
            xi = iLine.o.x;
            // yi = point.y;
          }
          // calculate the intersection point
          else {
            b1 = 0;
            b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
            a1 = point.y - b1 * point.x;
            a2 = iLine.o.y - b2 * iLine.o.x;

            xi = -(a1 - a2) / (b1 - b2);
            // yi = a1 + b1 * xi;
          }
          // dont count xi < point.x cases
          if (xi >= point.x) {
            xcount += 1;
          }
          // optimisation 4: specific for square images
          if (xcount === 2) {
            break;
          }
        }
        return xcount;
      },

      /**
       * Returns coordinates of object's bounding rectangle (left, top, width, height)
       * the box is intended as aligned to axis of canvas.
       * @param {Boolean} [absolute] use coordinates without viewportTransform
       * @param {Boolean} [calculate] use coordinates of current position instead of .oCoords / .aCoords
       * @return {Object} Object with left, top, width, height properties
       */
      getBoundingRect: function(absolute, calculate) {
        var coords = this.getCoords(absolute, calculate);
        return util.makeBoundingBoxFromPoints(coords);
      },

      /**
       * Returns width of an object's bounding box counting transformations
       * before 2.0 it was named getWidth();
       * @return {Number} width value
       */
      getScaledWidth: function() {
        return this._getTransformedDimensions().x;
      },

      /**
       * Returns height of an object bounding box counting transformations
       * before 2.0 it was named getHeight();
       * @return {Number} height value
       */
      getScaledHeight: function() {
        return this._getTransformedDimensions().y;
      },

      /**
       * Makes sure the scale is valid and modifies it if necessary
       * @private
       * @param {Number} value
       * @return {Number}
       */
      _constrainScale: function(value) {
        if (Math.abs(value) < this.minScaleLimit) {
          if (value < 0) {
            return -this.minScaleLimit;
          } else {
            return this.minScaleLimit;
          }
        } else if (value === 0) {
          return 0.0001;
        }
        return value;
      },

      /**
       * Scales an object (equally by x and y)
       * @param {Number} value Scale factor
       * @return {fabric.Object} thisArg
       * @chainable
       */
      scale: function(value) {
        this._set('scaleX', value);
        this._set('scaleY', value);
        return this.setCoords();
      },

      /**
       * Scales an object to a given width, with respect to bounding box (scaling by x/y equally)
       * @param {Number} value New width value
       * @param {Boolean} absolute ignore viewport
       * @return {fabric.Object} thisArg
       * @chainable
       */
      scaleToWidth: function(value, absolute) {
        // adjust to bounding rect factor so that rotated shapes would fit as well
        var boundingRectFactor =
          this.getBoundingRect(absolute).width / this.getScaledWidth();
        return this.scale(value / this.width / boundingRectFactor);
      },

      /**
       * Scales an object to a given height, with respect to bounding box (scaling by x/y equally)
       * @param {Number} value New height value
       * @param {Boolean} absolute ignore viewport
       * @return {fabric.Object} thisArg
       * @chainable
       */
      scaleToHeight: function(value, absolute) {
        // adjust to bounding rect factor so that rotated shapes would fit as well
        var boundingRectFactor =
          this.getBoundingRect(absolute).height / this.getScaledHeight();
        return this.scale(value / this.height / boundingRectFactor);
      },

      /**
       * Calculates and returns the .coords of an object.
       * unused by the library, only for the end dev.
       * @return {Object} Object with tl, tr, br, bl ....
       * @chainable
       * @deprecated
       */
      calcCoords: function(absolute) {
        // this is a compatibility function to avoid removing calcCoords now.
        if (absolute) {
          return this.calcACoords();
        }
        return this.calcOCoords();
      },

      calcLineCoords: function() {
        var vpt = this.getViewportTransform(),
          padding = this.padding,
          angle = degreesToRadians(this.angle),
          cos = util.cos(angle),
          sin = util.sin(angle),
          cosP = cos * padding,
          sinP = sin * padding,
          cosPSinP = cosP + sinP,
          cosPMinusSinP = cosP - sinP,
          aCoords = this.calcACoords();

        var lineCoords = {
          tl: transformPoint(aCoords.tl, vpt),
          tr: transformPoint(aCoords.tr, vpt),
          bl: transformPoint(aCoords.bl, vpt),
          br: transformPoint(aCoords.br, vpt)
        };

        if (padding) {
          lineCoords.tl.x -= cosPMinusSinP;
          lineCoords.tl.y -= cosPSinP;
          lineCoords.tr.x += cosPSinP;
          lineCoords.tr.y -= cosPMinusSinP;
          lineCoords.bl.x -= cosPSinP;
          lineCoords.bl.y += cosPMinusSinP;
          lineCoords.br.x += cosPMinusSinP;
          lineCoords.br.y += cosPSinP;
        }

        return lineCoords;
      },

      calcOCoords: function() {
        var rotateMatrix = this._calcRotateMatrix(),
          translateMatrix = this._calcTranslateMatrix(),
          vpt = this.getViewportTransform(),
          startMatrix = multiplyMatrices(vpt, translateMatrix),
          finalMatrix = multiplyMatrices(startMatrix, rotateMatrix),
          finalMatrix = multiplyMatrices(finalMatrix, [
            1 / vpt[0],
            0,
            0,
            1 / vpt[3],
            0,
            0
          ]),
          dim = this._calculateCurrentDimensions(),
          coords = {};
        this.forEachControl(function(control, key, fabricObject) {
          coords[key] = control.positionHandler(dim, finalMatrix, fabricObject);
        });

        // debug code
        // var canvas = this.canvas;
        // setTimeout(function() {
        //   canvas.contextTop.clearRect(0, 0, 700, 700);
        //   canvas.contextTop.fillStyle = 'green';
        //   Object.keys(coords).forEach(function(key) {
        //     var control = coords[key];
        //     canvas.contextTop.fillRect(control.x, control.y, 3, 3);
        //   });
        // }, 50);
        return coords;
      },

      calcACoords: function() {
        var rotateMatrix = this._calcRotateMatrix(),
          translateMatrix = this._calcTranslateMatrix(),
          finalMatrix = multiplyMatrices(translateMatrix, rotateMatrix),
          dim = this._getTransformedDimensions(),
          w = dim.x / 2,
          h = dim.y / 2;
        return {
          // corners
          tl: transformPoint({ x: -w, y: -h }, finalMatrix),
          tr: transformPoint({ x: w, y: -h }, finalMatrix),
          bl: transformPoint({ x: -w, y: h }, finalMatrix),
          br: transformPoint({ x: w, y: h }, finalMatrix)
        };
      },

      /**
       * Sets corner and controls position coordinates based on current angle, width and height, left and top.
       * oCoords are used to find the corners
       * aCoords are used to quickly find an object on the canvas
       * lineCoords are used to quickly find object during pointer events.
       * See {@link https://github.com/kangax/fabric.js/wiki/When-to-call-setCoords|When-to-call-setCoords}
       * @param {Boolean} [skipCorners] skip calculation of oCoords.
       * @return {fabric.Object} thisArg
       * @chainable
       */
      setCoords: function(skipCorners) {
        this.aCoords = this.calcACoords();
        // in case we are in a group, for how the inner group target check works,
        // lineCoords are exactly aCoords. Since the vpt gets absorbed by the normalized pointer.
        this.lineCoords = this.group ? this.aCoords : this.calcLineCoords();
        if (skipCorners) {
          return this;
        }
        // set coordinates of the draggable boxes in the corners used to scale/rotate the image
        this.oCoords = this.calcOCoords();
        this._setCornerCoords && this._setCornerCoords();
        return this;
      },

      /**
       * calculate rotation matrix of an object
       * @return {Array} rotation matrix for the object
       */
      _calcRotateMatrix: function() {
        return util.calcRotateMatrix(this);
      },

      /**
       * calculate the translation matrix for an object transform
       * @return {Array} rotation matrix for the object
       */
      _calcTranslateMatrix: function() {
        var center = this.getCenterPoint();
        return [1, 0, 0, 1, center.x, center.y];
      },

      transformMatrixKey: function(skipGroup) {
        var sep = '_',
          prefix = '';
        if (!skipGroup && this.group) {
          prefix = this.group.transformMatrixKey(skipGroup) + sep;
        }
        return (
          prefix +
          this.top +
          sep +
          this.left +
          sep +
          this.scaleX +
          sep +
          this.scaleY +
          sep +
          this.skewX +
          sep +
          this.skewY +
          sep +
          this.angle +
          sep +
          this.originX +
          sep +
          this.originY +
          sep +
          this.width +
          sep +
          this.height +
          sep +
          this.strokeWidth +
          this.flipX +
          this.flipY
        );
      },

      /**
       * calculate transform matrix that represents the current transformations from the
       * object's properties.
       * @param {Boolean} [skipGroup] return transform matrix for object not counting parent transformations
       * There are some situation in which this is useful to avoid the fake rotation.
       * @return {Array} transform matrix for the object
       */
      calcTransformMatrix: function(skipGroup) {
        var matrix = this.calcOwnMatrix();
        if (skipGroup || !this.group) {
          return matrix;
        }
        var key = this.transformMatrixKey(skipGroup),
          cache = this.matrixCache || (this.matrixCache = {});
        if (cache.key === key) {
          return cache.value;
        }
        if (this.group) {
          matrix = multiplyMatrices(
            this.group.calcTransformMatrix(false),
            matrix
          );
        }
        cache.key = key;
        cache.value = matrix;
        return matrix;
      },

      /**
       * calculate transform matrix that represents the current transformations from the
       * object's properties, this matrix does not include the group transformation
       * @return {Array} transform matrix for the object
       */
      calcOwnMatrix: function() {
        var key = this.transformMatrixKey(true),
          cache = this.ownMatrixCache || (this.ownMatrixCache = {});
        if (cache.key === key) {
          return cache.value;
        }
        var tMatrix = this._calcTranslateMatrix(),
          options = {
            angle: this.angle,
            translateX: tMatrix[4],
            translateY: tMatrix[5],
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            skewX: this.skewX,
            skewY: this.skewY,
            flipX: this.flipX,
            flipY: this.flipY
          };
        cache.key = key;
        cache.value = util.composeMatrix(options);
        return cache.value;
      },

      /*
       * Calculate object dimensions from its properties
       * @private
       * @deprecated since 3.4.0, please use fabric.util._calcDimensionsTransformMatrix
       * not including or including flipX, flipY to emulate the flipping boolean
       * @return {Object} .x width dimension
       * @return {Object} .y height dimension
       */
      _calcDimensionsTransformMatrix: function(skewX, skewY, flipping) {
        return util.calcDimensionsMatrix({
          skewX: skewX,
          skewY: skewY,
          scaleX: this.scaleX * (flipping && this.flipX ? -1 : 1),
          scaleY: this.scaleY * (flipping && this.flipY ? -1 : 1)
        });
      },

      /*
       * Calculate object dimensions from its properties
       * @private
       * @return {Object} .x width dimension
       * @return {Object} .y height dimension
       */
      _getNonTransformedDimensions: function() {
        var strokeWidth = this.strokeWidth,
          w = this.width + strokeWidth,
          h = this.height + strokeWidth;
        return { x: w, y: h };
      },

      /*
       * Calculate object bounding box dimensions from its properties scale, skew.
       * @param {Number} skewX, a value to override current skewX
       * @param {Number} skewY, a value to override current skewY
       * @private
       * @return {Object} .x width dimension
       * @return {Object} .y height dimension
       */
      _getTransformedDimensions: function(skewX, skewY) {
        if (typeof skewX === 'undefined') {
          skewX = this.skewX;
        }
        if (typeof skewY === 'undefined') {
          skewY = this.skewY;
        }
        var dimensions = this._getNonTransformedDimensions(),
          dimX,
          dimY,
          noSkew = skewX === 0 && skewY === 0;

        if (this.strokeUniform) {
          dimX = this.width;
          dimY = this.height;
        } else {
          dimX = dimensions.x;
          dimY = dimensions.y;
        }
        if (noSkew) {
          return this._finalizeDimensions(
            dimX * this.scaleX,
            dimY * this.scaleY
          );
        }
        var bbox = util.sizeAfterTransform(dimX, dimY, {
          scaleX: this.scaleX,
          scaleY: this.scaleY,
          skewX: skewX,
          skewY: skewY
        });
        return this._finalizeDimensions(bbox.x, bbox.y);
      },

      /*
       * Calculate object bounding box dimensions from its properties scale, skew.
       * @param Number width width of the bbox
       * @param Number height height of the bbox
       * @private
       * @return {Object} .x finalized width dimension
       * @return {Object} .y finalized height dimension
       */
      _finalizeDimensions: function(width, height) {
        return this.strokeUniform
          ? { x: width + this.strokeWidth, y: height + this.strokeWidth }
          : { x: width, y: height };
      },

      /*
       * Calculate object dimensions for controls box, including padding and canvas zoom.
       * and active selection
       * private
       */
      _calculateCurrentDimensions: function() {
        var vpt = this.getViewportTransform(),
          dim = this._getTransformedDimensions(),
          p = transformPoint(dim, vpt, true);
        return p.scalarAdd(2 * this.padding);
      }
    }
  );
})();
fabric.util.object.extend(
  fabric.Object.prototype,
  /** @lends fabric.Object.prototype */ {
    /**
     * Moves an object to the bottom of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendToBack: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendToBack.call(this.group, this);
      } else if (this.canvas) {
        this.canvas.sendToBack(this);
      }
      return this;
    },

    /**
     * Moves an object to the top of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringToFront: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringToFront.call(this.group, this);
      } else if (this.canvas) {
        this.canvas.bringToFront(this);
      }
      return this;
    },

    /**
     * Moves an object down in stack of drawn objects
     * @param {Boolean} [intersecting] If `true`, send object behind next lower intersecting object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendBackwards: function(intersecting) {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendBackwards.call(
          this.group,
          this,
          intersecting
        );
      } else if (this.canvas) {
        this.canvas.sendBackwards(this, intersecting);
      }
      return this;
    },

    /**
     * Moves an object up in stack of drawn objects
     * @param {Boolean} [intersecting] If `true`, send object in front of next upper intersecting object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringForward: function(intersecting) {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringForward.call(
          this.group,
          this,
          intersecting
        );
      } else if (this.canvas) {
        this.canvas.bringForward(this, intersecting);
      }
      return this;
    },

    /**
     * Moves an object to specified level in stack of drawn objects
     * @param {Number} index New position of object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    moveTo: function(index) {
      if (this.group && this.group.type !== 'activeSelection') {
        fabric.StaticCanvas.prototype.moveTo.call(this.group, this, index);
      } else if (this.canvas) {
        this.canvas.moveTo(this, index);
      }
      return this;
    }
  }
);
/* _TO_SVG_START_ */
(function() {
  function getSvgColorString(prop, value) {
    if (!value) {
      return prop + ': none; ';
    } else if (value.toLive) {
      return prop + ': url(#SVGID_' + value.id + '); ';
    } else {
      var color = new fabric.Color(value),
        str = prop + ': ' + color.toRgb() + '; ',
        opacity = color.getAlpha();
      if (opacity !== 1) {
        //change the color in rgb + opacity
        str += prop + '-opacity: ' + opacity.toString() + '; ';
      }
      return str;
    }
  }

  var toFixed = fabric.util.toFixed;

  fabric.util.object.extend(
    fabric.Object.prototype,
    /** @lends fabric.Object.prototype */ {
      /**
       * Returns styles-string for svg-export
       * @param {Boolean} skipShadow a boolean to skip shadow filter output
       * @return {String}
       */
      getSvgStyles: function(skipShadow) {
        var fillRule = this.fillRule ? this.fillRule : 'nonzero',
          strokeWidth = this.strokeWidth ? this.strokeWidth : '0',
          strokeDashArray = this.strokeDashArray
            ? this.strokeDashArray.join(' ')
            : 'none',
          strokeDashOffset = this.strokeDashOffset
            ? this.strokeDashOffset
            : '0',
          strokeLineCap = this.strokeLineCap ? this.strokeLineCap : 'butt',
          strokeLineJoin = this.strokeLineJoin ? this.strokeLineJoin : 'miter',
          strokeMiterLimit = this.strokeMiterLimit
            ? this.strokeMiterLimit
            : '4',
          opacity = typeof this.opacity !== 'undefined' ? this.opacity : '1',
          visibility = this.visible ? '' : ' visibility: hidden;',
          filter = skipShadow ? '' : this.getSvgFilter(),
          fill = getSvgColorString('fill', this.fill),
          stroke = getSvgColorString('stroke', this.stroke);

        return [
          stroke,
          'stroke-width: ',
          strokeWidth,
          '; ',
          'stroke-dasharray: ',
          strokeDashArray,
          '; ',
          'stroke-linecap: ',
          strokeLineCap,
          '; ',
          'stroke-dashoffset: ',
          strokeDashOffset,
          '; ',
          'stroke-linejoin: ',
          strokeLineJoin,
          '; ',
          'stroke-miterlimit: ',
          strokeMiterLimit,
          '; ',
          fill,
          'fill-rule: ',
          fillRule,
          '; ',
          'opacity: ',
          opacity,
          ';',
          filter,
          visibility
        ].join('');
      },

      /**
       * Returns styles-string for svg-export
       * @param {Object} style the object from which to retrieve style properties
       * @param {Boolean} useWhiteSpace a boolean to include an additional attribute in the style.
       * @return {String}
       */
      getSvgSpanStyles: function(style, useWhiteSpace) {
        var term = '; ';
        var fontFamily = style.fontFamily
          ? 'font-family: ' +
            (style.fontFamily.indexOf("'") === -1 &&
            style.fontFamily.indexOf('"') === -1
              ? "'" + style.fontFamily + "'"
              : style.fontFamily) +
            term
          : '';
        var strokeWidth = style.strokeWidth
            ? 'stroke-width: ' + style.strokeWidth + term
            : '',
          fontFamily = fontFamily,
          fontSize = style.fontSize
            ? 'font-size: ' + style.fontSize + 'px' + term
            : '',
          fontStyle = style.fontStyle
            ? 'font-style: ' + style.fontStyle + term
            : '',
          fontWeight = style.fontWeight
            ? 'font-weight: ' + style.fontWeight + term
            : '',
          fill = style.fill ? getSvgColorString('fill', style.fill) : '',
          stroke = style.stroke
            ? getSvgColorString('stroke', style.stroke)
            : '',
          textDecoration = this.getSvgTextDecoration(style),
          deltaY = style.deltaY
            ? 'baseline-shift: ' + -style.deltaY + '; '
            : '';
        if (textDecoration) {
          textDecoration = 'text-decoration: ' + textDecoration + term;
        }

        return [
          stroke,
          strokeWidth,
          fontFamily,
          fontSize,
          fontStyle,
          fontWeight,
          textDecoration,
          fill,
          deltaY,
          useWhiteSpace ? 'white-space: pre; ' : ''
        ].join('');
      },

      /**
       * Returns text-decoration property for svg-export
       * @param {Object} style the object from which to retrieve style properties
       * @return {String}
       */
      getSvgTextDecoration: function(style) {
        return ['overline', 'underline', 'line-through']
          .filter(function(decoration) {
            return style[decoration.replace('-', '')];
          })
          .join(' ');
      },

      /**
       * Returns filter for svg shadow
       * @return {String}
       */
      getSvgFilter: function() {
        return this.shadow ? 'filter: url(#SVGID_' + this.shadow.id + ');' : '';
      },

      /**
       * Returns id attribute for svg output
       * @return {String}
       */
      getSvgCommons: function() {
        return [
          this.id ? 'id="' + this.id + '" ' : '',
          this.clipPath
            ? 'clip-path="url(#' + this.clipPath.clipPathId + ')" '
            : ''
        ].join('');
      },

      /**
       * Returns transform-string for svg-export
       * @param {Boolean} use the full transform or the single object one.
       * @return {String}
       */
      getSvgTransform: function(full, additionalTransform) {
        var transform = full
            ? this.calcTransformMatrix()
            : this.calcOwnMatrix(),
          svgTransform = 'transform="' + fabric.util.matrixToSVG(transform);
        return svgTransform + (additionalTransform || '') + '" ';
      },

      _setSVGBg: function(textBgRects) {
        if (this.backgroundColor) {
          var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;
          textBgRects.push(
            '\t\t<rect ',
            this._getFillAttributes(this.backgroundColor),
            ' x="',
            toFixed(-this.width / 2, NUM_FRACTION_DIGITS),
            '" y="',
            toFixed(-this.height / 2, NUM_FRACTION_DIGITS),
            '" width="',
            toFixed(this.width, NUM_FRACTION_DIGITS),
            '" height="',
            toFixed(this.height, NUM_FRACTION_DIGITS),
            '"></rect>\n'
          );
        }
      },

      /**
       * Returns svg representation of an instance
       * @param {Function} [reviver] Method for further parsing of svg representation.
       * @return {String} svg representation of an instance
       */
      toSVG: function(reviver) {
        return this._createBaseSVGMarkup(this._toSVG(reviver), {
          reviver: reviver
        });
      },

      /**
       * Returns svg clipPath representation of an instance
       * @param {Function} [reviver] Method for further parsing of svg representation.
       * @return {String} svg representation of an instance
       */
      toClipPathSVG: function(reviver) {
        return (
          '\t' +
          this._createBaseClipPathSVGMarkup(this._toSVG(reviver), {
            reviver: reviver
          })
        );
      },

      /**
       * @private
       */
      _createBaseClipPathSVGMarkup: function(objectMarkup, options) {
        options = options || {};
        var reviver = options.reviver,
          additionalTransform = options.additionalTransform || '',
          commonPieces = [
            this.getSvgTransform(true, additionalTransform),
            this.getSvgCommons()
          ].join(''),
          // insert commons in the markup, style and svgCommons
          index = objectMarkup.indexOf('COMMON_PARTS');
        objectMarkup[index] = commonPieces;
        return reviver ? reviver(objectMarkup.join('')) : objectMarkup.join('');
      },

      /**
       * @private
       */
      _createBaseSVGMarkup: function(objectMarkup, options) {
        options = options || {};
        var noStyle = options.noStyle,
          reviver = options.reviver,
          styleInfo = noStyle ? '' : 'style="' + this.getSvgStyles() + '" ',
          shadowInfo = options.withShadow
            ? 'style="' + this.getSvgFilter() + '" '
            : '',
          clipPath = this.clipPath,
          vectorEffect = this.strokeUniform
            ? 'vector-effect="non-scaling-stroke" '
            : '',
          absoluteClipPath = clipPath && clipPath.absolutePositioned,
          stroke = this.stroke,
          fill = this.fill,
          shadow = this.shadow,
          commonPieces,
          markup = [],
          clipPathMarkup,
          // insert commons in the markup, style and svgCommons
          index = objectMarkup.indexOf('COMMON_PARTS'),
          additionalTransform = options.additionalTransform;
        if (clipPath) {
          clipPath.clipPathId = 'CLIPPATH_' + fabric.Object.__uid++;
          clipPathMarkup =
            '<clipPath id="' +
            clipPath.clipPathId +
            '" >\n' +
            clipPath.toClipPathSVG(reviver) +
            '</clipPath>\n';
        }
        if (absoluteClipPath) {
          markup.push('<g ', shadowInfo, this.getSvgCommons(), ' >\n');
        }
        markup.push(
          '<g ',
          this.getSvgTransform(false),
          !absoluteClipPath ? shadowInfo + this.getSvgCommons() : '',
          ' >\n'
        );
        commonPieces = [
          styleInfo,
          vectorEffect,
          noStyle ? '' : this.addPaintOrder(),
          ' ',
          additionalTransform ? 'transform="' + additionalTransform + '" ' : ''
        ].join('');
        objectMarkup[index] = commonPieces;
        if (fill && fill.toLive) {
          markup.push(fill.toSVG(this));
        }
        if (stroke && stroke.toLive) {
          markup.push(stroke.toSVG(this));
        }
        if (shadow) {
          markup.push(shadow.toSVG(this));
        }
        if (clipPath) {
          markup.push(clipPathMarkup);
        }
        markup.push(objectMarkup.join(''));
        markup.push('</g>\n');
        absoluteClipPath && markup.push('</g>\n');
        return reviver ? reviver(markup.join('')) : markup.join('');
      },

      addPaintOrder: function() {
        return this.paintFirst !== 'fill'
          ? ' paint-order="' + this.paintFirst + '" '
          : '';
      }
    }
  );
})();
/* _TO_SVG_END_ */
(function() {
  var extend = fabric.util.object.extend,
    originalSet = 'stateProperties';

  /*
    Depends on `stateProperties`
  */
  function saveProps(origin, destination, props) {
    var tmpObj = {},
      deep = true;
    props.forEach(function(prop) {
      tmpObj[prop] = origin[prop];
    });

    extend(origin[destination], tmpObj, deep);
  }

  function _isEqual(origValue, currentValue, firstPass) {
    if (origValue === currentValue) {
      // if the objects are identical, return
      return true;
    } else if (Array.isArray(origValue)) {
      if (
        !Array.isArray(currentValue) ||
        origValue.length !== currentValue.length
      ) {
        return false;
      }
      for (var i = 0, len = origValue.length; i < len; i++) {
        if (!_isEqual(origValue[i], currentValue[i])) {
          return false;
        }
      }
      return true;
    } else if (origValue && typeof origValue === 'object') {
      var keys = Object.keys(origValue),
        key;
      if (
        !currentValue ||
        typeof currentValue !== 'object' ||
        (!firstPass && keys.length !== Object.keys(currentValue).length)
      ) {
        return false;
      }
      for (var i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        // since clipPath is in the statefull cache list and the clipPath objects
        // would be iterated as an object, this would lead to possible infinite recursion
        // we do not want to compare those.
        if (key === 'canvas' || key === 'group') {
          continue;
        }
        if (!_isEqual(origValue[key], currentValue[key])) {
          return false;
        }
      }
      return true;
    }
  }

  fabric.util.object.extend(
    fabric.Object.prototype,
    /** @lends fabric.Object.prototype */ {
      /**
       * Returns true if object state (one of its state properties) was changed
       * @param {String} [propertySet] optional name for the set of property we want to save
       * @return {Boolean} true if instance' state has changed since `{@link fabric.Object#saveState}` was called
       */
      hasStateChanged: function(propertySet) {
        propertySet = propertySet || originalSet;
        var dashedPropertySet = '_' + propertySet;
        if (
          Object.keys(this[dashedPropertySet]).length < this[propertySet].length
        ) {
          return true;
        }
        return !_isEqual(this[dashedPropertySet], this, true);
      },

      /**
       * Saves state of an object
       * @param {Object} [options] Object with additional `stateProperties` array to include when saving state
       * @return {fabric.Object} thisArg
       */
      saveState: function(options) {
        var propertySet = (options && options.propertySet) || originalSet,
          destination = '_' + propertySet;
        if (!this[destination]) {
          return this.setupState(options);
        }
        saveProps(this, destination, this[propertySet]);
        if (options && options.stateProperties) {
          saveProps(this, destination, options.stateProperties);
        }
        return this;
      },

      /**
       * Setups state of an object
       * @param {Object} [options] Object with additional `stateProperties` array to include when saving state
       * @return {fabric.Object} thisArg
       */
      setupState: function(options) {
        options = options || {};
        var propertySet = options.propertySet || originalSet;
        options.propertySet = propertySet;
        this['_' + propertySet] = {};
        this.saveState(options);
        return this;
      }
    }
  );
})();
(function() {
  var degreesToRadians = fabric.util.degreesToRadians;

  fabric.util.object.extend(
    fabric.Object.prototype,
    /** @lends fabric.Object.prototype */ {
      /**
       * Determines which corner has been clicked
       * @private
       * @param {Object} pointer The pointer indicating the mouse position
       * @return {String|Boolean} corner code (tl, tr, bl, br, etc.), or false if nothing is found
       */
      _findTargetCorner: function(pointer, forTouch) {
        // objects in group, anykind, are not self modificable,
        // must not return an hovered corner.
        if (
          !this.hasControls ||
          this.group ||
          !this.canvas ||
          this.canvas._activeObject !== this
        ) {
          return false;
        }

        var ex = pointer.x,
          ey = pointer.y,
          xPoints,
          lines,
          keys = Object.keys(this.oCoords),
          j = keys.length - 1,
          i;
        this.__corner = 0;

        // cycle in reverse order so we pick first the one on top
        for (; j >= 0; j--) {
          i = keys[j];
          if (!this.isControlVisible(i)) {
            continue;
          }

          lines = this._getImageLines(
            forTouch ? this.oCoords[i].touchCorner : this.oCoords[i].corner
          );
          // // debugging
          //
          // this.canvas.contextTop.fillRect(lines.bottomline.d.x, lines.bottomline.d.y, 2, 2);
          // this.canvas.contextTop.fillRect(lines.bottomline.o.x, lines.bottomline.o.y, 2, 2);
          //
          // this.canvas.contextTop.fillRect(lines.leftline.d.x, lines.leftline.d.y, 2, 2);
          // this.canvas.contextTop.fillRect(lines.leftline.o.x, lines.leftline.o.y, 2, 2);
          //
          // this.canvas.contextTop.fillRect(lines.topline.d.x, lines.topline.d.y, 2, 2);
          // this.canvas.contextTop.fillRect(lines.topline.o.x, lines.topline.o.y, 2, 2);
          //
          // this.canvas.contextTop.fillRect(lines.rightline.d.x, lines.rightline.d.y, 2, 2);
          // this.canvas.contextTop.fillRect(lines.rightline.o.x, lines.rightline.o.y, 2, 2);

          xPoints = this._findCrossPoints({ x: ex, y: ey }, lines);
          if (xPoints !== 0 && xPoints % 2 === 1) {
            this.__corner = i;
            return i;
          }
        }
        return false;
      },

      /**
       * Calls a function for each control. The function gets called,
       * with the control, the object that is calling the iterator and the control's key
       * @param {Function} fn function to iterate over the controls over
       */
      forEachControl: function(fn) {
        for (var i in this.controls) {
          fn(this.controls[i], i, this);
        }
      },

      /**
       * Sets the coordinates of the draggable boxes in the corners of
       * the image used to scale/rotate it.
       * note: if we would switch to ROUND corner area, all of this would disappear.
       * everything would resolve to a single point and a pythagorean theorem for the distance
       * @private
       */
      _setCornerCoords: function() {
        var coords = this.oCoords;

        for (var control in coords) {
          var controlObject = this.controls[control];
          coords[control].corner = controlObject.calcCornerCoords(
            this.angle,
            this.cornerSize,
            coords[control].x,
            coords[control].y,
            false
          );
          coords[control].touchCorner = controlObject.calcCornerCoords(
            this.angle,
            this.touchCornerSize,
            coords[control].x,
            coords[control].y,
            true
          );
        }
      },

      /**
       * Draws a colored layer behind the object, inside its selection borders.
       * Requires public options: padding, selectionBackgroundColor
       * this function is called when the context is transformed
       * has checks to be skipped when the object is on a staticCanvas
       * @param {CanvasRenderingContext2D} ctx Context to draw on
       * @return {fabric.Object} thisArg
       * @chainable
       */
      drawSelectionBackground: function(ctx) {
        if (
          !this.selectionBackgroundColor ||
          (this.canvas && !this.canvas.interactive) ||
          (this.canvas && this.canvas._activeObject !== this)
        ) {
          return this;
        }
        ctx.save();
        var center = this.getCenterPoint(),
          wh = this._calculateCurrentDimensions(),
          vpt = this.canvas.viewportTransform;
        ctx.translate(center.x, center.y);
        ctx.scale(1 / vpt[0], 1 / vpt[3]);
        ctx.rotate(degreesToRadians(this.angle));
        ctx.fillStyle = this.selectionBackgroundColor;
        ctx.fillRect(-wh.x / 2, -wh.y / 2, wh.x, wh.y);
        ctx.restore();
        return this;
      },

      /**
       * Draws borders of an object's bounding box.
       * Requires public properties: width, height
       * Requires public options: padding, borderColor
       * @param {CanvasRenderingContext2D} ctx Context to draw on
       * @param {Object} styleOverride object to override the object style
       * @return {fabric.Object} thisArg
       * @chainable
       */
      drawBorders: function(ctx, styleOverride) {
        styleOverride = styleOverride || {};
        var wh = this._calculateCurrentDimensions(),
          strokeWidth = this.borderScaleFactor,
          width = wh.x + strokeWidth,
          height = wh.y + strokeWidth,
          hasControls =
            typeof styleOverride.hasControls !== 'undefined'
              ? styleOverride.hasControls
              : this.hasControls,
          shouldStroke = false;

        ctx.save();
        ctx.strokeStyle = styleOverride.borderColor || this.borderColor;
        this._setLineDash(
          ctx,
          styleOverride.borderDashArray || this.borderDashArray,
          null
        );

        ctx.strokeRect(-width / 2, -height / 2, width, height);

        if (hasControls) {
          ctx.beginPath();
          this.forEachControl(function(control, key, fabricObject) {
            // in this moment, the ctx is centered on the object.
            // width and height of the above function are the size of the bbox.
            if (
              control.withConnection &&
              control.getVisibility(fabricObject, key)
            ) {
              // reset movement for each control
              shouldStroke = true;
              ctx.moveTo(control.x * width, control.y * height);
              ctx.lineTo(
                control.x * width + control.offsetX,
                control.y * height + control.offsetY
              );
            }
          });
          if (shouldStroke) {
            ctx.stroke();
          }
        }
        ctx.restore();
        return this;
      },

      /**
       * Draws borders of an object's bounding box when it is inside a group.
       * Requires public properties: width, height
       * Requires public options: padding, borderColor
       * @param {CanvasRenderingContext2D} ctx Context to draw on
       * @param {object} options object representing current object parameters
       * @param {Object} styleOverride object to override the object style
       * @return {fabric.Object} thisArg
       * @chainable
       */
      drawBordersInGroup: function(ctx, options, styleOverride) {
        styleOverride = styleOverride || {};
        var bbox = fabric.util.sizeAfterTransform(
            this.width,
            this.height,
            options
          ),
          strokeWidth = this.strokeWidth,
          strokeUniform = this.strokeUniform,
          borderScaleFactor = this.borderScaleFactor,
          width =
            bbox.x +
            strokeWidth *
              (strokeUniform ? this.canvas.getZoom() : options.scaleX) +
            borderScaleFactor,
          height =
            bbox.y +
            strokeWidth *
              (strokeUniform ? this.canvas.getZoom() : options.scaleY) +
            borderScaleFactor;
        ctx.save();
        this._setLineDash(
          ctx,
          styleOverride.borderDashArray || this.borderDashArray,
          null
        );
        ctx.strokeStyle = styleOverride.borderColor || this.borderColor;
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        ctx.restore();
        return this;
      },

      /**
       * Draws corners of an object's bounding box.
       * Requires public properties: width, height
       * Requires public options: cornerSize, padding
       * @param {CanvasRenderingContext2D} ctx Context to draw on
       * @param {Object} styleOverride object to override the object style
       * @return {fabric.Object} thisArg
       * @chainable
       */
      drawControls: function(ctx, styleOverride) {
        styleOverride = styleOverride || {};
        ctx.save();
        ctx.setTransform(
          this.canvas.getRetinaScaling(),
          0,
          0,
          this.canvas.getRetinaScaling(),
          0,
          0
        );
        ctx.strokeStyle = ctx.fillStyle =
          styleOverride.cornerColor || this.cornerColor;
        if (!this.transparentCorners) {
          ctx.strokeStyle =
            styleOverride.cornerStrokeColor || this.cornerStrokeColor;
        }
        this._setLineDash(
          ctx,
          styleOverride.cornerDashArray || this.cornerDashArray,
          null
        );
        this.setCoords();
        this.forEachControl(function(control, key, fabricObject) {
          if (control.getVisibility(fabricObject, key)) {
            control.render(
              ctx,
              fabricObject.oCoords[key].x,
              fabricObject.oCoords[key].y,
              styleOverride,
              fabricObject
            );
          }
        });
        ctx.restore();

        return this;
      },

      /**
       * Returns true if the specified control is visible, false otherwise.
       * @param {String} controlKey The key of the control. Possible values are 'tl', 'tr', 'br', 'bl', 'ml', 'mt', 'mr', 'mb', 'mtr'.
       * @returns {Boolean} true if the specified control is visible, false otherwise
       */
      isControlVisible: function(controlKey) {
        return (
          this.controls[controlKey] &&
          this.controls[controlKey].getVisibility(this, controlKey)
        );
      },

      /**
       * Sets the visibility of the specified control.
       * @param {String} controlKey The key of the control. Possible values are 'tl', 'tr', 'br', 'bl', 'ml', 'mt', 'mr', 'mb', 'mtr'.
       * @param {Boolean} visible true to set the specified control visible, false otherwise
       * @return {fabric.Object} thisArg
       * @chainable
       */
      setControlVisible: function(controlKey, visible) {
        if (!this._controlsVisibility) {
          this._controlsVisibility = {};
        }
        this._controlsVisibility[controlKey] = visible;
        return this;
      },

      /**
       * Sets the visibility state of object controls.
       * @param {Object} [options] Options object
       * @param {Boolean} [options.bl] true to enable the bottom-left control, false to disable it
       * @param {Boolean} [options.br] true to enable the bottom-right control, false to disable it
       * @param {Boolean} [options.mb] true to enable the middle-bottom control, false to disable it
       * @param {Boolean} [options.ml] true to enable the middle-left control, false to disable it
       * @param {Boolean} [options.mr] true to enable the middle-right control, false to disable it
       * @param {Boolean} [options.mt] true to enable the middle-top control, false to disable it
       * @param {Boolean} [options.tl] true to enable the top-left control, false to disable it
       * @param {Boolean} [options.tr] true to enable the top-right control, false to disable it
       * @param {Boolean} [options.mtr] true to enable the middle-top-rotate control, false to disable it
       * @return {fabric.Object} thisArg
       * @chainable
       */
      setControlsVisibility: function(options) {
        options || (options = {});

        for (var p in options) {
          this.setControlVisible(p, options[p]);
        }
        return this;
      },

      /**
       * This callback function is called every time _discardActiveObject or _setActiveObject
       * try to to deselect this object. If the function returns true, the process is cancelled
       * @param {Object} [options] options sent from the upper functions
       * @param {Event} [options.e] event if the process is generated by an event
       */
      onDeselect: function() {
        // implemented by sub-classes, as needed.
      },

      /**
       * This callback function is called every time _discardActiveObject or _setActiveObject
       * try to to select this object. If the function returns true, the process is cancelled
       * @param {Object} [options] options sent from the upper functions
       * @param {Event} [options.e] event if the process is generated by an event
       */
      onSelect: function() {
        // implemented by sub-classes, as needed.
      }
    }
  );
})();
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {}),
    min = fabric.util.array.min,
    max = fabric.util.array.max;

  if (fabric.Group) {
    return;
  }

  /**
   * Group class
   * @class fabric.Group
   * @extends fabric.Object
   * @mixes fabric.Collection
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-3#groups}
   * @see {@link fabric.Group#initialize} for constructor definition
   */
  fabric.Group = fabric.util.createClass(
    fabric.Object,
    fabric.Collection,
    /** @lends fabric.Group.prototype */ {
      /**
       * Type of an object
       * @type String
       * @default
       */
      type: 'group',

      /**
       * Width of stroke
       * @type Number
       * @default
       */
      strokeWidth: 0,

      /**
       * Indicates if click, mouseover, mouseout events & hoverCursor should also check for subtargets
       * @type Boolean
       * @default
       */
      subTargetCheck: false,

      /**
       * Groups are container, do not render anything on theyr own, ence no cache properties
       * @type Array
       * @default
       */
      cacheProperties: [],

      /**
       * setOnGroup is a method used for TextBox that is no more used since 2.0.0 The behavior is still
       * available setting this boolean to true.
       * @type Boolean
       * @since 2.0.0
       * @default
       */
      useSetOnGroup: false,

      /**
       * Constructor
       * @param {Object} objects Group objects
       * @param {Object} [options] Options object
       * @param {Boolean} [isAlreadyGrouped] if true, objects have been grouped already.
       * @return {Object} thisArg
       */
      initialize: function(objects, options, isAlreadyGrouped) {
        options = options || {};
        this._objects = [];
        // if objects enclosed in a group have been grouped already,
        // we cannot change properties of objects.
        // Thus we need to set options to group without objects,
        isAlreadyGrouped && this.callSuper('initialize', options);
        this._objects = objects || [];
        for (var i = this._objects.length; i--; ) {
          this._objects[i].group = this;
        }

        if (!isAlreadyGrouped) {
          var center = options && options.centerPoint;
          // we want to set origins before calculating the bounding box.
          // so that the topleft can be set with that in mind.
          // if specific top and left are passed, are overwritten later
          // with the callSuper('initialize', options)
          if (options.originX !== undefined) {
            this.originX = options.originX;
          }
          if (options.originY !== undefined) {
            this.originY = options.originY;
          }
          // if coming from svg i do not want to calc bounds.
          // i assume width and height are passed along options
          center || this._calcBounds();
          this._updateObjectsCoords(center);
          delete options.centerPoint;
          this.callSuper('initialize', options);
        } else {
          this._updateObjectsACoords();
        }

        this.setCoords();
      },

      /**
       * @private
       */
      _updateObjectsACoords: function() {
        var skipControls = true;
        for (var i = this._objects.length; i--; ) {
          this._objects[i].setCoords(skipControls);
        }
      },

      /**
       * @private
       * @param {Boolean} [skipCoordsChange] if true, coordinates of objects enclosed in a group do not change
       */
      _updateObjectsCoords: function(center) {
        var center = center || this.getCenterPoint();
        for (var i = this._objects.length; i--; ) {
          this._updateObjectCoords(this._objects[i], center);
        }
      },

      /**
       * @private
       * @param {Object} object
       * @param {fabric.Point} center, current center of group.
       */
      _updateObjectCoords: function(object, center) {
        var objectLeft = object.left,
          objectTop = object.top,
          skipControls = true;

        object.set({
          left: objectLeft - center.x,
          top: objectTop - center.y
        });
        object.group = this;
        object.setCoords(skipControls);
      },

      /**
       * Returns string represenation of a group
       * @return {String}
       */
      toString: function() {
        return '#<fabric.Group: (' + this.complexity() + ')>';
      },

      /**
       * Adds an object to a group; Then recalculates group's dimension, position.
       * @param {Object} object
       * @return {fabric.Group} thisArg
       * @chainable
       */
      addWithUpdate: function(object) {
        var nested = !!this.group;
        this._restoreObjectsState();
        fabric.util.resetObjectTransform(this);
        if (object) {
          if (nested) {
            // if this group is inside another group, we need to pre transform the object
            fabric.util.removeTransformFromObject(
              object,
              this.group.calcTransformMatrix()
            );
          }
          this._objects.push(object);
          object.group = this;
          object._set('canvas', this.canvas);
        }
        this._calcBounds();
        this._updateObjectsCoords();
        this.dirty = true;
        if (nested) {
          this.group.addWithUpdate();
        } else {
          this.setCoords();
        }
        return this;
      },

      /**
       * Removes an object from a group; Then recalculates group's dimension, position.
       * @param {Object} object
       * @return {fabric.Group} thisArg
       * @chainable
       */
      removeWithUpdate: function(object) {
        this._restoreObjectsState();
        fabric.util.resetObjectTransform(this);

        this.remove(object);
        this._calcBounds();
        this._updateObjectsCoords();
        this.setCoords();
        this.dirty = true;
        return this;
      },

      /**
       * @private
       */
      _onObjectAdded: function(object) {
        this.dirty = true;
        object.group = this;
        object._set('canvas', this.canvas);
      },

      /**
       * @private
       */
      _onObjectRemoved: function(object) {
        this.dirty = true;
        delete object.group;
      },

      /**
       * @private
       */
      _set: function(key, value) {
        var i = this._objects.length;
        if (this.useSetOnGroup) {
          while (i--) {
            this._objects[i].setOnGroup(key, value);
          }
        }
        if (key === 'canvas') {
          while (i--) {
            this._objects[i]._set(key, value);
          }
        }
        fabric.Object.prototype._set.call(this, key, value);
      },

      /**
       * Returns object representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} object representation of an instance
       */
      toObject: function(propertiesToInclude) {
        var _includeDefaultValues = this.includeDefaultValues;
        var objsToObject = this._objects.map(function(obj) {
          var originalDefaults = obj.includeDefaultValues;
          obj.includeDefaultValues = _includeDefaultValues;
          var _obj = obj.toObject(propertiesToInclude);
          obj.includeDefaultValues = originalDefaults;
          return _obj;
        });
        var obj = fabric.Object.prototype.toObject.call(
          this,
          propertiesToInclude
        );
        obj.objects = objsToObject;
        return obj;
      },

      /**
       * Returns object representation of an instance, in dataless mode.
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} object representation of an instance
       */
      toDatalessObject: function(propertiesToInclude) {
        var objsToObject,
          sourcePath = this.sourcePath;
        if (sourcePath) {
          objsToObject = sourcePath;
        } else {
          var _includeDefaultValues = this.includeDefaultValues;
          objsToObject = this._objects.map(function(obj) {
            var originalDefaults = obj.includeDefaultValues;
            obj.includeDefaultValues = _includeDefaultValues;
            var _obj = obj.toDatalessObject(propertiesToInclude);
            obj.includeDefaultValues = originalDefaults;
            return _obj;
          });
        }
        var obj = fabric.Object.prototype.toDatalessObject.call(
          this,
          propertiesToInclude
        );
        obj.objects = objsToObject;
        return obj;
      },

      /**
       * Renders instance on a given context
       * @param {CanvasRenderingContext2D} ctx context to render instance on
       */
      render: function(ctx) {
        this._transformDone = true;
        this.callSuper('render', ctx);
        this._transformDone = false;
      },

      /**
       * Decide if the object should cache or not. Create its own cache level
       * needsItsOwnCache should be used when the object drawing method requires
       * a cache step. None of the fabric classes requires it.
       * Generally you do not cache objects in groups because the group is already cached.
       * @return {Boolean}
       */
      shouldCache: function() {
        var ownCache = fabric.Object.prototype.shouldCache.call(this);
        if (ownCache) {
          for (var i = 0, len = this._objects.length; i < len; i++) {
            if (this._objects[i].willDrawShadow()) {
              this.ownCaching = false;
              return false;
            }
          }
        }
        return ownCache;
      },

      /**
       * Check if this object or a child object will cast a shadow
       * @return {Boolean}
       */
      willDrawShadow: function() {
        if (fabric.Object.prototype.willDrawShadow.call(this)) {
          return true;
        }
        for (var i = 0, len = this._objects.length; i < len; i++) {
          if (this._objects[i].willDrawShadow()) {
            return true;
          }
        }
        return false;
      },

      /**
       * Check if this group or its parent group are caching, recursively up
       * @return {Boolean}
       */
      isOnACache: function() {
        return this.ownCaching || (this.group && this.group.isOnACache());
      },

      /**
       * Execute the drawing operation for an object on a specified context
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawObject: function(ctx) {
        for (var i = 0, len = this._objects.length; i < len; i++) {
          this._objects[i].render(ctx);
        }
        this._drawClipPath(ctx);
      },

      /**
       * Check if cache is dirty
       */
      isCacheDirty: function(skipCanvas) {
        if (this.callSuper('isCacheDirty', skipCanvas)) {
          return true;
        }
        if (!this.statefullCache) {
          return false;
        }
        for (var i = 0, len = this._objects.length; i < len; i++) {
          if (this._objects[i].isCacheDirty(true)) {
            if (this._cacheCanvas) {
              // if this group has not a cache canvas there is nothing to clean
              var x = this.cacheWidth / this.zoomX,
                y = this.cacheHeight / this.zoomY;
              this._cacheContext.clearRect(-x / 2, -y / 2, x, y);
            }
            return true;
          }
        }
        return false;
      },

      /**
       * Restores original state of each of group objects (original state is that which was before group was created).
       * if the nested boolean is true, the original state will be restored just for the
       * first group and not for all the group chain
       * @private
       * @param {Boolean} nested tell the function to restore object state up to the parent group and not more
       * @return {fabric.Group} thisArg
       * @chainable
       */
      _restoreObjectsState: function() {
        var groupMatrix = this.calcOwnMatrix();
        this._objects.forEach(function(object) {
          // instead of using _this = this;
          fabric.util.addTransformToObject(object, groupMatrix);
          delete object.group;
          object.setCoords();
        });
        return this;
      },

      /**
       * Realises the transform from this group onto the supplied object
       * i.e. it tells you what would happen if the supplied object was in
       * the group, and then the group was destroyed. It mutates the supplied
       * object.
       * Warning: this method is not useful anymore, it has been kept to no break the api.
       * is not used in the fabricJS codebase
       * this method will be reduced to using the utility.
       * @private
       * @deprecated
       * @param {fabric.Object} object
       * @param {Array} parentMatrix parent transformation
       * @return {fabric.Object} transformedObject
       */
      realizeTransform: function(object, parentMatrix) {
        fabric.util.addTransformToObject(object, parentMatrix);
        return object;
      },

      /**
       * Destroys a group (restoring state of its objects)
       * @return {fabric.Group} thisArg
       * @chainable
       */
      destroy: function() {
        // when group is destroyed objects needs to get a repaint to be eventually
        // displayed on canvas.
        this._objects.forEach(function(object) {
          object.set('dirty', true);
        });
        return this._restoreObjectsState();
      },

      /**
       * make a group an active selection, remove the group from canvas
       * the group has to be on canvas for this to work.
       * @return {fabric.ActiveSelection} thisArg
       * @chainable
       */
      toActiveSelection: function() {
        if (!this.canvas) {
          return;
        }
        var objects = this._objects,
          canvas = this.canvas;
        this._objects = [];
        var options = this.toObject();
        delete options.objects;
        var activeSelection = new fabric.ActiveSelection([]);
        activeSelection.set(options);
        activeSelection.type = 'activeSelection';
        canvas.remove(this);
        objects.forEach(function(object) {
          object.group = activeSelection;
          object.dirty = true;
          canvas.add(object);
        });
        activeSelection.canvas = canvas;
        activeSelection._objects = objects;
        canvas._activeObject = activeSelection;
        activeSelection.setCoords();
        return activeSelection;
      },

      /**
       * Destroys a group (restoring state of its objects)
       * @return {fabric.Group} thisArg
       * @chainable
       */
      ungroupOnCanvas: function() {
        return this._restoreObjectsState();
      },

      /**
       * Sets coordinates of all objects inside group
       * @return {fabric.Group} thisArg
       * @chainable
       */
      setObjectsCoords: function() {
        var skipControls = true;
        this.forEachObject(function(object) {
          object.setCoords(skipControls);
        });
        return this;
      },

      /**
       * @private
       */
      _calcBounds: function(onlyWidthHeight) {
        var aX = [],
          aY = [],
          o,
          prop,
          coords,
          props = ['tr', 'br', 'bl', 'tl'],
          i = 0,
          iLen = this._objects.length,
          j,
          jLen = props.length;

        for (; i < iLen; ++i) {
          o = this._objects[i];
          coords = o.calcACoords();
          for (j = 0; j < jLen; j++) {
            prop = props[j];
            aX.push(coords[prop].x);
            aY.push(coords[prop].y);
          }
          o.aCoords = coords;
        }

        this._getBounds(aX, aY, onlyWidthHeight);
      },

      /**
       * @private
       */
      _getBounds: function(aX, aY, onlyWidthHeight) {
        var minXY = new fabric.Point(min(aX), min(aY)),
          maxXY = new fabric.Point(max(aX), max(aY)),
          top = minXY.y || 0,
          left = minXY.x || 0,
          width = maxXY.x - minXY.x || 0,
          height = maxXY.y - minXY.y || 0;
        this.width = width;
        this.height = height;
        if (!onlyWidthHeight) {
          // the bounding box always finds the topleft most corner.
          // whatever is the group origin, we set up here the left/top position.
          this.setPositionByOrigin({ x: left, y: top }, 'left', 'top');
        }
      },

      /* _TO_SVG_START_ */
      /**
       * Returns svg representation of an instance
       * @param {Function} [reviver] Method for further parsing of svg representation.
       * @return {String} svg representation of an instance
       */
      _toSVG: function(reviver) {
        var svgString = ['<g ', 'COMMON_PARTS', ' >\n'];

        for (var i = 0, len = this._objects.length; i < len; i++) {
          svgString.push('\t\t', this._objects[i].toSVG(reviver));
        }
        svgString.push('</g>\n');
        return svgString;
      },

      /**
       * Returns styles-string for svg-export, specific version for group
       * @return {String}
       */
      getSvgStyles: function() {
        var opacity =
            typeof this.opacity !== 'undefined' && this.opacity !== 1
              ? 'opacity: ' + this.opacity + ';'
              : '',
          visibility = this.visible ? '' : ' visibility: hidden;';
        return [opacity, this.getSvgFilter(), visibility].join('');
      },

      /**
       * Returns svg clipPath representation of an instance
       * @param {Function} [reviver] Method for further parsing of svg representation.
       * @return {String} svg representation of an instance
       */
      toClipPathSVG: function(reviver) {
        var svgString = [];

        for (var i = 0, len = this._objects.length; i < len; i++) {
          svgString.push('\t', this._objects[i].toClipPathSVG(reviver));
        }

        return this._createBaseClipPathSVGMarkup(svgString, {
          reviver: reviver
        });
      }
      /* _TO_SVG_END_ */
    }
  );

  /**
   * Returns {@link fabric.Group} instance from an object representation
   * @static
   * @memberOf fabric.Group
   * @param {Object} object Object to create a group from
   * @param {Function} [callback] Callback to invoke when an group instance is created
   */
  fabric.Group.fromObject = function(object, callback) {
    var objects = object.objects,
      options = fabric.util.object.clone(object, true);
    delete options.objects;
    if (typeof objects === 'string') {
      // it has to be an url or something went wrong.
      fabric.loadSVGFromURL(objects, function(elements) {
        var group = fabric.util.groupSVGElements(elements, object, objects);
        group.set(options);
        callback && callback(group);
      });
      return;
    }
    fabric.util.enlivenObjects(objects, function(enlivenedObjects) {
      fabric.util.enlivenObjects([object.clipPath], function(enlivedClipPath) {
        var options = fabric.util.object.clone(object, true);
        options.clipPath = enlivedClipPath[0];
        delete options.objects;
        callback && callback(new fabric.Group(enlivenedObjects, options, true));
      });
    });
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.ActiveSelection) {
    return;
  }

  /**
   * Group class
   * @class fabric.ActiveSelection
   * @extends fabric.Group
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-3#groups}
   * @see {@link fabric.ActiveSelection#initialize} for constructor definition
   */
  fabric.ActiveSelection = fabric.util.createClass(
    fabric.Group,
    /** @lends fabric.ActiveSelection.prototype */ {
      /**
       * Type of an object
       * @type String
       * @default
       */
      type: 'activeSelection',

      /**
       * Constructor
       * @param {Object} objects ActiveSelection objects
       * @param {Object} [options] Options object
       * @return {Object} thisArg
       */
      initialize: function(objects, options) {
        options = options || {};
        this._objects = objects || [];
        for (var i = this._objects.length; i--; ) {
          this._objects[i].group = this;
        }

        if (options.originX) {
          this.originX = options.originX;
        }
        if (options.originY) {
          this.originY = options.originY;
        }
        this._calcBounds();
        this._updateObjectsCoords();
        fabric.Object.prototype.initialize.call(this, options);
        this.setCoords();
      },

      /**
       * Change te activeSelection to a normal group,
       * High level function that automatically adds it to canvas as
       * active object. no events fired.
       * @since 2.0.0
       * @return {fabric.Group}
       */
      toGroup: function() {
        var objects = this._objects.concat();
        this._objects = [];
        var options = fabric.Object.prototype.toObject.call(this);
        var newGroup = new fabric.Group([]);
        delete options.type;
        newGroup.set(options);
        objects.forEach(function(object) {
          object.canvas.remove(object);
          object.group = newGroup;
        });
        newGroup._objects = objects;
        if (!this.canvas) {
          return newGroup;
        }
        var canvas = this.canvas;
        canvas.add(newGroup);
        canvas._activeObject = newGroup;
        newGroup.setCoords();
        return newGroup;
      },

      /**
       * If returns true, deselection is cancelled.
       * @since 2.0.0
       * @return {Boolean} [cancel]
       */
      onDeselect: function() {
        this.destroy();
        return false;
      },

      /**
       * Returns string representation of a group
       * @return {String}
       */
      toString: function() {
        return '#<fabric.ActiveSelection: (' + this.complexity() + ')>';
      },

      /**
       * Decide if the object should cache or not. Create its own cache level
       * objectCaching is a global flag, wins over everything
       * needsItsOwnCache should be used when the object drawing method requires
       * a cache step. None of the fabric classes requires it.
       * Generally you do not cache objects in groups because the group outside is cached.
       * @return {Boolean}
       */
      shouldCache: function() {
        return false;
      },

      /**
       * Check if this group or its parent group are caching, recursively up
       * @return {Boolean}
       */
      isOnACache: function() {
        return false;
      },

      /**
       * Renders controls and borders for the object
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {Object} [styleOverride] properties to override the object style
       * @param {Object} [childrenOverride] properties to override the children overrides
       */
      _renderControls: function(ctx, styleOverride, childrenOverride) {
        ctx.save();
        ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
        this.callSuper('_renderControls', ctx, styleOverride);
        childrenOverride = childrenOverride || {};
        if (typeof childrenOverride.hasControls === 'undefined') {
          childrenOverride.hasControls = false;
        }
        childrenOverride.forActiveSelection = true;
        for (var i = 0, len = this._objects.length; i < len; i++) {
          this._objects[i]._renderControls(ctx, childrenOverride);
        }
        ctx.restore();
      }
    }
  );

  /**
   * Returns {@link fabric.ActiveSelection} instance from an object representation
   * @static
   * @memberOf fabric.ActiveSelection
   * @param {Object} object Object to create a group from
   * @param {Function} [callback] Callback to invoke when an ActiveSelection instance is created
   */
  fabric.ActiveSelection.fromObject = function(object, callback) {
    fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
      delete object.objects;
      callback &&
        callback(new fabric.ActiveSelection(enlivenedObjects, object, true));
    });
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  'use strict';

  var extend = fabric.util.object.extend;

  if (!global.fabric) {
    global.fabric = {};
  }

  if (global.fabric.Image) {
    fabric.warn('fabric.Image is already defined.');
    return;
  }

  /**
   * Image class
   * @class fabric.Image
   * @extends fabric.Object
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-1#images}
   * @see {@link fabric.Image#initialize} for constructor definition
   */
  fabric.Image = fabric.util.createClass(
    fabric.Object,
    /** @lends fabric.Image.prototype */ {
      /**
       * Type of an object
       * @type String
       * @default
       */
      type: 'image',

      /**
       * Width of a stroke.
       * For image quality a stroke multiple of 2 gives better results.
       * @type Number
       * @default
       */
      strokeWidth: 0,

      /**
       * When calling {@link fabric.Image.getSrc}, return value from element src with `element.getAttribute('src')`.
       * This allows for relative urls as image src.
       * @since 2.7.0
       * @type Boolean
       * @default
       */
      srcFromAttribute: false,

      /**
       * private
       * contains last value of scaleX to detect
       * if the Image got resized after the last Render
       * @type Number
       */
      _lastScaleX: 1,

      /**
       * private
       * contains last value of scaleY to detect
       * if the Image got resized after the last Render
       * @type Number
       */
      _lastScaleY: 1,

      /**
       * private
       * contains last value of scaling applied by the apply filter chain
       * @type Number
       */
      _filterScalingX: 1,

      /**
       * private
       * contains last value of scaling applied by the apply filter chain
       * @type Number
       */
      _filterScalingY: 1,

      /**
       * minimum scale factor under which any resizeFilter is triggered to resize the image
       * 0 will disable the automatic resize. 1 will trigger automatically always.
       * number bigger than 1 are not implemented yet.
       * @type Number
       */
      minimumScaleTrigger: 0.5,

      /**
       * List of properties to consider when checking if
       * state of an object is changed ({@link fabric.Object#hasStateChanged})
       * as well as for history (undo/redo) purposes
       * @type Array
       */
      stateProperties: fabric.Object.prototype.stateProperties.concat(
        'cropX',
        'cropY'
      ),

      /**
       * List of properties to consider when checking if cache needs refresh
       * Those properties are checked by statefullCache ON ( or lazy mode if we want ) or from single
       * calls to Object.set(key, value). If the key is in this list, the object is marked as dirty
       * and refreshed at the next render
       * @type Array
       */
      cacheProperties: fabric.Object.prototype.cacheProperties.concat(
        'cropX',
        'cropY'
      ),

      /**
       * key used to retrieve the texture representing this image
       * @since 2.0.0
       * @type String
       * @default
       */
      cacheKey: '',

      /**
       * Image crop in pixels from original image size.
       * @since 2.0.0
       * @type Number
       * @default
       */
      cropX: 0,

      /**
       * Image crop in pixels from original image size.
       * @since 2.0.0
       * @type Number
       * @default
       */
      cropY: 0,

      /**
       * Indicates whether this canvas will use image smoothing when painting this image.
       * Also influence if the cacheCanvas for this image uses imageSmoothing
       * @since 4.0.0-beta.11
       * @type Boolean
       * @default
       */
      imageSmoothing: true,

      /**
       * Constructor
       * Image can be initialized with any canvas drawable or a string.
       * The string should be a url and will be loaded as an image.
       * Canvas and Image element work out of the box, while videos require extra code to work.
       * Please check video element events for seeking.
       * @param {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | String} element Image element
       * @param {Object} [options] Options object
       * @param {function} [callback] callback function to call after eventual filters applied.
       * @return {fabric.Image} thisArg
       */
      initialize: function(element, options) {
        options || (options = {});
        this.filters = [];
        this.cacheKey = 'texture' + fabric.Object.__uid++;
        this.callSuper('initialize', options);
        this._initElement(element, options);
      },

      /**
       * Returns image element which this instance if based on
       * @return {HTMLImageElement} Image element
       */
      getElement: function() {
        return this._element || {};
      },

      /**
       * Sets image element for this instance to a specified one.
       * If filters defined they are applied to new image.
       * You might need to call `canvas.renderAll` and `object.setCoords` after replacing, to render new image and update controls area.
       * @param {HTMLImageElement} element
       * @param {Object} [options] Options object
       * @return {fabric.Image} thisArg
       * @chainable
       */
      setElement: function(element, options) {
        this.removeTexture(this.cacheKey);
        this.removeTexture(this.cacheKey + '_filtered');
        this._element = element;
        this._originalElement = element;
        this._initConfig(options);
        if (this.filters.length !== 0) {
          this.applyFilters();
        }
        // resizeFilters work on the already filtered copy.
        // we need to apply resizeFilters AFTER normal filters.
        // applyResizeFilters is run more often than normal filters
        // and is triggered by user interactions rather than dev code
        if (this.resizeFilter) {
          this.applyResizeFilters();
        }
        return this;
      },

      /**
       * Delete a single texture if in webgl mode
       */
      removeTexture: function(key) {
        var backend = fabric.filterBackend;
        if (backend && backend.evictCachesForKey) {
          backend.evictCachesForKey(key);
        }
      },

      /**
       * Delete textures, reference to elements and eventually JSDOM cleanup
       */
      dispose: function() {
        this.removeTexture(this.cacheKey);
        this.removeTexture(this.cacheKey + '_filtered');
        this._cacheContext = undefined;
        ['_originalElement', '_element', '_filteredEl', '_cacheCanvas'].forEach(
          function(element) {
            fabric.util.cleanUpJsdomNode(this[element]);
            this[element] = undefined;
          }.bind(this)
        );
      },

      /**
       * Get the crossOrigin value (of the corresponding image element)
       */
      getCrossOrigin: function() {
        return (
          this._originalElement && (this._originalElement.crossOrigin || null)
        );
      },

      /**
       * Returns original size of an image
       * @return {Object} Object with "width" and "height" properties
       */
      getOriginalSize: function() {
        var element = this.getElement();
        return {
          width: element.naturalWidth || element.width,
          height: element.naturalHeight || element.height
        };
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _stroke: function(ctx) {
        if (!this.stroke || this.strokeWidth === 0) {
          return;
        }
        var w = this.width / 2,
          h = this.height / 2;
        ctx.beginPath();
        ctx.moveTo(-w, -h);
        ctx.lineTo(w, -h);
        ctx.lineTo(w, h);
        ctx.lineTo(-w, h);
        ctx.lineTo(-w, -h);
        ctx.closePath();
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _renderDashedStroke: function(ctx) {
        var x = -this.width / 2,
          y = -this.height / 2,
          w = this.width,
          h = this.height;

        ctx.save();
        this._setStrokeStyles(ctx, this);

        ctx.beginPath();
        fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
        fabric.util.drawDashedLine(
          ctx,
          x + w,
          y,
          x + w,
          y + h,
          this.strokeDashArray
        );
        fabric.util.drawDashedLine(
          ctx,
          x + w,
          y + h,
          x,
          y + h,
          this.strokeDashArray
        );
        fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
        ctx.closePath();
        ctx.restore();
      },

      /**
       * Returns object representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} Object representation of an instance
       */
      toObject: function(propertiesToInclude) {
        var filters = [];

        this.filters.forEach(function(filterObj) {
          if (filterObj) {
            filters.push(filterObj.toObject());
          }
        });
        var object = extend(
          this.callSuper(
            'toObject',
            ['cropX', 'cropY'].concat(propertiesToInclude)
          ),
          {
            src: this.getSrc(),
            crossOrigin: this.getCrossOrigin(),
            filters: filters
          }
        );
        if (this.resizeFilter) {
          object.resizeFilter = this.resizeFilter.toObject();
        }
        return object;
      },

      /**
       * Returns true if an image has crop applied, inspecting values of cropX,cropY,width,height.
       * @return {Boolean}
       */
      hasCrop: function() {
        return (
          this.cropX ||
          this.cropY ||
          this.width < this._element.width ||
          this.height < this._element.height
        );
      },

      /* _TO_SVG_START_ */
      /**
       * Returns svg representation of an instance
       * @return {Array} an array of strings with the specific svg representation
       * of the instance
       */
      _toSVG: function() {
        var svgString = [],
          imageMarkup = [],
          strokeSvg,
          element = this._element,
          x = -this.width / 2,
          y = -this.height / 2,
          clipPath = '',
          imageRendering = '';
        if (!element) {
          return [];
        }
        if (this.hasCrop()) {
          var clipPathId = fabric.Object.__uid++;
          svgString.push(
            '<clipPath id="imageCrop_' + clipPathId + '">\n',
            '\t<rect x="' +
              x +
              '" y="' +
              y +
              '" width="' +
              this.width +
              '" height="' +
              this.height +
              '" />\n',
            '</clipPath>\n'
          );
          clipPath = ' clip-path="url(#imageCrop_' + clipPathId + ')" ';
        }
        if (!this.imageSmoothing) {
          imageRendering = '" image-rendering="optimizeSpeed';
        }
        imageMarkup.push(
          '\t<image ',
          'COMMON_PARTS',
          'xlink:href="',
          this.getSvgSrc(true),
          '" x="',
          x - this.cropX,
          '" y="',
          y - this.cropY,
          // we're essentially moving origin of transformation from top/left corner to the center of the shape
          // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
          // so that object's center aligns with container's left/top
          '" width="',
          element.width || element.naturalWidth,
          '" height="',
          element.height || element.height,
          imageRendering,
          '"',
          clipPath,
          '></image>\n'
        );

        if (this.stroke || this.strokeDashArray) {
          var origFill = this.fill;
          this.fill = null;
          strokeSvg = [
            '\t<rect ',
            'x="',
            x,
            '" y="',
            y,
            '" width="',
            this.width,
            '" height="',
            this.height,
            '" style="',
            this.getSvgStyles(),
            '"/>\n'
          ];
          this.fill = origFill;
        }
        if (this.paintFirst !== 'fill') {
          svgString = svgString.concat(strokeSvg, imageMarkup);
        } else {
          svgString = svgString.concat(imageMarkup, strokeSvg);
        }
        return svgString;
      },
      /* _TO_SVG_END_ */

      /**
       * Returns source of an image
       * @param {Boolean} filtered indicates if the src is needed for svg
       * @return {String} Source of an image
       */
      getSrc: function(filtered) {
        var element = filtered ? this._element : this._originalElement;
        if (element) {
          if (element.toDataURL) {
            return element.toDataURL();
          }

          if (this.srcFromAttribute) {
            return element.getAttribute('src');
          } else {
            return element.src;
          }
        } else {
          return this.src || '';
        }
      },

      /**
       * Sets source of an image
       * @param {String} src Source string (URL)
       * @param {Function} [callback] Callback is invoked when image has been loaded (and all filters have been applied)
       * @param {Object} [options] Options object
       * @param {String} [options.crossOrigin] crossOrigin value (one of "", "anonymous", "use-credentials")
       * @see https://developer.mozilla.org/en-US/docs/HTML/CORS_settings_attributes
       * @return {fabric.Image} thisArg
       * @chainable
       */
      setSrc: function(src, callback, options) {
        fabric.util.loadImage(
          src,
          function(img, isError) {
            this.setElement(img, options);
            this._setWidthHeight();
            callback && callback(this, isError);
          },
          this,
          options && options.crossOrigin
        );
        return this;
      },

      /**
       * Returns string representation of an instance
       * @return {String} String representation of an instance
       */
      toString: function() {
        return '#<fabric.Image: { src: "' + this.getSrc() + '" }>';
      },

      applyResizeFilters: function() {
        var filter = this.resizeFilter,
          minimumScale = this.minimumScaleTrigger,
          objectScale = this.getTotalObjectScaling(),
          scaleX = objectScale.scaleX,
          scaleY = objectScale.scaleY,
          elementToFilter = this._filteredEl || this._originalElement;
        if (this.group) {
          this.set('dirty', true);
        }
        if (!filter || (scaleX > minimumScale && scaleY > minimumScale)) {
          this._element = elementToFilter;
          this._filterScalingX = 1;
          this._filterScalingY = 1;
          this._lastScaleX = scaleX;
          this._lastScaleY = scaleY;
          return;
        }
        if (!fabric.filterBackend) {
          fabric.filterBackend = fabric.initFilterBackend();
        }
        var canvasEl = fabric.util.createCanvasElement(),
          cacheKey = this._filteredEl
            ? this.cacheKey + '_filtered'
            : this.cacheKey,
          sourceWidth = elementToFilter.width,
          sourceHeight = elementToFilter.height;
        canvasEl.width = sourceWidth;
        canvasEl.height = sourceHeight;
        this._element = canvasEl;
        this._lastScaleX = filter.scaleX = scaleX;
        this._lastScaleY = filter.scaleY = scaleY;
        fabric.filterBackend.applyFilters(
          [filter],
          elementToFilter,
          sourceWidth,
          sourceHeight,
          this._element,
          cacheKey
        );
        this._filterScalingX = canvasEl.width / this._originalElement.width;
        this._filterScalingY = canvasEl.height / this._originalElement.height;
      },

      /**
       * Applies filters assigned to this image (from "filters" array) or from filter param
       * @method applyFilters
       * @param {Array} filters to be applied
       * @param {Boolean} forResizing specify if the filter operation is a resize operation
       * @return {thisArg} return the fabric.Image object
       * @chainable
       */
      applyFilters: function(filters) {
        filters = filters || this.filters || [];
        filters = filters.filter(function(filter) {
          return filter && !filter.isNeutralState();
        });
        this.set('dirty', true);

        // needs to clear out or WEBGL will not resize correctly
        this.removeTexture(this.cacheKey + '_filtered');

        if (filters.length === 0) {
          this._element = this._originalElement;
          this._filteredEl = null;
          this._filterScalingX = 1;
          this._filterScalingY = 1;
          return this;
        }

        var imgElement = this._originalElement,
          sourceWidth = imgElement.naturalWidth || imgElement.width,
          sourceHeight = imgElement.naturalHeight || imgElement.height;

        if (this._element === this._originalElement) {
          // if the element is the same we need to create a new element
          var canvasEl = fabric.util.createCanvasElement();
          canvasEl.width = sourceWidth;
          canvasEl.height = sourceHeight;
          this._element = canvasEl;
          this._filteredEl = canvasEl;
        } else {
          // clear the existing element to get new filter data
          // also dereference the eventual resized _element
          this._element = this._filteredEl;
          this._filteredEl
            .getContext('2d')
            .clearRect(0, 0, sourceWidth, sourceHeight);
          // we also need to resize again at next renderAll, so remove saved _lastScaleX/Y
          this._lastScaleX = 1;
          this._lastScaleY = 1;
        }
        if (!fabric.filterBackend) {
          fabric.filterBackend = fabric.initFilterBackend();
        }
        fabric.filterBackend.applyFilters(
          filters,
          this._originalElement,
          sourceWidth,
          sourceHeight,
          this._element,
          this.cacheKey
        );
        if (
          this._originalElement.width !== this._element.width ||
          this._originalElement.height !== this._element.height
        ) {
          this._filterScalingX =
            this._element.width / this._originalElement.width;
          this._filterScalingY =
            this._element.height / this._originalElement.height;
        }
        return this;
      },

      /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      _render: function(ctx) {
        fabric.util.setImageSmoothing(ctx, this.imageSmoothing);
        if (
          this.isMoving !== true &&
          this.resizeFilter &&
          this._needsResize()
        ) {
          this.applyResizeFilters();
        }
        this._stroke(ctx);
        this._renderPaintInOrder(ctx);
      },

      /**
       * Paint the cached copy of the object on the target context.
       * it will set the imageSmoothing for the draw operation
       * @param {CanvasRenderingContext2D} ctx Context to render on
       */
      drawCacheOnCanvas: function(ctx) {
        fabric.util.setImageSmoothing(ctx, this.imageSmoothing);
        fabric.Object.prototype.drawCacheOnCanvas.call(this, ctx);
      },

      /**
       * Decide if the object should cache or not. Create its own cache level
       * needsItsOwnCache should be used when the object drawing method requires
       * a cache step. None of the fabric classes requires it.
       * Generally you do not cache objects in groups because the group outside is cached.
       * This is the special image version where we would like to avoid caching where possible.
       * Essentially images do not benefit from caching. They may require caching, and in that
       * case we do it. Also caching an image usually ends in a loss of details.
       * A full performance audit should be done.
       * @return {Boolean}
       */
      shouldCache: function() {
        return this.needsItsOwnCache();
      },

      _renderFill: function(ctx) {
        var elementToDraw = this._element;
        if (!elementToDraw) {
          return;
        }
        var scaleX = this._filterScalingX,
          scaleY = this._filterScalingY,
          w = this.width,
          h = this.height,
          min = Math.min,
          max = Math.max,
          // crop values cannot be lesser than 0.
          cropX = max(this.cropX, 0),
          cropY = max(this.cropY, 0),
          elWidth = elementToDraw.naturalWidth || elementToDraw.width,
          elHeight = elementToDraw.naturalHeight || elementToDraw.height,
          sX = cropX * scaleX,
          sY = cropY * scaleY,
          // the width height cannot exceed element width/height, starting from the crop offset.
          sW = min(w * scaleX, elWidth - sX),
          sH = min(h * scaleY, elHeight - sY),
          x = -w / 2,
          y = -h / 2,
          maxDestW = min(w, elWidth / scaleX - cropX),
          maxDestH = min(h, elHeight / scaleY - cropY);

        elementToDraw &&
          ctx.drawImage(
            elementToDraw,
            sX,
            sY,
            sW,
            sH,
            x,
            y,
            maxDestW,
            maxDestH
          );
      },

      /**
       * needed to check if image needs resize
       * @private
       */
      _needsResize: function() {
        var scale = this.getTotalObjectScaling();
        return (
          scale.scaleX !== this._lastScaleX || scale.scaleY !== this._lastScaleY
        );
      },

      /**
       * @private
       */
      _resetWidthHeight: function() {
        this.set(this.getOriginalSize());
      },

      /**
       * The Image class's initialization method. This method is automatically
       * called by the constructor.
       * @private
       * @param {HTMLImageElement|String} element The element representing the image
       * @param {Object} [options] Options object
       */
      _initElement: function(element, options) {
        this.setElement(fabric.util.getById(element), options);
        fabric.util.addClass(this.getElement(), fabric.Image.CSS_CANVAS);
      },

      /**
       * @private
       * @param {Object} [options] Options object
       */
      _initConfig: function(options) {
        options || (options = {});
        this.setOptions(options);
        this._setWidthHeight(options);
      },

      /**
       * @private
       * @param {Array} filters to be initialized
       * @param {Function} callback Callback to invoke when all fabric.Image.filters instances are created
       */
      _initFilters: function(filters, callback) {
        if (filters && filters.length) {
          fabric.util.enlivenObjects(
            filters,
            function(enlivenedObjects) {
              callback && callback(enlivenedObjects);
            },
            'fabric.Image.filters'
          );
        } else {
          callback && callback();
        }
      },

      /**
       * @private
       * Set the width and the height of the image object, using the element or the
       * options.
       * @param {Object} [options] Object with width/height properties
       */
      _setWidthHeight: function(options) {
        options || (options = {});
        var el = this.getElement();
        this.width = options.width || el.naturalWidth || el.width || 0;
        this.height = options.height || el.naturalHeight || el.height || 0;
      },

      /**
       * Calculate offset for center and scale factor for the image in order to respect
       * the preserveAspectRatio attribute
       * @private
       * @return {Object}
       */
      parsePreserveAspectRatioAttribute: function() {
        var pAR = fabric.util.parsePreserveAspectRatioAttribute(
            this.preserveAspectRatio || ''
          ),
          rWidth = this._element.width,
          rHeight = this._element.height,
          scaleX = 1,
          scaleY = 1,
          offsetLeft = 0,
          offsetTop = 0,
          cropX = 0,
          cropY = 0,
          offset,
          pWidth = this.width,
          pHeight = this.height,
          parsedAttributes = { width: pWidth, height: pHeight };
        if (pAR && (pAR.alignX !== 'none' || pAR.alignY !== 'none')) {
          if (pAR.meetOrSlice === 'meet') {
            scaleX = scaleY = fabric.util.findScaleToFit(
              this._element,
              parsedAttributes
            );
            offset = (pWidth - rWidth * scaleX) / 2;
            if (pAR.alignX === 'Min') {
              offsetLeft = -offset;
            }
            if (pAR.alignX === 'Max') {
              offsetLeft = offset;
            }
            offset = (pHeight - rHeight * scaleY) / 2;
            if (pAR.alignY === 'Min') {
              offsetTop = -offset;
            }
            if (pAR.alignY === 'Max') {
              offsetTop = offset;
            }
          }
          if (pAR.meetOrSlice === 'slice') {
            scaleX = scaleY = fabric.util.findScaleToCover(
              this._element,
              parsedAttributes
            );
            offset = rWidth - pWidth / scaleX;
            if (pAR.alignX === 'Mid') {
              cropX = offset / 2;
            }
            if (pAR.alignX === 'Max') {
              cropX = offset;
            }
            offset = rHeight - pHeight / scaleY;
            if (pAR.alignY === 'Mid') {
              cropY = offset / 2;
            }
            if (pAR.alignY === 'Max') {
              cropY = offset;
            }
            rWidth = pWidth / scaleX;
            rHeight = pHeight / scaleY;
          }
        } else {
          scaleX = pWidth / rWidth;
          scaleY = pHeight / rHeight;
        }
        return {
          width: rWidth,
          height: rHeight,
          scaleX: scaleX,
          scaleY: scaleY,
          offsetLeft: offsetLeft,
          offsetTop: offsetTop,
          cropX: cropX,
          cropY: cropY
        };
      }
    }
  );

  /**
   * Default CSS class name for canvas
   * @static
   * @type String
   * @default
   */
  fabric.Image.CSS_CANVAS = 'canvas-img';

  /**
   * Alias for getSrc
   * @static
   */
  fabric.Image.prototype.getSvgSrc = fabric.Image.prototype.getSrc;

  /**
   * Creates an instance of fabric.Image from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} callback Callback to invoke when an image instance is created
   */
  fabric.Image.fromObject = function(_object, callback) {
    var object = fabric.util.object.clone(_object);
    fabric.util.loadImage(
      object.src,
      function(img, isError) {
        if (isError) {
          callback && callback(null, true);
          return;
        }
        fabric.Image.prototype._initFilters.call(
          object,
          object.filters,
          function(filters) {
            object.filters = filters || [];
            fabric.Image.prototype._initFilters.call(
              object,
              [object.resizeFilter],
              function(resizeFilters) {
                object.resizeFilter = resizeFilters[0];
                fabric.util.enlivenObjects([object.clipPath], function(
                  enlivedProps
                ) {
                  object.clipPath = enlivedProps[0];
                  var image = new fabric.Image(img, object);
                  callback(image, false);
                });
              }
            );
          }
        );
      },
      null,
      object.crossOrigin
    );
  };

  /**
   * Creates an instance of fabric.Image from an URL string
   * @static
   * @param {String} url URL to create an image from
   * @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument). Second argument is a boolean indicating if an error occurred or not.
   * @param {Object} [imgOptions] Options object
   */
  fabric.Image.fromURL = function(url, callback, imgOptions) {
    fabric.util.loadImage(
      url,
      function(img, isError) {
        callback && callback(new fabric.Image(img, imgOptions), isError);
      },
      null,
      imgOptions && imgOptions.crossOrigin
    );
  };
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  var controlsUtils = fabric.controlsUtils,
    scaleSkewStyleHandler = controlsUtils.scaleSkewCursorStyleHandler,
    scaleStyleHandler = controlsUtils.scaleCursorStyleHandler,
    scalingEqually = controlsUtils.scalingEqually,
    scalingYOrSkewingX = controlsUtils.scalingYOrSkewingX,
    scalingXOrSkewingY = controlsUtils.scalingXOrSkewingY,
    scaleOrSkewActionName = controlsUtils.scaleOrSkewActionName,
    objectControls = fabric.Object.prototype.controls;

  objectControls.ml = new fabric.Control({
    x: -0.5,
    y: 0,
    cursorStyleHandler: scaleSkewStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName
  });

  objectControls.mr = new fabric.Control({
    x: 0.5,
    y: 0,
    cursorStyleHandler: scaleSkewStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName
  });

  objectControls.mb = new fabric.Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: scaleSkewStyleHandler,
    actionHandler: scalingYOrSkewingX,
    getActionName: scaleOrSkewActionName
  });

  objectControls.mt = new fabric.Control({
    x: 0,
    y: -0.5,
    cursorStyleHandler: scaleSkewStyleHandler,
    actionHandler: scalingYOrSkewingX,
    getActionName: scaleOrSkewActionName
  });

  objectControls.tl = new fabric.Control({
    x: -0.5,
    y: -0.5,
    cursorStyleHandler: scaleStyleHandler,
    actionHandler: scalingEqually
  });

  objectControls.tr = new fabric.Control({
    x: 0.5,
    y: -0.5,
    cursorStyleHandler: scaleStyleHandler,
    actionHandler: scalingEqually
  });

  objectControls.bl = new fabric.Control({
    x: -0.5,
    y: 0.5,
    cursorStyleHandler: scaleStyleHandler,
    actionHandler: scalingEqually
  });

  objectControls.br = new fabric.Control({
    x: 0.5,
    y: 0.5,
    cursorStyleHandler: scaleStyleHandler,
    actionHandler: scalingEqually
  });

  objectControls.mtr = new fabric.Control({
    x: 0,
    y: -0.5,
    actionHandler: controlsUtils.rotationWithSnapping,
    cursorStyleHandler: controlsUtils.rotationStyleHandler,
    offsetY: -40,
    withConnection: true,
    actionName: 'rotate'
  });

  if (fabric.Textbox) {
    // this is breaking the prototype inheritance, no time / ideas to fix it.
    // is important to document that if you want to have all objects to have a
    // specific custom control, you have to add it to Object prototype and to Textbox
    // prototype. The controls are shared as references. So changes to control `tr`
    // can still apply to all objects if needed.
    var textBoxControls = (fabric.Textbox.prototype.controls = {});

    textBoxControls.mtr = objectControls.mtr;
    textBoxControls.tr = objectControls.tr;
    textBoxControls.br = objectControls.br;
    textBoxControls.tl = objectControls.tl;
    textBoxControls.bl = objectControls.bl;
    textBoxControls.mt = objectControls.mt;
    textBoxControls.mb = objectControls.mb;

    textBoxControls.mr = new fabric.Control({
      x: 0.5,
      y: 0,
      actionHandler: controlsUtils.changeWidth,
      cursorStyleHandler: scaleSkewStyleHandler,
      actionName: 'resizing'
    });

    textBoxControls.ml = new fabric.Control({
      x: -0.5,
      y: 0,
      actionHandler: controlsUtils.changeWidth,
      cursorStyleHandler: scaleSkewStyleHandler,
      actionName: 'resizing'
    });
  }
})();
