var coffeemugg, coffee, logger, elements, merge_elements, NEWLINE, CMContext, HTMLPlugin, g_context;

if (typeof window !== "undefined" && window !== null) {
    coffeemugg = window.CoffeeMug = {};
    coffee = typeof CoffeeScript !== "undefined" && CoffeeScript !== null ? CoffeeScript : null;
    logger = {
        debug: function(msg) {
            return console.log("debug: " + msg);
        },
        info: function(msg) {
            return console.log("info: " + msg);
        },
        warn: function(msg) {
            return console.log("warn: " + msg);
        },
        error: function(msg) {
            return console.log("error: " + msg);
        }
    };
} else {
    coffeemugg = exports;
    logger = require("nogg").logger("coffeemugg");
    coffee = require("coffee-script");
}

coffeemugg.version = "0.0.2";

coffeemugg.doctypes = {
    "default": "<!DOCTYPE html>",
    "5": "<!DOCTYPE html>",
    xml: '<?xml version="1.0" encoding="utf-8" ?>',
    transitional: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    strict: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    frameset: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">',
    "1.1": '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    basic: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">',
    mobile: '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">',
    ce: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "ce-html-1.0-transitional.dtd">'
};

elements = {
    regular: "a abbr address article aside audio b bdi bdo blockquote body button\n canvas caption cite code colgroup datalist dd del details dfn div dl dt em\n fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup\n html i iframe ins kbd label legend li map mark menu meter nav noscript object\n ol optgroup option output p pre progress q rp rt ruby s samp script section\n select small span strong style sub summary sup table tbody td textarea tfoot\n th thead time title tr u ul video",
    "void": "area base br col command embed hr img input keygen link meta param\n source track wbr",
    obsolete: "applet acronym bgsound dir frameset noframes isindex listing\n nextid noembed plaintext rb strike xmp big blink center font marquee multicol\n nobr spacer tt",
    obsolete_void: "basefont frame"
};

merge_elements = function(args) {
    var result, a, element, _obj_$bmq3$_, _i_$Wfc9$_, _len_$eegC$_, _obj_$eIZW$_, _i_$pc4E$_, _len_$DxFb$_;
    result = [];
    _obj_$eIZW$_ = args;
    _i_$pc4E$_ = 0;
    _len_$DxFb$_ = _obj_$eIZW$_.length;
    for (; _i_$pc4E$_ < _len_$DxFb$_; _i_$pc4E$_ = _i_$pc4E$_ + 1) {
        a = _obj_$eIZW$_[_i_$pc4E$_];
        _obj_$bmq3$_ = elements[a].split(" ");
        _i_$Wfc9$_ = 0;
        _len_$eegC$_ = _obj_$bmq3$_.length;
        for (; _i_$Wfc9$_ < _len_$eegC$_; _i_$Wfc9$_ = _i_$Wfc9$_ + 1) {
            element = _obj_$bmq3$_[_i_$Wfc9$_];
            if (!(result.indexOf(element) > -1)) {
                result.push(element);
            }
        }
    }
    return result;
};

coffeemugg.tags = merge_elements("regular", "obsolete", "void", "obsolete_void");

coffeemugg.self_closing = merge_elements("void", "obsolete_void");

NEWLINE = {};

