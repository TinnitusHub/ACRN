// references
// ==================

/// <reference path="../JQuery/JQuery1.9.1.js"/>
/// <reference path="../JQuery/JQueryResize.js"/>
/// <reference path="../JQuery/JQueryNodeListener.js"/>
/// <reference path="../JQuery/JQueryOthers.js"/>
/// <reference path="../JQueryUI/JQueryUI1.11.0.js"/>
/// <reference path="../JQueryUI/JQueryUIMenuBar.js"/>
/// <reference path="../JQueryUI/JQueryUIContextMenu.js"/>
/// <reference path="../JQueryUI/JQueryUIOthers.js"/>
/// <reference path="../JQueryFancyTree/Core.js"/>
/// <reference path="../JQueryFancyTree/DND.js"/>
/// <reference path="../V/V.js"/>
/// <reference path="../V/VDebug.js"/>
/// <reference path="../V/VResizable.js"/>
/// <reference path="../V/VTabView.js"/>
/// <reference path="../V/VMessageBox.js"/>
/// <reference path="../V/VFileBrowser.js"/>
/// <reference path="../VDF/VDF.js"/>
/// <reference path="../VDF/VDFTypeInfo.js"/>
/// <reference path="../VDF/VDFNode.js"/>
/// <reference path="../VDF/VDFSaver.js"/>
/// <reference path="../VDF/VDFLoader.js"/>
/// <reference path="../VDF/VDFTokenParser.js"/>
/// <reference path="../CoherentUI/CoherentUI.js"/>
/// <reference path="../General/ClassExtensions.js"/>
/// <reference path="../General/Globals.js"/>

/// <reference path="../AngularJS/AngularJS.js"/>
/// <reference path="../AngularJS/ScrollView.js"/>

// variables
// ==================

var uiState = {};
var livePage;
var liveSubpage;
var liveSubpage2;

//var lastLoadedUrl = null;

// angular
// ==========

function AngularCompile(root)
{
    var injector = angular.element($('[ng-app]')[0]).injector();
    var $compile = injector.get('$compile');
    var $rootScope = injector.get('$rootScope');
    var result = $compile(root)($rootScope);
    $rootScope.$digest();
    return result;
}

// methods: url writing/parsing
// ==================

function GetUrlVars(/*optional:*/ url)
{
	url = url || CurrentUrl();
	if (!url.Contains('?'))
		return {length: 0};

	var vars = {};

	var urlVarStr = url.Contains("?") ? (url.Contains("runJS=") ? url.slice(url.indexOf("?") + 1) : url.slice(url.indexOf("?") + 1).split("#")[0]) : "";
	var parts = urlVarStr.split("&");
	for(var i = 0; i < parts.length; i++)
		vars[parts[i].substring(0, parts[i].indexOf("="))] = parts[i].substring(parts[i].indexOf("=") + 1);

	return vars;
}
function GetUrlPathNodes(url)
{
	var firstAfterDomainCharPos = url.indexOf("/", url.indexOf("//") + 2) != -1 ? url.indexOf("/", url.indexOf("//") + 2) + 1 : url.length;
	var pathsStr = url.substring(firstAfterDomainCharPos, url.Contains("?") ? url.indexOf("?") : url.length);
	if (pathsStr.length == 0)
		return [url];
	var parts = [url.substr(0, firstAfterDomainCharPos)].concat(pathsStr.split("/"));
    return parts;
}

// methods: serialization
// ==================

// no using JSON!
/*var JSON_stringify_old = JSON.stringify;
var JSON_parse_old = JSON.parse;
JSON.stringify = function () { throw new Error("No using JSON!"); };
JSON.parse = function () { throw new Error("No using JSON!"); };*/

// object-Json
function ToJSON(obj) { return JSON.stringify(obj); }
function FromJSON(json) { return JSON.parse(json); }

// object-VDF
function FromVDF(vdf, /*optional:*/ realVTypeName, loadOptions) { return VDF.Deserialize(vdf, realVTypeName, loadOptions || new VDFLoadOptions(null, true)); }
function ToVDF(obj, /*optional:*/ declaredTypeName_orSaveOptions, saveOptions_orDeclaredTypeName) { return VDF.Serialize(obj, declaredTypeName_orSaveOptions, saveOptions_orDeclaredTypeName); }

