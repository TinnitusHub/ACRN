var FrameUI = function()
{
	var self = this;
	self.toneMatcher = new ToneMatcherUI();
	self.noise = new NoiseUI();
	self.acrn = new ACRNUI();
	self.pageMapRoot = FromVDF(V.Multiline(function() {/*
{name:'Tools' children:[^]} ##{name:'Root' children:[^]}
##	{name:'Tone Matcher'}
##	{name:'Noise'}
	{name:'ACRN'}
	*/}));

	// early ui setup
	// ==========
	
	var R = function (selector) { return self.root.find(selector); }
	self.root = $(V.Multiline(function() {/*
	<div class="Frame" class="clickThrough" style="position: absolute; width: 100%; height: 100%; z-index: 1;">
		<div id="screenCenter" style="position: absolute; left: 50%; top: 50%; width: 0; height: 0;"></div>
		<style>
		#exit:hover { background: rgba(0, 0, 0, 0.7) !important; }
            
        .topMenuL1Button
		{
            display: inline-block;
            margin-left: -3;
			padding: 7 15;
            #border-radius: 100px;
			color: #000;
			font-size: 14px;
			cursor: pointer;
		}
		.topMenuL1Button:hover { background: rgba(0, 0, 0, 0.1); }
		.topMenuL1Button > div
		{
			position: absolute;
			margin-left: -10;
			margin-top: -2;
			width: 3;
			height: 3;
			background: green;
			display: none;
		}

        .topMenuL2
        {
            display: inline-block;
            border-radius: 19px;
        }
        .topMenuL2:not(:first-child) { margin-left: 7; }
            
        .topMenuL2Button
		{
            display: inline-block;
            margin-left: -3;
			padding: 9 15;
            #border-radius: 100px;
			color: #000;
			font-size: 14px;
			cursor: pointer;
		}
		.topMenuL2Button:hover { background: rgba(0, 0, 0, 0.1); }
		.topMenuL2Button > div
		{
			position: absolute;
			margin-left: -10;
			margin-top: -2;
			width: 3;
			height: 3;
			background: green;
			display: none;
		}

		#topMenuContent > div > div:first-child { display: none !important; }
		</style>
		<div id="topMenu" style="position: relative; z-index: 1; width: 100%; margin-bottom: 10; #border-radius: 0 0 150px 150px; #background: rgba(255, 255, 255, .5);">
            <div id="topMenuContent" style="text-align: center;">
            </div>
            <!-- <div style="position: absolute; width: 100%; height: 150; margin-top: -150; border: solid #CCC; border-width: 0 0 1px 0; border-radius: 0 0 150px 150px; background: rgba(0, 20, 50, .1);"></div> -->
		</div>
		<div id="popupSourceHolder" class="clickThrough"></div>
		<div id="page" class="clickThrough" style="position: relative; width: 100%; height: 100%; #margin-bottom: 10;"></div>
        <div id="bottomPanel" class="borderBox centerUpShadow20" style="display: none; position: absolute; width: 100%; height: 300; border: solid #000; border-width: 3px 0 0 0;"></div>
		</div>
	</div>
	*/}).trim());

	/*self.PreViewClose = function()
	{
		//for (var i = 1; i <= 3; i++) // notify pages at level-1 and down that they're about to close ('page 0' is essentially the window)
	    //	TryCall(window["Page" + i + "Root"]["PreClose"]);
	    if (self.openPage)
	        self.ClosePage(self.openPage, null);
	};*/

    // build top-menu
	function BuildPageMapNode(parent, node)
	{
		var group = $("<div style='display: inline-block;'>");

		var button = $("<div class='topMenuL1Button' style='display: inline-block;'>").appendTo(group).attr("id", node.name).html(node.name);
	    if (parent == null)
		    button.removeClass("topMenuL1Button").css("font-size", 18).css("padding-top", 5);
	    else
		    button.click(function()
		    {
		    	self.OpenPage(button.html().toLowerCase().replace(/ (.)/g, function(match, group1) { return group1.toUpperCase(); }));
		    });

        if (node.children)
        {
        	var childHolder = $("<div class='topMenuL1' style='text-align: center;'>").appendTo(group);
            for (var i in node.children.Indexes())
                BuildPageMapNode(childHolder, node.children[i]).appendTo(childHolder);
        }
		
        return group;
    }
	BuildPageMapNode(null, self.pageMapRoot).appendTo(R("#topMenuContent"));

	// methods
	// ==========

	self.GetSubButton = function(sub) { return R("#" + sub); };
	self.IsSubButtonActive = function(sub) { return self.GetSubButton(sub).hasClass("active"); };
	self.SetSubButtonActive = function(sub, active)
	{
		if (active)
			self.GetSubButton(sub).addClass("active");
		else
			self.GetSubButton(sub).removeClass("active");
	}

	self.IsPageOpen = function(page) { return self.openPage == page; };
	/*function GetPagePath(page)
	{
		if (page == "noise")
			return "/others/tools/noise";
		if (page == "acrn")
			return "/others/tools/acrn";
		return "";
	}*/
	self.OpenPage = function(page, /*optional:*/ callback, allowMakeNewHistoryEntry)
	{
		allowMakeNewHistoryEntry = allowMakeNewHistoryEntry != null ? allowMakeNewHistoryEntry : true;

		var oldPage = self.openPage;
		if (oldPage)
			self.ClosePage(oldPage, page);

		//if (oldPage != null && oldPage != page && allowMakeNewHistoryEntry)
		//	history.pushState({}, "", GetPagePath(page));

		self[page].Show(R("#page"));
	    //self.SetSubButtonActive(page, true);
		self.openPage = page;
	};
    self.ClosePage = function(page, /*optional:*/ newPage)
	{
	    if (!self.IsPageOpen(page))
	        return; // nothing to close
		self[page].Hide();
		//self.SetSubButtonActive(page, false);
		self.openPage = null;
	};
	/*self.TogglePageOpen = function(page)
	{
	    if (self.IsPageOpen(page))
	    {
	        self.ClosePage(page);
	        //self.OpenPage("MainMenu");
	    }
	    else
	        self.OpenPage(page);
	};*/

	// todo: put this in better place
	// loads page content on refresh/back/forward action
    window.onpopstate = function(event)
    {
		//if (event.state === null)
        //    return;
        LoadURL(false);
    }
    function LoadURL(allowMakeNewHistoryEntry)
    {
	    // browser url overrides
		var url = CurrentUrl();
		if (url.EndsWith("/")) // make urls consistent; if there's a trailing slash, remove it
			url = url.substr(0, url.length - 1);
        var pathNodes = GetUrlPathNodes(url);
		var vars = GetUrlVars(url);
		uiState.CopyXChildrenAsOwn(vars);

    	//self.OpenPage("MainMenu");
    	//if (vars.page)
    	//    self.OpenPage(vars.page);
		/*if (pathNodes.length > 1)
			self.OpenPage(pathNodes[pathNodes.length - 1].replace(/-(.)/g, function(match, group1) { return group1.toUpperCase(); }), null, allowMakeNewHistoryEntry); // maybe temp
		else // if no page specified, open the DevelopmentTest page (for now)
			self.OpenPage("noise", null, allowMakeNewHistoryEntry);*/

		self.OpenPage("acrn");

		// run in-url script commands (for in-browser testing)
		if (vars.runJS)
		    eval(decodeURI(vars.runJS).replace(/`/g, "\"").replace(/\[h\]/g, "#").replace(/\[p\]/g, "%")); //replace(/"/g, "`").replace(/#/g, "[h]").replace(/%/g, "[p]")
    }

	self.ShowLoadingScreen = function(message)
	{
	    if (!R("#loadingScreenMessage").length)
	    {
	        var root = $("<div style='background: rgba(0, 0, 0, .5); height: 100%;'>").appendTo(R("#overlay"));
	        $("<div id='loadingScreenMessage' style='position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); -webkit-transform: translate(-50%, -50%); font-size: 23; color: white;'>").appendTo(root).html(message);
	    }
	    else
            R("#loadingScreenMessage").html(message);
	};
	self.HideLoadingScreen = function() { R("#overlay").html(""); };

    self.ResizePage = function()
    {
	    var nonPageContent_height = $(document).height() - R("#page").height(); //$("body").height() - R("#page").height();
        R("#page").css("height", "calc(100% - " + nonPageContent_height + "px)");
	};
	self.ShowMenu = function()
	{
		R("#topMenuController").css("background-image", "url(../Packages/Images/Arrows/TopRightArrow_16_White.png)").css("background-position", "11px 7px");
		R("#topMenu").css("display", "inherit");
		self.ResizePage();
	};
	self.HideMenu = function()
	{
	    R("#topMenuController").css("background-image", "url(../Packages/Images/Arrows/BottomLeftArrow_16_White.png)").css("background-position", "13px 5px");
		R("#topMenu").css("display", "none");
		self.ResizePage();
	};

    self.Attach = function(holder)
    {
        self.root.appendTo(holder);

        // early ui activation
		// ----------

		$(window).resize(function()
		{
			WaitXThenRun(0, function() { self.ResizePage(); });
		});
		$(document).tooltip(
		{
			track: true,
			hide: { duration: "fast" },
			content: function(callback) { callback($(this).prop('title').replace(/\|/g, '<br>')); },
			open: function(event, ui) { $(".ui-tooltip:not(:last)").remove(); }
		});
		$(document).on("mouseenter", "*", function(event, ui)
		{
			if ($(this).attr('title') == null && $(this).parents('[title]').length == 0) // if we (and ancestors) have no tooltip
				$(".ui-tooltip").remove();
		});
		$(document).on("mousemove", "*", function(event, ui)
		{
			if (event.handledGlobally)
				return;
			event.handledGlobally = true;

			//UpdateWebUIHasMouseFocus(!$(this).is("#backdrop") ? true : false);
		});
		$(document).on("focus", "[textArea]", function () { this.textOnFocus = $(this).text(); });
	    $(document).on("blur", "[textArea]", function()
	    {
	        if ($(this).text() != this.textOnFocus)
	            $(this).trigger("vChange");
	    });

	    /*document.oncopy = function()
	    {
	        var selection = window.getSelection();
	        var oldSelectionRange = selection.getRangeAt(0);
	        if (!$(oldSelectionRange.startContainer).is("div.textarea")) // we only need to use a text-copy-buffer if selected text was in a custom textarea
	            return;

	        var tempDiv = $("<div class='selectable' style='position: absolute; left: -100000;'>").appendTo("body");
	        tempDiv.text(selection);
	        selection.selectAllChildren(tempDiv[0]);
	        WaitXThenRun(0, function()
	        {
	            tempDiv.remove();
	            selection.removeAllRanges();
	            selection.addRange(oldSelectionRange);
	        });
	    }*/
	    document.addEventListener("paste", function(event) // intercept paste actions, to make sure we're only pasting text
	    {
	        event.preventDefault(); // cancel paste
	        var text = event.clipboardData.getData("text/plain"); // get text representation of clipboard
	        document.execCommand("insertText", false, text); // insert text manually
        });

		// quick menu closer
		$(document).click(function(e)
		{
			if ($(e.target).hasClass("quickMenuToggler") || $(e.target).closest(".quickMenu").length > 0 || $(e.target).closest("html").length == 0)
				return;
			CloseQuickMenus();
		});

		// set up functionless droppability on backdrop (it's expected to have a droppability widget)
		//R("#backdrop").droppable({});
		//R("#backdrop")[0].layersOver = 0;

		// fix for arrow-key-movement of draggables
		document.onkeydown = function(e)
		{
			if (e.which == null)
				return;

			if (e.which >= 37 && e.which <= 40) // arrow keys
			{
				if ($(".ui-draggable-dragging, .ui-sortable-helper").length > 0) // if there's an active draggable/sortable
					return false;
			}
		};

		//$(document).focusin(function(event, ui) { UpdateUIHasKeyboardFocus(); });
		//$(document).focusout(function() { UpdateUIHasKeyboardFocus(); });

	    //$(document).bind("DOMNodeInserted", function(event)
		//insertionQ("body *").every(function(element)
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var observer = new MutationObserver(function(mutations, observer)
		{
			mutations.forEach(function(mutation)
			{
				var addedNodes = [];
				for (var i = 0; i < mutation.addedNodes.length; i++)
					addedNodes.push(mutation.addedNodes[i]);
				for (var i in addedNodes)
				{
					var target = $(addedNodes[i]);

					// remove focusability of all controls other than the input-absorbing ones
					var focusable = target.is("input[type='text']") || target.is("option"); //target.is("button")
					if (!focusable && !target.is("div"))
						target.attr("tabIndex", "-1");

					// fix for dialogs-being-dragged-outside-of-viewport issue
					if (target.is(".ui-dialog"))
					{
						target.draggable({containment: "body"});
						if (target.hasClass("ui-resizable"))
							target.resizable({containment: "body"});
					}
				}
			});
		});
	    $(document).on("focus", "[tabIndex=-1]", function() { $(this).blur(); });

		// define what element should be observed by the observer, and what types of mutations trigger the callback
		observer.observe(document,
		{
			subtree: true,
			childList: true
		});

		// auto-click the first button of open dialog, when the enter key is pressed
		$(document).on("keyup", function(event, ui)
		{
		    /*var tagName = event.target.tagName.toLowerCase();
			tagName = (tagName === "input" && event.target.type === "button") ? "button" : tagName;

			if (event.which === $.ui.keyCode.ENTER && tagName !== "textarea" && tagName !== "select" && tagName !== "button")
				$(this).find(".ui-dialog-buttonset button").eq(0).trigger("click");*/
		    if (event.which === $.ui.keyCode.ENTER)
		        $(".ui-dialog-buttonset button").eq(0).trigger("click");
		});

		$(window).on("unload", function() { self.ClosePage(self.openPage); });

		// ui activation
		// ----------

		//R("#DevelopmentTree").click(function(event, ui) { Frame.OpenPage("DevelopmentTree"); });
		//R("#Noise").click(function(event, ui) { Frame.OpenPage("Noise"); });

		R("#topMenuController").click(function()
		{
			if ($("#topMenu").css("display") == "none")
				self.ShowMenu();
			else
				self.HideMenu();
		});

		R("#topMenu").resize(function() { self.ResizePage(); });

        // attach pages
        // ----------

		self.toneMatcher.Attach(R("#page"));
		self.noise.Attach(R("#page"));
		self.acrn.Attach(R("#page"));

		// early startup
		// ----------

		VMessageBox.defaultCenterTo = $("#screenCenter");

		// startup
	    // ----------

		//if (parent.frames.length) //window.top != window //window.frameElement) // if in iframe, set window-location to actual site
		//    top.location = "http://venryx.herokuapp.com";

		LoadURL();

	    self.ResizePage();
    };
};

// startup
$(function()
{
	window.Frame = new FrameUI();
	Frame.Attach($("body"));
});