'use strict';

var MPlayer = require('./mplayer');
var EventEmitter = require("events");
var scheduler = require('node-schedule');

class Module extends EventEmitter {

    constructor(helper, info) {
        super();
        this.info = info;
        this.player = null;
        // this.helper = helper;
        this.config = {
            nrj: "http://cdn.nrjaudio.fm/audio1/fr/40101/aac_576.mp3?origine=fluxradios",
            // nrj: "C:/Users/maxime/Desktop/test.mp3"
        };
    }

    // initialize(cb){
    //     var self = this;
    //     // @todo dev
    //     class Task extends EventEmitter {
    //
    //     }
    //     var task = null;
    //
    //     // morning start Yann
    //     var rule = new scheduler.RecurrenceRule();
    //     rule.hour = 7;
    //     rule.minute = 40;
    //     rule.dayOfWeek = [1,2,3,4,5];
    //     scheduler.scheduleJob(rule, function(){
    //         task = new Task();
    //         task.options = {radioName: "nrj"};
    //         self.newTask(task);
    //     });
    //
    //     // morning end Yann
    //     var rule2 = new scheduler.RecurrenceRule();
    //     rule2.hour = 8;
    //     rule2.minute = 30;
    //     rule2.dayOfWeek = [1,2,3,4,5];
    //     scheduler.scheduleJob(rule2, function(){
    //         task.emit("stop");
    //     });
    //
    //     // ================================
    //
    //     // morning start Max
    //     var c = new scheduler.RecurrenceRule();
    //     c.hour = 9;
    //     c.minute = 0;
    //     c.dayOfWeek = [1,2,3,4,5];
    //     scheduler.scheduleJob(c, function(){
    //         task = new Task();
    //         task.options = {radioName: "nrj"};
    //         self.newTask(task);
    //     });
    //
    //     // morning end Max
    //     var d = new scheduler.RecurrenceRule();
    //     d.hour = 9;
    //     d.minute = 40;
    //     d.dayOfWeek = [1,2,3,4,5];
    //     scheduler.scheduleJob(d, function(){
    //         task.emit("stop");
    //     });
    //
    //     // @todo fin dev
    //
    //     return cb();
    // }

    onNewTask(options) {
        if (this.info.id === "startRadio") {
            this._startRadio(options);
        } else if (this.info.id === "stopRadio") {
            this._stopRadio();
        }
    }

    stopRadio() {
        this.player.kill();
    }

    _startRadio(options) {
        var self = this;

        self.emit("newTask");

        this.player = new MPlayer({verbose: false});
        this.player.on("ready", function() {
            self.player.openFile(self.config[options.radioName]);
        });

        // Each time the task is executed by a trigger
        // task.once('stop', function() {
        //     player.kill();
        // });
        //
        // // when new task is created automatically stop this task
        // this.once("newTask", function() {
        //     task.stop();
        // });
    }

    _stopRadio() {
        this.player.kill();
    }
}

module.exports = Module;