angular.module('hackApp', ['hackApp.filters'])

  .config(function($provide, $locationProvider, $filterProvider) {
    var pulseElements = $(),
        pulseColor = {r:0xE6, g:0xF0, b: 0xFF},
        baseColor = {r:0x99, g:0xc2, b: 0xFF},
        pulseDuration = 500,
        pulseDelay = 100;

    function hex(number) {
      return ('0' + Number(number).toString(16)).slice(-2);
    }

    jQuery.fn.pulse = function () {
      pulseElements = pulseElements.add(this);
    };
    var lastPulse;

    function tick() {
      var duration = new Date().getTime() - lastPulse,
          index = duration * Math.PI / pulseDuration ,
          level = Math.pow(Math.sin(index), 10),
          color = {
            r: Math.round(pulseColor.r * level + baseColor.r * (1 - level)),
            g: Math.round(pulseColor.g * level + baseColor.g * (1 - level)),
            b: Math.round(pulseColor.b * level + baseColor.b * (1 - level))
          },
          style = '#' + hex(color.r) + hex(color.g) + hex(color.b);

      pulseElements.css('backgroundColor', style);
      if (duration > pulseDuration) {
        setTimeout(function() {
          lastPulse = new Date().getTime();
          tick();
        }, pulseDelay);
      } else {
        setTimeout(tick, 50);
      }
    }

    $provide.value('startPulse', function() {
       setTimeout(function() {
         lastPulse = new Date().getTime();
         tick();
       }, 2000);
    });
  })

  .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/view1', {template: 'page1.html', controller: PageOneCtrl});
        $routeProvider.when('/view2', {template: 'page2.html', controller: PageTwoCtrl});
        $routeProvider.when('/view3', {template: 'page3.html', controller: PageThreeCtrl});
  }])

  .value('indent', function(text, spaces) {
    if (!text) return text;
    var lines = text.split(/\r?\n/);
    var prefix = '      '.substr(0, spaces || 0);
    var i;

    // remove any leading blank lines
    while (lines.length && lines[0].match(/^\s*$/)) lines.shift();
    // remove any trailing blank lines
    while (lines.length && lines[lines.length - 1].match(/^\s*$/)) lines.pop();
    var minIndent = 999;
    for (i = 0; i < lines.length; i++) {
      var line = lines[0];
      var indent = line.match(/^\s*/)[0];
      if (indent !== line && indent.length < minIndent) {
        minIndent = indent.length;
      }
    }

    for (i = 0; i < lines.length; i++) {
      lines[i] = prefix + lines[i].substring(minIndent);
    }
    lines.push('');
    return lines.join('\n');
  })

  .value('escape', function(text) {
    return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/"/g, '&quot;');
  })

  .factory('script', function() {

    return {
      angular: '<script src="http://code.angularjs.org/angular-' + angular.version.full + '.min.js"></script>\n',
      resource: '<script src="http://code.angularjs.org/angular-resource-' + angular.version.full + '.min.js"></script>\n'
    };
  })

  .factory('fetchCode', function(indent) {
    return function get(id, spaces) {
      return indent(angular.element(document.getElementById(id)).html(), spaces);
    }
  })

  .directive('code', function() {
    return {restrict: 'E', terminal: true};
  })

  .directive('appRun', function(fetchCode, $templateCache) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var modules = [];

        modules.push(function($provide) {
          $provide.value('$templateCache', $templateCache);
          $provide.value('$anchorScroll', angular.noop)
        });
        if (attrs.module) {
          modules.push(attrs.module);
        }

        element.html(fetchCode(attrs.appRun));
        element.bind('click', function(event) {
          if (event.target.attributes.getNamedItem('ng-click')) {
            event.preventDefault();
          }
        });
        angular.bootstrap(element, modules);
      }
    };
  })

  .directive('appSource', function(fetchCode, escape, script) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var tabs = [],
            panes = [],
            annotation = attrs.annotate && angular.fromJson(fetchCode(attrs.annotate)) || {},
            TEMPLATE = {
              'index.html':
                '<!doctype html>\n' +
                '<html ng-app__MODULE__>\n' +
                '  <head>\n' +
                '    ' + script.angular +
               (attrs.resource ? ('    ' + script.resource.replace('></', '>\n    </')) : '') +
                '__HEAD__' +
                '  </head>\n' +
                '  <body>\n' +
                '__BODY__' +
                '  </body>\n' +
                '</html>'
          };

        angular.forEach(attrs.appSource.split(' '), function(filename, index) {
          var content;

          tabs.push(
            '<li class="' + (!index ? ' active' : '') + '">' +
              '<a href="#' + id(filename) + '" data-toggle="tab">' + (filename) + '</a>' +
            '</li>');

          if (index == 0) {
            var head = [];

            angular.forEach(attrs.appSource.split(' '), function(tab, index) {
              var filename = tab.split(':')[0],
                  fileType = filename.split(/\./)[1];

              if (index == 0) return;
              if (fileType == 'js') {
                head.push('    <script src="' + filename + '"></script>\n');
              } else if (fileType == 'css') {
                head.push('    <link rel="stylesheet" href="' + filename + '">\n');
              }
            });
            content = TEMPLATE['index.html'];
            content = content.
              replace('__MODULE__', attrs.module ? '="' + attrs.module + '"' : '').
              replace('__HEAD__', head.join('')).
              replace('__BODY__', fetchCode(filename, 4));
          } else {
            content = fetchCode(filename);
          }

          // hack around incorrect tokenization
          content = content.replace('.done-true', 'doneTrue');
          content = prettyPrintOne(escape(content), 'html', true);
          // hack around incorrect tokenization
          content = content.replace('doneTrue', '.done-true');

          var popovers = {},
              counter = 0;

          angular.forEach(annotation[filename], function(text, key) {
            var regexp = new RegExp('(\\W|^)(' + key.replace(/([\W\-])/g, '\\$1') + ')(\\W|$)');

            content = content.replace(regexp, function(_, before, token, after) {
              var token = "__" + (counter++) + "__";
              popovers[token] =
                '<code class="nocode" rel="popover" title="' + escape('<code>' + key + '</code>') +
                '" data-content="' + escape(text) + '">' + escape(key) + '</code>';
              return before + token + after;
            });
          });

          angular.forEach(popovers, function(text, token) {
            content = content.replace(token, text);
          });

          panes.push(
            '<div class="tab-pane' + (!index ? ' active' : '') + '" id="' + id(filename) + '">' +
              '<pre class="prettyprint linenums nocode">' + content +'</pre>' +
            '</div>');
        });

        element.html(
          '<div class="tabbable">' +
            '<ul class="nav nav-tabs">' +
            tabs.join('') +
            '</ul>' +
            '<div class="tab-content">' +
            panes.join('') +
            '</div>' +
            '</div>');
        element.find('[rel=popover]').popover().pulse();

        function id(id) {
          return id.replace(/\W/g, '-');
        }
      }
    }
  })

  .directive('hint', function() {
    return {
      template: '<em>Hint:</em> hover over ' +
          '<code class="nocode" rel="popover" title="Hover" ' +
          'data-content="Place your mouse over highlited areas in the code for explanations.">me</code>.'
    }
  })

  .run(function($rootScope, startPulse){
    $rootScope.version = angular.version;
    $rootScope.$evalAsync(function(){

      $('[rel=popover]').
        popover().
        pulse();
      startPulse();

        //tabs
        $('#viewTab1 a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
        $('#viewTab2 a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
        $('#viewTab3 a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    });
  })
