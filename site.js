// Delay loading any function until the html dom has loaded. All functions are
// defined in this top level function to ensure private scope.
jQuery(document).ready(function () {

  // Installs error handling.
  jQuery.ajaxSetup({
  error: function(resp, e) {
    if (resp.status == 0){
      alert('You are offline!!\n Please Check Your Network.');
      } else if (resp.status == 404){
        alert('Requested URL not found.');
      } else if (resp.status == 500){
        alert('Internel Server Error:\n\t' + resp.responseText);
      } else if (e == 'parsererror') {
        alert('Error.\nParsing JSON Request failed.');
      } else if (e == 'timeout') {
        alert('Request timeout.');
      } else {
        alert('Unknown Error.\n' + resp.responseText);
      }
    }
  });  // error:function()


  var generate_btn = jQuery('#generate_btn');
  var graphviz_div = jQuery('#graphviz_generated_div');
  var c_data_textarea = jQuery('#c_data');

  var showJson_checkbox = jQuery('#showJson');
  var showDot_checkbox = jQuery('#showDot');
  var showGraph_checkbox = jQuery('#showGraph');

function Reverse(s) {
  return (s === '') ? '' : Reverse(s.substr(1)) + s.charAt(0);
}

function ConvertArrayString(s) {
	var row = "";
    var rowElements = [];
	var remainder = "";
	var states = {};

	remainder = S(s);
	remainder = remainder.strip(',');
	remainder = remainder.collapseWhitespace();
    row = remainder.between('(', ')').s;
    
    while (row.length > 0) {
   	    row = row.trim();
		rowElements = row.split(" ");
		states[rowElements[0]] = {};
		states[rowElements[0]]['forward'] = rowElements[1];
		states[rowElements[0]]['branch']  = rowElements[2];
		states[rowElements[0]]['repeat']  = rowElements[3];
		remainder = remainder.strip('(' + row + ')');
		row = remainder.between('(', ')').s;
	}
    return states;
}

  function FindStateTables(c_data_textarea_val) {
	  
    var STATE_TABLE_IDENTIFIER = 'state_table';
    var STATE_TABLE_ARRAY_IDENTIFIER = STATE_TABLE_IDENTIFIER+'[mMAX_STATES]';
    var state_table_unique_array_identifier = "";
    
    var cdata = S(c_data_textarea_val);    
    var max_count = cdata.count(STATE_TABLE_ARRAY_IDENTIFIER);
    var arrString = "";
    var count = 0;
    var name = "";
    var name_prefix = "";
    var index;
    var i = 0;
    var stateTables = {};
        
    console.log('number of state tables: ' + max_count);
      
    while (count < max_count) {
        arrString = cdata.between(STATE_TABLE_ARRAY_IDENTIFIER, '}').s;
        index = cdata.indexOf(STATE_TABLE_ARRAY_IDENTIFIER) - 1;
        i = 0; name = ""; name_prefix = "";
        while ((cdata.charAt(index - i) != " ") && (index >= 0) ) {
			name_prefix = name_prefix + cdata.charAt(index - i);
			i++;
		} 
		name_prefix= Reverse(name_prefix);
        state_table_unique_array_identifier = name_prefix + STATE_TABLE_ARRAY_IDENTIFIER;
        cdata = cdata.strip(state_table_unique_array_identifier + arrString + '}');
        name = name_prefix + STATE_TABLE_IDENTIFIER;   
        stateTables[name] = ConvertArrayString(arrString);;
		count++;
    }
    return stateTables;     
  }
  
 function FindEnum(c_data_textarea_val) {
	  
    var ENUM_IDENTIFIER = 'STATESENUM';    
    var cdata = S(c_data_textarea_val); 
    var arrString;
    var enumElements = [];
    var enumOb = {};
    var i = 0;
     
    if (cdata.count(ENUM_IDENTIFIER) != 1){
        console.log('Error: Expected exactly one STATESENUM Enum array but there are multiple or none');
        return "";
    }	
    
    cdata = cdata.between(ENUM_IDENTIFIER, '}'); 
    cdata = cdata.strip('{');
    cdata = cdata.strip(',');
    cdata = cdata.strip('mNULL');
    cdata = cdata.strip('mMAX_STATES');
	cdata = cdata.collapseWhitespace();
	arrString = cdata.trim().s;
	enumElements = arrString.split(" ");
	
	for (i = 0; i < enumElements.length; i++){
		enumOb[enumElements[i]] = i;
		enumOb[i] = enumElements[i];
    }
	
    return (enumOb);   
 } 
 
 function FindFns(c_data_textarea_val) {
	  
    var FN_IDENTIFIER = 'state_fns_array[mMAX_STATES]';    
    var cdata = S(c_data_textarea_val); 
    var arrString;
    var fnElements = [];
    var fnOb = {};
    var i = 0;
     
    if (cdata.count(FN_IDENTIFIER) != 1){
        console.log('Error: Expected exactly one state_fns_array but there are multiple or none');
        return "";
    }	
    
    arrString = cdata.between(FN_IDENTIFIER, '}').s; 
    arrString = arrString.substring(arrString.indexOf('{'));
    cdata = S(arrString);
    cdata = cdata.strip('{');
    cdata = cdata.strip(',');
	cdata = cdata.collapseWhitespace();
	arrString = cdata.trim().s;
	fnElements = arrString.split(" ");
	
	for (i = 0; i < fnElements.length; i++){
		fnOb[i] = fnElements[i];
		fnOb[fnElements[i]] = i;
    }
	
    return (fnOb);   
 }  
 
 function GetIndexOfMatchingBracket(s, i){
    // find first bracket
    if (i == 0) {
        while (i < s.length) {
			if (s.charAt(i) == '{') {
			    i++;
			    break;
			}
			else if (s.charAt(i) == ';') {
				return i*(-1);
			}
			i++;
	    }
	    if (i >= s.length) return -1;  // didn't find anything.  
	} 
    while (i < s.length) {
        if (s.charAt(i) == '{') {
            i = GetIndexOfMatchingBracket(s, i+1);
		}
        else if (s.charAt(i) == '}') {
            return i+1;
        }
        else {
            // process whatever is at s.charAt(i)
            i++;
        }
	}
    return i; 
 }
 
 function FindMsgs(fns, c_data_textarea_val) {
     var FN_IDENTIFIER = 'state_fns_array[mMAX_STATES]';	
     var cdata = S(c_data_textarea_val); 
     var key;
     var count = 0;
     var remainder;
     var msgs = {};
     var fnName;
     var bracketIndex;
     var firstTime = true;
     
     // after the next two lines gets rid of the state_fns_array pointer array. 
     arrString = cdata.between(FN_IDENTIFIER, '}').s; 
     cdata = cdata.strip(arrString).s;
     
     while (fns.hasOwnProperty(count)) {
		 fnName = fns[count];
		 
		 // The firstTime flag will be false if we have looped around without increasing count because the previous loop found 
		 // a fn prototype if thats the case we don't want to go back to the source text, but use the text with the fn prototype deleted.  
		 if (firstTime) {
			 if (cdata.indexOf(fnName) == -1){
				 console.log("ERROR: can't find " + fnName);
				 return -1;
			 }
             remainder = cdata.substring( cdata.indexOf(fnName));
		 }
		 else {
			 firstTime = true;
			 if (remainder.indexOf(fnName) == -1){
				 console.log("ERROR: can't find " + fnName);
				 return -1;
			 }
			 remainder = remainder.substring(remainder.indexOf(fnName));
		 }
		 
		 bracketIndex = GetIndexOfMatchingBracket(remainder, 0);
		 if (bracketIndex < 0){
			 if (bracketIndex == -1) {
				 console.log("ERROR: Syntax error when searching for function bracket");
				 return -1;
			 }
			 else {
			     // looks like we found a function prototype, remove it look again for the actual function. 
			     console.log("found fn prototype and removing it");	 
				 remainder = remainder.substring(bracketIndex*(-1));
				 firstTime = false;
			 }
		 }
		 // skip the next bit if it was a function prototype and loop around again. 
		 if (firstTime) {
			remainder = remainder.substring(0, bracketIndex);
		    msgs[fnName] = {};
		    if (remainder.indexOf('REPEAT_UNTIL') >= 0) {
	    		 msgs[fnName]['repeat'] = S(remainder).between('REPEAT_UNTIL', ')').strip('(').strip('"').trim().s;
		    }
		    if (remainder.indexOf('FORWARD_WHEN') >= 0) {
                 msgs[fnName]['forward'] = S(remainder).between('FORWARD_WHEN', ')').strip('(').strip('"').trim().s;
		    }
		    if (remainder.indexOf('BRANCH_IF') >= 0) {
                msgs[fnName]['branch'] = S(remainder).between('BRANCH_IF', ')').strip('(').strip('"').trim().s;		 
		    }		 
		    count++;
		 }
	 }
     return msgs;
   }
     
	function AssembleDrawingDataStructure(stateTable, enums, fns, msgs){
		
		var drwObj = {};
		var key;
		var key2;
		var id;
		var fn;
		
			
		// Put in each of the states. 
		for (key in stateTable) {
			if (!(stateTable.hasOwnProperty(key))) continue; 
			drwObj[key] = {};
		}
		
		// Put in nextState object, label and shape for each state. 
		for (key in drwObj) {
			if (!(drwObj.hasOwnProperty(key))) continue; 
			drwObj[key]["nextState"] = {};
			id = enums[key];
			fn = S(fns[id].split('_').pop()).humanize().s;
			drwObj[key]["label"] = key + ' \\n ' + fn;
			if (key.indexOf('START') == -1) drwObj[key]["shape"] = 'circle';
			else drwObj[key]["shape"] = 'doublecircle';
		}		
		
		// Put in nextState object, label and shape for each state. 
		for (key in drwObj) {
			if (!(drwObj.hasOwnProperty(key))) continue; 
			drwObj[key]["nextState"] = {};
			id = enums[key];
			fn = S(fns[id].split('_').pop()).humanize().s;
			drwObj[key]["label"] = key + ' \\n ' + fn;
			if (key.indexOf('START') == -1) drwObj[key]["shape"] = 'circle';
			else drwObj[key]["shape"] = 'doublecircle';
		}
		
		// complete the forward, repeat and branch for each state.  
		for (key in drwObj) {
			if (!(drwObj.hasOwnProperty(key))) continue; 
			
			if (stateTable[key]["forward"] !== "mNULL") {
			    drwObj[key]["nextState"]["forward"] = {
			    	"fwdState" : stateTable[key]["forward"],
                    "fwdMsg"   : msgs[fns[enums[key]]]["forward"]
			    };
			}
			
			if (stateTable[key]["repeat"] !== "mNULL") {
			    drwObj[key]["nextState"]["repeat"] = {
					"rptState" : stateTable[key]["repeat"],
					"rptMsg"   : msgs[fns[enums[key]]]["repeat"]
				};
			}	
			
			if (stateTable[key]["branch"] !== "mNULL") {
			    drwObj[key]["nextState"]["branch"] = {
					"branchState" : stateTable[key]["branch"],
					"branchMsg"   : msgs[fns[enums[key]]]["branch"]
				};	
			}    					
		}						

		return(drwObj);
		
		 		
	}
	
	function CreateDotString(dwgObj){
		var obKey;
		var nextKey
		var nextState;
		var stateLabel;
		var circle = "";
		var doubleCircle = "";
		var dotString = "";
		
		// Any state with start in its name will be a double circle shape. Everything else is a plain circle. 
		for (obKey in dwgObj){
			if (obKey.indexOf("START") ==  -1 ) circle = circle + " " + obKey;
			else doubleCircle = doubleCircle + " " + obKey;
		}
		dotString = 'digraph finite_state_machine {\n    rankdir=LR;\n    size="8,5";\n'		
		dotString = dotString + "    node [shape = doublecircle];" + doubleCircle + "; \n";
		dotString = dotString + "    node [shape = circle];" + circle + "; \n\n";

		// Set the label inside of each state circle (or double circle).
		for (obKey in dwgObj){
			stateLabel = dwgObj[obKey]["label"];
			dotString = dotString + "        " + obKey + ' [label = "' + stateLabel + '"];\n';
		}
		
		dotString = dotString + "\n";
			
		// Complete the state transitions and label the transitions. 		
		for (obKey in dwgObj){
			nextState = dwgObj[obKey]["nextState"];
			if (nextState.hasOwnProperty("forward")) {
				dotString = dotString + "        " + obKey + " -> " + nextState["forward"]["fwdState"] + ' [label = "Forward when \\n ' + nextState["forward"]["fwdMsg"] + '"];\n';
			} 
			if (nextState.hasOwnProperty("repeat")) {
				dotString = dotString + "        " + obKey + " -> " + nextState["repeat"]["rptState"] + ' [label = "Repeat until \\n ' + nextState["repeat"]["rptMsg"] + '"];\n';
			} 			
			if (nextState.hasOwnProperty("branch")) {
				dotString = dotString + "        " + obKey + " -> " + nextState["branch"]["branchState"] + ' [label = "Branch if \\n ' + nextState["branch"]["branchMsg"] + '"];\n';
			} 						
		}
		dotString = dotString + " }\n";
		
		return dotString;
	}
	  
    function UpdateGraphviz() {
		graphviz_div.html("");
		var fnsOb;
		var msg;
		var enums;
		var stateTable;
		var dwgObj;
		var content;
		var key;
		var dotString;
		var svg;
    
		// look through the c code and get the bits we are interested in
		stateTable = FindStateTables(c_data_textarea.val());
		enums = FindEnum(c_data_textarea.val());
		fnsOb = FindFns(c_data_textarea.val());
		msg = FindMsgs(fnsOb, c_data_textarea.val());
    
		// work through each state table and generate a diagramatic representation
		for (key in stateTable) {
			if (!(stateTable.hasOwnProperty(key))) continue; // skip if its a built in property
			
			// assemble the bits we are interested in into a single object
			dwgObj = AssembleDrawingDataStructure(stateTable[key], enums, fnsOb, msg);
			console.log(stateTable);
			console.log("Complete State entry for " + key);
			console.log(dwgObj);
		
			// use the extracted data from the c file to create the dot string for graphviz
			dotString = CreateDotString(dwgObj);      
			  
			content = jQuery('<div id="' + key + '_title"><h2> StateTable: ' + key + ' </h2></div>');  			  
			graphviz_div.append(content);
			
			if (showJson_checkbox.prop('checked')) {
			    content = '<div id="' + key + '_json"><pre> ';
			    content = content + JSON.stringify(dwgObj, null, 4);
			    content = content + '</pre></div>';
			    content = jQuery(content);
			    graphviz_div.append(content);
			}
			
			if (showDot_checkbox.prop('checked')) {
			    content = '<div id="' + key + '_dot"><pre> ';
			    content = content + dotString;
			    content = content + '</pre></div>';
			    content = jQuery(content);
			    graphviz_div.append(content);
			}
			
			if (showGraph_checkbox.prop('checked')) {
				svg = Viz(dotString, "svg");
			    content = '<div id="' + key + '_graph"><pre> ' + svg + '</pre></div>';
			    content = jQuery(content);
			    graphviz_div.append(content);
			}
			
		}


		// Generate the Visualization of the Graph into "svg".
		// var svg = Viz(data, "svg");
		// svg_div.html("<hr>"+svg);
	}

  // Startup function: call UpdateGraphviz
  jQuery(function() {
	// The buttons are disabled, enable them now that this script
	// has loaded.
    generate_btn.removeAttr("disabled")
                .text("Generate Graph!");

  });

  // Bind actions to form buttons.
  generate_btn.click(UpdateGraphviz);


});
