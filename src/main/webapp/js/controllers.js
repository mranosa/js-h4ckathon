'use strict';

/* Controllers */


function MultiPageCtrl($scope, $location, $anchorScroll) {
    $scope.gotoView1 = function() {
        $location.path('/view1');
    };

    $scope.gotoView2 = function() {
        $location.path('/view2');
    };

    $scope.gotoView3 = function() {
        $location.path('/view3');
    };

    $scope.$on('$beforeRouteChange', function() {
        //$anchorScroll.disableAutoScrolling();
    });

    $scope.$on('$afterRouteChange', function() {
        if('/view1' == $location.path()){
            $('#multipageTab a:first').tab('show');
        }
        if('/view2' == $location.path()){
            $('#multiPageMiddleTab').tab('show');
        }
        if('/view3' == $location.path()){
            $('#multipageTab a:last').tab('show');
        }
    });
}