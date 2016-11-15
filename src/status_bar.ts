'use strict';
import {window, StatusBarAlignment, StatusBarItem} from 'vscode';

const activeColour = "white";
const inactiveColour = "#b3b3b3";

const colour = {"active": "white", "inactive": "#b3b3b3"};

export class StatusBar {

    private _enabled: Boolean;
    private _strict: Boolean;
    private _visible: Boolean;

    private _toggleBarItem: StatusBarItem;
    private _strictBarItem: StatusBarItem;

    constructor(enabled = true, strict = true, visible = true) {
        this._toggleBarItem = window.createStatusBarItem();
        this._toggleBarItem.text = "(λ)";
        this._toggleBarItem.command = 'paredit.toggle';
        this.enabled = enabled;
        this.visible = visible;

        this._strictBarItem = window.createStatusBarItem();
        this._strictBarItem.text = "strict";
        this._strictBarItem.command = 'paredit.toggleStrict';
        this.strict = strict;
        this.visible = visible;
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(value: Boolean) {
        this._enabled = value;

        if (this._enabled) {
            this._toggleBarItem.tooltip = "Disable Paredit"
            this._toggleBarItem.color = colour.active;
        } else {
            this._toggleBarItem.tooltip = "Enable Paredit"
            this._toggleBarItem.color = colour.inactive;  
        }
    }

    get strict() {
        return this._strict;
    }

    set strict(value: Boolean) {
        this._strict = value;

        if (this._strict) {
            this._strictBarItem.tooltip = "Disable Paredit Strict"
            this._strictBarItem.color = colour.active;
        } else {
            this._strictBarItem.tooltip = "Enable Paredit Strict"
            this._strictBarItem.color = colour.inactive;  
        }
    }

    get visible(): Boolean {
        return this._visible;
    }

    set visible(value: Boolean) {
        if (value) {
            this._toggleBarItem.show();
            //this._strictBarItem.show();
        } else {
            this._toggleBarItem.hide();
            //this._strictBarItem.hide();
        }
    }

    dispose() {
        this._toggleBarItem.dispose();
        this._strictBarItem.dispose();
    }
}