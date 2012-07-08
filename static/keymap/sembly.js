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
    "Ctrl-S": "findNext", "Ctrl-R": "findPrev", "Ctrl-G": "clearSearch", "Shift-Alt-5": "replace",
    "Ctrl-Z": "undo", "Cmd-Z": "undo", "Alt-/": "autocomplete",

    "Ctrl-Enter": function(cm) {cm.submit();},
    "Cmd-Enter":  function(cm) {cm.submit();},
    "Cmd-S":      function(cm) {cm.submit();},

    "Cmd-A": function(cm) {cm.setSelection({line:0,ch:0}, {line:(cm.lineCount()+1),ch:0});},
    "Cmd-Left": function(cm) {var c = cm.getCursor(); cm.setCursor({line:c.line, ch:0}); },
    "Cmd-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setCursor({line:c.line, ch:l}); },
    "Shift-Cmd-Left": function(cm) {var c = cm.getCursor(); cm.setSelection({line:c.line, ch:0}, c); },
    "Shift-Cmd-Right": function(cm) {var c = cm.getCursor(); var l = cm.getLine(c.line).length; cm.setSelection({line:c.line, ch:l}, c); },

    fallthrough: ["basic", "emacsy"]
  };

})();
