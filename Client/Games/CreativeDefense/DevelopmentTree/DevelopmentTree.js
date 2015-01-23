var DevelopmentTreeUI = function()
{
    var self = this;
    self.tasks = [];
    self.taskLists = [];
    self.selectedTaskID = null;

	// early ui setup
	// ==========

    var R = function(selector) { return self.root.find(selector); };
	self.root = $(V.Multiline(function() {/*
	<div class="DevelopmentTree clickThrough #menu" style="display: none;"><div class="clickThrough borderBox" style="position: relative; width: 960; #height: 100%; margin: 0 auto; padding: 10; border: 1px solid #CCC; border-radius: 3px; background: rgba(255, 255, 255, .7);">
        <style>
        _.DevelopmentTree div { color: #888; }
        _.DevelopmentTree div > * { color: #888; }

        .list
        {
            display: inline-block;
            position: relative;
            float: left;
            width: calc(50% - 3px); //calc(33.333% - 4px);
            #height: 100%;
            #border: 1px outset #777;
            box-sizing: border-box;
        }
        .list:not(:nth-child(3)) { margin-left: 6; }
        .list > .background
        {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: .3;
        }
        .list > .categoryTitle
        {
            display: inline-block;
            position: relative;
            left: 50%;
            transform: translate(-50%);
            font-size: 14;
        }

        .tasks { min-height: 100; }
        .taskBox
        {
            position: relative;
            width: 100%;
            background: rgba(0, 30, 60, .1);
            #background: rgba(255, 255, 255, .3);
            #border: 1px outset #777;
        }
        .taskBox:not(:first-child) { margin-top: 3; }
        .taskBox * { cursor: pointer; }
        .taskBox:hover { background: rgba(0, 0, 0, .3) !important; }
        .taskBox.selected { background: rgba(0, 0, 0, .5) !important; }

        .title:hover, .title:focus
        {
            #background: rgba(255, 255, 255, .3) !important;
            border: 1px solid #333 !important;
            #color: #CCC !important;
        }
        </style>
        <!-- <div class="fixed" style="position: fixed; left: 0; top: 0; z-index: -2; width: 100%; height: 100%; background: rgba(0, 0, 0, 1);"></div> -->
        <!-- <div class="fixed" style="position: fixed; left: 0; top: 0; z-index: -1; width: 100%; height: 100%; background: url(Packages/Images/Backgrounds/Ocean.png); opacity: 1;"></div> -->
        <div class="fixed" style="position: fixed; left: 0; top: 50%; z-index: -1; width: 100%; height: 1080; transform: translate(0px, -50%); background: url(Packages/Images/Backgrounds/Ocean.png); opacity: 1;"></div>
        <div id="topBar" class="clear" style="margin-bottom: -14;">
            <div class="clear" style="float: right;">
                <div id="save" class="button">Save</div>
                <div id="load" class="button">Load</div>
            </div>
        </div>
        <div class="clear" id="focusList">
            <div style="padding-left: 10; font-size: 18;">Focus</div>
            <div style="border: solid #CCC; border-width: 0 0 1px 0;"></div>
            <div class="list" id="clean_focus">
                <!-- <div class="background menuB300 clickThrough"></div> -->
                <div class="categoryTitle">Clean</div>
                <div class="buttonBar" style="padding: 5; padding-top: 0;">
                    <div class="new button diameter24 icon10" title="New" style="background-image: url(/Packages/Images/Buttons/Plus.png);"></div>
                    <!--<div class="rename button diameter24 icon14" title="Rename" style="background-image: url(/Packages/Images/Buttons/Edit.png);"></div>-->
                    <div class="delete button diameter24 icon10" title="Delete" style="background-image: url(/Packages/Images/Buttons/Minus.png);"></div>
                </div>
                <div class="tasks">
                </div>
            </div>
            <div class="list" id="grow_focus">
                <!-- <div class="background menuB300 clickThrough"></div> -->
                <div class="categoryTitle">Grow</div>
                <div class="buttonBar" style="padding: 5; padding-top: 0;">
                    <div class="new button diameter24 icon10" title="New" style="background-image: url(/Packages/Images/Buttons/Plus.png);"></div>
                    <!--<div class="rename button diameter24 icon14" title="Rename" style="background-image: url(/Packages/Images/Buttons/Edit.png);"></div>-->
                    <div class="delete button diameter24 icon10" title="Delete" style="background-image: url(/Packages/Images/Buttons/Minus.png);"></div>
                </div>
                <div class="tasks">
                </div>
            </div>
        </div>
        <div class="clear" id="fullList" style="margin-top: 10;">
            <div style="padding-left: 10; font-size: 18;">Background</div>
            <div style="border: solid #CCC; border-width: 0 0 1px 0;"></div>
            <div class="list" id="clean">
                <!-- <div class="background menuB300 clickThrough"></div> -->
                <div class="categoryTitle">Clean</div>
                <div class="buttonBar" style="padding: 5; padding-top: 0;">
                    <div class="new button diameter24 icon10" title="New" style="background-image: url(/Packages/Images/Buttons/Plus.png);"></div>
                    <!--<div class="rename button diameter24 icon14" title="Rename" style="background-image: url(/Packages/Images/Buttons/Edit.png);"></div>-->
                    <div class="delete button diameter24 icon10" title="Delete" style="background-image: url(/Packages/Images/Buttons/Minus.png);"></div>
                </div>
                <div class="tasks">
                </div>
            </div>
            <div class="list" id="grow">
                <!-- <div class="background menuB300 clickThrough"></div> -->
                <div class="categoryTitle">Grow</div>
                <div class="buttonBar" style="padding: 5; padding-top: 0;">
                    <div class="new button diameter24 icon10" title="New" style="background-image: url(/Packages/Images/Buttons/Plus.png);"></div>
                    <!--<div class="rename button diameter24 icon14" title="Rename" style="background-image: url(/Packages/Images/Buttons/Edit.png);"></div>-->
                    <div class="delete button diameter24 icon10" title="Delete" style="background-image: url(/Packages/Images/Buttons/Minus.png);"></div>
                </div>
                <div class="tasks">
                </div>
            </div>
        </div>
	</div></div>
	*/}).trim());

    // database methods
    // ==========

	function GetResponseErrors(response)
	{
	    var result = [];
	    for (var i in response.results.Indexes())
	    {
	        var responseResult = response.results[i];
	        if (responseResult && responseResult.error)
	            result.push(responseResult.error);
        }
	    return result;
	}

	/*function TaskList_AddTask(taskListID, id)
	{
	    CallDatabase({command: "TaskList_AddTask", taskListID: taskListID, taskID: id}).done(function(response)
        {
            if (response.error)
                alert("Error: " + response.error);
            else
                self.LoadTasksAndTaskLists();
        });
	}*/

    function AddTask(holdingTaskListIDs, name, /*optional:*/ onSuccess)
	{
        var calls = [{command: "AddTask", name: name}];
        for (var i in holdingTaskListIDs.Indexes())
            calls.push({command: "TaskList_AddTask", taskListID: holdingTaskListIDs[i], taskID: "<results[0]>"});
        CallDatabase(calls).done(function(response)
        {
            if (GetResponseErrors(response).length)
                return alert("Error: " + GetResponseErrors(response)[0]);

            self.LoadTasksAndTaskLists();
            TryCall(onSuccess, response.id);
        });
    };
    function RemoveTask(id)
    {
        CallDatabase({command: "RemoveTask", id: id}).done(function(response)
        {
            self.LoadTasksAndTaskLists();
        });
    };
    /*function AddVote(taskID)
    {
        $.ajax(
        {
            type: "POST",
            data: {command: "AddVote", taskID: taskID},
            dataType: "JSON",
            url: "/Database"
        }).done(function(response)
        {
            self.LoadTasksAndTaskLists();
        });
    };
    function RemoveVote(taskID)
    {
        $.ajax(
        {
            type: "POST",
            data: {command: "RemoveVote", taskID: taskID},
            dataType: "JSON",
            url: "/Database"
        }).done(function(response)
        {
            self.LoadTasksAndTaskLists();
        });
    };*/

	// methods
    // ==========

    var taskListNames = {1: "clean", 2: "grow", 101: "clean_focus", 102: "grow_focus"}; //taskListIDToNameMap
    var taskListIDs = V.SwapKeysAndValues_NewValuesAsInts(taskListNames); //taskListNameToIDMap
    self.LoadTasksAndTaskLists = function()
    {
    	self.SelectTaskByID(null); // maybe temp
        CallDatabase(
        [
            {command: "GetTasks"},
            {command: "GetTaskLists"}
        ]).done(function(response)
        {
            self.tasks = response.results[0].tasks;
            self.taskLists = response.results[1].taskLists;
            LoadTaskListsUI();
        });
    };
    function LoadTaskListsUI()
    {
        for (var i in self.taskLists.Indexes())
        {
            var taskList = self.taskLists[i];
            var taskList_taskBoxHolder = $("#" + taskListNames[taskList.id] + " > .tasks");

            //var tasks = self.tasks.Filter(function() { return taskList.tasks.Contains(this.id); });
            var tasks = taskList.tasks.Map(function()
            {
                var taskID = this;
                return self.tasks.First(function() { return this.id == taskID; });
            });
            if (!taskListNames[taskList.id].Contains("_focus")) // if full-list (focus list ordering should be fully manual/disconnected from voting)
                tasks = V.StableSort(tasks, function(a, b)
                {
                    var aVotes = parseInt(a.votes || 0);
                    var bVotes = parseInt(b.votes || 0);
                    return aVotes < bVotes ? 1 : (aVotes > bVotes ? -1 : 0); // descending order
                });
            
            taskList_taskBoxHolder.html("");
            for (var i2 = 0; i2 < tasks.length; i2++)
            {
                var task = tasks[i2];
                var box = CreateTaskBox(task);
                taskList_taskBoxHolder.append(box);
            }
        }
    };
    function CreateTaskBox(task)
    {
        var result = $("<div class='taskBox borderBox'>");
        result[0].task = task;
        //result.click(function() { self.SelectTaskByID(task.id); });
        result.on("click", "*", function () { self.SelectTaskByID(task.id); });

        var title = $("<input class='title' type='text' style='padding-left: 5; width: calc(100% - 96px); height: 28; background: transparent; border: 1px solid transparent; font-size: 15;'>").appendTo(result).val(task.name);
        title.change(function()
        {
            CallDatabase({command: "RenameTask", id: task.id, name: title.val()}).done(function(response)
            {
                if (response.error)
                    alert("Error: " + response);
                else
                    self.LoadTasksAndTaskLists();
            });
        });
        var timeBox = $("<div class='button' title='Estimated hours required to develop' style='display: inline-block; margin-left: 3; padding: 0 5; width: 20; height: 28; vertical-align: top; background: rgba(0, 0, 0, .3);'>").appendTo(result);
        var time = $("<div style='margin-top: 3; font-size: 15; text-align: center;'>").appendTo(timeBox).html(task.time || 0);
        timeBox.click(function()
        {
	        V.ShowTextInputBox({title: "Set Time", label: "Time: ", value: task.time, onOK: function(value)
	        {
	            CallDatabase({command: "SetTaskTime", id: task.id, time: parseFloat(value)}).done(function(response)
                {
	                if (response.error)
	                    alert("Error: " + response);
                    else
	                    self.LoadTasksAndTaskLists();
                });
	        }});
        });
        var votesBox = $("<div title='Votes' style='display: inline-block; margin-left: 3; padding: 0 5; width: 20; height: 28; vertical-align: top; background: rgba(0, 0, 0, .3);'>").appendTo(result);
        var votes = $("<div style='margin-top: 3; font-size: 15; text-align: center;'>").appendTo(votesBox).html(task.votes || 0);
        var buttons = $("<div style='float: right;'>").appendTo(result);

        var voteCountBar = $("<div style='display: none; width: 100%; height: 10;'>").appendTo(result);
        var voteCount = 50;
        for (var i = 0; i < voteCount; i++)
        {
            var voteButton = $("<div class='borderBox' style='display: inline-block; width: " + (100 / voteCount) + "%; height: 10; border: 1px solid #FFF;'>").appendTo(voteCountBar);
            voteButton[0].i = i;
            voteButton.attr("title", (i + 1) + " (right click to remove)");
            if (i < (task.votes || 0))
                voteButton.css("background", "green");
            voteButton.mouseup(function(event, data)
            {
                CallDatabase({command: "SetTaskVotes", id: task.id, votes: event.which == 1 ? this.i + 1 : 0}).done(function(response) // left click sets votes, middle/right click removes votes
                {
                    self.LoadTasksAndTaskLists();
                });
            });
        }

        var setVoteCount = $("<div class='new button diameter28 icon10' title='Your votes' style='background-image: url(/Packages/Images/Buttons/Down.png);'>").appendTo(buttons);
        setVoteCount.click(function ()
        {
            if (voteCountBar.css("display") == "none")
            {
                setVoteCount.css("background-image", "url(/Packages/Images/Buttons/Up.png)");
                voteCountBar.css("display", "");
            }
            else
            {
                setVoteCount.css("background-image", "url(/Packages/Images/Buttons/Down.png)");
                voteCountBar.css("display", "none");
            }
        });

        /*var remove = $("<div class='new button diameter28 icon14' title='Delete' style='margin-left: 3; background-image: url(/Packages/Images/Buttons/X.png);'>").appendTo(buttons);
        remove.click(function()
        {
            V.ShowConfirmationBox({title: "Delete Task", message: "Delete task '" + task.name + "'?", onOK: function()
            {
                RemoveTask(task.id);
            }});
        });*/

        return result;
    }

    self.GetTask = function(id) { return self.GetTaskBox(id) && self.GetTaskBox(id)[0].task; }
    self.GetTaskBox = function(id) { return R(".taskBox").first(function() { return this.task.id == id; }); }
    self.GetTaskBoxes = function(id) { return R(".taskBox").filter(function() { return this.task.id == id; }).toArray(); }
    self.SelectTaskByID = function(id)
    {
        //if (self.selectedTaskID == id)
        //    return;
        self.OnTaskSelected(id);
    };
    self.OnTaskSelected = function(id)
    {
        self.selectedTaskID = id;
        /*var box = self.GetTaskBox(id);
        R(".taskBox.selected").removeClass("selected");
        if (box)
        {
            box.addClass("selected");
            R(".delete").removeClass("disabled");
        }
        else
            R(".delete").addClass("disabled");
        //self.LoadProperties(self.GetTask(id));*/

        R(".taskBox.selected").removeClass("selected");
        var boxes = self.GetTaskBoxes(id);
        if (boxes.length)
            for (var i in boxes.Indexes())
            {
                var box = $(boxes[i]);
                box.addClass("selected");
                R(".delete").removeClass("disabled");
            }
        else
            R(".delete").addClass("disabled");
    };

    function StartDownload(content, filename)
    {
        var link = $("<a style='display: none;'/>").appendTo($("body")); //.html("Save to Disk");
        link.attr("href", "data:application/octet-stream," + encodeURIComponent(content));
        link.attr("download", filename);
        link[0].click(); //link.click(); // (the jQuery click-function fails to trigger the download, for some reason)
        link.remove();
    }
    function SelectFileForOpen(callback)
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

    self.Attach = function(holder)
	{
        self.root.appendTo(holder);

        R("#save").click(function(event, data)
	    {
            CallDatabase({command: "GetDatabaseData"}).done(function(response)
            {
                if (response.error)
                    return alert("Error: " + response.error);
                StartDownload(ToJSON(response.results[0]), "DevelopmentTree_Backup.json");
            });
        });
        R("#load").click(function(event, data)
	    {
            SelectFileForOpen(function(text)
            {
                CallDatabase({command: "SetDatabaseData", data: FromJSON(text)}).done(function(response)
                {
                    if (response.error)
                        return alert("Error: " + response.error + ";" + ToJSON(response.error));
                    self.LoadTasksAndTaskLists();
                });
            });
	    });

        R(".tasks").sortable(
        {
            connectWith: ".tasks",
            receive: function(event, ui)
            {
                var task = ui.item[0].task;
                var fromTaskListName = ui.sender.parent().attr("id");
                var toTaskListName = $(event.target).parent().attr("id");
               
                //var fromTaskListNameRoot = fromTaskListName.substr(0, fromTaskListName.Contains("_") ? fromTaskListName.indexOf("_") : fromTaskListName.length);
                //var toTaskListNameRoot = toTaskListName.substr(0, toTaskListName.Contains("_") ? toTaskListName.indexOf("_") : toTaskListName.length);
                //var switchingColumn = fromTaskListNameRoot != toTaskListNameRoot;

                var oldTaskListNames = [fromTaskListName];
                if (fromTaskListName.Contains("_focus"))
                    oldTaskListNames.push(fromTaskListName.substr(0, fromTaskListName.Contains("_") ? fromTaskListName.indexOf("_") : fromTaskListName.length));
                else if (self.taskLists.First(function() { return taskListNames[this.id] == fromTaskListName + "_focus"; }).tasks.Contains(task.id))
                    oldTaskListNames.push(fromTaskListName + "_focus");

                var newTaskListNames = [toTaskListName];
                //if (toTaskListName.Contains("_focus")) // maybe temp; for now, cancel the dual-design and have focus-list items not be other-list items
                //    newTaskListNames.push(toTaskListName.substr(0, toTaskListName.Contains("_") ? toTaskListName.indexOf("_") : toTaskListName.length));
                
                var calls = [];
                // removing
                for (var i in oldTaskListNames.Indexes())
                {
                    var oldTaskListName = oldTaskListNames[i];
                    if (!newTaskListNames.Contains(oldTaskListName))
                        calls.push({command: "TaskList_RemoveTask", taskListID: taskListIDs[oldTaskListName], taskID: task.id});
                }
                // adding
                for (var i in newTaskListNames.Indexes())
                {
                    var newTaskListName = newTaskListNames[i];
                    if (!oldTaskListNames.Contains(newTaskListName))
                        calls.push({command: "TaskList_AddTask", taskListID: taskListIDs[newTaskListName], taskID: task.id});
                }

                if (!calls.length) // if no calls (e.g. we dragged item from root-list to focus-list, but the focus-list already contained it)
                    return self.LoadTasksAndTaskLists(); // refresh, so that controls (including the dragged one) are refreshed

                CallDatabase(calls).done(function(response)
                {
                    if (response.error)
                        return alert("Error: " + response.error);
                    self.LoadTasksAndTaskLists();
                });
            },
            update: function(event, ui)
            {
                //if (ui.sender == null && event.target == ui.item.parent()[0]) // if from-task-list and to-task-list are the same (dragged within the same list)
                if (event.target == ui.item.parent()[0]) // if not pre-drag-between-lists event
                {
                    var task = ui.item[0].task;
                    var taskListName = $(event.target).parent().attr("id");
                    var newTaskIndex = ui.item.index();
                    CallDatabase({command: "TaskList_SetTaskIndex", taskListID: taskListIDs[taskListName], taskID: task.id, taskIndex: newTaskIndex}).done(function(response)
                    {
                        if (response.error)
                            return alert("Error: " + response.error);
                        self.LoadTasksAndTaskLists();
                    });
                }
            }
        });

        self.root.click(function(event, data)
        {
            if (!$(event.target).closest(".taskBox, .button, .fixed").length)
	            self.SelectTaskByID(null);
	    });
	    R("#focusList .new").click(function()
	    {
	        var control = $(this);
	        V.ShowTextInputBox({title: "New Task", label: "Name: ", onOK: function(value)
	        {
	            /*var taskListName = control.parent().parent().attr("id");
	            var taskListID = taskListIDs[taskListName];
	            var fullTaskListID = taskListIDs[taskListName.replace("_focus", "")];
	            AddTask([fullTaskListID, taskListID], value);*/
                AddTask([taskListIDs[control.parent().parent().attr("id")]], value);
	        }});
	    });
        R("#fullList .new").click(function()
        {
            var control = $(this);
	        V.ShowTextInputBox({title: "New Task", label: "Name: ", onOK: function(value)
	        {
	            AddTask([taskListIDs[control.parent().parent().attr("id")]], value);
	        }});
	    });
        R(".delete").click(function()
        {
            var task = self.GetTask(self.selectedTaskID); //($(".taskBox").first(function() { return $(this).find("input:focus"); })[0] || {}).task;
            if (task)
	            V.ShowConfirmationBox({title: "Delete Task", message: "Delete task '" + task.name + "'?", onOK: function()
                {
                    RemoveTask(task.id);
                }});
	    });

        //self.LoadTasksAndTaskLists();
	    //self.SelectTaskByID(null);
	};
    self.Show = function()
    {
        self.root.css("display", "");
        Frame.SetSubButtonActive("DevelopmentTree", true);

        self.LoadTasksAndTaskLists();
    };
    self.Hide = function()
    {
        self.root.css("display", "none");
        Frame.SetSubButtonActive("DevelopmentTree", false); // old) note: have active-ness instead reflect whether data is being preserved in active state
    };
};