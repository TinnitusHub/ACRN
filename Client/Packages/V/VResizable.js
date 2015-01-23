$.prototype.VResizable = function(options) // shareSpaceWith, resizeDirection
{
    var self = this;
    var parentSize = function() { return self[["w", "e"].Contains(options.resizeDirection) ? "outerWidth" : "outerHeight"].apply(self.parent(), arguments); }
    var selfSizeOuter = function() { return self[["w", "e"].Contains(options.resizeDirection) ? "outerWidth" : "outerHeight"].apply(self, arguments); }
    var otherSizeOuter = function() { return options.shareSpaceWith[["w", "e"].Contains(options.resizeDirection) ? "outerWidth" : "outerHeight"].apply(options.shareSpaceWith, arguments); }
    self.resizable(
	{
		handles: options.resizeDirection,
		useOuterSize: true,
		start: function(event, ui)
		{
		    self.selfStartPercentage = (selfSizeOuter() / parentSize()) * 100;
		    self.otherStartPercentage = (otherSizeOuter() / parentSize()) * 100;
		},
		resize: function(event, ui)
		{
		    var selfPercentage = (selfSizeOuter() / parentSize()) * 100;
		    otherSizeOuter(((self.selfStartPercentage + self.otherStartPercentage) - selfPercentage) + "%");
		    self.css("left", "0"); // fix for odd adding of "left: -[half of selfWidthOuter];" to css
		},
		stop: function(event, ui)
		{
		    var selfPercentage = (selfSizeOuter() / parentSize()) * 100;
		    selfSizeOuter(selfPercentage + "%");
		    otherSizeOuter(((self.selfStartPercentage + self.otherStartPercentage) - selfPercentage) + "%");
		}
	});
	self.resizable("option").resize(null, {element: self});
};