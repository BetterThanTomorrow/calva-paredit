'use strict';
import {commands, window, TextEditor, TextEditorEdit, ExtensionContext, Range, Selection} from 'vscode';

export function getSelection (editor: TextEditor) {
    return {"start":  editor.document.offsetAt(editor.selection.start),
            "end":    editor.document.offsetAt(editor.selection.end),
            "cursor": editor.document.offsetAt(editor.selection.active)};
}

export function scrollTo (editor: TextEditor, index: number) {
    let pos = editor.document.positionAt(index);
    editor.selection = new Selection(pos, pos);
    let rng = new Range(pos, pos);
    editor.revealRange(rng);
}

export function select (editor: TextEditor, start: number, end: number) {
    let pos1 = editor.document.positionAt(start);
    let pos2 = editor.document.positionAt(end);

    editor.selection = new Selection(pos1, pos2);

    let rng = new Range(pos1, pos2);
    editor.revealRange(rng);
}

export function edit (editor: TextEditor, edit: TextEditorEdit, edits) {
    for (let change of edits.changes) {

        if (change[0] === 'insert') {
            let pos = editor.document.positionAt(change[1]);
            edit.insert(pos, change[2]);
        }
        else {
            let start = editor.document.positionAt(change[1]);
            let end   = editor.document.positionAt(change[1] + change[2]);
            edit.delete(new Range(start, end));
        }
    };

    scrollTo(editor, edits.newIndex);
}