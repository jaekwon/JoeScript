// TODO number prefixes
(function() {
  // Really primitive kill-ring implementation.
  var killRing = [];
  function addToRing(str) {
    killRing.push(str);
    if (killRing.length > 50) killRing.shift();
  }
  function getFromRing() { return killRing[killRing.length - 1] || ""; }
  function popFromRing() { if (killRing.length > 1) killRing.pop(); return getFromRing(); }

  CodeMirror.keyMap.sembly = {
    "Ctrl-W": function(cm) {addToRing(cm.getSelection()); cm.replaceSelection("");},
    "Ctrl-Alt-W": function(cm) {addToRing(cm.getSelection()); cm.replaceSelection("");},
    "Alt-W": function(cm) {addToRing(cm.getSelection());},
    "Ctrl-Y": function(cm) {cm.replaceSelection(getFromRing());},
    "Alt-Y": function(cm) {cm.replaceSelection(popFromRing());},
    "Ctrl-/": "undo", "Shift-Ctrl--": "undo", "Shift-Alt-,": "goDocStart", "Shift-Alt-.": "goDocEnd",
    //"Ctrl-S": "findNext", "Ctrl-R": "findPrev", "Ctrl-G": "clearSearch", "Shift-Alt-5": "replace",
    "Ctrl-Z": "undo", "Cmd-Z": "undo",
    "Shift-Ctrl-Z": "redo", "Shift-Cmd-Z": "redo",
    "Alt-/": "autocomplete",

    "Cmd-Enter":  function(cm) {cm.submit();},
    "Alt-Enter":  function(cm) {cm.submit();},
    "Ctrl-Enter": function(cm) {cm.submit();},

    "Ctrl-[": "indentLess",
    "Cmd-[": "indentLess",
    "Ctrl-]": "indentMore",
    "Cmd-]": "indentMore",

    "Cmd-A": function(cm) {cm.setSelection({line:0,ch:0}, {line:(cm.lineCount()+1),ch:0});},
    "Alt-A": function(cm) {cm.setSelection({line:0,ch:0}, {line:(cm.lineCount()+1),ch:0});},
    "Ctrl-A": function(cm) {cm.setSelection({line:0,ch:0}, {line:(cm.lineCount()+1),ch:0});},
    "Cmd-Left": function(cm) {var c = cm.getCursor(); cm.setCursor({line:c.line, ch:0}); },
    "Alt-Left": function(cm) {var c = cm.getCursor(); cm.setCursor({line:c.line, ch:0}); },
    "Ctrl-Left": function(cm) {var c = cm.getCursor(); cm.setCursor({line:c.line, ch:0}); },
    "Cmd-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setCursor({line:c.line, ch:l}); },
    "Alt-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setCursor({line:c.line, ch:l}); },
    "Ctrl-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setCursor({line:c.line, ch:l}); },
    "Shift-Cmd-Left": function(cm) {var c = cm.getCursor(); cm.setSelection({line:c.line, ch:0}, c); },
    "Shift-Alt-Left": function(cm) {var c = cm.getCursor(); cm.setSelection({line:c.line, ch:0}, c); },
    "Shift-Ctrl-Left": function(cm) {var c = cm.getCursor(); cm.setSelection({line:c.line, ch:0}, c); },
    "Shift-Cmd-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setSelection({line:c.line, ch:l}, c); },
    "Shift-Alt-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setSelection({line:c.line, ch:l}, c); },
    "Shift-Ctrl-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setSelection({line:c.line, ch:l}, c); },

    fallthrough: ["basic"]
  };

})();
