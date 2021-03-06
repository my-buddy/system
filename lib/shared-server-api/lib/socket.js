"use strict";
module.exports = function (server, socketServer) {
    socketServer.on('connection', function (socket) {
        function onNewNotification(notification) {
            server.logger.debug('One notification to send', notification);
            socket.emit('notification:new', notification);
        }
        function onProfileStoppedCompleted() {
            socket.emit('profile:stopped:completed');
        }
        function onProfileStartedCompleted() {
            socket.emit('profile:start:complete');
        }
        function onUserUpdated(id) {
            socket.emit('user:updated', id);
        }
        function onNewRuntimeTask(execution) {
            socket.emit("runtime:task-execution:new", server.services.taskService.taskExecutionToJson(execution));
            emitRuntimeTaskUpdate();
        }
        function onDeleteRuntimeTask(executionId) {
            socket.emit("runtime:task-execution:delete", executionId);
            emitRuntimeTaskUpdate();
        }
        function emitRuntimeTaskUpdate() {
            var tasks = [];
            server.system.executingTasks.forEach(function (tmp) {
                tasks.push(tmp);
            });
            socket.emit("runtime:executing-tasks:update", server.services.taskService.taskExecutionToJson(tasks));
        }
        // Listen for new notifications
        // Then pass notification through socket
        server.system.on('notification:new', onNewNotification);
        server.system.on("runtime:task-execution:new", onNewRuntimeTask);
        server.system.on("runtime:task-execution:delete", onDeleteRuntimeTask);
        server.system.runtime.profileManager.on('profile:stopped:completed', onProfileStoppedCompleted);
        server.system.on('profile:start:complete', onProfileStartedCompleted);
        server.system.bus.on('user:updated', onUserUpdated);
        // Once socket is disconnected remove all the current listener for this user
        // avoid listeners leak
        socket.on('disconnect', function () {
            server.system.removeListener('notification:new', onNewNotification);
            server.system.removeListener("runtime:task-execution:new", onNewRuntimeTask);
            server.system.removeListener("runtime:task-execution:new", onDeleteRuntimeTask);
            server.system.runtime.profileManager.removeListener('profile:stopped:completed', onProfileStoppedCompleted);
            server.system.runtime.profileManager.removeListener('profile:start:complete', onProfileStartedCompleted);
            server.system.bus.removeListener('user:updated', onUserUpdated);
        });
    });
};
