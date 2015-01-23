var ACRNUI = function()
{
    var self = this;

    var R = function(selector) { return self.root.find(selector); };
	self.root = $(V.Multiline(function() {/*
	<div class="ACRN clickThrough borderBox" style="display: none; position: relative; width: 960; #height: 100%; margin: 0 auto; padding: 10; border: 1px solid #CCC; border-radius: 3px; background: rgba(255, 255, 255, .7);">
		<style>
		.editable { cursor: pointer; color: blue; }
		.editText { display: inline-block; margin: 0; }
		.editText > * { width: 40; }
		</style>
		<div id="start" class="button">Start</div>
		<div id="stop" class="button">Stop</div>
		<!-- <div id="profiles" class="button" style="float: right;">Profiles</div> -->
		<div id="profilesMenu" style="#display: none; position: absolute; left: 959; margin-top: -40; width: 300; padding: 5; border: 1px solid #CCC; border-radius: 3px;">
			<div style="margin-bottom: 5; text-align: center; font-size: 14;">Profiles</div>
			<div id="profileList">
			</div>
			<div id="newProfile" class="button" style="margin-top: 5;">New</div>
			<div style="float: right;">
				<div id="export" class="button" style="margin-top: 5;">Export</div>
				<div id="import" class="button" style="margin-top: 5;">Import</div>
			</div>
		</div>
		<div class="row3">
            <span style="display: inline-block; width: 150;">Base frequency: <span id="baseFrequency" class="editable"></span> hz</span></span>
            <div id="baseFrequencySlider" style="display: inline-block; width: 700;">
        </div>
		<div class="row3">
			<span style="display: inline-block; width: 140;">Master volume: <span id="masterVolume" class="editable"></span>%</span>
			<div id="masterVolumeSlider" style="display: inline-block; width: 300;"></div>
		</div>
		<div class="row3">
            <span style="display: inline-block; width: 120;">Tempo: <span id="tempo" class="editable"></span> bpm</span></span>
			<div id="tempoSlider" style="display: inline-block; width: 300;">
        </div>
		<div class="row3" style="padding: 5; border: 1px solid #CCC; border-radius: 3px;">
			<div style="margin-bottom: 5; text-align: center; font-size: 14;">Sequence Items</div>
			<div id="sequenceItems">
			</div>
			<div id="newSequenceItem" class="button" style="margin-top: 5;">New</div>
		</div>
		<div class="row3" style="margin-top: 5;">
			<span>Shuffle sequence: </span>
			<input id="shuffleSequence" type="checkbox" style="transform: translate(0,3px);"/>
		</div>
		<div class="row3">
			<span>Sequence repeat count: </span>
			<input id="sequenceRepeatCount" type="number" min="1" max="100" style="width: 50;"/>
		</div>
		<div class="row3">
			<span>After sequence: </span>
			<select id="afterSequence_type"><option>do nothing</option><option selected>wait for</option><option>run code</option></select>
			<span id="afterSequence_waitFor_box">
				<input id="afterSequence_waitFor" type="number" min="1" max="1000" style="width: 50;"/>
				<div style="display: inline-block;">beats</div>
			</span>
			<span id="afterSequence_runCode_box">
				<!-- <input id="afterSequence_runCode" type="text" style="width: 700;"/> -->
				<span id="afterSequence_runCode_help" style="margin-left: 5; cursor: pointer; color: blue;">help</span>
			</span>
			<div id="afterSequence_runCode_box2" style="margin-top: 3;">
				<textarea id="afterSequence_runCode" style="width: 100%; height: 70; resize: none;"></textarea>
			</div>
		</div>
	</div>
	*/}).trim());
	
	// start/stop
	// ==========
	
	var audiolet = new Audiolet();
	var synth;
	var playingPatternEvent;
	var playing = false;

	var beatInfos_base;
	var beatInfos;

	R("#start").click(StartNoise);
	function StartNoise()
	{
		if (playing);
			StopNoise();

		synth = new TriggerSynth(audiolet, this.currentFreq); // high synth - scheduled as a mono synth (i.e. one instance keeps running and the gate and frequency are switched)
		synth.connect(audiolet.output); // connect it to the output so we can hear it
		audiolet.scheduler.setTempo(tempo * 2); // times 2, since we actually use two beats for each tone (one for climb, another for fall)

		function BuildBeatInfos()
		{
			beatInfos_base = [];

			var sequenceItems_final = [];
			var sequenceItems_copy = V.CloneArray(sequenceItems);
			for (var i = 0; i < sequenceRepeatCount; i++)
			{
				if (shuffleSequence)
					Shuffle(sequenceItems_copy);
				for (var i2 = 0; i2 < sequenceItems_copy.length; i2++)
					sequenceItems_final.push(sequenceItems_copy[i2]);
			}

			for (var i = 0; i < sequenceItems_final.length; i++)
			{
				var item = sequenceItems_final[i];
				for (var i2 = 0; i2 < (item ? item.for : 1); i2++)
				{
					beatInfos_base.push({ item: item }); // for climb/attack
					beatInfos_base.push({ item: item, lastItemBeat: i2 == (item ? item.for : 1) - 1 }); // if not last beat, for continuation; else, for fall/release
				}
				if (item && item.then_type == "wait for")
					for (var i2 = 0; i2 < item.then_waitFor; i2++)
					{
						beatInfos_base.push({}); // 'wait' beat
						beatInfos_base.push({}); // 'wait' beat
					}
			}
			if (afterSequence_type == "wait for")
				//beatInfos_base.push({runCode: "WaitFor(" + afterSequence_waitFor + ");"});
				for (var i = 0; i < afterSequence_waitFor; i++)
				{
					beatInfos_base.push({}); // 'wait' beat
					beatInfos_base.push({}); // 'wait' beat
				}

			beatInfos = V.CloneArray(beatInfos_base);
		}
		BuildBeatInfos();
		
		// init gate values
		synth.gainEnv.gate.setValue(0);
		var index = 0;
		var lastSequence;
		playingPatternEvent = audiolet.scheduler.play([lastSequence = new PSequence([{}], Infinity)], 1, function() //function(sequenceItem)
		{
			var beatInfo = beatInfos[index];
			var frequency;
			try { frequency = eval(beatInfo.item.frequencyEquation); } catch (ex) {}
			if (typeof frequency != "number")
				frequency = 0;

			if (beatInfo.item) // if 'tone' beat
			{
				if (!beatInfo.lastItemBeat) // if climbing or continuing, for this beat
				{
					synth.sine.frequency.setValue(frequency);
					SetVolume(masterVolume * tempoCompensationVolume * beatInfo.item.volume * .05);
				}
			}
			else // if 'wait' beat
			{
				synth.sine.frequency.setValue(0);
				SetVolume(0);
			}
			synth.gainEnv.gate.setValue(beatInfo.lastItemBeat || !beatInfo.item ? 0 : 1); // set the gate

			if (beatInfo.loadProfileByID) // if beat has 'load profile' action attached
			{
				lastSequence.list = []; // forces the current sequence to stop
				LoadProfileByID(beatInfo.loadProfileByID); //WaitXThenRun(0, function() { LoadProfileByID(beatInfo.loadProfileByID); }); // run code after beat function completes
				return;
			}

			if (index == beatInfos_base.length - 1)
				/*if (afterSequence_type == "wait for")
					eval("WaitFor(" + afterSequence_waitFor + ");");
				else */if (afterSequence_type == "run code")
					eval(afterSequence_runCode); //WaitXThenRun(0, function() { eval(beatInfo.runCode); }); // run code after this function completes

			if (index == beatInfos.length - 1)
				//if (shuffleSequence)
					BuildBeatInfos(); //Shuffle(sequenceItems_final);

			index = index < beatInfos.length - 1 ? index + 1 : 0;
		});
		playing = true;
	}
	function SetVolume(vol)
	{
		if (synth !== null)
    		if (synth instanceof TriggerSynth)
    		{
				//synth.gain.gain.setValue(vol);
    			synth.gainEnv.levels[1].setValue(vol);
    			synth.gainEnv.levels[2].setValue(.9 * vol); //1 * vol);
    		}
	}
	function Shuffle(list)
	{
		for (var j, x, i = list.length; i; j = parseInt(Math.random() * i), x = list[--i], list[i] = list[j], list[j] = x)
			;
		//return list;
	}
	
	R("#stop").click(StopNoise);
	function StopNoise()
	{
		if (!playing)
			return;

        audiolet.scheduler.remove(playingPatternEvent); //audiolet.scheduler.stop();
        synth.disconnect(audiolet.output); // disconnect sythesizer from audiolet's output
        playing = false;
	}
	
	// profiles
	// ==========

	var ACRNProfileKeyStart = "ACRN_profile";
	function GetNextProfileID()
	{
		var highestIDFound = -1;
		for (var key in localStorage)
			if (key.StartsWith(ACRNProfileKeyStart))
			{
				var id = parseInt(key.substr(ACRNProfileKeyStart.length));
				if (id > highestIDFound)
					highestIDFound = id;
			}

		return highestIDFound + 1;
	}
	R("#newProfile").click(function()
	{
		localStorage.setItem(ACRNProfileKeyStart + GetNextProfileID(), ToJSON({}));
		LoadProfileList();
	});
	R("#export").click(function()
	{
		var data = {};
		for (var key in localStorage)
			if (key.StartsWith(ACRNProfileKeyStart))
				data[key] = localStorage[key];
		V.StartDownload(ToJSON(data), "ACRNProfiles.json");
	});
	R("#import").click(function()
	{
		V.SelectFileForOpen(function(text)
		{
			var data = FromJSON(text);
			V.ShowConfirmationBox({title: "Clear Existing", message: "Clear existing profiles before import?", okLabel: "Yes", cancelLabel: "No", onOK: function()
			{
				for (var key in localStorage)
					if (key.StartsWith(ACRNProfileKeyStart))
						localStorage.removeItem(key);

				for (var key in data)
					if (key.StartsWith(ACRNProfileKeyStart))
						localStorage[key] = data[key];

				LoadProfileList();
			}, onCancel: function()
			{
				for (var key in data)
					if (key.StartsWith(ACRNProfileKeyStart))
						localStorage[ACRNProfileKeyStart + GetNextProfileID()] = data[key];

				LoadProfileList();
			}});
		});
	});
	
	var liveProfileID = -1;
	function LoadProfileList()
	{
		R("#profileList").html("");

		var foundProfile = false;
		for (var key in localStorage)
			if (key.StartsWith(ACRNProfileKeyStart))
				foundProfile = true;
		if (!foundProfile) // if no profiles were found, load in the starter set
			for (var i in ACRNData.startProfiles.Indexes())
				localStorage[ACRNProfileKeyStart + i] = ToJSON(ACRNData.startProfiles[i]);

		var profileKeys_sorted = [];
		for (var key in localStorage)
			if (key.StartsWith(ACRNProfileKeyStart))
				profileKeys_sorted.push(key);
		profileKeys_sorted.sort(function(aStr, bStr)
		{
			var a = parseInt(aStr.substr(ACRNProfileKeyStart.length));
			var b = parseInt(bStr.substr(ACRNProfileKeyStart.length));
			return a < b ? -1 : (a > b ? 1 : 0);
		});

		for (var i in profileKeys_sorted.Indexes())
		{
			var key = profileKeys_sorted[i];
			(function()
			{
				var data = FromJSON(localStorage.getItem(key));
				var id = parseInt(key.substr(ACRNProfileKeyStart.length));

				var box = $("<div style='margin-top: 0;'>");
				var name = $("<input type='text' style='width: 190; transform: translate(0, 1px);'>").appendTo(box).val(data.name);
				var save = $("<div class='button thin'>Save</div>").appendTo(box).click(function()
				{
					if (data.name && id != liveProfileID)
						VMessageBox.ShowConfirmationBox({title: "Save over Profile", message: "Save over '" + name.val() + "'? (different profile)", onOK: function()
						{
							SaveProfile(id, name.val());
						}});
					else
						SaveProfile(id, name.val());
				});
				var load = $("<div class='button thin'>Load</div>").appendTo(box).click(function() { LoadProfileByID(id); });
				var remove = $("<div class='button thin'>X</div>").appendTo(box).click(function()
				{
					if (data.name)
						VMessageBox.ShowConfirmationBox({title: "Delete Profile", message: "Delete '" + name.val() + "'?", onOK: function()
						{
							RemoveProfile(id);
						}});
					else
						RemoveProfile(id);
				});
				if (!data.name) // if new-profile
					load.addClass("disabled");

				R("#profileList").append(box);
			})();
		}
	}
	function CreateProfile(name)
	{
		var result = {};
		result.name = name;
		result.baseFrequency = baseFrequency;
		result.tempo = tempo;
		result.masterVolume = masterVolume;
		result.sequenceItems = sequenceItems;
		result.sequenceRepeatCount = sequenceRepeatCount;
		result.shuffleSequence = shuffleSequence;
		result.afterSequence_type = afterSequence_type;
		result.afterSequence_waitFor = afterSequence_waitFor;
		result.afterSequence_runCode = afterSequence_runCode;
		return result;
	}
	function SaveProfile(profileID, name)
	{
		localStorage.setItem(ACRNProfileKeyStart + profileID, ToJSON(CreateProfile(name)));
		liveProfileID = profileID;
		LoadProfileList();
	}

	function LoadProfileByID(profileID)
	{
		LoadProfile(FromJSON(localStorage.getItem(ACRNProfileKeyStart + profileID)));
		liveProfileID = profileID;
	}
	function LoadProfile(data)
	{
		var wasPlaying = playing;
		StopNoise();

		SetBaseFrequency(data.baseFrequency);
		SetTempo(data.tempo);
		SetMasterVolume(data.masterVolume);
		sequenceItems = data.sequenceItems;
		LoadSequenceItems();
		SetSequenceRepeatCount(data.sequenceRepeatCount);
		SetShuffleSequence(data.shuffleSequence);
		SetAfterSequence_Type(data.afterSequence_type);
		SetAfterSequence_WaitFor(data.afterSequence_waitFor);
		SetAfterSequence_RunCode(data.afterSequence_runCode);

		if (wasPlaying)
			StartNoise();
	}
	function RemoveProfile(profileID)
	{
		localStorage.removeItem(ACRNProfileKeyStart + profileID);
		LoadProfileList();
	}

	// base frequency
	// ==========

	var baseFrequency;
	R("#baseFrequency").editable(function(value, settings) { SetBaseFrequency(V.Clamp(1, 18000, value)); }, { cssclass: "editText", type: "text" });
	R("#baseFrequencySlider").slider(
	{
		min: 1,
		max: 18000,
		slide: function(event, ui) { SetBaseFrequency(ui.value); }
	});
	function SetBaseFrequency(newBaseFrequency)
	{
		if (R("#baseFrequency").html() != newBaseFrequency)
			R("#baseFrequency").html(newBaseFrequency);
		if (R("#baseFrequencySlider").slider("value") != newBaseFrequency)
			R("#baseFrequencySlider").slider("value", newBaseFrequency);
		baseFrequency = newBaseFrequency;
	}

	// #tempo
	// ==========

	var tempo;
	var tempoCompensationVolume;
	R("#tempo").editable(function(value, settings) { SetTempo(V.Clamp(30, 1000, value)); }, {cssclass: "editText", type: "text"});
	R("#tempoSlider").slider(
	{
		min: 30,
		max: 1000,
		slide: function(event, ui) { SetTempo(ui.value); }
	});
	function SetTempo(newTempo)
	{
		if (R("#tempo").html() != newTempo)
			R("#tempo").html(newTempo);
		if (R("#tempoSlider").slider("value") != newTempo)
			R("#tempoSlider").slider("value", newTempo);
		tempo = newTempo;
		//tempoCompensationVolume = Math.log(tempo); //logWithBaseX(tempo, 2.718281828459045);
		tempoCompensationVolume = V.Lerp(.1, 1, V.GetPercentOfXFromYToZ(tempo, 30, 1000));

		if (playing)
			StartNoise();
	}

	// master volume
	// ==========

	var masterVolume = .5;
	R("#masterVolume").editable(function(value, settings) { SetMasterVolume(V.Clamp(0, 1, value / 100)); }, {cssclass: "editText", type: "text"});
	R("#masterVolumeSlider").slider(
	{
		min: 0,
		max: 100,
		slide: function() { R("#masterVolumeSlider").slider("option").change(); },
		change: function() { SetMasterVolume(R("#masterVolumeSlider").slider("value") / 100); }
	});
	function SetMasterVolume(newMasterVolume)
	{
		R("#masterVolume").html(Math.round(newMasterVolume * 100));
		if (R("#masterVolumeSlider").slider("value") != Math.round(newMasterVolume * 100))
			R("#masterVolumeSlider").slider("value", Math.round(newMasterVolume * 100));
		masterVolume = newMasterVolume;
	}

	// sequence-items
	// ==========

	var sequenceItems = [];
	R("#newSequenceItem").click(function()
	{
		sequenceItems.push({frequencyEquation: "baseFrequency", volume: 1, "for": 1, then_type: "do nothing", then_waitFor: 0});
		LoadSequenceItems();
		if (playing)
			StartNoise();
	});
	function LoadSequenceItems()
	{
		R("#sequenceItems").html("");
		for (var i in sequenceItems.Indexes())
			R("#sequenceItems").append(CreateSequenceItemBox(sequenceItems[i]));
	}
	function CreateSequenceItemBox(item)
	{
		var box = $("<div style='margin-top: 0;'>");

		$("<span>Play tone at </span>").appendTo(box);
		var frequencyEquation = $("<input type='text' style='width: 190;'>").appendTo(box).val(item.frequencyEquation).change(function()
		{
			item.frequencyEquation = frequencyEquation.val();
		});
		$("<span> hz with volume </span>").appendTo(box);
		var volumeInput = $("<input type='number' step='1' min='0' max='100' style='width: 40;'>").appendTo(box).val(Math.round(item.volume * 100)).change(function()
		{
			item.volume = volumeInput.val() / 100;
		});
		$("<span>% for </span>").appendTo(box);
		var forInput = $("<input type='number' step='1' min='0' max='100' style='width: 40;'>").appendTo(box).val(item.for).change(function()
		{
			item.for = parseInt(forInput.val());
			if (playing)
				StartNoise();
		});
		$("<span> beats, then </span>").appendTo(box);
		var then_type = $("<select><option>do nothing</option><option>wait for</option></select>").appendTo(box).val(item.then_type).change(function()
		{
			item.then_type = then_type.val();
			then_waitFor_box.css("display", then_type.val() == "wait for" ? "" : "none");
			if (playing)
				StartNoise();
		});

		var then_waitFor_box = $("<span style='display: none;'>").appendTo(box).css("display", then_type.val() == "wait for" ? "" : "none");
		var then_waitFor = $("<input type='number' step='1' min='0' max='100' style='margin-left: 5; width: 40;'/>").appendTo(then_waitFor_box).val(item.then_waitFor).change(function()
		{
			item.then_waitFor = parseInt(then_waitFor.val());
			if (playing)
				StartNoise();
		});
		$("<span> beats</span>").appendTo(then_waitFor_box);

		var remove = $("<span class='button thin' style='margin-left: 5;'>X</span>").appendTo(box).click(function()
		{
			VMessageBox.ShowConfirmationBox({title: "Delete Sequence Item", message: "Delete?", onOK: function()
			{
				RemoveSequenceItem(box.index());
				if (playing)
					StartNoise();
			}});
		});

		return box;
	}
	function RemoveSequenceItem(index)
	{
		sequenceItems.RemoveAt(index);
		LoadSequenceItems();
	}

	// shuffle sequence
	// ==========

	var shuffleSequence;
	R("#shuffleSequence").change(function() { SetShuffleSequence(R("#shuffleSequence")[0].checked); });
	function SetShuffleSequence(value)
	{
		if (R("#shuffleSequence")[0].checked != value)
			R("#shuffleSequence")[0].checked = value;
		shuffleSequence = value;

		if (playing)
			StartNoise();
	}

	// sequence repeat count
	// ==========

	var sequenceRepeatCount;
	R("#sequenceRepeatCount").change(function() { SetSequenceRepeatCount(R("#sequenceRepeatCount").val()); });
	function SetSequenceRepeatCount(value)
	{
		if (R("#sequenceRepeatCount").val() != value)
			R("#sequenceRepeatCount").val(value);
		sequenceRepeatCount = value;

		if (playing)
			StartNoise();
	}

	// after sequence
	// ==========

	var afterSequence_type;
	var afterSequence_waitFor;
	var afterSequence_runCode;
	R("#afterSequence_type").change(function() { SetAfterSequence_Type(R("#afterSequence_type").val()); });
	function SetAfterSequence_Type(value)
	{
		if (R("#afterSequence_type").val() != value)
			R("#afterSequence_type").val(value);
		afterSequence_type = value;

		R("#afterSequence_waitFor_box").css("display", value == "wait for" ? "inline-block" : "none");
		R("#afterSequence_runCode_box").css("display", value == "run code" ? "inline-block" : "none");
		R("#afterSequence_runCode_box2").css("display", value == "run code" ? "" : "none");

		if (playing)
			StartNoise();
	}
	R("#afterSequence_waitFor").change(function() { SetAfterSequence_WaitFor(R("#afterSequence_waitFor").val()); });
	function SetAfterSequence_WaitFor(value)
	{
		if (R("#afterSequence_waitFor").val() != value)
			R("#afterSequence_waitFor").val(value);
		afterSequence_waitFor = value;

		if (playing)
			StartNoise();
	}
	R("#afterSequence_runCode").change(function() { SetAfterSequence_RunCode(R("#afterSequence_runCode").val()); });
	function SetAfterSequence_RunCode(value)
	{
		if (R("#afterSequence_runCode").val() != value)
			R("#afterSequence_runCode").val(value);
		afterSequence_runCode = value;

		if (playing)
			StartNoise();
	}

	function WaitFor(beats) // currently always adds the 'wait' beats to the end
	{
		for (var i = 0; i < beats; i++)
		{
			beatInfos.push({}); // 'wait' beat
			beatInfos.push({}); // 'wait' beat
		}
	}
	function LoadProfileByName(profileName)
	{
		var profileID = null;
		for (var key in localStorage)
			if (key.StartsWith(ACRNProfileKeyStart) && FromJSON(localStorage.getItem(key)).name == profileName)
				profileID = key.substr(ACRNProfileKeyStart.length);

		//LoadProfileByID(profileID);
		beatInfos.Last().loadProfileByID = profileID; // add 'load profile' action to last beat
	}

	R("#afterSequence_runCode_help").click(function()
	{
		VMessageBox.ShowMessageBox({title: "Run-Code Help", message: V.Multiline(function() {/*
Commands:
* WaitFor(x)   // wait for 'x' number of beats
* LoadProfileByName(x)    // tell program to load the profile 'x', once the current sequence is finished
* Math.random()   // get a randomly generated number between 0 and 1

Example code:
WaitFor(8)   // wait for 8 beats
if (Math.random() < .1)   // if the random number we get is less then .1 (i.e. one tenth of the time), run the next command
    LoadProfileByName("AnotherProfile")   // tell program to load the profile "AnotherProfile", once the current sequence is finished
*/}), width: 750});
	});

    self.Attach = function(holder)
	{
    	self.root.appendTo(holder);

    	LoadProfileList();
    	/*if (localStorage.getItem("ACRN_lastSessionProfile") != null)
    		LoadProfile(FromJSON(localStorage.getItem("ACRN_lastSessionProfile")));
    	else
			LoadProfile(
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
			});*/
    	LoadProfile(FromJSON(localStorage.getItem("ACRN_lastSessionProfile")) || ACRNData.startProfiles[0]);
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

        localStorage.setItem("ACRN_lastSessionProfile", ToJSON(CreateProfile("lastSession")));
    };
};

TriggerSynth = function(audiolet, frequency)
{
    AudioletGroup.apply(this, [audiolet, 0, 1]);

    this.sine = new Sine(audiolet, frequency);

    this.gainEnv = new ADSREnvelope(audiolet,
            0, // gate
            .1, // attack
            .1, // decay
            .9, //1 // sustain
            .08); // release
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