function ToBool(boolStr) { return boolStr == "true" ? true : false; }
function ToInt(stringOrFloatVal) { return parseInt(stringOrFloatVal); }
function ToFloat(stringOrIntVal) { return parseFloat(stringOrIntVal); }
function ToString(val) { return "" + val; }
//function ToFloatString(floatVal) { return "[#float]" + floatVal; } // this works because actually-string values don't have a type header; this adds its own (maybe temp)

// methods
// ==================

function Log(message, appendStackTrace, logLater) { console.log(message); return message; }
function onerror(message, url, line) { Log("JS) " + message + " (" + line + "; " + url + ")\n"); }

/*function Database_SendMessage(messageData)
{
    return $.ajax(
    {
        type: "POST",
        data: messageData,
        dataType: "JSON",
        url: "/Database"
    });
}*/
function CallDatabase(callOrCalls)
{
    var calls = callOrCalls instanceof Array ? callOrCalls : [callOrCalls];
    /*return $.ajax(
    {
        type: "post",
        //contentType: "application/x-www-form-urlencoded", // apparently this is needed (doesn't seem like it should be; but whatever)
        data: {calls: calls},
        dataType: "json",
        url: "/Database"
    });*/
    return $.ajax(
    {
        type: "post",
        contentType: "application/json",
        data: ToJSON({calls: calls}),
        url: "/Database"
    });
}

function TryCall(func, /*optional:*/ args_)
{
    if (func instanceof Function)
        func.apply(this, V.CloneArray(arguments).splice(0, 1));
}
function CurrentUrl() { return window.location.href.replace(/%22/, "\""); } // note; look into the escaping issue more

function WaitXThenRun(waitTime, func) { setTimeout(func, waitTime); }

function SetCookie(name, value, /*optional:*/ daysToExpire)
{
	daysToExpire = daysToExpire != null ? daysToExpire : 100000;
	var expireDate = new Date();
	expireDate.setDate(expireDate.getDate() + daysToExpire);
	document.cookie = name + "=" + value + "; expires=" + expireDate.toUTCString() + "; path=/;";
}
function GetCookie(name)
{
	var result = null;

	var container = document.cookie;

	var cookieStart = container.indexOf(" " + name + "=");
	if (cookieStart == -1)
		cookieStart = container.indexOf(name + "=");
	if (cookieStart != -1)
	{
		var cookieValueStart = container.indexOf("=", cookieStart) + 1;
		var cookieValueEnd = container.indexOf(";", cookieValueStart);
		if (cookieValueEnd == -1)
			cookieValueEnd = container.length;
		result = decodeURIComponent(container.substring(cookieValueStart, cookieValueEnd));
	}

	return result;
}

function IsQuickMenuOpen(id) { return $("#" + id).css("display") != "none"; }
function ToggleQuickMenu(id)
{
	var open = IsQuickMenuOpen(id);
	SetQuickMenuOpen(id, !open);
	return !open;
}
function SetQuickMenuOpen(id, open) { $("#" + id).css("display", open ? "" : "none"); }
function CloseQuickMenus() { $(".quickMenu.autoClose").css("display", "none"); }

function GetSelection() { return {startControl: GetSelectionStartControl(), endControl: GetSelectionEndControl(), startOffset: GetSelectionStartOffset(), endOffset: GetSelectionEndOffset()}; }
function GetSelectionStartControl() { return window.getSelection().getRangeAt(0).startContainer; }
function GetSelectionEndControl() { return window.getSelection().getRangeAt(window.getSelection().rangeCount - 1).endContainer; }
function GetSelectionStartOffset() { return window.getSelection().getRangeAt(0).startOffset; }
function GetSelectionEndOffset() { return window.getSelection().getRangeAt(window.getSelection().rangeCount - 1).endOffset; }

function SetSelection(control, startOffset, endOffset)
{
    var selection = getSelection();
    var range = document.createRange();
    range.setStart(control, startOffset);
    range.setEnd(control, endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
}