# code-paredit

[Paredit](http://mumble.net/~campbell/emacs/paredit.el) for [VS Code](https://code.visualstudio.com) (a thin wrapper around [paredit.js](http://robert.kra.hn/projects/paredit-js))

**Paredit**: provides structural editing and navigation for LISPs  

Aiming for feature parity with Atom's [lisp-paredit](https://github.com/jonspalding/lisp-paredit)

## Commands

### Navigation

Default keybinding | Action
------------------ | ------
ctrl-right         | Forward Sexp
ctrl-left          | Backward Sexp
ctrl-down          | Forward Down Sexp
ctrl-up            | Backward Up Sexp
ctrl-w             | Expand Selection
---                | Close List
---                | Select Defn

### Editing

Default keybinding | Action
------------------ | ------
ctrl-alt-.         | Slurp Forward
ctrl-alt-<         | Slurp Backward
ctrl-alt-,         | Barf Forward
ctrl-alt->         | Barf Backward
ctrl-alt-s         | Splice
ctrl-alt-/         | Split Sexp
cmd-delete         | Kill Sexp Forward
cmd-backspace      | Kill Sexp Backward
ctrl-alt-down      | Splice & Kill Forward
ctrl-alt-up        | Splice & Kill Backward
ctrl-alt-(         | Wrap Around ()
ctrl-alt-[         | Wrap Around []
ctrl-alt-{         | Wrap Around {}
ctrl-alt-i         | Indent
---                | Transpose