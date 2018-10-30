'use strict';
import { StatusBar } from './status_bar';
import * as utils from './utils';
import { commands, window, ExtensionContext, workspace, ConfigurationChangeEvent } from 'vscode';

let paredit = require('paredit.js');

const languages = new Set(["clojure", "lisp", "scheme"]);
let enabled = true,
    expandState = { range: null, prev: null };

const navigate = (fn, ...args) =>
    ({ textEditor, ast, selection }) => {
        let res = fn(ast, selection.cursor, ...args);
        utils.select(textEditor, res);
    }

const yank = (fn, ...args) =>
    ({ textEditor, ast, selection }) => {
        let res = fn(ast, selection.cursor, ...args),
            positions = typeof (res) === "number" ? [selection.cursor, res] : res;
        utils.copy(textEditor, positions);
    }

const cut = (fn, ...args) =>
    ({ textEditor, ast, selection }) => {
        let res = fn(ast, selection.cursor, ...args),
            positions = typeof (res) === "number" ? [selection.cursor, res] : res;
        utils.cut(textEditor, positions);
    }

const navigateExpandSelecion = (fn, ...args) =>
    ({ textEditor, ast, selection }) => {
        let range = textEditor.selection,
            res = fn(ast, selection.start, selection.end, ...args);
        if (expandState.prev == null || !range.contains(expandState.prev.range)) {
            expandState = { range: range, prev: null };
        }
        expandState = { range: utils.select(textEditor, res), prev: expandState };
    }

function navigateContractSelecion({ textEditor, selection }) {
    let range = textEditor.selection;
    if (expandState.prev && expandState.prev.range && range.contains(expandState.prev.range)) {
        textEditor.selection = expandState.prev.range;
        expandState = expandState.prev;
    }
}

function indent({ textEditor, selection }) {
    let src = textEditor.document.getText(),
        ast = paredit.parse(src),
        res = paredit.editor.indentRange(ast, src, selection.start, selection.end);

    utils
        .edit(textEditor, utils.commands(res))
        .then((applied?) => utils.undoStop(textEditor));
}

const edit = (fn, ...args) =>
    ({ textEditor, src, ast, selection }) => {
        let res = fn(ast, src, selection.cursor, ...args);

        if (res)
            if (res.changes.length > 0) {
                let cmd = utils.commands(res),
                    sel = {
                        start: Math.min(...cmd.map(c => c.start)),
                        end: Math.max(...cmd.map(utils.end))
                    };

                utils
                    .edit(textEditor, cmd)
                    .then((applied?) => {
                        utils.select(textEditor, res.newIndex);
                        indent({
                            textEditor: textEditor,
                            selection: sel
                        })
                    });
            }
            else
                utils.select(textEditor, res.newIndex);
    }

const editWithEndIdx = (fn, args) =>
    ({ textEditor, src, ast, selection }) => {
        let res = fn(ast, src, selection.start, { ...args, endIdx: selection.end });
        if (res)
            if (res.changes.length > 0) {
                let cmd = utils.commands(res),
                    sel = {
                        start: Math.min(...cmd.map(c => c.start)),
                        end: Math.max(...cmd.map(utils.end))
                    };

                utils
                    .edit(textEditor, cmd)
                    .then((applied?) => {
                        utils.select(textEditor, res.newIndex);
                        indent({
                            textEditor: textEditor,
                            selection: sel
                        })
                    });
            }
            else
                utils.select(textEditor, res.newIndex);
    }

const createNavigationCopyCutCommands = (commands) => {
    const capitalizeFirstLetter = (s) => { return s.charAt(0).toUpperCase() + s.slice(1); }

    let result: [string, Function][] = new Array<[string, Function]>();
    Object.keys(commands).forEach((c) => {
        result.push([`paredit.${c}`, navigate(commands[c])]);
        result.push([`paredit.yank${capitalizeFirstLetter(c)}`, yank(commands[c])]);
        result.push([`paredit.cut${capitalizeFirstLetter(c)}`, cut(commands[c])]);
    });
    return result;
}

const navCopyCutcommands = {
    'rangeForDefun': paredit.navigator.rangeForDefun,
    'forwardSexp': paredit.navigator.forwardSexp,
    'backwardSexp': paredit.navigator.backwardSexp,
    'forwardDownSexp': paredit.navigator.forwardDownSexp,
    'backwardUpSexp': paredit.navigator.backwardUpSexp,
    'closeList': paredit.navigator.closeList
};

