"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var MPlayer = require("./mplayer");
var Adapter = (function (_super) {
    __extends(Adapter, _super);
    function Adapter(system) {
        _super.call(this);
        var self = this;
        this.logger = system.logger.Logger.getLogger('MPlayerSpeakerAdapter');
        this.player = new MPlayer({ debug: false, args: "-ao win32" });
        this.stopped = false;
        this.ready = false;
        this.lastFile = null;
        this.player
            .once("ready", function () {
            self.ready = true;
        })
            .on("stop", function () {
            self.emit("stop");
            self.stopped = true;
        })
            .on("error", function (err) {
            self.logger.error("An error occurred with mplayer while trying to play %s (Note that it may still be played) => %s", self.lastFile, err);
        });
    }
    Adapter.prototype.stop = function () {
        if (!this.stopped) {
            this.player.stop();
        }
        return this;
    };
    Adapter.prototype.play = function (file) {
        this.lastFile = file;
        if (this.ready) {
            this.player.openFile(file);
        }
        else {
            this.player.once("ready", this.play.bind(this, file));
        }
        return this;
    };
    return Adapter;
}(events_1.EventEmitter));
exports.Adapter = Adapter;
