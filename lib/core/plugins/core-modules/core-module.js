'use strict';

var AbstractContainer = require(CORE_DIR + '/plugins/abstract-container.js');
var PersistencePlugin = require(CORE_DIR + '/persistence/plugins-persistence.js');

var _ = require('lodash');

class CoreModule extends AbstractContainer{

    constructor(pluginId, id, instance, userOptions){
        super(MyBuddy, pluginId, userOptions, instance);
        this.id = id;
    }

    /**
     * Return the plugin config.
     * @returns {object}
     */
    getConfig(){
        return this.instance.getConfig();
    }

    toJSON(){
        return _.merge(super.toJSON(), {

        })
    }

    static isInstanceValid(instance){
        if(typeof instance !== 'function'){
            return false;
        }
        if(
            !(instance.prototype.initialize instanceof Function)
            || !(instance.prototype.getConfig instanceof Function)
        ){
            return false;
        }

        return true;
    }

    /**
     *
     * @param options
     * @param cb
     */
    saveUserOptions(options, cb){
        if(!cb) cb = function(){};

        // save to db
        MyBuddy.database.plugins.saveUserOptions(this.pluginId, this.id, 'core-module', options, function(err){
            return cb(err);
        });
    }
}

module.exports = CoreModule;