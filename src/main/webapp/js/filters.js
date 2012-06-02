/* Filters */

var filterModule = angular.module('hackApp.filters', []);

filterModule.filter('selectme', function() {
    return function(input) {
        return input ? "alert-success" : "";
    }
});

filterModule.filter('buttonme', function() {
    return function(input) {
        return input ? "btn-success" : "btn-warning";
    }
});

filterModule.filter('iconme', function() {
    return function(input) {
        return input ? "icon-ok icon-white" : "icon-plus icon-white";
    }
});

filterModule.filter('valid', function() {
    return function(input) {
        return input ? "success" : "";
    }
});

filterModule.filter('notempty', function() {
    return function(input) {
        if (typeof (input) == 'undefined') return "";

        var strInput = new String(input);
        return strInput.length > 0 ? "success" : "";
    }
});

filterModule.filter('notemptyboolean', function() {
    return function(input) {
        if (typeof (input) == 'undefined') return false;

        var strInput = new String(input);
        return strInput.length > 0 ? true : false;
    }
});

filterModule.filter('error', function() {
    return function(input) {
        return input ? "error" : "";
    }
});