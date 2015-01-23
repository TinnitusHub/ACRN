var template = V.Multiline(function()
{/*
<div class="scrollView_rootChild scrollbar-chrome" ng-transclude>
</div>
*/}).trim();

var module = angular.module("app", []);
module.directive("scrollView", function()
{
    return {
        link: function(scope, element)
        {
            var root = element;
            if (!root.prop("style").width.length)
                root.css("width", "100%");
            if (!root.prop("style").height.length)
                root.css("height", "100%");
            var options = {wrapper: root};
            /*if (element.attr("onScrollbarShow"))
                options.onScrollbarShow = new Function(element.attr("onScrollbarShow"));
            if (element.attr("onScrollbarHide"))
                options.onScrollbarHide = new Function(element.attr("onScrollbarHide"));*/
            root.children(".scrollbar-chrome").scrollbar(options);
        },
        transclude: true,
        template: template
    };
});