const pareditCommands: [string, Function][] = [

    // SELECTING
    ['paredit.sexpRangeExpansion', navigateExpandSelecion(paredit.navigator.sexpRangeExpansion)],
    ['paredit.sexpRangeContraction', navigateContractSelecion],

    // NAVIGATION, COPY, CUT
    // (Happens in createNavigationCopyCutCommands())

    // EDITING
    ['paredit.slurpSexpForward', edit(paredit.editor.slurpSexp, { 'backward': false })],
    ['paredit.slurpSexpBackward', edit(paredit.editor.slurpSexp, { 'backward': true })],
    ['paredit.barfSexpForward', edit(paredit.editor.barfSexp, { 'backward': false })],
    ['paredit.barfSexpBackward', edit(paredit.editor.barfSexp, { 'backward': true })],
    ['paredit.spliceSexp', edit(paredit.editor.spliceSexp)],
    ['paredit.splitSexp', edit(paredit.editor.splitSexp)],
    ['paredit.killSexpForward', edit(paredit.editor.killSexp, { 'backward': false })],
    ['paredit.killSexpBackward', edit(paredit.editor.killSexp, { 'backward': true })],
    ['paredit.spliceSexpKillForward', edit(paredit.editor.spliceSexpKill, { 'backward': false })],
    ['paredit.spliceSexpKillBackward', edit(paredit.editor.spliceSexpKill, { 'backward': true })],
    ['paredit.deleteForward', editWithEndIdx(paredit.editor.delete, { 'backward': false })],
    ['paredit.deleteBackward', editWithEndIdx(paredit.editor.delete, { 'backward': true })],
    ['paredit.wrapAroundParens', edit(paredit.editor.wrapAround, '(', ')')],
    ['paredit.wrapAroundSquare', edit(paredit.editor.wrapAround, '[', ']')],
    ['paredit.wrapAroundCurly', edit(paredit.editor.wrapAround, '{', '}')],
    ['paredit.indentRange', indent],
    ['paredit.transpose', edit(paredit.editor.transpose)]];

function wrapPareditCommand(fn) {
    return () => {

        let textEditor = window.activeTextEditor;
        let doc = textEditor.document;
        if (!enabled || !languages.has(doc.languageId)) return;

        let src = textEditor.document.getText();
        fn({
            textEditor: textEditor,
            src: src,
            ast: paredit.parse(src),
            selection: utils.getSelection(textEditor)
        });
    }
}

function setKeyMapConf() {
    let keyMap = workspace.getConfiguration().get('calva.paredit.defaultKeyMap');
    commands.executeCommand('setContext', 'paredit:keyMap', keyMap);
}
setKeyMapConf();

export function activate(context: ExtensionContext) {

    let statusBar = new StatusBar();

    context.subscriptions.push(

        statusBar,
        commands.registerCommand('paredit.toggle', () => { enabled = !enabled; statusBar.enabled = enabled; }),
        window.onDidChangeActiveTextEditor((e) => statusBar.visible = languages.has(e.document.languageId)),
        workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
            console.log(e);
            if (e.affectsConfiguration('calva.paredit.defaultKeyMap')) {
                setKeyMapConf();
            }
        }),

        ...createNavigationCopyCutCommands(navCopyCutcommands)
            .map(([command, fn]) => commands.registerCommand(command, wrapPareditCommand(fn))),
        ...pareditCommands
            .map(([command, fn]) => commands.registerCommand(command, wrapPareditCommand(fn))));
}

// static configure(context: ExtensionContext) {
//     context.subscriptions.push(workspace.onDidChangeConfiguration(configuration.onConfigurationChanged, configuration));
// }

// private _onDidChange = new EventEmitter<ConfigurationChangeEvent>();
// get onDidChange(): Event<ConfigurationChangeEvent> {
//     return this._onDidChange.event;
// }

// private onConfigurationChanged(e: ConfigurationChangeEvent) {
//     if (!e.affectsConfiguration(ExtensionKey, null!)) return;

//     Container.resetConfig();
//     if (Container.pages !== undefined) {
//         Container.pages.refresh();
//     }

//     if (configuration.changed(e, configuration.name('defaultGravatarsStyle').value)) {
//         clearGravatarCache();
//     }

//     const section = configuration.name('keymap').value;
//     if (configuration.changed(e, section)) {
//         setCommandContext(CommandContext.KeyMap, this.get<KeyMap>(section));
//     }

//     this._onDidChange.fire(e);
// }

export function deactivate() {
}