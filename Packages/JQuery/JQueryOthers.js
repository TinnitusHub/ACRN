var JQueryOthers = new function()
{
    $.fn.first = function(/*optional:*/ matchFunc) // equivalent to C# FirstOrDefault
    {
        var result = this.toArray().First(matchFunc || function() { return true; });
        return result && $(result);
    };
    $.fn.on_doubleClick = function(descendentSelector, functionToCall)
    {
        $(this).on("click", descendentSelector, function(event)
        {
            this.clicks = (this.clicks ? this.clicks + 1 : 1); // count clicks
            if (this.clicks == 1)
            {
                var self = this;
                this.timer = setTimeout(function()
                {
                    self.clicks = 0; // second click delayed too long, reset
                }, 500);
            }
            else
            {
                clearTimeout(this.timer); // cancel delay timer
                this.clicks = 0; // reset
                functionToCall.call(this);
            }
        }).on("dblclick", function(e)
        {
            e.preventDefault(); // cancel system double-click event
        });
    };
    $.fn.mouseInBounds = function(mouseX, mouseY)
    {
        var bounds = $(this).offset();
        bounds.bottom = bounds.top + $(this).outerHeight();
        bounds.right = bounds.left + $(this).outerWidth();
        if ((mouseX >= bounds.left && mouseX <= bounds.right) && (mouseY >= bounds.top && mouseY <= bounds.bottom))
            return true;
        return false;
    };
    $.fn.insertIntoXAtY = function(parent, index)
    {
        if (index == 0)
            this.prependTo(parent);
        else
            this.insertAfter(parent.children().eq(index - 1));
        return this;
    };

    /*var oldText = $.fn.text;
    $.fn.text = function() // fix for custom-textarea's requiring two-hits-of-the-enter-key to add the first line-break
    {
        if (this.is("div[textArea]") && typeof arguments[0] == "string") // if setting text, add carriage-return to end of text
            arguments[0] += "\r";
        var result = oldText.apply(this, arguments);
        if (this.is("div[textArea]") && !arguments.length) // if getting text, strip text of carriage-returns (as added by the above)
            result = result.replace(/\r/g, "");
        return result;
    };*/

    // run angular-compile command on new content
    var oldPrepend = $.fn.prepend;
    $.fn.prepend = function()
    {
        var isFragment = arguments[0] && arguments[0][0] && arguments[0][0].parentNode && arguments[0][0].parentNode.nodeName == "#document-fragment";
        var result = oldPrepend.apply(this, arguments);
        if (isFragment)
            AngularCompile(arguments[0]);
        return result;
    };
    var oldAppend = $.fn.append;
    $.fn.append = function()
    {
        var isFragment = arguments[0] && arguments[0][0] && arguments[0][0].parentNode && arguments[0][0].parentNode.nodeName == "#document-fragment";
        var result = oldAppend.apply(this, arguments);
        if (isFragment)
            AngularCompile(arguments[0]);
        return result;
    };
};