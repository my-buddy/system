"use strict";

import _ = require("lodash");
import ip  = require('ip');
import path = require("path");

/**
 * @param config
 * @returns {object}
 */
export default function(config: any) {
    let defaultConfig =  require("./default");
    let completeConfig = _.merge({}, defaultConfig, config);
    let systemIP = ip.address();
    let appPath = process.cwd();
    let webServerUrl = ((completeConfig.webServerSSL.activate ? "https" : "http") + "://localhost:" + completeConfig.sharedApiPort);

    // Set some config only possible during runtime
    _.merge(completeConfig, {
        appPath: appPath,
        system: {
            pluginsTmpDir: completeConfig.system.pluginsTmpDir || path.join(completeConfig.system.tmpDir, 'plugins'),
            pluginsDataDir: completeConfig.system.pluginsDataDir || path.join(completeConfig.system.dataDir, 'plugins'),
            synchronizedPluginsDir: completeConfig.system.synchronizedPluginsDir || path.join(completeConfig.system.dataDir, 'synchronized-plugins'),
        },
        systemIP: systemIP,
        sharedApiUrl: completeConfig.sharedApiUrl || ((completeConfig.sharedApiSSL.activate ? "https" : "http") + "://" + (systemIP + ':' + completeConfig.sharedApiPort)),
        webServerUrl: webServerUrl,
        webServerRemoteUrl: webServerUrl.replace("localhost", systemIP)
    });
    return completeConfig;
};