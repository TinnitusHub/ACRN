// Object: base
// ==================

// the below lets you do stuff like this: Array.prototype._AddFunction(function AddX(value) { this.push(value); }); []._AddX("newItem");
Object.defineProperty(Object.prototype, "_AddItem", // note; these functions should by default add non-enumerable properties/items
{
	enumerable: false,
	value: function(name, value, /*;optional:*/ forceAdd)
	{
		forceAdd = forceAdd != null ? forceAdd : true;
		if (this[name] && forceAdd)
			delete this[name];
		if (!this[name]) // if item doesn't exist yet
			Object.defineProperty(this, name,
			{
				enumerable: false,
				value: value
			});
	}
});
Object.prototype._AddItem("_AddFunction", function(func, /*;optional:*/ forceAdd) { this._AddItem(func.name || func.toString().match(/^function\s*([^\s(]+)/)[1], func, forceAdd); });

// the below lets you do stuff like this: Array.prototype._AddGetterSetter("AddX", null, function(value) { this.push(value); }); [].AddX = "newItem";
Object.prototype._AddFunction(function _AddGetterSetter(getter, setter, /*;optional:*/ forceAdd)
{
	forceAdd = forceAdd != null ? forceAdd : true;
	var name = (getter || setter).name || (getter || setter).toString().match(/^function\s*([^\s(]+)/)[1];
	if (this[name] && forceAdd)
		delete this[name];
	if (!this[name]) // if item doesn't exist yet
		if (getter && setter)
			Object.defineProperty(this, name, { enumerable: false, get: getter, set: setter });
		else if (getter)
			Object.defineProperty(this, name, { enumerable: false, get: getter });
		else
			Object.defineProperty(this, name, { enumerable: false, set: setter });
});

// the below lets you do stuff like this: Array.prototype._AddFunction_Inline = function AddX(value) { this.push(value); }; [].AddX = "newItem";
Object.prototype._AddGetterSetter(null, function _AddFunction_Inline(func) { this._AddFunction(func); });
Object.prototype._AddGetterSetter(null, function _AddGetter_Inline(func) { this._AddGetterSetter(func, null); });
Object.prototype._AddGetterSetter(null, function _AddSetter_Inline(func) { this._AddGetterSetter(null, func); });

// Object: normal
// ==================

Object.prototype._AddSetter_Inline = function ExtendWith_Inline(value) { this.ExtendWith(value); };
Object.prototype._AddFunction_Inline = function ExtendWith(value) { $.extend(this, value); };
Object.prototype._AddFunction_Inline = function GetItem_SetToXIfNull(itemName, /*;optional:*/ defaultValue)
{
	if (!this[itemName])
		this[itemName] = defaultValue;
	return this[itemName];
};
Object.prototype._AddFunction_Inline = function CopyXChildrenAsOwn(x) { $.extend(this, x); };
Object.prototype._AddFunction_Inline = function CopyXChildrenToClone(x) { return $.extend($.extend({}, this), x); };
Object.prototype._AddFunction_Inline = function Keys()
{
	var result = [];
	for (var key in this)
		if (this.hasOwnProperty(key))
			result.push(key);
	return result;
};
Object.prototype._AddFunction_Inline = function Items()
{
	var result = [];
	for (var key in this)
		if (this.hasOwnProperty(key))
			result.push(this[key]);
	return result;
};
Object.prototype._AddFunction_Inline = function ToJson() { return JSON.stringify(this); };

// String
// ==================

String.prototype._AddFunction_Inline = function StartsWith(str) {return this.lastIndexOf(str, 0) === 0;};
String.prototype._AddFunction_Inline = function EndsWith(str) { var pos = this.length - str.length; return this.indexOf(str, pos) === pos; };
String.prototype._AddFunction_Inline = function Contains(str, /*;optional:*/ startIndex) { return -1 !== String.prototype.indexOf.call(this, str, startIndex); };
String.prototype._AddFunction_Inline = function HashCode()
{
	var hash = 0;
	for (var i = 0; i < this.length; i++)
	{
		var char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
String.prototype._AddFunction_Inline = function Matches(regex, index)
{
	index = index || 1; // default to the first capturing group
	var matches = [];
	var match;
	while (match = regex.exec(this))
		matches.push(match[index]);
	return matches;
};
/*String.prototype._AddFunction_Inline = function LastIndexOf(str)
{
    for (var i = this.length - 1; i >= 0; i--)
        if (this.substr(i).startsWith(str))
            return i;
    return -1;
};*/
String.prototype._AddFunction_Inline = function IndexOf_Xth(str, x)
{
	var currentPos = -1;
	for (var i = 0; i < x; i++)
	{
		var subIndex = this.indexOf(str, currentPos + 1);
		if (subIndex == -1)
			return -1; // no such xth index
		currentPos = subIndex;
	}
	return currentPos;
};
String.prototype._AddFunction_Inline = function IndexOfAny()
{
	if (arguments[0] instanceof Array)
		arguments = arguments[0];

	var lowestIndex = -1;
	for (var i = 0; i < arguments.length; i++)
	{
		var indexOfChar = this.indexOf(arguments[i]);
		if (indexOfChar != -1 && (indexOfChar < lowestIndex || lowestIndex == -1))
			lowestIndex = indexOfChar;
	}
	return lowestIndex;
};
String.prototype._AddFunction_Inline = function ContainsAny()
{
	for (var i = 0; i < arguments.length; i++)
		if (this.contains(arguments[i]))
			return true;
	return false;
};
String.prototype._AddFunction_Inline = function SplitByAny()
{
    var chars = arguments;
    if (arguments.length == 1 && arguments[0] instanceof Array)
		chars = arguments[0];
    
    var replacementMap = {"[": "\\[", "]": "\\]"};
    var splitStr = "";
	for (var i = 0; i < chars.length; i++)
	    splitStr += (splitStr.length > 1 ? "|" : "") + (replacementMap[chars[i]] || chars[i]);
    
	return this.split(new RegExp(splitStr));
};
String.prototype._AddFunction_Inline = function Splice(index, removeCount, insert) { return this.slice(0, index) + insert + this.slice(index + Math.abs(removeCount)); };

// Array
// ==================

Array.prototype._AddFunction_Inline = function Contains(str) { return this.indexOf(str) != -1; };

Array.prototype._AddFunction_Inline = function AddRange(array)
{
	for (var i in array.Indexes())
		this.push(array[i]);
};
Array.prototype._AddFunction_Inline = function Indexes()
{
	var result = {};
	for (var i = 0; i < this.length; i++)
		result[i] = this[i];
	return result;
};
/*Array.prototype._AddFunction_Inline = function Strings() // removed, because it doesn't allow for duplicates
{
	var result = {};
	for (var key in this)
	{
		if (this.hasOwnProperty(key))
			result[this[key]] = null;
	}
	return result;
};*/
Array.prototype._AddFunction_Inline = function RemoveAt(index) { return this.splice(index, 1); };
Array.prototype._AddFunction_Inline = function Remove(obj)
{
	for (var i = this.length;; i--)
		if(this[i] === obj)
			return this.RemoveAt(i);
};
Array.prototype._AddFunction_Inline = function Clear()
{
	while (this.length > 0)
		this.pop();
};
Array.prototype._AddFunction_Inline = function Filter(matchFunc)
{
	var result = [];
	for (var i in this.Indexes())
		if (matchFunc.call(this[i], this[i])) // call, having the item be "this", as well as the first argument
			result.push(this[i]);
	return result;
};
Array.prototype._AddFunction_Inline = function First(matchFunc) { return this.Filter(matchFunc || function() { return true; })[0]; };
Array.prototype._AddFunction_Inline = function Last() { return this[this.length - 1]; };
Array.prototype._AddFunction_Inline = function Any(matchFunc)
{
    for (var i in this.Indexes())
        if (matchFunc.call(this[i], this[i]))
            return true;
    return false;
};
Array.prototype._AddFunction_Inline = function All(matchFunc)
{
	for (var i in this.Indexes())
        if (!matchFunc.call(this[i], this[i]))
            return false;
    return true;
};
Array.prototype._AddFunction_Inline = function Map(transformFunc)
{
	var result = [];
	for (var i = 0; i < this.length; i++)
	    result.push(transformFunc.call(this[i], this[i])); // call, having the item be "this", as well as the first argument
	return result;
};

Array.prototype._AddFunction_Inline = function SetItems(array)
{
	this.splice(0, this.length);
	this.AddRange(array);
};

// others
// ==========

Math.logWithBaseX = function(n, base)
{
	//base = base || 1;
	return Math.log(n) / Math.log(base);
};

Uint8ClampedArray.prototype._AddFunction_Inline = Array.prototype._AddFunction_Inline = function GetRange(index, count)
{
	var result = [];
    for (var i = index; i < index + count; i++)
        result.push(this[i]);
    return result;
};