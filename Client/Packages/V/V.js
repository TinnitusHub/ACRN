var V = new function()
{
    var self = this;

	/*function AddClosureFunctionsToX(newHolder)
	{
		var names = arguments.callee.caller.toString().matches(/function\s*([\w\d]+)\s*\(/g);
		for (var i in names.indexes())
			try { newHolder[names[i]] = eval(names[i]); } catch(e) {}
	}
	AddClosureFunctionsToX(self);*/

    self.Nothing = function() {};
    self.AnimateSize = function (control, newWidth, newHeight, newMinWidth, newMinHeight, fadeTime)
	{
		var newLeft = parseInt(control.offset().left - ((newWidth - control.width()) / 2));
		if (newLeft < 0)
			newLeft = 0;
		else if (newLeft + newWidth > $(document).width())
			newLeft = $(document).width() - newWidth - (control.outerWidth() - control.width());
		var newTop = parseInt(control.offset().top - ((newHeight - control.height()) / 2));
		if (newTop < 0)
			newTop = 0;
		else if (newTop + newHeight > $(document).height())
			newTop = $(document).height() - newHeight - (control.outerHeight() - control.height());

		control.animate({ minWidth: newMinWidth, minHeight: newMinHeight, width: newWidth, height: newHeight, left: newLeft, top: newTop }, 250);
	};

	self.CloneObject = function(obj) { return $.extend({}, obj); }; //deep: JSON.parse(JSON.stringify(obj));
	self.CloneArray = function(array) { return Array.prototype.slice.call(array, 0); }; //array.slice(0); //deep: JSON.parse(JSON.stringify(array));
	self.IsEqual = function(a, b)
	{
		function _equals(a, b) { return JSON.stringify(a) === JSON.stringify($.extend(true, {}, a, b)); }
		return _equals(a, b) && _equals(b, a);
	};

	self.CallXAtDepthY = function(func, depth)
	{
		var currentCallPackage = function() { func(); };
		for (var i = 1; i < depth; i++)
			currentCallPackage = function() { currentCallPackage(); };
		currentCallPackage();
	};

	self.FormatString = function(str /*params:*/)
	{
		var result = str;
		for (var i = 0; i < arguments.length - 1; i++)
		{
			var reg = new RegExp("\\{" + i + "\\}", "gm");
			result = result.replace(reg, arguments[i + 1]);
		}
		return result;
	};
	self.CapitalizeWordsInX = function(str, addSpacesBetweenWords)
	{
		var result = str.replace(/(^|\W)(\w)/g, function(match) { return match.toUpperCase(); });
		var lowercaseWords = // words that are always lowercase (in titles)
		[
			"a", "aboard", "about", "above", "across", "after", "against", "along", "alongside", "amid", "amidst", "among", "amongst", "an", "and", "around", "as", "aside", "astride", "at", "atop",
			"before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "but", "by", "despite", "during", "except",
			"for", "from", "given", "in", "inside", "into", "minus", "notwithstanding", "of", "off", "on", "onto", "opposite", "or", "out", "over",
			"per", "plus", "regarding", "sans", "since", "than", "through", "throughout", "till", "toward", "towards",
			"under", "underneath", "unlike", "until", "unto", "upon", "versus", "via", "with", "within", "without", "yet"
		];
		lowercaseWords.pushAll(["to"]); // words that are overwhelmingly lowercase
		result = result.replace(new RegExp("(\\s)(" + lowercaseWords.join("|") + ")(\\s|$)", "gi"), function (match) { return match.toLowerCase(); }); // case-insensitive, search-and-make-lowercase call
		if (addSpacesBetweenWords)
			result = result.replace(/(^|[a-z])([A-Z])/g, function(match, group1, group2) { return group1 + " " + group2; });
		return result;
	}
	// example:
	// alert(V.Multiline(function() {/*
	// Text that...
	// spans multiple...
	// lines.
	// */}));
	self.Multiline = function(functionWithInCommentMultiline)
	{
		var text = functionWithInCommentMultiline.toString().replace(/\r/g, "");
		var firstCharPos = text.indexOf("\n", text.indexOf("/*"));
		return text.substring(firstCharPos + 1, text.lastIndexOf("\n"));
	};

	self.StableSort = function(array, compare) // needed for Chrome
	{
		var array2 = array.map(function(obj, index) { return { index: index, obj: obj } });
		array2.sort(function(a, b)
		{
			var r = compare(a.obj, b.obj);
			return r != 0 ? r : V.Compare(a.index, b.index);
		});
		return array2.map(function(pack) { return pack.obj; });
	};
	self.Compare = function(a, b) { return a < b ? -1 : (a > b ? 1 : 0); };

	self.GetAbsolutePath = function(path)
	{
		var a = $("<a>").attr("href", path);
		return a[0].protocol + "//" + a[0].host + a[0].pathname + a[0].search + a[0].hash;
	};

	self.GetScreenCenter = function() { return Frame.screenCenter.offset(); };
	self.GetScreenWidth = function() { return $("body").width(); }
	self.GetScreenHeight = function() { return $("body").height(); }

	self.GetContentHeight = function(content)
	{
		var holder = $("<div style='position: absolute; left: -1000; top: -1000; width: 1000; height: 1000; overflow: hidden;'>").appendTo("body");
		var contentClone = content.clone();
		holder.append(contentClone);
		var height = contentClone.outerHeight();
		holder.remove();
		return height;
	};

	self.GetObjectsWithKey_AsMap = function(keyToFind, /*;optional:*/ rootObj, maxDepth, currentDepth)
	{
		rootObj = rootObj || window;
		maxDepth = maxDepth != null ? maxDepth : 10;
		currentDepth = currentDepth != null ? currentDepth : 0;

		var result = {};
		for (var key in rootObj)
			if (key == keyToFind)
				result[key] = "FOUND_HERE";
			else if (rootObj[key] instanceof Object && currentDepth < maxDepth && rootObj[key] != window)
			{
				var matchingDescendantMap = V.GetObjectsWithKey_AsMap(keyToFind, rootObj[key], maxDepth, currentDepth + 1);
				if (matchingDescendantMap)
					result[key] = matchingDescendantMap;
			}
		return result.Keys().length ? result : null;
	};

	self.GetDescendants = function(rootObj, /*;optional:*/ matchFunc, keyMatchFunc, maxCount, maxDepth, currentDepth, parentObjects)
	{
		matchFunc = matchFunc || function(child) { return child instanceof Object; };
		keyMatchFunc = keyMatchFunc || function(child) { return true; };
		maxCount = maxCount || Number.MAX_VALUE;
		maxDepth = maxDepth != null ? maxDepth : Number.MAX_VALUE;
		currentDepth = currentDepth != null ? currentDepth : 0;
		parentObjects = parentObjects || [];

		var result = [];
		for (var key in rootObj)
		{
			var child = rootObj[key];
			if (!keyMatchFunc(key) || parentObjects.contains(child)) // no loop-backs
				continue;

			if (matchFunc(child) && result.length < maxCount)
				result.push(child);
			if (result.length < maxCount && child != rootObj && currentDepth < maxDepth)
			{
				var matchingDescendants = V.GetDescendants(child, matchFunc, keyMatchFunc, maxCount, maxDepth, currentDepth + 1, parentObjects.concat([child]));
				for (var i in matchingDescendants)
					if (result.length < maxCount)
						result.push(matchingDescendants[i]);
			}
		}
		return result;
	};

	self.ExtendWith = function(value) { $.extend(this, value); };

    var hScrollBarHeight;
    self.GetHScrollBarHeight = function()
    {
	    if (!hScrollBarHeight)
	    {
		    var outer = $("<div style='visibility: hidden; position: absolute; left: -100; top: -100; height: 100; overflow: scroll;'/>").appendTo('body');
		    var heightWithScroll = $("<div>").css({height: "100%"}).appendTo(outer).outerHeight();
		    outer.remove();
		    hScrollBarHeight = 100 - heightWithScroll;
		    //hScrollBarHeight = outer.children().height() - outer.children()[0].clientHeight;
	    }
	    return hScrollBarHeight;
    }
    var vScrollBarWidth;
    self.GetVScrollBarWidth = function()
    {
	    if (!vScrollBarWidth)
	    {
		    var outer = $("<div style='visibility: hidden; position: absolute; left: -100; top: -100; width: 100; overflow: scroll;'/>").appendTo('body');
		    var widthWithScroll = $("<div>").css({width: "100%"}).appendTo(outer).outerWidth();
		    outer.remove();
		    vScrollBarWidth = 100 - widthWithScroll;
		    //vScrollBarWidth = outer.children().width() - outer.children()[0].clientWidth + 1;
	    }
	    return vScrollBarWidth;
    }
    self.HasScrollBar = function(control) { return HasVScrollBar(control) || HasHScrollBar(control); }
    self.HasVScrollBar = function(control) { return control[0].scrollHeight > control[0].clientHeight; }
    self.HasHScrollBar = function (control) { return control[0].scrollWidth > control[0].clientWidth; }

    self.transparentImageString = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    self.transparentImageString_full = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    self.ShowMessageBox_Simple = function (title, message) { VMessageBox.ShowMessageBox({ title: title, message: message }); };

    self.SwapKeysAndValues = function(obj)
    {
        var result = {};
        for (var key in obj)
            result[obj[key]] = key;
        return result;
    };
    self.SwapKeysAndValues_NewValuesAsInts = function(obj)
    {
        var result = {};
        for (var key in obj)
            result[obj[key]] = parseInt(key);
        return result;
    };

	self.Clamp = function(min, max, value) { return value < min ? min : (value > max ? max : value); }
	self.Lerp = function(a, b, percentFromAToB) { return a + ((b - a) * percentFromAToB); };
	self.GetPercentOfXFromYToZ = function(x, y, z) { return (x - y) / (z - y); };

	self.StartDownload = function(content, filename)
    {
        var link = $("<a style='display: none;'/>").appendTo($("body")); //.html("Save to Disk");
        link.attr("href", "data:application/octet-stream," + encodeURIComponent(content));
        link.attr("download", filename);
        link[0].click(); //link.click(); // (the jQuery click-function fails to trigger the download, for some reason)
        link.remove();
    }
    self.SelectFileForOpen = function(callback)
    {
        var input = $("<input type='file'>").appendTo($("body"));
        input.change(function(event)
        {
            var file = input[0].files[0];
            var reader = new FileReader();
            reader.onload = function(event) { callback(event.target.result); };
            reader.readAsText(file);
        });
        input.click();
        input[0].remove(); //input.remove(); // (the jQuery remove-function breaks the event listener)
    }
};