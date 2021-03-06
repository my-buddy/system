'use strict';

var _ = require('lodash');
var validator = require('validator');
var util = require('util');

export = function(server, router) {

    var PluginsDao = server.orm.models.Plugins;

    router.get('/users/:user/plugins', function(req, res){

        var user = req.params.user;

        PluginsDao
            .findAll({
                where: {
                    userId: user
                }
            })
            .then(function(plugins){
                if(!plugins){
                    return res.notFound('Invalid user id');
                }
                return res.ok(PluginsDao.toJSON(plugins));
            })
            .catch(function(err){
                return res.serverError(err);
            });
    });

    /**
     *
     */
    router.get('/users/:user/plugins/:plugin', function(req, res){

        var userId = req.params.user;
        var name = req.params.plugin;

        var search = {
            userId: userId,
            name: name
        };

        PluginsDao
            .findOne({
                where: search
            })
            .then(function(plugin){
                if(!plugin){
                    return res.notFound();
                }
                var json = plugin.toJSON();
                json.modules = plugin.getModules();
                return res.ok(json);
            })
            .catch(function(err){
                return res.serverError(err);
            });
    });

    router.put('/users/:user/plugins/:plugin', function(req, res) {
        var user = req.params.user;
        var pluginId = req.params.plugin;
        var userOptions = req.body.userOptions;
        var pluginPackage = req.body.pluginPackage;
        var toUpdate = {};

        // validate body
        var errors = new Map();

        // user options
        if(userOptions !== undefined){
            if(!_.isPlainObject(userOptions)){
                errors.set('userOptions', 'Invalid options');
            }
            toUpdate.userOptions = userOptions;
        }

        // pluginPackage
        if (pluginPackage !== undefined) {
            toUpdate.pluginPackage = pluginPackage;
        }

        if(errors.size > 0){
            return res.badRequest(errors);
        }

        var where = { userId: user, id: pluginId };

        PluginsDao
            .findOne({
                where: where
            })
            .then(function(plugin){
                if(!plugin){
                    return res.notFound();
                }

                return plugin.update(toUpdate).then(function(test){
                    server.system.notificationService.push('success', util.format('The plugin %s options has been updated', plugin.name));
                    return res.ok(test.toJSON());
                });
            })
            .catch(function(err){
                return res.serverError(err);
            });
    });

    /**
     * Save a new plugin for a given user.
     */
    router.post("/users/:user/plugins", function(req, res) {
        var version = req.body.version;
        var name = req.body.name;
        var repository = req.body.repository;
        var userId = parseInt(req.params.user);
        var pluginPackage = req.body.package;

        // process.exit();
        // validation
        var errors = {};

        // Must contain a string as name
        if(!name || !validator.isLength(name, {min: 1})){
            errors['name'] = 'Name required or invalid';
        }

        if(!version){
            errors['version'] = 'version required or invalid';
        }

        if(!userId){
            errors['userId'] = 'userId required or invalid';
        }

        if(_.size(errors) > 0) {
            return res.badRequest({errors: errors});
        }

        var plugin = {
            "version": version,
            "name": name,
            "userId": userId,
            "package": pluginPackage,
            "repository": repository
        };

        // server.logger.verbose("Creating plugin with data %s", util.inspect(plugin));
        return PluginsDao.create(plugin)
            .then(function(created) {
                server.logger.verbose("Plugin \"%s\" created with id \"%s\" for user \"%s\"", created.name, created.id, created.userId);
                server.io.emit("user:plugin:created", plugin);
                return res.created(created);
            })
            .catch(res.serverError);

    });

    router.delete("/users/:user/plugins/:plugin", function(req, res) {
        var userId = parseInt(req.params.user);
        var name = req.params.plugin;
        var query = {
            where: {
                userId: userId,
                name: name
            }
        };
        PluginsDao.destroy(query)
            .then(function(rows) {
                if (rows === 0) {
                    return res.notFound();
                }
                server.io.emit("user:plugin:deleted", { name: name, userId: userId });
                return res.ok();
            })
            .catch(res.serverError);
    });

    /**
     * Fetch modules for a user.
     * You can filter modules by their types.
     */
    router.get('/users/:id/modules', function(req, res) {
        PluginsDao
            .findAllModulesByUserId(req.params.id)
            .then(function(modules){
                if(!modules){
                    return res.badRequest("Invalid user id");
                }
                var tmp = modules
                    .filter(function(item){
                        return item.type === req.query.type;
                    })
                    .map(function(item){
                        item.pluginId = item.plugin.name;
                        return item;
                    });
                return res.ok(tmp);
            })
            .catch(res.serverError);
    });

    /**
     * Return the module detail from a user plugin
     * user : id
     * plugin : id
     * module : name
     */
    router.get('/users/:user/plugins/:plugin/modules/:module', function(req, res){
        PluginsDao
            .findAllPluginModulesByUserId(req.params.user, req.params.plugin)
            .then(function(modules){
                if(!modules){
                    return res.notFound('Invalid user or plugin id');
                }
                var module = modules.find(function(module){
                    return module.name === req.params.module;
                });
                if(module === undefined){
                    return res.notFound();
                }

                // format module
                // attach an attribute config for convenience and avoid having to go back to pluginPackage to retrieve module config.
                module.config = {
                    userOptions: module.plugin.pluginPackage.modules.find(function(tmp) {
                        return tmp.name === module.name;
                    }).options
                };

                return res.ok(module);
            })
            .catch(res.serverError);
    });

    return router;
};