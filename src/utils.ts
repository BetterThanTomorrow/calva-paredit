'use strict';
import { TextEditor, TextEditorEdit, Selection, Range } from 'vscode';

interface Insert {
    kind: "insert",
    start: number,
    text: string
}

interface Delete {
    kind: "delete",
    start: number,
    length: number
}

type Command = Insert | Delete;

function toCommand([command, start, arg]): Command {
    if (command === 'insert')
        return { kind: command, start: start, text: arg };
    else
        return { kind: command, start: start, length: arg };
}

export const commands = (res) => res.changes.map(toCommand);

export function end(command: Command) {
    if (command.kind === 'insert')
        return command.start + command.text.length
    else
        return command.start
}

export function getSelection(editor: TextEditor) {
    return {
        start: editor.document.offsetAt(editor.selection.start),
        end: editor.document.offsetAt(editor.selection.end),
        cursor: editor.document.offsetAt(editor.selection.active)
    };
}

export function select(editor: TextEditor, pos: any): Range {
    let start, end: number;

    if (typeof pos === "number")
        start = end = pos;
    else if (pos instanceof Array)
        start = pos[0], end = pos[1];

    let pos1 = editor.document.positionAt(start),
        pos2 = editor.document.positionAt(end),
        sel = new Selection(pos1, pos2);

    editor.selection = sel;
    editor.revealRange(sel);
    return sel;
}

export const handle = (editor: TextEditor, command: Command) =>
    edit => {
        let start = editor.document.positionAt(command.start);

        if (command.kind === 'insert')
            edit.insert(start, command.text);
        else {
            let end = start.translate(0, command.length);
            edit.delete(new Selection(start, end));
        }
    }

export const edit = (editor: TextEditor, commands: [Command]) =>
    commands
        .reduce((prev, command) =>
            prev.then((_) =>
                editor.edit(handle(editor, command),
                    { undoStopAfter: false, undoStopBefore: false })),
            Promise.resolve(true));

export function undoStop(editor: TextEditor) {
    let pos = editor.document.positionAt(0);
    editor.edit((edit) => edit.insert(pos, ""),
        { undoStopAfter: true, undoStopBefore: false })
}