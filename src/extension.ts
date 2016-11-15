'use strict';
import * as utils from './utils';
import {commands, window, ExtensionContext, TextEditor, TextEditorEdit} from 'vscode';
let paredit = require('paredit.js');

const languages = new Set(["clojure", "lisp", "scheme"]);

function wrapPareditCommand(fn) {
    return (textEditor: TextEditor, edit: TextEditorEdit) => {

        let doc = textEditor.document;
        if (!languages.has(doc.languageId)) return;

        let src = textEditor.document.getText();
        let ast = paredit.parse(src);
        let sel = utils.getSelection(textEditor);

        let res = fn({'source': src, 'ast': ast, 'selection': sel});

        if (typeof res === "number")
            utils.scrollTo(textEditor, res);
        else if (res instanceof Array)
            utils.select(textEditor, res[0], res[1]);
        else if (res instanceof Object)
            utils.edit(textEditor, edit, res);
        else return;
    }
}

function registerPareditCommand(command: string, fn) {
    return commands.registerTextEditorCommand(command, wrapPareditCommand(fn));
}

export function activate(context: ExtensionContext) {

    let navigate = 
        (fn, ...args) => ({ast, selection}) => fn(ast, selection.cursor, ...args);
    let navigateRange = 
        (fn, ...args) => ({ast, selection}) => fn(ast, selection.start, selection.end, ...args)

    let edit = 
        (fn, ...args) => ({ast, selection, source}) => fn(ast, source, selection.cursor, ...args);
    let editRange = 
        (fn, ...args) => ({ast, selection, source}) => fn(ast, source, selection.start, selection.end, ...args);

    context.subscriptions.push(

        // NAVIGATION
        registerPareditCommand('paredit.forwardSexp',            navigate(paredit.navigator.forwardSexp)),
        registerPareditCommand('paredit.backwardSexp',           navigate(paredit.navigator.backwardSexp)),
        registerPareditCommand('paredit.forwardDownSexp',        navigate(paredit.navigator.forwardDownSexp)),
        registerPareditCommand('paredit.backwardUpSexp',         navigate(paredit.navigator.backwardUpSexp)),
        registerPareditCommand('paredit.sexpRangeExpansion',     navigateRange(paredit.navigator.sexpRangeExpansion)),
        registerPareditCommand('paredit.closeList',              navigate(paredit.navigator.closeList)),
        registerPareditCommand('paredit.rangeForDefun',          navigate(paredit.navigator.rangeForDefun)),
        
        // EDITING
        registerPareditCommand('paredit.slurpSexpForward',       edit(paredit.editor.slurpSexp, {'backward': false})),
        registerPareditCommand('paredit.slurpSexpBackward',      edit(paredit.editor.slurpSexp, {'backward': true})),
        registerPareditCommand('paredit.barfSexpForward',        edit(paredit.editor.barfSexp, {'backward': false})),
        registerPareditCommand('paredit.barfSexpBackward',       edit(paredit.editor.barfSexp, {'backward': true})),
        registerPareditCommand('paredit.spliceSexp',             edit(paredit.editor.spliceSexp)),
        registerPareditCommand('paredit.splitSexp',              edit(paredit.editor.splitSexp)),
        registerPareditCommand('paredit.killSexpForward',        edit(paredit.editor.killSexp, {'backward': false})),
        registerPareditCommand('paredit.killSexpBackward',       edit(paredit.editor.killSexp, {'backward': true})),
        registerPareditCommand('paredit.spliceSexpKillForward',  edit(paredit.editor.spliceSexpKill, {'backward': false})),
        registerPareditCommand('paredit.spliceSexpKillBackward', edit(paredit.editor.spliceSexpKill, {'backward': true})),
        registerPareditCommand('paredit.wrapAroundParens',       edit(paredit.editor.wrapAround, '(', ')')),
        registerPareditCommand('paredit.wrapAroundSquare',       edit(paredit.editor.wrapAround, '[', ']')),
        registerPareditCommand('paredit.wrapAroundCurly',        edit(paredit.editor.wrapAround, '{', '}')),
        registerPareditCommand('paredit.indentRange',            editRange(paredit.editor.indentRange)),
        registerPareditCommand('paredit.transpose',              edit(paredit.editor.transpose)))
}

export function deactivate() {
}