﻿import {SurveyTextWorker} from "./textWorker";
import * as Survey from "survey-knockout";

export class SurveyJSONEditor {
    public static updateTextTimeout: number = 1000;

    private isProcessingImmediately: boolean = false;
    private aceEditor: AceAjax.Editor;
    private textWorker: SurveyTextWorker;
    koText: any;
    koErrors: any;

    constructor() {
        this.koText = ko.observable("");
        this.koErrors = ko.observableArray();
        var self = this;
        this.koText.subscribe(function (newValue) {
            self.onJsonEditorChanged();
        });
    }
    public init() {
        if (!this.hasAceEditor) return;
        this.aceEditor = ace.edit("surveyjsJSONEditor");
        var self = this;
        this.aceEditor.setTheme("ace/theme/monokai");
        this.aceEditor.session.setMode("ace/mode/json");
        this.aceEditor.setShowPrintMargin(false);
        this.aceEditor.getSession().on("change", function () {
            self.onJsonEditorChanged();
        });
        this.aceEditor.getSession().setUseWorker(true);
        SurveyTextWorker.newLineChar = this.aceEditor.session.doc.getNewLineCharacter();
    }
    public get hasAceEditor(): boolean { return typeof ace !== "undefined"; }
    public get text(): string {
        if (!this.hasAceEditor) return this.koText();
        return this.aceEditor.getValue();
    }
    public set text(value: string) {
        this.isProcessingImmediately = true;
        this.koText(value);
        if (this.aceEditor) {
            this.aceEditor.setValue(value);
            this.aceEditor.renderer.updateFull(true);
        }
        this.processJson(value);
        this.isProcessingImmediately = false;
    }
    public show(value: string) {
        this.text = value;
        if (this.aceEditor) {
            this.aceEditor.focus();
        }
    }
    public get isJsonCorrect(): boolean {
        this.textWorker = new SurveyTextWorker(this.text);
        return this.textWorker.isJsonCorrect;
    }
    public get survey(): Survey.Survey { return this.textWorker.survey; }
    private timeoutId: number = -1;
    private onJsonEditorChanged(): any {
        if (this.timeoutId > -1) {
            clearTimeout(this.timeoutId);
        }
        if (this.isProcessingImmediately) {
            this.timeoutId = -1;
        } else {
            var self = this;
            this.timeoutId = setTimeout(function () {
                self.timeoutId = -1;
                self.processJson(self.text);
            }, SurveyJSONEditor.updateTextTimeout);
        }
    }
    private processJson(text: string): any {
        this.textWorker = new SurveyTextWorker(text);
        if (this.aceEditor) {
            this.aceEditor.getSession().setAnnotations(this.createAnnotations(text, this.textWorker.errors));
        } else {
            this.koErrors(this.textWorker.errors);
        }
    }
    private createAnnotations(text: string, errors: any[]): AceAjax.Annotation[] {
        var annotations = new Array<AceAjax.Annotation>();
        for (var i = 0; i < errors.length; i++) {
            var error = errors[i];
            var annotation: AceAjax.Annotation = { row: error.position.start.row, column: error.position.start.column, text: error.text, type: "error" };
            annotations.push(annotation);
        }
        return annotations;
    }
}