coffeemugg.CMContext = CMContext = function(options) {
    var context, plugins, ref_$Q3Mm$_, plugin, _obj_$PNgH$_, _i_$D8Dy$_, _len_$JmbD$_;
    options = typeof options !== "undefined" && options !== null ? options : {};
    options.format = options.format || on;
    options.autoescape = options.autoescape || off;
    context = {
        options: options,
        _buffer: "",
        _newline: "",
        _indent: "",
        render: function(contents, args) {
            if (typeof contents === "string" && typeof coffee !== "undefined" && coffee !== null) {
                eval("contents = function () {" + coffee.compile(contents, {
                    bare: true
                }) + "}");
            }
            this.reset();
            if (typeof contents === "function") {
                contents.call(this, args);
            }
            return this;
        },
        render_tag: function(name, args) {
            var a, contents, attrs, idclass, _obj_$jSwY$_, _i_$b98f$_, _len_$rLoI$_;
            _obj_$jSwY$_ = args;
            _i_$b98f$_ = 0;
            _len_$rLoI$_ = _obj_$jSwY$_.length;
            for (; _i_$b98f$_ < _len_$rLoI$_; _i_$b98f$_ = _i_$b98f$_ + 1) {
                a = _obj_$jSwY$_[_i_$b98f$_];
                switch (typeof a) {
                  case "function":
                    contents = a.bind(this);
                    break;
                  case "object":
                    attrs = a;
                    break;
                  case "number":
                  case "boolean":
                    contents = a;
                    break;
                  case "string":
                    if (args.length === 1) {
                        contents = a;
                    } else {
                        if (a === args[0]) {
                            idclass = a;
                        } else {
                            contents = a;
                        }
                    }
                    break;
                  default:
                    undefined;
                }
            }
            this.text("" + this._newline + this._indent + "<" + name);
            if (idclass) {
                this.render_idclass(idclass);
            }
            if (attrs) {
                this.render_attrs(attrs);
            }
            if ("in"(name, coffeemugg.self_closing)) {
                this.text(" />");
            } else {
                this.text(">");
                this.render_contents(contents);
                this.text("</" + name + ">");
            }
            return NEWLINE;
        },
        render_idclass: function(str) {
            var classes, i, id, _obj_$cohX$_, _i_$GXZB$_, _len_$RovZ$_;
            classes = [];
            str = String(str).replace('"', "&quot;");
            _obj_$cohX$_ = str.split(".");
            _i_$GXZB$_ = 0;
            _len_$RovZ$_ = _obj_$cohX$_.length;
            for (; _i_$GXZB$_ < _len_$RovZ$_; _i_$GXZB$_ = _i_$GXZB$_ + 1) {
                i = _obj_$cohX$_[_i_$GXZB$_];
                if (i[0] === "#") {
                    id = i.slice(1, undefined, 1);
                } else {
                    if (!(i === "")) {
                        classes.push(i);
                    }
                }
            }
            if (id) {
                this.text(' id="' + id + '"');
            }
            if (classes.length > 0) {
                return this.text(' class="' + classes.join(" ") + '"');
            }
        },
        render_attrs: function(obj) {
            var accum_$1MRF$_, _obj_$og63$_, v;
            accum_$1MRF$_ = [];
            _obj_$og63$_ = obj;
            for (k in _obj_$og63$_) {
                v = _obj_$og63$_[k];
                if (typeof v === "boolean" && v) {
                    v = k;
                }
                if (v) {
                    accum_$1MRF$_.push(this.text(" " + k + '="' + String(v).replace('"', "&quot;") + '"'));
                }
            }
            return accum_$1MRF$_;
        },
        render_contents: function(contents, args) {
            if (typeof contents === "function") {
                if (this.options.format) {
                    this._indent = this._indent + "  ";
                }
                contents = contents.call(this, args);
                if (this.options.format) {
                    this._indent = this._indent.slice(2, undefined, 1);
                }
                if (contents === NEWLINE) {
                    this.text("" + this._newline + this._indent);
                }
            }
            switch (typeof contents) {
              case "string":
              case "number":
              case "boolean":
                this.text(this.esc(contents));
                break;
              default:
                undefined;
            }
            return null;
        },
        esc: function(txt) {
            if (this.options.autoescape) {
                return this.h(txt);
            } else {
                return txt;
            }
        },
        h: function(txt) {
            return String(txt).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;");
        },
        doctype: function(type) {
            type = typeof type !== "undefined" && type !== null ? type : "default";
            return this.text(this._indent + coffeemugg.doctypes[type]);
        },
        text: function(txt) {
            this._buffer = this._buffer + txt;
            if (this.options.format) {
                this._newline = "\n";
            }
            return null;
        },
        tag: function(name, args) {
            return this.render_tag(name, args);
        },
        comment: function(cmt) {
            this.text("" + this._newline + this._indent + "<!--" + cmt + "-->");
            return NEWLINE;
        },
        toString: function() {
            return this._buffer;
        },
        reset: function() {
            this._buffer = "";
            this._newline = "";
            this._indent = "";
            return this;
        }
    };
    plugins = (ref_$Q3Mm$_ = options.plugins) !== null && ref_$Q3Mm$_ !== undefined ? ref_$Q3Mm$_ : [];
    plugins.unshift(HTMLPlugin);
    _obj_$PNgH$_ = plugins;
    _i_$D8Dy$_ = 0;
    _len_$JmbD$_ = _obj_$PNgH$_.length;
    for (; _i_$D8Dy$_ < _len_$JmbD$_; _i_$D8Dy$_ = _i_$D8Dy$_ + 1) {
        plugin = _obj_$PNgH$_[_i_$D8Dy$_];
        if (typeof plugin === "string") {
            plugin = require(plugin);
        }
        plugin(context);
    }
    return context;
};

