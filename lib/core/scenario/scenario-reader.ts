"use strict";

import {Daemon} from "../../daemon";

export class ScenarioReader {

    system: Daemon;
    logger: any;

    constructor(system) {
        this.system = system;
        this.logger = this.system.logger.Logger.getLogger('ScenarioReader');
    }

    /**
     * Read a scenario from data
     * @param scenario
     */
    readScenario(scenario) {
        var self = this;
        this.logger.debug("Read scenario %s", scenario.id);

        // execute each node
        this.readNodes(scenario, scenario.nodes, { lvl: -1 });
        return Promise.resolve();
    }

    readNodes(scenario: any, nodes: any[], options: any) {
        var self = this;
        nodes.forEach(function(node) {
            self.readNode(scenario, node, { lvl: options.lvl + 1 });
        });
    }

    readNode(scenario: any, node: any, options: any) {
        var self = this;
        if (node.type === "trigger") {
            self.readTriggerNode(scenario, node, options);
        } else if (node.type === "task") {
            self.readTaskNode(scenario, node, options);
        }
    }

    readTriggerNode(scenario: any, node: any, options: any) {
        var self = this;
        var plugin = null;

        return Promise
            .resolve(self.getModuleInstance(scenario.userId, node.pluginId, node.triggerId))
            .then(function(data) {
                self.logger.debug("Create a new demand for trigger module from plugin %s", data.plugin.id);
                data.moduleInstance.onNewDemand(node.options, onTrigger);
            })
            .catch(function(err) {
                self.logger.error("Unable to read scenario", err);
            });

        function onTrigger() {
            console.log("trigger execution", node.options, options);
            self.readNodes(scenario, node.nodes, options);
        }
    }

    readTaskNode(scenario: any, node: any, options: any) {
        var self = this;
        var plugin = null;

        return Promise
            .resolve(self.getModuleInstance(scenario.userId, node.pluginId, node.taskId))
            // Get plugin info
            .then(function(data) {
                self.logger.debug("Create a new demand for task module from plugin %s", data.plugin.id, node.options);
                data.moduleInstance.onNewTask(node.options);
            })
            .catch(function(err) {
                self.logger.error("Unable to read scenario", err);
            });
    }

    getModuleInstance(userId: number, pluginId: string, moduleId: string) {
        var self = this;
        var plugin = null;
        return Promise
            .resolve()
            // Get plugin info
            .then(function() {
                return self.system.apiService.findPlugin(userId, pluginId);
            })
            // Load module instance
            .then(function(data) {
                plugin = data;
                self.logger.debug("Load module instance from plugin %s", plugin.id);
                return self.system.moduleLoader.loadModule(plugin, moduleId);
            })
            .then(function(moduleInstance) {
                return {
                    plugin: plugin,
                    moduleInstance: moduleInstance
                };
            });
    }
}