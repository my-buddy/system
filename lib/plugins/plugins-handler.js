'use strict';

var CoreModule = require(LIB_DIR + '/plugins/core-modules/core-module.js');
var ModuleContainer = require(LIB_DIR + '/plugins/modules/module-container.js');
var CoreModuleHelper = require(LIB_DIR + '/plugins/core-modules/core-module-helper.js');
var ModuleHelper = require(LIB_DIR + '/plugins/modules/module-helper.js');
var PersistencePlugin = require(LIB_DIR + '/persistence/plugins.js');
var MessageAdapterContainer = require(LIB_DIR + '/plugins/message-adapters/message-adapter.js');
var MessageAdapterHelper = require(LIB_DIR + '/plugins/message-adapters/message-adapter-helper.js');
var async = require('async');
var PluginHelper   = require(LIB_DIR + '/plugins/plugin-helper.js').PluginHelper;
var ModuleScheduler   = require(LIB_DIR + '/modules/module-scheduler.js');
var sync = require('synchronize');
var logger = LOGGER.getLogger('PluginsHandler');
var _ = require('lodash');

class PluginsHandler{

    /**
     *
     * @param loadPlugins
     * @param done
     * @returns {*}
     */
    loadPlugins(done){

        var self = this;
        var repository = '';
        var plugins = [];

        if(MyBuddy.config.externalModuleRepositories){
            repository = MyBuddy.config.externalModuleRepositories[0];
        }

        async.each(MyBuddy.config.loadPlugins, function(moduleName, cb) {

            var path = repository + '/' + moduleName + '/index.js';
            logger.debug('Load plugin %s in %s', moduleName, path);
            try{
                var Module = require(path);
            }
            catch(e){
                logger.error("Unable to load package module [%s]", moduleName);
                logger.error(e);
                return cb(e);
            }

            if(!PluginsHandler.isPluginValid(Module)){
                logger.error('Module %s is invalid', moduleName);
                return cb();
            }
            else{
                try{
                    // Main plugin object wrapper
                    var plugin = {
                        name: moduleName,
                        id: moduleName,
                        messageAdapters: [],
                        modules: [],
                    };
                    var args = [moduleName].concat(self.getRequiredComponents(Module.require, moduleName, 'user', plugin));

                    // Code here may be forced synchronously
                    // We need this because the helper is used as synchronous method by plugin
                    // but may do asynchronous stuff
                    sync.fiber(function(){

                        var loaded = null;
                        setTimeout(function(){
                            if(!loaded){
                                logger.warn('The plugin %s seems to take abnormal long time to load!', plugin.name);
                            }
                        }, 2000);

                        Module.apply(null, args);
                        loaded = true;

                        plugins.push(plugin);
                        return cb();
                    });
                }
                catch(e){
                    logger.error("Unable to load module [%s]", moduleName);
                    logger.error(e);
                    return cb(e);
                }
            }

        }, function(err){
            return done(err, plugins);
        });
    };

    /**
     *
     * @param required
     * @param moduleName
     * @returns {Array}
     */
    getRequiredComponents(required, moduleName, moduletype, plugin){
        var self = this;
        var args = [];
        if(Array.isArray(required)){
            required.forEach(function(require){
                switch(require){
                    case 'daemon':
                        args.push(MyBuddy);
                        break;
                    case 'logger':
                        args.push(LOGGER.getLogger('Module - ' + moduleName));
                        break;
                    case 'scheduler':
                        args.push(new ModuleScheduler(self, moduleName, moduletype));
                        break;
                    case 'helper':
                        args.push(new PluginHelper(self.daemon, plugin));
                        break;
                    default:
                        throw new Error('Module [' + moduleName + '] try to require a component [' + require + '] that does not exist');
                        break;
                }
            });
        }
        return args;
    }

    /**
     * Check if module is valid.
     * @param Module
     * @returns {boolean}
     */
    static isPluginValid(Module){
        if(!(typeof Module === 'function')){
            return false;
        }
        //if(!(Module.prototype instanceof EventEmitter) ){
        //    return false;
        //}
        return true;
    };

    registerCoreModule(pluginId, name, module, cb){

        // Check module validity first
        if(!CoreModule.isInstanceValid(module)){
            throw new Error('Unable to register core module [' + name + '] because it\'s not a valid module');
        }

        // Extract user options
        PersistencePlugin.getUserOptions(pluginId, name, 'core-module', function(err, options){
            if(err){
                return cb(err);
            }

            if(options === null){
                options = {};
            }

            // Create container
            var container = new CoreModule(pluginId, name, null, options);

            // Create helper and attach to container
            var helper = new CoreModuleHelper(MyBuddy, container);

            // Instantiate module and attach to container
            container.setInstance(new module(helper));

            // register global core module
            MyBuddy.coreModules.push(container);

            logger.verbose('Core module [%s] registered', name);

            return cb();
        });
    }

    registerModule(pluginId, name, module, cb){

        if(!ModuleContainer.checkModuleValidity(module, name)){
            throw new Error('Unable to register module [' + name + '] because it\'s not a valid module');
        }

        // Extract user options
        PersistencePlugin.getUserOptions(pluginId, name, 'module', function(err, options){
            if(err){
                return cb(err);
            }

            if(options === null){
                options = {};
            }

            // System container
            var tmp = new ModuleContainer(pluginId, name, null, options);

            // Module helper (deal with container)
            var helper = new ModuleHelper(MyBuddy, tmp);

            // Module instance
            tmp.instance = new module(helper);

            // register and attach module to daemon
            MyBuddy.userModules[name] = tmp;

            logger.verbose('Module [%s] Registered', name);

            return cb();
        });
    }

    /**
     *
     * @param name
     * @param adapter
     */
    registerMessageAdapter(pluginId, name, adapter, cb){
        var self = this;

        if(!MessageAdapterContainer.isInstanceValid(adapter)){
            throw new Error('Unable to register message adapters [' + name + '] because it\'s not a valid module');
        }

        // Extract user options
        PersistencePlugin.getUserOptions(pluginId, name, 'message-adapter', function(err, options){
            if(err){
                return cb(err);
            }

            if(options === null){
                options = {};
            }

            // Wrap adapter for system
            var messageAdapter = new MessageAdapterContainer(pluginId, name, null, options);
            var helper = new MessageAdapterHelper(MyBuddy, messageAdapter);

            // instantiate adapter and pass helper
            var instance = new adapter(helper);

            // Store to collection
            messageAdapter.instance = instance;
            MyBuddy.messenger.adapters[name] = messageAdapter;

            // keep reference for this plugin
            //this.plugin.messageAdapters.push(messageAdapter);

            logger.verbose('Adapter [%s] registered', name);
            return cb(null, 'coucou');
        });
    }
}

module.exports = PluginsHandler;