HTMLPlugin = function(context) {
    var tag, _obj_$X9bM$_, _i_$5ynn$_, _len_$rVM4$_, coffeescript_helpers;
    _obj_$X9bM$_ = coffeemugg.tags.concat(coffeemugg.self_closing);
    _i_$5ynn$_ = 0;
    _len_$rVM4$_ = _obj_$X9bM$_.length;
    for (; _i_$5ynn$_ < _len_$rVM4$_; _i_$5ynn$_ = _i_$5ynn$_ + 1) {
        tag = _obj_$X9bM$_[_i_$5ynn$_];
        (function(tag) {
            context[tag] = function() {
                return this.render_tag(tag, arguments);
            };
        })(tag);
    }
    context.ie = function(condition, contents) {
        this.text("" + this._newline + this._indent + "<!--[if " + condition + "]>");
        this.render_contents(contents);
        this.text("<![endif]-->");
        return NEWLINE;
    };
    coffeescript_helpers = "\n    var __extends = function(child, parent) {\n      for (var key in parent) {\n        if (__hasProp.call(parent, key)) child[key] = parent[key];\n      }\n      function ctor() { this.constructor = child; }\n      ctor.prototype = parent.prototype;\n      child.prototype = new ctor();\n      child.__super__ = parent.prototype;\n      return child;\n    },\n    __bind = function(fn, me){\n      return function(){ return fn.apply(me, arguments); };\n    },\n    __indexOf = [].indexOf || function(item) {\n      for (var i = 0, l = this.length; i < l; i++) {\n        if (i in this && this[i] === item) return i;\n      }\n      return -1;\n    },\n    __hasProp = {}.hasOwnProperty,\n    __slice = [].slice;\n  ".replace("\\ +", " ").replace("\\n", "");
    context.coffeescript = function(param) {
        var css_props, valid_css_prop, p, _obj_$rKB5$_, _i_$fluw$_, _len_$m8RE$_, parse_prop, parse_selector;
        switch (typeof param) {
          case "function":
            this.script("" + coffeescript_helpers + "(" + param + ").call(this);");
            break;
          case "string":
            this.script({
                type: "text/coffeescript"
            }, function() {
                return param;
            });
            break;
          case "object":
            param.type = "text/coffeescript";
            this.script(param);
            break;
          default:
            undefined;
        }
        css_props = "\n      align-content align-items align-self alignment-adjust alignment-baseline\n      anchor-point animation animation-delay animation-direction animation-duration\n      animation-iteration-count animation-name animation-play-state\n      animation-timing-function appearance azimuth backface-visibility background\n      background-attachment background-clip background-color background-image\n      background-origin background-position background-repeat background-size\n      baseline-shift binding bleed bookmark-label bookmark-level bookmark-state\n      bookmark-target border border-bottom border-bottom-color\n      border-bottom-left-radius border-bottom-right-radius border-bottom-style\n      border-bottom-width border-collapse border-color border-image\n      border-image-outset border-image-repeat border-image-slice\n      border-image-source border-image-width border-left border-left-color\n      border-left-style border-left-width border-radius border-right\n      border-right-color border-right-style border-right-width border-spacing\n      border-style border-top border-top-color border-top-left-radius\n      border-top-right-radius border-top-style border-top-width border-width bottom\n      box-decoration-break box-shadow box-sizing break-after break-before\n      break-inside caption-side clear clip color color-profile column-count\n      column-fill column-gap column-rule column-rule-color column-rule-style\n      column-rule-width column-span column-width columns content counter-increment\n      counter-reset crop cue cue-after cue-before cursor direction display\n      dominant-baseline drop-initial-after-adjust drop-initial-after-align\n      drop-initial-before-adjust drop-initial-before-align drop-initial-size\n      drop-initial-value elevation empty-cells fit fit-position flex flex-basis\n      flex-direction flex-flow flex-grow flex-shrink flex-wrap float float-offset\n      font font-feature-settings font-family font-kerning font-language-override\n      font-size font-size-adjust font-stretch font-style font-synthesis font-variant\n      font-variant-alternates font-variant-caps font-variant-east-asian\n      font-variant-ligatures font-variant-numeric font-variant-position font-weight\n      hanging-punctuation height hyphens icon image-orientation image-rendering\n      image-resolution inline-box-align justify-content left letter-spacing\n      line-break line-height line-stacking line-stacking-ruby line-stacking-shift\n      line-stacking-strategy list-style list-style-image list-style-position\n      list-style-type margin margin-bottom margin-left margin-right margin-top\n      marker-offset marks marquee-direction marquee-loop marquee-play-count\n      marquee-speed marquee-style max-height max-width min-height min-width move-to\n      nav-down nav-index nav-left nav-right nav-up opacity order orphans outline\n      outline-color outline-offset outline-style outline-width overflow\n      overflow-style overflow-wrap overflow-x overflow-y padding padding-bottom\n      padding-left padding-right padding-top page page-break-after page-break-before\n      page-break-inside page-policy pause pause-after pause-before perspective\n      perspective-origin pitch pitch-range play-during position presentation-level\n      punctuation-trim quotes rendering-intent resize rest rest-after rest-before\n      richness right rotation rotation-point ruby-align ruby-overhang ruby-position\n      ruby-span size speak speak-as speak-header speak-numeral speak-punctuation\n      speech-rate stress string-set tab-size table-layout target target-name\n      target-new target-position text-align text-align-last text-decoration\n      text-decoration-color text-decoration-line text-decoration-skip\n      text-decoration-style text-emphasis text-emphasis-color text-emphasis-position\n      text-emphasis-style text-height text-indent text-justify text-outline\n      text-shadow text-space-collapse text-transform text-underline-position\n      text-wrap top transform transform-origin transform-style transition\n      transition-delay transition-duration transition-property\n      transition-timing-function unicode-bidi vertical-align visibility voice-balance\n      voice-duration voice-family voice-pitch voice-range voice-rate voice-stress\n      voice-volume volume white-space widows width word-break word-spacing word-wrap\n      z-index \n    ".split("\\s+");
        valid_css_prop = {};
        _obj_$rKB5$_ = css_props;
        _i_$fluw$_ = 0;
        _len_$m8RE$_ = _obj_$rKB5$_.length;
        for (; _i_$fluw$_ < _len_$m8RE$_; _i_$fluw$_ = _i_$fluw$_ + 1) {
            p = _obj_$rKB5$_[_i_$fluw$_];
            valid_css_prop[p] = true;
        }
        parse_prop = function(prop, val, parent, open) {
            var t;
            t = prop.replace("_", "-");
            if (valid_css_prop[t]) {
                prop = t;
            }
            if (typeof val === "object") {
                if (open) {
                    this.text("" + this._newline + this._indent + "}");
                }
                parse_selector.call(this, prop, val, parent);
                return false;
            } else {
                if (!open) {
                    this.text("" + this._newline + this._indent + parent + " {");
                }
                if (typeof val === "number") {
                    this.text("" + this._newline + this._indent + prop + ": " + val + this.unit + ";");
                } else {
                    this.text("" + this._newline + this._indent + prop + ": " + val + ";");
                }
                return true;
            }
        };
        parse_selector = function(selector, obj, parent) {
            var selectors, accum_$PoHi$_, accum_$pHiE$_, s, _obj_$dNj3$_, _i_$zGT1$_, _len_$RPEb$_, _obj_$lGr3$_, _i_$847W$_, _len_$ZO8a$_, open, o, _obj_$hZNd$_, val, _obj_$hNYN$_, _i_$TokP$_, _len_$K8Fp$_, _obj_$3Dkj$_;
            if (parent) {
                selectors = accum_$PoHi$_ = [];
                _obj_$lGr3$_ = parent.split("\\s*,\\s*");
                _i_$847W$_ = 0;
                _len_$ZO8a$_ = _obj_$lGr3$_.length;
                for (; _i_$847W$_ < _len_$ZO8a$_; _i_$847W$_ = _i_$847W$_ + 1) {
                    p = _obj_$lGr3$_[_i_$847W$_];
                    accum_$pHiE$_ = [];
                    _obj_$dNj3$_ = selector.split("\\s*,\\s*");
                    _i_$zGT1$_ = 0;
                    _len_$RPEb$_ = _obj_$dNj3$_.length;
                    for (; _i_$zGT1$_ < _len_$RPEb$_; _i_$zGT1$_ = _i_$zGT1$_ + 1) {
                        s = _obj_$dNj3$_[_i_$zGT1$_];
                        if (s.indexOf("&") >= 0) {
                            accum_$pHiE$_.push(s.replace("&", p));
                        } else {
                            "" + p + " " + s;
                        }
                    }
                    accum_$PoHi$_.push(accum_$pHiE$_);
                }
                return accum_$PoHi$_;
                selector = selectors.join(",");
            }
            open = false;
            if (this.options.format) {
                this._indent = this._indent + "  ";
            }
            if ("instanceof"(obj, Array)) {
                _obj_$hNYN$_ = obj;
                _i_$TokP$_ = 0;
                _len_$K8Fp$_ = _obj_$hNYN$_.length;
                for (; _i_$TokP$_ < _len_$K8Fp$_; _i_$TokP$_ = _i_$TokP$_ + 1) {
                    o = _obj_$hNYN$_[_i_$TokP$_];
                    _obj_$hZNd$_ = o;
                    for (prop in _obj_$hZNd$_) {
                        val = _obj_$hZNd$_[prop];
                        open = parse_prop.call(this, prop, val, selector, open);
                    }
                }
            } else {
                if (typeof obj === "object") {
                    _obj_$3Dkj$_ = obj;
                    for (prop in _obj_$3Dkj$_) {
                        val = _obj_$3Dkj$_[prop];
                        open = parse_prop.call(this, prop, val, selector, open);
                    }
                } else {
                    throw new (Error("Don't know what to do with " + obj));
                }
            }
            if (this.options.format) {
                this._indent = this._indent.slice(2, undefined, 1);
            }
            if (open) {
                return this.text("" + this._newline + this._indent + "}");
            }
        };
        context.unit = "px";
        context.css = function(args) {
            var accum_$wnxP$_, arg, accum_$C59p$_, obj, accum_$cdlo$_, _obj_$Sgcb$_, v, _obj_$ZR3G$_, _i_$mTyy$_, _len_$sGtU$_, accum_$XhmH$_, _obj_$cgJO$_, _obj_$MjPh$_, _i_$ptRS$_, _len_$ZiCD$_;
            accum_$wnxP$_ = [];
            _obj_$MjPh$_ = args;
            _i_$ptRS$_ = 0;
            _len_$ZiCD$_ = _obj_$MjPh$_.length;
            for (; _i_$ptRS$_ < _len_$ZiCD$_; _i_$ptRS$_ = _i_$ptRS$_ + 1) {
                arg = _obj_$MjPh$_[_i_$ptRS$_];
                if ("instanceof"(arg, Array)) {
                    accum_$C59p$_ = [];
                    _obj_$ZR3G$_ = arg;
                    _i_$mTyy$_ = 0;
                    _len_$sGtU$_ = _obj_$ZR3G$_.length;
                    for (; _i_$mTyy$_ < _len_$sGtU$_; _i_$mTyy$_ = _i_$mTyy$_ + 1) {
                        obj = _obj_$ZR3G$_[_i_$mTyy$_];
                        accum_$cdlo$_ = [];
                        _obj_$Sgcb$_ = obj;
                        for (k in _obj_$Sgcb$_) {
                            v = _obj_$Sgcb$_[k];
                            accum_$cdlo$_.push(parse_selector.call(this, k, v));
                        }
                        accum_$C59p$_.push(accum_$cdlo$_);
                    }
                    accum_$wnxP$_.push(accum_$C59p$_);
                } else {
                    if (typeof arg === "object") {
                        accum_$XhmH$_ = [];
                        _obj_$cgJO$_ = arg;
                        for (k in _obj_$cgJO$_) {
                            v = _obj_$cgJO$_[k];
                            accum_$XhmH$_.push(parse_selector.call(this, k, v));
                        }
                        accum_$wnxP$_.push(accum_$XhmH$_);
                    } else {
                        throw new (Error("@css takes objects or arrays of objects"));
                    }
                }
            }
            return accum_$wnxP$_;
        };
    };
    return context;
};

g_context = undefined;

coffeemugg.render = function(template, options, args) {
    var ref_$4Brf$_;
    if (typeof options !== "undefined" && options !== null ? (ref_$4Brf$_ = options.plugins) !== null && ref_$4Brf$_ !== undefined : undefined) {
        throw new (Error("To install plugins to the global renderer, you must call coffeemugg.install_plugin."));
    }
    g_context = typeof g_context !== "undefined" && g_context !== null ? g_context : CMContext();
    if (typeof options !== "undefined" && options !== null) {
        g_context.options = options;
    }
    return g_context.render(template, args).toString();
};

coffeemugg.install_plugin = function(plugin) {
    if (typeof plugin === "string") {
        plugin = require(plugin);
    }
    return plugin(g_context);
};