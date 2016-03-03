(function(){
    'use strict';

    /**
     * Create a valid api task from the form scope task.
     * Basically do all the mapping.
     *
     * @param formTask
     * @returns {{messageAdapters: Array, options: {}}}
     */
    function createTaskFromForm(formTask){

        var options = {};
        _.forEach(formTask.options, function(option){
            options[option.name] = option.value;
        });

        var task = {
            messageAdapters: formTask.actions
                .filter(function(action){
                    return action.value;
                })
                .map(function(action){
                    return action.name;
                }),
            options: options
        };

        // we have a task on command
        if(formTask.triggerOptions){

            var triggerOptions = {};
            _.forEach(formTask.triggerOptions, function(option){
                triggerOptions[option.name] = option.value;
            });

            task.triggerOptions = triggerOptions;
        }

        return task;
    }

    angular
        .module('components.tasks')

        .controller('TasksController', function($rootScope, $scope, $http, APP_CONFIG, TASK_TYPE, notificationService, apiService, tasksService, _, SweetAlert){

            // http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
            $scope.tasks = [];
            $scope.scheduledTasks = [];
            $scope.triggeredTasks = [];

            apiService.get('/tasks', {}).then(function(data){
                $scope.tasks = data;
                $scope.scheduledTasks = _.filter($scope.tasks, {'type': TASK_TYPE.schedule});
                $scope.triggeredTasks = _.filter($scope.tasks, {'type': TASK_TYPE.trigger});
            });

            /**
             *
             */
            $scope.removeTask = function(id){
                SweetAlert.swal({
                        title: "Are you sure?",
                        text: "Your will not be able to recover this imaginary file!",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",confirmButtonText: "Yes, delete it!",
                        cancelButtonText: "No, cancel plx!",
                        closeOnConfirm: false,
                        closeOnCancel: true },
                    function(isConfirm){
                        if (isConfirm) {
                            //tasksService.remove(id)
                            //    .then(function(data){

                                    $rootScope.$apply(function(){
                                        _.remove($scope.scheduledTasks, function(task){
                                            console.log(task.id, id);
                                            return task.id === id;
                                        });
                                    });
                                    SweetAlert.swal("Deleted!", "Your imaginary file has been deleted.", "success");
                                //});
                        }
                    });
            }
        })

        .controller('CreateController', function($scope, $http, $uibModal, APP_CONFIG, $log, tasksService, notificationService){
            $scope.modules = [];

            console.log('CreateController');
            tasksService.getAll().then(function(response){
                $scope.modules = response;
            });

            $scope.addInstantTask = function(size, module){
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: '/app/components/tasks/modals/add-instant-task.html',
                    controller: 'ModalAddInstantTask',
                    size: size,
                    resolve: {
                        module: function () {
                            return module;
                        }
                    }
                });

                modalInstance.result.then(function (task) {

                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                });
            };

            $scope.addScheduledTask = function (size, module) {

                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: '/app/components/tasks/modals/add-scheduled-task.html',
                    controller: 'ModalAddScheduledTask',
                    size: size,
                    resolve: {
                        module: function () {
                            return module;
                        }
                    }
                });

                modalInstance.result.then(function (task) {

                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                });
            };

            /**
             *
             * @param size
             * @param module
             */
            $scope.addTriggerTask = function(size, module){
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/components/tasks/modals/task-triggers-select.html',
                    controller: function($scope, $uibModalInstance, module, $http, APP_CONFIG, apiService, _){

                        $scope.taskTriggers = [];

                        // get triggers
                        apiService.getTaskTriggers().then(function(results){
                            $scope.taskTriggers = results;
                        });

                        $scope.selectTrigger = function(pluginId, id){
                            var res = _.find($scope.taskTriggers, function(entry){
                                return entry.pluginId === pluginId && entry.id === id;
                            });
                            $uibModalInstance.close(res);
                        };

                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    },
                    size: size,
                    resolve: {
                        module: function () {
                            return module;
                        }
                    }
                });
                modalInstance.result.then(function (taskTrigger) {

                    var modalInstance = $uibModal.open({
                        templateUrl: '/app/components/tasks/modals/add-trigger-task.html',
                        controller: 'ModalAddTriggerTask',
                        size: size,
                        resolve: {
                            module: function () {
                                return module;
                            },
                            taskTrigger: function(){
                                return taskTrigger;
                            }
                        }
                    });
                    modalInstance.result.then(function (target) {
                        notificationService.success('Task created');
                    });

                });
            };

            $scope.addMovementTriggeredTask = function(size, module){
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: '/app/components/tasks/modals/add-movement-commanded-task.html',
                    controller: 'ModalAddMovementTriggeredTask',
                    size: size,
                    resolve: {
                        module: function () {
                            return module;
                        }
                    }
                });

                modalInstance.result.then(function (task) {

                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                });
            }
        })

        .controller('CreateFormController', function($scope, $stateParams, pluginsService){
            console.log('CreateFormController');
            $scope.module = null;

            // we will store all of our form data in this object
            $scope.formData = {};

            pluginsService.getModule($stateParams.pluginId, $stateParams.moduleId)
                .then(function(module){
                    $scope.module = module;
                });

            // function to process the form
            $scope.processForm = function() {
                alert('awesome!');
            };
        })

        .controller('CreateFormStep1Controller', function($scope){
            console.log('CreateFormStep1Controller');

        });
})();