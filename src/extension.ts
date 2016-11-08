'use strict';
import {commands, window, ExtensionContext, Range, Selection} from 'vscode';
let paredit = require('paredit.js');

export function activate(context: ExtensionContext) {

    let navigate = (fn) => {
        return () => {
            let editor = window.activeTextEditor;
            if (!editor) return;

            let doc = editor.document;
            if (doc.languageId !== "clojure") return;

            let src = doc.getText();
            let ast = paredit.parse(src);

            let cur = editor.selection.active;
            let idx = doc.offsetAt(cur);
            
            let ind = fn(ast, idx);
            let pos = doc.positionAt(ind);

            editor.selection = new Selection(pos, pos);

            let rng = new Range(pos, pos);
            editor.revealRange(rng);
        }
    }

    context.subscriptions.push(
        commands.registerCommand('paredit.forwardSexp',     navigate(paredit.navigator.forwardSexp)),
        commands.registerCommand('paredit.forwardDownSexp', navigate(paredit.navigator.forwardDownSexp)),
        commands.registerCommand('paredit.backwardSexp',    navigate(paredit.navigator.backwardSexp)),
        commands.registerCommand('paredit.backwardUpSexp',  navigate(paredit.navigator.backwardUpSexp)),

        commands.registerCommand('paredit.rangeForDefun', () => {
            window.showInformationMessage('TODO: rangeForDefun');
        }),
        commands.registerCommand('paredit.sexpRangeExpansion', () => {
            window.showInformationMessage('TODO: sexpRangeExpansion');
        }),
        commands.registerCommand('paredit.sexpsAt', () => {
            window.showInformationMessage('TODO: sexpsAt');
        }),
        commands.registerCommand('paredit.containingSexpsAt', () => {
            window.showInformationMessage('TODO: containingSexpsAt');
        }),
        commands.registerCommand('paredit.nextSexp', () => {
            window.showInformationMessage('TODO: nextSexp');
        }),
        commands.registerCommand('paredit.prevSexp', () => {
            window.showInformationMessage('TODO: prevSexp');
        }),

        commands.registerCommand('paredit.wrapAround', () => {
            window.showInformationMessage('TODO: wrapAround');
        }),
        commands.registerCommand('paredit.barfSexp', () => {
            window.showInformationMessage('TODO: barfSexp');
        }),
        commands.registerCommand('paredit.closeAndNewline', () => {
            window.showInformationMessage('TODO: closeAndNewline');
        }),
        commands.registerCommand('paredit.delete', () => {
            window.showInformationMessage('TODO: delete');
        }),
        commands.registerCommand('paredit.indentRange', () => {
            window.showInformationMessage('TODO: indentRange');
        }),
        commands.registerCommand('paredit.killSexp', () => {
            window.showInformationMessage('TODO: killSexp');
        }),
        commands.registerCommand('paredit.rewrite', () => {
            window.showInformationMessage('TODO: rewrite');
        }),
        commands.registerCommand('paredit.slurpSexp', () => {
            window.showInformationMessage('TODO: slurpSexp');
        }),
        commands.registerCommand('paredit.spliceSexp', () => {
            window.showInformationMessage('TODO: spliceSexp');
        }),
        commands.registerCommand('paredit.splitSexp', () => {
            window.showInformationMessage('TODO: splitSexp');
        }));
}

export function deactivate() {
}