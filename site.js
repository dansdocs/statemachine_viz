
var process_btn = document.getElementById("process_btn");
var accept_btn = document.getElementById("accept_btn");
var line_checkbox = document.getElementById("line_checkbox");
var word_checkbox = document.getElementById("word_checkbox");
var char_checkbox = document.getElementById("char_checkbox");
var svg_checkbox  = document.getElementById("svg_checkbox");
var dot_checkbox  = document.getElementById("dot_checkbox");
var json_checkbox = document.getElementById("json_checkbox");

var line_window = undefined;
var word_window = undefined;
var char_window = undefined;
var svg_window  = undefined;
var dot_window  = undefined;
var json_window = undefined;

Logger.useDefaults();    
  
var editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/c_cpp");
editor.on("change", adjust_width_of_dom_padding_strip);
editor.$blockScrolling = Infinity;
adjust_width_of_dom_padding_strip(null);
editor.focus()
        
// This is just for very minor asthetics/vanity. Adjust the grey padding strip above the editor
// to match as the number of digits increases. Copying the div width value from the 
// editor dom is one event behind - hence the if/else lookup style approach.  
function adjust_width_of_dom_padding_strip(e){
    var w;
    w="73px";
    if (editor.session.getLength() < 10) w = "40px";
    else if (editor.session.getLength() > 9 && editor.session.getLength() < 100) w = "47px";
    else if (editor.session.getLength() > 99 && editor.session.getLength() < 1000) w = "53px";
    else if (editor.session.getLength() > 999 && editor.session.getLength() < 10000) w = "60px";
    else if (editor.session.getLength() > 9999 && editor.session.getLength() < 100000) w = "66px";
    else if (editor.session.getLength() > 99999 && editor.session.getLength() < 1000000) w = "73px";
    document.getElementsByClassName("flex-col")[0].style.width = w;
}        
  

  // create a diff and return as a DOM fragment. 
  // depends on jsdiff.js
  // diffType is a string and can be: "diffChars", "diffWords" or "diffLines"
  // existing and updated are strings and are the two pieces of text to diff. 
  function do_diff(existing, updated, diffType){
	  var diff;
	  var fragment;
	  
        diff = JsDiff[diffType](existing, updated);
        var fragment = document.createDocumentFragment();
	    for (var i=0; i < diff.length; i++) {

		    if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
			    var swap = diff[i];
			    diff[i] = diff[i + 1];
			    diff[i + 1] = swap;
		    }

		    var node;
		    if (diff[i].removed) {
		        node = document.createElement('del');
			    node.appendChild(document.createTextNode(diff[i].value));
		    } else if (diff[i].added) {
			    node = document.createElement('ins');
			    node.appendChild(document.createTextNode(diff[i].value));
		    } else {
			    node = document.createTextNode(diff[i].value);
		    }
		    fragment.appendChild(node);
	    }
	    return fragment;
  }


// convert a DOM fragment to a html string. 
// for some reason in microsoft edge can't attach a child fragment to a popup
// so convert the fragment to a string, merge it into a page and write the whole page. 
function toHTMLstring(node, recursive) {
  node = node || this;
  
  if (!recursive){
      toHTMLstring.hs = "";
      toHTMLstring.closetag = "";
  }

  if (node.tagName) {
    toHTMLstring.hs += '<' + node.tagName + '>';
    toHTMLstring.closetag = '</' + node.tagName + '>';
  } 
  
  if (node.nodeValue) {
    toHTMLstring.hs += node.nodeValue;
    toHTMLstring.hs += toHTMLstring.closetag;
  }

  var childNodes = node.childNodes;
  if (childNodes) {
    var length = childNodes.length;
    for (var i = 0; i < length; i++) {
      toHTMLstring(childNodes[i], true);
    }
  }

  return toHTMLstring.hs;
}

function acceptAndUpdateEditorContents(incoming){
	// this function is called by the accept button onclick event
	// and it is also called during the work done when the process button 
	// has been pressed. For this process button case, we are just storing the
	// data ready for if/when the user presses the accept button.  
	// mimic a static variable and use it to store string data ready for 
	// when the accept button is pressed - and when pressed replace the editor contents
	// with the new string data.  
    	
    if ( typeof incoming == 'string' ) {
      acceptAndUpdateEditorContents.newCode = incoming;
    }
    
    else {
		if (typeof acceptAndUpdateEditorContents.newCode == 'string'){
		    editor.setValue(acceptAndUpdateEditorContents.newCode, 1);
	    }
	}
}

