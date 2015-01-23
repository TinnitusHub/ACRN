$.prototype.VTabView = function(/*optional:*/ options) // activate
{
    options = options || {};

    var self = this;
    var buttonHolder = self.children().eq(0);
    var panelHolder = self.children().eq(1);

    if (!self.hasClass("VTabView")) // if not initialized
    {
        self.addClass("VTabView");
        buttonHolder.addClass("buttons");
        panelHolder.addClass("panels");

        var buttons = buttonHolder.find("div:not(.ignore)").filter(function () { return !$(this).parents(".buttons :not(.ignore)").length; });
        var panels = panelHolder.children();

        buttons.click(function() { self[0].MakeTabActive(buttons.index($(this))); });
        self[0].GetActiveTabIndex = function() { return buttons.index(buttons.filter(".active")); };
        self[0].MakeTabActive = function(tabIndex)
        {
            buttons.removeClass("active");
            buttons.eq(tabIndex).addClass("active");
            panels.removeClass("active");
            panels.eq(tabIndex).addClass("active");

            if (options.activate)
                options.activate(tabIndex);
        };
    }

    self[0].MakeTabActive(options.selectedTab != null ? options.selectedTab : 0);
};