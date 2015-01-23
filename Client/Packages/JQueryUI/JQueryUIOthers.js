/*$.prototype.slider_old = $.prototype.slider;
$.prototype.slider = function()
{
    var result = $.prototype.slider_old.apply(this, arguments);
    this.find(".ui-slider-handle").unbind("keydown"); // disable keyboard actions
    return result;
};*/

$.prototype.spinner_old = $.prototype.spinner;
$.prototype.spinner = function()
{
    if (arguments.length) // add in validation
    {
        var options = arguments[0];
        var oldChangeFunc = options.change;
        var self = this;
        options.change = function()
        {
            var clampedValue = Math.min(options.max, Math.max(options.min, (options.step || 1).toString().contains(".") ? parseFloat(self.val()) : parseInt(self.val())));
            self.val(clampedValue.toString() != "NaN" ? clampedValue : options.min);
            if (oldChangeFunc)
                oldChangeFunc.apply(this, arguments);
        };
    }
    return $.prototype.spinner_old.apply(this, arguments);
};

// disable tab view "arrow keys to switch tab" feature (by default, anyway)
$.widget("ui.tabs", $.ui.tabs,
{
	options: {keyboard: true},
	_tabKeydown: function()
	{
		if(this.options.keyboard)
			this._super('_tabKeydown');
		else
			return false;
	}
});

// disables the JQueryDialog [clicking the default dialog button when Enter is pressed-down or held] functionality (custom code will trigger it on key-up)
$.prototype.dialog_old = $.prototype.dialog;
$.prototype.dialog = function()
{
    var result = $.prototype.dialog_old.apply(this, arguments);
    this.keypress(function(event)
    {
        if (event.keyCode == $.ui.keyCode.ENTER)
            return false;
    });
    return result;
};