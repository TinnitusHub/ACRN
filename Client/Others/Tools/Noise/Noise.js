var NoiseUI = function()
{
    var self = this;

    var R = function(selector) { return self.root.find(selector); };
	self.root = $(V.Multiline(function() {/*
	<div class="Noise clickThrough borderBox #menu" style="display: none; position: relative; width: 960; #height: 100%; margin: 0 auto; padding: 10; border: 1px solid #CCC; border-radius: 3px; background: rgba(255, 255, 255, .7);">
        <style>
			#tempo > :not(#tempoLabel) { z-index: 1; }
			#masterVolume > :not(#masterVolumeLabel) { z-index: 1; }
		</style>
		<div>
			<div id="start" class="button">Start</div>
			<div id="stop" class="button">Stop</div>
			<div style="display: inline-block; margin-left: 5;">
				<div style="float: left; margin-right: 10; text-align: top; transform: translate(0px, 3px);">Tempo:</div>
				<div id="tempo" style="position: relative; float: left; width: 325; transform: translate(0px, 7px);">
					<div id="tempoLabel" style="position: absolute; width: 100%; text-align: center; margin-top: -4; color: #000; z-index: 2; pointer-events: none;"></div>
				</div>
			</div>
			<div style="display: inline-block; margin-left: 10;">
				<div style="float: left; margin-right: 10; text-align: top; transform: translate(0px, 3px);">Master Volume:</div>
				<div id="masterVolume" style="position: relative; float: left; width: 325; transform: translate(0px, 7px);">
					<div id="masterVolumeLabel" style="position: absolute; width: 100%; text-align: center; margin-top: -4; color: #000; z-index: 2; pointer-events: none;"></div>
				</div>
			</div>
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
		</div>
		<div class="clear" style="margin-top: 10;">
			<div style="margin-bottom: 5;">Noise Concentration <span style="font-size: 12; color: #AAA;">(horizontal 'x' is frequency/tone, vertical 'y' is the relative density/concentration of noise at that frequency)</span></div>
			<div style="float: left; width: 25; height: 200; position: relative; margin-right: 5;">
				<div style="text-align: right;">100</div>
				<div style="position: absolute; bottom: 0; right: 0;">0</div>
			</div>
			<canvas id="noiseConcentrationGraph" width="900" height="200" style="display: inline-block; outline: 1px solid #AAA;"></canvas>
			<div style="margin-left: 30; width: 900;">
				<div style="float: left;">0hz</div>
				<div id="noiseConcentration_frequency" style="position: absolute; width: 900; text-align: center; opacity: .75;"></div>
				<div style="float: right;">18000hz</div>
			</div>
		</div>
		<div class="clear" style="margin-top: 10;">
			<div style="margin-bottom: 5;">Volume <span style="font-size: 12; color: #AAA;">(horizontal 'x' is frequency/tone, vertical 'y' is volume)</span></div>
			<div style="float: left; width: 25; height: 200; display: inline-block; position: relative; margin-right: 5;">
				<div style="text-align: right;">100</div>
				<div style="position: absolute; bottom: 0; right: 0;">0</div>
			</div>
			<canvas id="volumeGraph" width="900" height="200" style="display: inline-block; outline: 1px solid #AAA;"></canvas>
			<div style="margin-left: 30; width: 900;">
				<div style="float: left;">0hz</div>
				<div id="volume_frequency" style="position: absolute; width: 900; text-align: center; opacity: .75;"></div>
				<div style="float: right;">18000hz</div>
			</div>
		</div>
	</div>
	*/}).trim());

	var fullControlMode = GetUrlVars().fullControlMode == "true";

	// first-row controls
	// ==========

	var audiolet = new Audiolet();
	var playingPatternEvent;
	var playing = false;
	var synth;
	R("#start").click(StartNoise);
	function StartNoise()
	{
		if (playing);
			StopNoise();

		synth = new TriggerSynth(audiolet, this.currentFreq); // high synth - scheduled as a mono synth (i.e. one instance keeps running and the gate and frequency are switched)
		synth.connect(audiolet.output); // connect it to the output so we can hear it
		//audiolet.scheduler.setTempo(tempo * 2); // times 2, since we actually use two beats for each tone (one for climb, another for fall)
		audiolet.scheduler.setTempo(tempo);

		var beatInfos;
		function BuildBeatInfos()
		{
			beatInfos = [];
			for (var x = 0; x < 900; x++)
				for (var i = 0; i < noiseConcentration_data[x]; i++)
					beatInfos.push(x);
			Shuffle(beatInfos);
		}
		BuildBeatInfos();

		var beatInfos_indexes = [];
		for (var i = 0; i < beatInfos.length; i++)
			beatInfos_indexes.push(i);

		// init gate values
		synth.gainEnv.gate.setValue(0);
		var gate = 1;
		playingPatternEvent = audiolet.scheduler.play([new PSequence(beatInfos_indexes, Infinity)], 1, function(beatInfoIndex)
		{
			var beatInfo = beatInfos[beatInfoIndex]; // each x-value-entry actually takes two beats
			var frequency = beatInfo * 20;

			synth.sine.frequency.setValue(frequency);
			SetVolume(masterVolume * tempoCompensationVolume * (volume_data[beatInfo] / 200) * 60);
			gate = gate == 1 ? 0 : 1; // invert the gate
			synth.gainEnv.gate.setValue(gate);

			if (beatInfoIndex == beatInfos_indexes.length - 1) // if last beat of all
				BuildBeatInfos(); //Shuffle(sequenceItems_final);
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
    		else
    			synth.gain.gain.setValue(vol / 1.5); // solid tone is much louder
	}
	function Shuffle(list)
	{
		for (var j, x, i = list.length; i; j = parseInt(Math.random() * i), x = list[--i], list[i] = list[j], list[j] = x)
			;
		return list;
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

	// #tempo
	// ==========

	var tempoCompensationVolume = 1;
	var tempo = 500000;
	R("#tempo").slider(
	{
		min: fullControlMode ? 100 : 3000,
		max: 1000000, //300000
		step: 10,
		slide: function() { R("#tempo").slider("option").change(); },
		change: function() { SetTempo(R("#tempo").slider("value"), false); }
	});
	function SetTempo(newTempo, updateUI)
	{
		updateUI = updateUI != null ? updateUI : true;

		R("#tempoLabel").html(newTempo);
		if (updateUI)
			R("#tempo").slider("value", newTempo);
		tempo = newTempo;

		//tempoCompensationVolume = Math.log(tempo); //logWithBaseX(tempo, 2.718281828459045);
		if (tempo < 500000)
			if (tempo < 10000)
				tempoCompensationVolume = V.Lerp(.001, V.Lerp(.1, 1, 10000 / 500000), tempo / 10000);
			else
				tempoCompensationVolume = V.Lerp(.1, 1, tempo / 500000);
		else
			tempoCompensationVolume = 1;

		if (playing)
			StartNoise();
	}

	// master volume
	// ==========

	var masterVolume = .5;
	R("#masterVolume").slider(
	{
		min: 0,
		max: fullControlMode ? 1000 : 100,
		slide: function() { R("#masterVolume").slider("option").change(); },
		change: function() { SetMasterVolume(R("#masterVolume").slider("value") / 100, false); }
	});
	function SetMasterVolume(newMasterVolume, updateUI)
	{
		updateUI = updateUI != null ? updateUI : true;

		R("#masterVolumeLabel").html(Math.round(newMasterVolume * 100) + "%");
		if (updateUI)
			R("#masterVolume").slider("value", Math.round(newMasterVolume * 100));
		masterVolume = newMasterVolume;
	}

	/*R("#profiles").click(function()
	{
		if (R("#profilesMenu").css("display") != "none")
			R("#profilesMenu").css("display", "none");
		else
			R("#profilesMenu").css("display", "");
	});*/

	// profiles
	// ==========

	var NoiseProfileKeyStart = "Noise_profile";
	function GetNextProfileID()
	{
		var highestIDFound = -1;
		for (var key in localStorage)
			if (key.StartsWith(NoiseProfileKeyStart))
			{
				var id = parseInt(key.substr(NoiseProfileKeyStart.length));
				if (id > highestIDFound)
					highestIDFound = id;
			}

		return highestIDFound + 1;
	}
	R("#newProfile").click(function()
	{
		localStorage.setItem(NoiseProfileKeyStart + GetNextProfileID(), ToJSON({}));
		LoadProfileList();
	});
	R("#export").click(function()
	{
		var data = {};
		for (var key in localStorage)
			if (key.StartsWith(NoiseProfileKeyStart))
				data[key] = localStorage[key];
		V.StartDownload(ToJSON(data), "NoiseProfiles.json");
	});
	R("#import").click(function()
	{
		V.SelectFileForOpen(function(text)
		{
			var data = FromJSON(text);
			V.ShowConfirmationBox({title: "Clear Existing", message: "Clear existing profiles before import?", okLabel: "Yes", cancelLabel: "No", onOK: function()
			{
				for (var key in localStorage)
					if (key.StartsWith(NoiseProfileKeyStart))
						localStorage.removeItem(key);

				for (var key in data)
					if (key.StartsWith(NoiseProfileKeyStart))
						localStorage[key] = data[key];

				LoadProfileList();
			}, onCancel: function()
			{
				for (var key in data)
					if (key.StartsWith(NoiseProfileKeyStart))
						localStorage[NoiseProfileKeyStart + GetNextProfileID()] = data[key];

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
			if (key.StartsWith(NoiseProfileKeyStart))
				foundProfile = true;
		if (!foundProfile) // if no profiles were found, load in the starter set
			for (var i in NoiseData.startProfiles.Indexes())
				localStorage[NoiseProfileKeyStart + i] = ToJSON(NoiseData.startProfiles[i]);

		var profileKeys_sorted = [];
		for (var key in localStorage)
			if (key.StartsWith(NoiseProfileKeyStart))
				profileKeys_sorted.push(key);
		profileKeys_sorted.sort(function(aStr, bStr)
		{
			var a = parseInt(aStr.substr(NoiseProfileKeyStart.length));
			var b = parseInt(bStr.substr(NoiseProfileKeyStart.length));
			return a < b ? -1 : (a > b ? 1 : 0);
		});

		for (var i in profileKeys_sorted.Indexes())
		{
			var key = profileKeys_sorted[i];
			(function()
			{
				var data = FromJSON(localStorage.getItem(key));
				var id = parseInt(key.substr(NoiseProfileKeyStart.length));

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
		result.tempo = R("#tempo").slider("value");
		result.masterVolume = R("#masterVolume").slider("value") / 100;
		result.noiseConcentrationGraph = R("#noiseConcentrationGraph")[0].toDataURL();
		result.volumeGraph = R("#volumeGraph")[0].toDataURL();
		return result;
	}
	function SaveProfile(profileID, name)
	{
		localStorage.setItem(NoiseProfileKeyStart + profileID, ToJSON(CreateProfile(name)));
		liveProfileID = profileID;
		LoadProfileList();
	}
	function LoadProfileByID(profileID)
	{
		LoadProfile(FromJSON(localStorage.getItem(NoiseProfileKeyStart + profileID)));
		liveProfileID = profileID;
	}
	function LoadProfile(data)
	{
		SetTempo(data.tempo);
		SetMasterVolume(data.masterVolume);

		if (data.noiseConcentrationGraph)
		{
			//R("#noiseConcentrationGraph")[0].getContext("2d").putImageData(save_noiseConcentrationGraph, 0, 0);
			var save_noiseConcentrationGraph = new Image;
			save_noiseConcentrationGraph.onload = function()
			{
				var graphics = R("#noiseConcentrationGraph")[0].getContext("2d");
				graphics.drawImage(save_noiseConcentrationGraph, 0, 0);
				var save_noiseConcentration_data = graphics.getImageData(0, 0, 900, 200).data;
				for (var x = 0; x < 900; x++)
					for (var y = 0; y < 200; y++)
					{
						//var data = graphics.getImageData(x, y, 1, 1).data; //[red, green, blue, alpha]
						var data = save_noiseConcentration_data.GetRange((x * 4) + (y * 900 * 4), 4); //[red, green, blue, alpha]
						if (data[0] != 255) // if black
							noiseConcentration_data[x] = 200 - y;
					}
				if (playing)
					StartNoise();
			};
			save_noiseConcentrationGraph.src = data.noiseConcentrationGraph;
		}
		else
		{
			for (var x = 0; x < 900; x++)
				noiseConcentration_data[x] = 100;
			NoiseConcentration_Render();
		}

		if (data.volumeGraph)
		{
			//R("volumeGraph")[0].getContext("2d").putImageData(save_volumeGraph, 0, 0);
			var save_volumeGraph = new Image;
			save_volumeGraph.onload = function()
			{
				var graphics = R("#volumeGraph")[0].getContext("2d");
				graphics.drawImage(save_volumeGraph, 0, 0);
				var save_volume_data = graphics.getImageData(0, 0, 900, 200).data;
				for (var x = 0; x < 900; x++)
					for (var y = 0; y < 200; y++)
					{
						//var data = graphics.getImageData(x, y, 1, 1).data; //[red, green, blue, alpha]
						var data = save_volume_data.GetRange((x * 4) + (y * 900 * 4), 4); //[red, green, blue, alpha]
						if (data[0] != 255) // if black
							volume_data[x] = 200 - y;
					}
			};
			save_volumeGraph.src = data.volumeGraph;
		}
		else
		{
			for (var x = 0; x < 900; x++)
				volume_data[x] = 100;
			Volume_Render();
		}
	}
	function RemoveProfile(profileID)
	{
		localStorage.removeItem(NoiseProfileKeyStart + profileID);
		LoadProfileList();
	}

	// graphs
	// ==========

	var noiseConcentration_data = []; // 900 items
	var noiseConcentration_lastMousePos = null;
	var noiseConcentration_mouseDown = false;
	R("#noiseConcentrationGraph").mousemove(function(event)
	{
		var mousePos = {x: event.pageX - R("#noiseConcentrationGraph").offset().left, y: event.pageY - R("#noiseConcentrationGraph").offset().top}; //{x: event.offsetX, y: event.offsetY};
		if (noiseConcentration_lastMousePos != null && noiseConcentration_mouseDown && event.which == 1)
		{
			var moveXDif = mousePos.x - noiseConcentration_lastMousePos.x;
			var moveYDif = mousePos.y - noiseConcentration_lastMousePos.y;
			if (mousePos.x > noiseConcentration_lastMousePos.x)
				for (var x = noiseConcentration_lastMousePos.x; x <= mousePos.x; x++)
				{
					var xDif = x - noiseConcentration_lastMousePos.x;
					var newYValue = 200 - (noiseConcentration_lastMousePos.y + ((xDif / moveXDif) * moveYDif));
					noiseConcentration_data[x] = newYValue;
				}
			else
				for (var x = mousePos.x; x <= noiseConcentration_lastMousePos.x; x++)
				{
					var xDif = x - noiseConcentration_lastMousePos.x;
					var newYValue = 200 - (noiseConcentration_lastMousePos.y + ((xDif / moveXDif) * moveYDif));
					noiseConcentration_data[x] = newYValue;
				}

			NoiseConcentration_Render();
			if (playing) // maybe temp
				StartNoise(); // update
		}

		R("#noiseConcentration_frequency").html("(" + (mousePos.x * 20) + "hz, " + ((200 - mousePos.y) / 2) + ")");
		noiseConcentration_lastMousePos = mousePos;
	});
	R("#noiseConcentrationGraph").mouseleave(function()
	{
		R("#noiseConcentration_frequency").html("");
		noiseConcentration_lastMousePos = null;
	});
	R("#noiseConcentrationGraph").mousedown(function() { noiseConcentration_mouseDown = true; });
	function NoiseConcentration_Render()
	{
		var canvas = R("#noiseConcentrationGraph");
		var graphics = canvas[0].getContext("2d");

		graphics.fillStyle = "white";
		graphics.fillRect(0, 0, 900, 200);

		for (var x = 0; x < 900; x++)
		{
			var yValue = noiseConcentration_data[x]; //|| 50;
			graphics.fillStyle = "black";
			graphics.fillRect(x, 200 - yValue, 1, 1);
		}
	}

	var volume_data = []; // 900 items
	var volume_lastMousePos = null;
	var volume_mouseDown = false;
	R("#volumeGraph").mousemove(function(event)
	{
		var mousePos = {x: event.pageX - R("#volumeGraph").offset().left, y: event.pageY - R("#volumeGraph").offset().top}; //{x: event.offsetX, y: event.offsetY};
		if (volume_lastMousePos != null && volume_mouseDown && event.which == 1)
		{
			var moveXDif = mousePos.x - volume_lastMousePos.x;
			var moveYDif = mousePos.y - volume_lastMousePos.y;
			if (mousePos.x > volume_lastMousePos.x)
				for (var x = volume_lastMousePos.x; x <= mousePos.x; x++)
				{
					var xDif = x - volume_lastMousePos.x;
					var newYValue = 200 - (volume_lastMousePos.y + ((xDif / moveXDif) * moveYDif));
					volume_data[x] = newYValue;
				}
			else
				for (var x = mousePos.x; x <= volume_lastMousePos.x; x++)
				{
					var xDif = x - volume_lastMousePos.x;
					var newYValue = 200 - (volume_lastMousePos.y + ((xDif / moveXDif) * moveYDif));
					volume_data[x] = newYValue;
				}

			Volume_Render();
		}

		R("#volume_frequency").html("(" + (mousePos.x * 20) + "hz, " + ((200 - mousePos.y) / 2) + ")");
		volume_lastMousePos = mousePos;
	});
	R("#volumeGraph").mouseleave(function()
	{
		R("#volume_frequency").html("");
		volume_lastMousePos = null;
	});
	R("#volumeGraph").mousedown(function() { volume_mouseDown = true; });
	function Volume_Render()
	{
		var canvas = R("#volumeGraph");
		var graphics = canvas[0].getContext("2d");

		graphics.fillStyle = "white";
		graphics.fillRect(0, 0, 900, 200);

		for (var x = 0; x < 900; x++)
		{
			var yValue = volume_data[x]; //|| 50;
			graphics.fillStyle = "black";
			graphics.fillRect(x, 200 - yValue, 1, 1);
		}
	}

	var draggingInCanvas = false;
	document.onselectstart = function(event)
	{
		if ($(event.target).is("canvas") || draggingInCanvas)
		{
			draggingInCanvas = true;
			event.preventDefault();
			return false;
		}
	};
	$(document).mouseup(function()
	{
		noiseConcentration_mouseDown = false;
		volume_mouseDown = false;
		draggingInCanvas = false;
	});

	self.Attach = function(holder)
	{
		self.root.appendTo(holder);

		LoadProfileList();
		/*if (localStorage.getItem("Noise_lastSessionProfile") != null)
			LoadProfile(FromJSON(localStorage.getItem("Noise_lastSessionProfile")));
		else
			LoadProfile({name: "Default", tempo: 500000, masterVolume: .5});*/
		LoadProfile(FromJSON(localStorage.getItem("Noise_lastSessionProfile")) || NoiseData.startProfiles[0]);
	};
    self.Show = function()
    {
        self.root.css("display", "");
        Frame.SetSubButtonActive("Noise", true);
    };
    self.Hide = function()
    {
        self.root.css("display", "none");
        Frame.SetSubButtonActive("Noise", false);

        localStorage.setItem("Noise_lastSessionProfile", ToJSON(CreateProfile("lastSession")));
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

    // connect oscillator
    this.sine.connect(this.gain);
    this.gain.connect(this.outputs[0]);

    // connect trigger and envelope
    //this.trigger.connect(this.gainEnv);
    this.gainEnv.connect(this.gainEnvMulAdd);
    this.gainEnvMulAdd.connect(this.gain, 0, 1);
};
extend(TriggerSynth, AudioletGroup);