function newOrUpdateWindow(win, title, fragment){
	
	if (typeof newOrUpdateWindow.yoffset == 'undefined') newOrUpdateWindow.yoffset = 0;
	
    var htmlString = Template.dPage.html.replace("^^title^^", title);
    htmlString = htmlString.replace("^^heading^^", title);
    	
	if ((win == undefined) || (win.closed) || (win == null) ) {
        win = window.open(url="", title, 'menubar=no, titlebar=no, resizable=yes, width=250, height=200, scrollbars=yes, status=no');
		// lay the windows out down the page. 
		win.moveTo(0, newOrUpdateWindow.yoffset);
        newOrUpdateWindow.yoffset += 30;
        if (newOrUpdateWindow.yoffset > 300) newOrUpdateWindow.yoffset = 0;
	}
	
    if ((win == null) && (newOrUpdateWindow.alert == undefined)) {
		alert("Looks like popups are blocked. Enable popups for this URL - or press the Process button once for each checked checkbox.");
		newOrUpdateWindow.alert = true;
	}
	
	if (typeof fragment !== "string") win.document.write(htmlString.replace('^^outputdiv^^', toHTMLstring(fragment, false)));
	else win.document.write(htmlString.replace('^^outputdiv^^', fragment));
    win.document.close();
    return win;
}

function processEditorContents(){
    var smObjArr;
    var fragment;
    var origCode = "";
    var newCode = "";
    var dotArray = [];
    
    smObjArr = Codeupdater.analyzeAndUpdateCode(editor.getValue());
    Logger.info(smObjArr);
    
    // make the new code available in the function handling the accept button click. 
    acceptAndUpdateEditorContents(smObjArr[0].newCode);

    origCode = S(smObjArr[0].origCode).replaceAll('\r', "").s;
    newCode = S(smObjArr[0].newCode).replaceAll('\r', "").s;
    if (line_checkbox.checked) line_window = newOrUpdateWindow(line_window, 'Line Diff', do_diff(origCode, newCode, "diffLines"));
    else if (line_window != undefined) line_window.close();
    if (word_checkbox.checked) word_window = newOrUpdateWindow(word_window, 'Word Diff', do_diff(origCode, newCode, "diffWords"));
    else if (word_window != undefined) word_window.close();
    if (char_checkbox.checked) char_window = newOrUpdateWindow(char_window, 'Char Diff', do_diff(origCode, newCode, "diffChars"));
    else if (char_window != undefined) char_window.close();
    
    if (svg_checkbox.checked || dot_checkbox.checked){
		for (var i in smObjArr){
            dotArray.push(Createdot.createDotString(smObjArr[i]));
	    }
	}
    
    if (svg_checkbox.checked) {
		var svg = "";
		for (var i in smObjArr){
		  svg += '<h1>State Machine: ' + smObjArr[i].machineName + '</h1>\n<div id="svg_' + smObjArr[i].machineName + '">\n'
		  svg += Viz(dotArray[i], "svg");
		  svg += '\n</div>\n'		
		}
		svg_window = newOrUpdateWindow(svg_window, 'SVG', svg);

	}
    else if (svg_window != undefined) svg_window.close();
    
    if (dot_checkbox.checked) {
		var dot = "";
		for (var i in smObjArr){
		  dot += '<h1>State Machine: ' + smObjArr[i].machineName + '</h1>\n<div id="dot_' + smObjArr[i].machineName + '">\n'
		  dot += dotArray[i];
		  dot += '\n</div>\n'		
		}
		dot_window = newOrUpdateWindow(dot_window, 'DOT', dot);

	}
    else if (dot_window != undefined) dot_window.close();    
    
    if (json_checkbox.checked) {
		var jn = "";
		for (var i in smObjArr){
		  jn += '<h1>State Machine: ' + smObjArr[i].machineName + '</h1>\n<div id="json_' + smObjArr[i].machineName + '">\n'
		  jn += JSON.stringify(smObjArr[i], null, 4);
		  jn += '\n</div>\n'		
		}
		json_window = newOrUpdateWindow(json_window, 'JSON', jn);

	}
    else if (json_window != undefined) json_window.close();   
    
    
    
}
      
 
function updateButtonTextAndBindEvents(){
    process_btn.innerHTML = "Process";
    process_btn.onclick = processEditorContents;
    accept_btn.innerHTML = "Accept";    
    accept_btn.onclick = acceptAndUpdateEditorContents;
    window.onbeforeunload = close_all_windows;
}


document.onreadystatechange = function () { 
    if (document.readyState === 'complete') {
        updateButtonTextAndBindEvents();
    }
};



function close_all_windows(){
    if (line_window !== undefined) line_window.close(); 
    if (word_window !== undefined) word_window.close(); 
    if (char_window !== undefined) char_window.close(); 
    if (svg_window  !== undefined) svg_window.close(); 
    if (dot_window  !== undefined) dot_window.close(); 
    if (json_window !== undefined) json_window.close(); 	
}
 


 
