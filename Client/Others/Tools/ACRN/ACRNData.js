var ACRNData = new function()
{
	var self = this;
	self.startProfiles =
	[
		{
			name: "Default",
			baseFrequency: 5000,
			tempo: 360,
			masterVolume: .5,
			sequenceItems:
			[
				{frequencyEquation: "(baseFrequency * .773) - 44.5", volume: 1, "for": 1, then_type: "do nothing", then_waitFor: 0},
				{frequencyEquation: "(baseFrequency * .903) - 21.5", volume: 1, "for": 1, then_type: "do nothing", then_waitFor: 0},
				{frequencyEquation: "(baseFrequency * 1.09) + 52", volume: 1, "for": 1, then_type: "do nothing", then_waitFor: 0},
				{frequencyEquation: "(baseFrequency * 1.395) + 26.5", volume: 1, "for": 1, then_type: "do nothing", then_waitFor: 0}
			],
			shuffleSequence: true,
			sequenceRepeatCount: 3,
			afterSequence_type: "wait for",
			afterSequence_waitFor: 8
		}
	];
};