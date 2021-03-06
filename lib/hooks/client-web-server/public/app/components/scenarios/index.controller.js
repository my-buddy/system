(function(){
    'use strict';

    /**
     *
     */
    angular
        .module('components.scenarios')
        .controller('IndexScenariosController', function($scope, sharedApiService, auth, util, _){

            $scope.scenarios = [];

            // retrieve the scenarios
            sharedApiService.get(util.format('/users/%s/scenarios', auth.getUser().id))
                .then(function(data){
                    $scope.scenarios = data;

                    // then the runtime
                    sharedApiService.get("/runtime/scenarios")
                        .then(function(data) {
                            data.forEach(function(scenario) {
                                var tmp = _.find($scope.scenarios, {id: scenario.id});
                                tmp.active = true;
                            });
                        });
                });
        });
})();