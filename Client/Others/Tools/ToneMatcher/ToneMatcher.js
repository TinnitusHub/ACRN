var ToneMatcherUI = function()
{
    var self = this;

    var R = function(selector) { return self.root.find(selector); };
	self.root = $(V.Multiline(function() {/*
	<div class="ToneMatcher clickThrough borderBox" style="display: none; position: relative; width: 960; #height: 100%; margin: 0 auto; padding: 10; border: 1px solid #CCC; border-radius: 3px; background: rgba(255, 255, 255, .7);">
        <div class="container">
            <section id="play">
                <button type="button" class="btn btn-default" id="playToneButton" onclick="playTone();">Play Single Frequency</button>
                <button type="button" class="btn btn-default" id="stopButton" onclick="stop();">Stop Audio</button>
            </section>
            <br/>
            <div class="freqSliderContainer" style="width: 200;">
                <div class="freqSliderText">Frequency: <span class="editFreq" id="freqValue"></span> hz</span>
                <div id="freqSlider" class="freqSliderSize" style="float: left; width: 700;"></div>         
            </div>
            <br/>
            <div class="volSlider" id="volSliderContainer">
                Volume: 
                <div id="volSlider" class="volSliderSize" style="width: 200;"></div>
            </div>
	        <div id="advancedOptions" style="display: none;">
		        <div>Advanced Options</div>
		        <div class="tempoSlider">
			        <div style="position: absolute;">Tempo:</div>
			        <div id="tempoSlider" class="tempoSliderSize" style="margin-top: 5px; width: 200;"></div>
		        </div>
	        </div>
        </div>
	</div>
	*/}).trim());

	// load values from local storage if available
	var updateACRNFreqs = true;
	if (localStorage.getItem("defaultFreq"))
		defaultFreq = localStorage.getItem("defaultFreq");
	if (localStorage.getItem("defaultVolume"))
		defaultVolume = localStorage.getItem("defaultVolume");
	for (var i = 0; i < numFreqs; i++)
	{
        if (localStorage.getItem(ACRN_FREQ_PREFIX + i))
        {
			updateACRNFreqs = false;
			freqChoices[i] = localStorage.getItem(ACRN_FREQ_PREFIX + i);
		}
		if (localStorage.getItem(ACRN_FREQ_PREFIX + "vol" + i))
			freqVolumes[i] = localStorage.getItem(ACRN_FREQ_PREFIX + "vol" + i);
	}

	// to clean
	// ==========

	// constants
	states =
	{
		PLAY_TONE: 0,
		PLAY_ACRN: 1,
		STOP: 2
	};

	ACRN_FREQ_PREFIX = "freq";
	ACRN_VOL_FREQ_PREFIX = "freqVol";

	// initial config values
	var defaultVolume = 25;
	var defaultFreq = 8125;
	var numFreqs = 4;
	var defaultFreqVolume = 100;

	// state values
	var currentFreq = defaultFreq;
	var currentVolume;
	var currentState = states.STOP;

	var freqAdjust = null;
	var freqAdjustValue = null;

	// http://www.wiseguysynth.com/larry/convert/bpm_table.htm -> 1.5hz = 90bpm
	// we need quarter notes, so 90 * 4 = 360
	var tempo = 360;

	// obj references
	var audiolet = new Audiolet();
	var playingPatternEvent;
	var synth = null;
	var timer;
	var freqChoices = [];
	// the indexs used to determine which frequency to play in the acrn playback
	var freqChoiceIndex = [0, 1, 2, 3];
	var freqPattern = [];
	var freqVolumes = [];
	var currentSelectedFreq = null;
	var currentPlayingFreqIndex = null;

	function registerEditFrequencies()
	{
		R(".acrnFreq").click(function()
		{
			removeEditFreq();
			R("#freqAdjustContainer").slideDown();
			freqAdjust = this;
			freqAdjustValue = $(this).html();
			$(this).removeClass("acrnFreq");
			$(this).addClass("freqSelected");
			R("#freqValAdjust").html(freqAdjustValue);
			currentSelectedFreq = parseInt($(this).attr("id").slice(-1));
			R("#freqVolSlider").slider("value", freqVolumes[currentSelectedFreq]);
		});
	}

	function removeEditFreq()
	{
		if (freqAdjust !== null)
		{
			$(freqAdjust).removeClass("freqSelected");
			$(freqAdjust).addClass("acrnFreq");
		}
		freqAdjust = null;
	}

	function hideFreqAdjust()
	{
		removeEditFreq();
		R("#freqAdjustContainer").slideUp();
	}

	function resetFreqVolumes()
	{
		for (var i = 0; i < numFreqs; i++)
			freqVolumes[i] = defaultFreqVolume;
	}

	function setFrequencyUpdateACRN(value)
	{
		setFrequency(value);
		generateACRNFrequencies();
		renderACRNFrequencies();
		resetFreqVolumes();
	}

	function setFrequency(freq)
	{
		this.currentFreq = freq;
		hideFreqAdjust();
		R("#freqValue").html(currentFreq);
		if (synth !== null && currentState === states.PLAY_TONE)
    		synth.sine.frequency.setValue(currentFreq);  // set the gate
		if (Modernizr.localstorage)
			localStorage.setItem("defaultFreq", freq);
	}

	function setTempo(tempo)
	{
		window.tempo = tempo;
		audiolet.scheduler.setTempo(tempo * 2);
	}

	function setVolumeValue(vol)
	{
		currentVolume = vol;
		adjustVolume(currentVolume);
		if (Modernizr.localstorage)
			localStorage.setItem("defaultVolume", vol);
	}

	function adjustVolume(vol)
	{
		// first create the volume float value
		vol = vol / 100;
		vol = vol * vol;

		if (synth !== null)
    		if (synth instanceof TriggerSynth)
    		{
    			//synth.gain.gain.setValue(vol);
    			synth.gainEnv.levels[1].setValue(vol);
    			synth.gainEnv.levels[2].setValue(.9 * vol); //1 * vol);
    		}
    		else
    			synth.gain.gain.setValue(vol / 1.5); // solid tone is much louder
	}

	function setFreqVolume(vol)
	{
		freqVolumes[currentSelectedFreq] = vol;
		if (Modernizr.localstorage)
			localStorage.setItem(ACRN_FREQ_PREFIX + "vol" + currentSelectedFreq, vol);
	}

	TriggerSynth = function(audiolet, frequency)
	{
		AudioletGroup.apply(this, [audiolet, 0, 1]);

		this.sine = new Sine(audiolet, frequency);

		this.gainEnv = new ADSREnvelope(audiolet,
				0, // Gate
				.1, // Attack
				.1, // Decay
				.9, //1 // Sustain
				.08); // Release
		this.gainEnvMulAdd = new MulAdd(audiolet, 0.5);
		this.gain = new Gain(audiolet);

		// Connect oscillator
		this.sine.connect(this.gain);
		this.gain.connect(this.outputs[0]);

		// Connect trigger and envelope
		//this.trigger.connect(this.gainEnv);
		this.gainEnv.connect(this.gainEnvMulAdd);
		this.gainEnvMulAdd.connect(this.gain, 0, 1);
	};
	extend(TriggerSynth, AudioletGroup);

	Synth = function(audiolet, frequency)
	{
		AudioletGroup.apply(this, [audiolet, 0, 1]);

		this.sine = new Sine(audiolet, frequency);
		this.gain = new Gain(audiolet);
		this.gain.gain.setValue(currentVolume / 2);

		// connect oscillator
		this.sine.connect(this.gain);

		this.gain.connect(this.outputs[0]);

	};
	extend(Synth, AudioletGroup);

	function playTone()
	{
		if (currentState === states.PLAY_ACRN)
			stop();
		if (currentState !== states.PLAY_TONE)
		{
			synth = new Synth(audiolet, this.currentFreq);
			adjustVolume(currentVolume);
			// Connect it to the output so we can hear it
			synth.connect(audiolet.output);
			currentState = states.PLAY_TONE;
		}
	}

	function removeHighlightedFreq()
	{
		R("#" + ACRN_FREQ_PREFIX + currentPlayingFreqIndex).removeClass("acrnFreqPlaying");
	}

	function highlightCurrentFreq()
	{
		R("#" + ACRN_FREQ_PREFIX + currentPlayingFreqIndex).addClass("acrnFreqPlaying");
	}

	function playACRN()
	{
		if (currentState === states.PLAY_TONE)
			stop();

		if (currentState !== states.PLAY_ACRN)
		{
			generateACRNFrequencies();
			// start timer
			timer.resetStopwatch();
			timer.Timer.play();
			// change play state
			currentState = states.PLAY_ACRN;
			// High synth - scheduled as a mono synth (i.e. one instance keeps
			// running and the gate and frequency are switched)
			synth = new TriggerSynth(audiolet, this.currentFreq);

			// Connect it to the output so we can hear it
			synth.connect(audiolet.output);

			// first set the gate on the ADSR envelope to 1, then alternate to 0 
			// trigger release
			var frequencyPattern = new PSequence([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
				6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, -2, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1], Infinity);

			/*var frequencyPattern = new PSequence([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
				6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, -2, -1/*, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1*#/], Infinity);*/

			audiolet.scheduler.setTempo(tempo * 2);
			shufflePattern();

			// init gate values
			synth.gainEnv.gate.setValue(0);
			var gateVal = 1;

			// Schedule the patterns to play
			var patterns = [frequencyPattern];
			playingPatternEvent = audiolet.scheduler.play(patterns, 1, function(index)
			{
				//console.log("Playing:" + index);
				if (index > -1)
				{
					removeHighlightedFreq();
					currentPlayingFreqIndex = freqPattern[index];
					if (gateVal === 1)
					{
						// Set the frequency
						synth.sine.frequency.setValue(freqChoices[currentPlayingFreqIndex]);
						// set the volume
						// get the individual frequency volume value
						var freqVolumeVal = freqVolumes[currentPlayingFreqIndex] / 100;
						// adjust the frequency volume value by the overall volume value
						adjustVolume(currentVolume * freqVolumeVal);
						highlightCurrentFreq();
					}
					// Set the gate
					synth.gainEnv.gate.setValue(gateVal);
					//console.log("set gate: " + gateVal + " freq: " + freqChoices[freqIndex]);
					// flip the gate
					gateVal = 1 - gateVal;
				}
				else if (index === -1)
					shufflePattern();
				else
				{
					//console.log("stopping: " + gateVal);
					adjustVolume(currentVolume);
					synth.gainEnv.gate.setValue(0);
				}
			}.bind(this));
		}
	}

	function generateACRNFrequencies()
	{
		// "Equidistant on a logarithmic scale." - There is a factor of 1.44225 between the values.
		/*
			freqChoices = [Math.floor(currentFreq * 0.5), Math.floor(currentFreq * 0.721125),
			Math.floor(currentFreq * 1.0400425), Math.floor(currentFreq * 1.5)];\
			*/
		// Calculation from http://www.tinnitustalk.com/threads/acoustic-cr%C2%AE-neuromodulation-do-it-yourself-guide.1469/page-6
		freqChoices = [Math.floor(currentFreq * 0.773 - 44.5), Math.floor(currentFreq * 0.903 - 21.5), Math.floor(currentFreq * 1.09 + 52), Math.floor(currentFreq * 1.395 + 26.5)];
		for (var i = 0; i < numFreqs; i++)
		{
			freqVolumes[i] = defaultFreqVolume;
			if (localStorage.getItem(ACRN_FREQ_PREFIX + "vol" + i)) // load in saved volume for frequency-slot, if one exists
				freqVolumes[i] = localStorage.getItem(ACRN_FREQ_PREFIX + "vol" + i);
		}
		if (Modernizr.localstorage)
		{
    		for (var i = 0; i < numFreqs; i++)
    		{
				localStorage.setItem(ACRN_FREQ_PREFIX + i, freqChoices[i]);
				localStorage.setItem(ACRN_VOL_FREQ_PREFIX + i, freqVolumes[i]);
			}
		}
	}

	function renderACRNFrequencies()
	{
		var patternStr = "";
		for (var i = 0; i < freqChoices.length; i++)
		{
			editFreqNode = $("<span>");
			editFreqNode.addClass("acrnFreq");
			editFreqNode.attr("id", ACRN_FREQ_PREFIX + i);
			editFreqNode.html(freqChoices[i]);
			patternStr += editFreqNode[0].outerHTML + " hz";
			if (i < freqChoices.length - 1)
				patternStr += ", ";
		}
		R("#freqPattern").html(patternStr);
		registerEditFrequencies();
	}

	function shufflePattern()
	{
		this.freqPattern = [];
		for (var i = 0; i < 3; i++)
		{
			shuffle(freqChoiceIndex);
			this.freqPattern.push.apply(this.freqPattern, freqChoiceIndex);
		}
	}

	function shuffle(o)
	{
		for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
			;
		return o;
	}

	function stop()
	{
		removeHighlightedFreq();
		if (currentState !== states.STOP)
		{
    		if (currentState === states.PLAY_ACRN)
    		{
				audiolet.scheduler.remove(playingPatternEvent);
				audiolet.scheduler.stop();
			}t
			// connect it to the output so we can hear it
			synth.disconnect(audiolet.output);
			currentState = states.STOP;
			timer.Timer.pause();
		}
	}

	// timer common functions
	function pad(number, length)
	{
		var str = '' + number;
		while (str.length < length)
			str = '0' + str;
		return str;
	}

	function formatTime(time)
	{
		var min = parseInt(time / 6000),
				sec = parseInt(time / 100) - (min * 60),
				hundredths = pad(time - (sec * 100) - (min * 6000), 2);
		return (min > 0 ? pad(min, 2) : "00") + ":" + pad(sec, 2) + ":" + hundredths;
	}

    // init ui
    // ==========

	R("#freqSlider").slider(
	{
		min: 1,
		max: 15000,
		value: defaultFreq,
		slide: function(event, ui)
		{
			setFrequencyUpdateACRN(ui.value);
		}
	});
	R("#volSlider").slider(
	{
		min: 0,
		max: 100,
		value: defaultVolume,
		slide: function(event, ui)
		{
			setVolumeValue(ui.value);
		},
		width: 40
	});

	R("#playToneButton").button();
	R("#playACRNButton").button();
	R("#stopButton").button();
	R("#freqVolSlider").slider(
	{
		min: 0,
		max: 100,
		value: defaultFreqVolume,
		slide: function(event, ui)
		{
			setFreqVolume(ui.value);
		},
		width: 40
	});

	R("#freqAdjustContainer").hide();

	R("#tempoSlider").slider(
	{
		min: 100,
		max: 300000,
		value: 360,
		slide: function(event, ui) { setTempo(ui.value); },
		width: 100
	});

	window.updateFrequencySlider = function(value)
	{
		R("#freqSlider").slider({ value: value });
	};

	// methods
    // ==========

    self.Attach = function(holder)
	{
    	self.root.appendTo(holder);

    	// others
		// ----------

		setFrequency(defaultFreq);
		if (updateACRNFreqs)
			generateACRNFrequencies();
		renderACRNFrequencies();
		setVolumeValue(defaultVolume);

		timer = new (function()
		{
			var $stopwatch; // stopwatch element on the page
			var incrementTime = 70; // timer speed in milliseconds
			var currentTime = 0; // current time in hundredths of a second
			var updateTimer = function()
			{
				$stopwatch.html(formatTime(currentTime));
				currentTime += incrementTime / 10;
			};
			var init = function()
			{
				$stopwatch = R('#stopwatch');
				timer.Timer = $.timer(updateTimer, incrementTime, true);
				timer.Timer.pause();
			};
			this.resetStopwatch = function()
			{
				currentTime = 0;
				this.Timer.stop().once();
			};
			$(init);
		});

		function isPositiveInteger(n)
		{
			var floatN = parseFloat(n);
			return !isNaN(floatN) && isFinite(n) && floatN > 0 && floatN % 1 == 0;
		}
		R(".editFreq").editable(function(value, settings)
		{
			if (!isPositiveInteger(value) || value < 1 || value > 15000)
				return this.revert; // ignore

			var id = $(this).attr('id');
			if (id === "freqValue")
			{
				setFrequencyUpdateACRN(value);
				updateFrequencySlider(value);
			}
			else
			{
				freqNum = $(freqAdjust).attr("id").slice(-1);
				$(freqAdjust).html(value);
				freqChoices[freqNum] = parseInt(value);

				if (Modernizr.localstorage)
				{
					localStorage.setItem(ACRN_FREQ_PREFIX + freqNum, parseInt(value));
				}
				console.log(ACRN_FREQ_PREFIX + "[" + freqNum + "]" + ": " + parseInt(value));
			}
			return value;
		},
		{
			cssclass: 'editText',
			type: 'text'
		});
	};
    self.Show = function()
    {
        self.root.css("display", "");
        Frame.SetSubButtonActive("ACRN", true);
    };
    self.Hide = function()
    {
        self.root.css("display", "none");
        Frame.SetSubButtonActive("ACRN", false);
    };
};