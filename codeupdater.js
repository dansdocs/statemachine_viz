
/**
 * @fileOverview create state machine object from tagged C code string. 
 * Also, update the tagged source code based on updates to the function prototypes and 
 * addition/removal of state machines. 
 * 
 * @author Daniel Burke 2017
 * @exports  analyzeAndUpdateCode(stringIn) and returns an array of state machine objects
 * @requires string.js (http://stringjs.com)
 * @version 0.0.1
 */

var Codeupdater = (function () {

      /**
      * A list of valid tags which are used in the c source to identify the parts of the code of interest. 
      * where there is a template {{}} in the string defined in the following list then they will be 
      * filled out such that there is one set per state machine. If there is no template the tag applies to all state machines in the file.  
      * @private
      * @var {object} _tags
      */           
      var _tags = {
          machine_list_start:     "//----state_machine_list_start",
          machine_list_end:       "//----state_machine_list_end",
          return_values_start:    "//----valid_state_return_values_start",
          return_values_end:      "//----valid_state_return_values_end",
          fn_proto_start:         "//----{{machineName}}_state_function_prototypes_start",
          fn_proto_end:           "//----{{machineName}}_state_function_prototypes_end",
          enum_start:             "//----{{machineName}}_states_enum_start",
          enum_end:               "//----{{machineName}}_states_enum_end",
          fn_array_start:         "//----{{machineName}}_state_functions_array_start",
          fn_array_end:           "//----{{machineName}}_state_functions_array_end",    
          transition_table_start: "//----{{machineName}}_state_transition_table_start", 
          transition_table_end:   "//----{{machineName}}_state_transition_table_end", 
          fn_defn_start:          "//----{{machineName}}_state_functions_start",
          fn_defn_end:            "//----{{machineName}}_state_functions_end",
          enum_header:            "enum {{machineName}}STATESENUM {\r\n    ",
          enum_arraysize:         "{{machineName}}ARRAYSIZE",
          nullState:              "{{machineName}}NULL",
          fnArrayName:            "{{machineName}}FnArray",
          transitionTableName:    " {{machineName}}TransitionTable"      
      };   

      /**
      * Inserts a string into another string at the specified location. 
      * @private
      * @function _insert
      * @param {string} startstr - Starting string which will be expanded by insertstr 
      * @param {number} index - The location in startstr that insertstr will be inserted. 
      * @param {string} insertstr - String to be inserted into startstr 
      * @returns {string} This is str with value inserted into it at location given by index. 
      * @example
      * alert(_insert("foo baz", 4, "bar "));
      * Output: foo bar baz
      */           
      var _insert = function(startstr, index, insertstr) {
          // Example: alert(_insert("foo baz", 4, "bar "));
          // Output: foo bar baz
          return startstr.substr(0, index) + insertstr + startstr.substr(index);
      };

      /**
      * Will go through a string starting at a given index, when it finds an opening bracket { it will then
      * search for its closing pair } and return the index of that closing pair.  
      * @private
      * @function _getIndexOfMatchingBracket
      * @param {string} s - String to search for brackets.  
      * @param {number} i - The starting point in s. 
      * @returns {number} The index of the closing bracket. If the brackets aren't matched, the index of the last bracket will be given. If index is longer than the string then the index will be returned. 
      * @example
      * console.log(_getIndexOfMatchingBracket("1{3{5}7}90", 0));
      * Output: 8
      */           
      var _getIndexOfMatchingBracket = function(s, i){
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
                 i = _getIndexOfMatchingBracket(s, i+1);
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
      };
 
      /**
      * Takes in a string and extracts the substring enclosed by one or two tag sets 
      * The substring is broken into comma separated data and the individual elements are returns as an array. 
      * @private
      * @function _arrayFromTaggedCSV
      * @param {string} outerOpenTag - If provided, will use this to get a substring between outer tags. Outer open and close have to be defined in pairs. Null can be given if you just have one set of delineaters.   
      * @param {string} outerCloseTag - If provided, will use this to get a substring between outer tags. Outer open and close have to be defined in pairs. Null can be given if you just have one set of delineaters.   
      * @param {string} innerOpenTag - If provided, will use this to get a substring between inner tags. inner tags have to be defined in pairs. Null can be given if you just have one set of delineaters.   
      * @param {string} innerCloseTag - If provided, will use this to get a substring between inner tags. inner tags have to be defined in pairs. Null can be given if you just have one set of delineaters.   
      * @returns {array} an array of strings created from the csv encoded string enclosed by the tags. 
      * @example
      * console.log(_arrayFromTaggedCSV('pio', 'pic', null, null, 'random stuff pio info1, info2, info3 pic more random stuff', sep=',')); 
      * Output: ["info1", "info2", "info3"]
      * 
      * console.log(_arrayFromTaggedCSV('pio', 'pic', '{', '}', 'random {{ with ignored brackets pio some extra text {info1, info2, info3} here we have more txt pic more random stuff', sep=',')); 
      * Output: ["info1", "info2", "info3"]
      */           
      var _arrayFromTaggedCSV = function(outerOpenTag, outerCloseTag, innerOpenTag, innerCloseTag, taggedCSVstring, sep) {
          outerOpenTag = typeof outerOpenTag !== 'undefined' ? outerOpenTag : null;
          outerCloseTag = typeof outerCloseTag !== 'undefined' ? outerCloseTag : null;
          innerOpenTag = typeof innerOpenTag !== 'undefined' ? innerOpenTag : null;
          innerCloseTag = typeof innerCloseTag !== 'undefined' ? innerCloseTag : null;
          taggedCSVstring = typeof taggedCSVstring !== 'undefined' ? taggedCSVstring : null;
          sep = typeof sep !== 'undefined' ? sep : ",";
          var cdata = S(taggedCSVstring);
          var csvArray = [];
          var error = false;
          var row;
          var totalInnerTags = 0;
          
          if ((outerOpenTag == null) && (innerOpenTag == null)) error = true;
          if ((outerCloseTag == null) && (innerCloseTag == null)) error = true;   
          if (((outerOpenTag != null) && (outerCloseTag == null)) || ((outerOpenTag == null) && (outerCloseTag != null))) error = true;
          if (((innerOpenTag != null) && (innerCloseTag == null)) || ((innerOpenTag == null) && (innerCloseTag != null))) error = true;
          
          if (error) {
               Logger.error("Issue with tags: outerOpenTag: '" + outerOpenTag + "' outerCloseTag: '" + outerCloseTag  + "' innerOpenTag: '" + innerOpenTag + "' innerCloseTag: '" + innerCloseTag + "'");     
          }       
          
          if ((outerOpenTag != null) && (error == false)) {
              if ((cdata.count(outerOpenTag) > 1) || (cdata.count(outerOpenTag) < 1)) {
                  Logger.error(" Expected exactly one outerOpenTag: '" + outerOpenTag + "'. Multiple or none exist in string");
                  error = true;
              }
              else if ((cdata.count(outerCloseTag) > 1) || (cdata.count(outerCloseTag) < 1)) {
                  Logger.error("Expect exactly one outerCloseTag: '" + outerCloseTag + "'. Multiple or none exist in string");
                  error = true;
              }
              else {
                  cdata = cdata.between(outerOpenTag, outerCloseTag);
                  cdata = cdata.collapseWhitespace();
                  cdata = cdata.trim();
              }
          }
          
          if ((innerOpenTag != null) && (error == false)) {
              if ((cdata.count(innerOpenTag) != cdata.count(innerCloseTag)) || (cdata.count(innerCloseTag) < 1)){
                  Logger.error("Mismatched inner tags, or no inner tags.");
                  error = true;
              }  
              else {
                  if (cdata.count(innerOpenTag) > 1){
                      totalInnerTags = cdata.count(innerOpenTag);
                      for (i = 0; i < totalInnerTags; i++) {  
                          row = cdata.between(innerOpenTag, innerCloseTag);
                          cdata = cdata.strip(innerOpenTag + row + innerCloseTag);
                          row = row.collapseWhitespace();
                          row = row.trim();
                          csvArray.push(row.parseCSV(sep));
                      }
                      return csvArray;
                  }
                  else {
                      cdata = cdata.between(innerOpenTag, innerCloseTag);
                      cdata = cdata.collapseWhitespace();
                      cdata = cdata.trim();
                  }
     
              }   
          }
          
          if (error == false) {
              csvArray = cdata.parseCSV(sep);
              for (var i in csvArray) {
                  if (csvArray[i] == "") csvArray.splice(i, 1);
              }
          }
     
          return csvArray;        
       };

      /**
      * Takes in a string and extracts the substring enclosed by the defined tags. 
      * The substring then has the supplied regex applied to it and the matches are replaced with the supplied string. 
      * @private
      * @function _updateBetween
      * @param {string} startTag - substring is extracted between start and end tags. 
      * @param {string} endTag - substring is extracted between start and end tags.
      * @param {string} codeIn - input string which the substring is extracted from based on the start and end tags.  
      * @param {string} newName - replacement string for whatever is matched by the regex. 
      * @param {string} regex - a regex string in the form that can be used directly with new RegExp(regex, 'gm')
      * @returns {string} returns the codeIn string with whatever the regex matched replaced by the newName string. 
      * @example
      * console.log(_updateBetween('[', ']', 'random WORD letters [ the WORD to change ] more stuff', '$1'+'PIGGLE', '(.*)WORD'));
      * Output: random WORD letters [ the PIGGLE to change ] more stuff
      */                
      var _updateBetween = function(startTag, endTag, codeIn, newName, regex){
          var snippit;
          var newSnippit;
          var re;
     
          snippit = S(codeIn).between(startTag, endTag).s;
          re = new RegExp(regex, 'gm');
          newSnippit = snippit.replace(re, newName);
          codeIn = S(codeIn).replaceAll(startTag + snippit + endTag, startTag + newSnippit + endTag).s;
          //Logger.info(newSnippit);
          return codeIn;
      };

      /**
      * Takes in a string which represents the tagged C code and the details required to go through 
      * through that code and update wherever an existing state name exists to a new provided name. 
      * @private
      * @function _renameState
      * @param {string} codeIn - The tagged C code we need to search through to update the state names.  
      * @param {string} oldFnDfn - The function prototype with the function name as the old state name eg. 'int smSTATE_desc(int p);'. 
      * @param {string} oldToNewStateName - The string that you put after the fn prototype to update the state name eg. '//----smSTATE=smNEW'
      * @param {string} newName - replacement string for whatever is matched by the regex. 
      * @param {object} smObj - The state machine object that has at least the state machine and tag defined (see example below).
      * @returns {array} returns an array where the first entry of the array is the updated fn prototype line by itself and the second entry is all codeIn with all instances of the old state name updated. 
      * @example
      * console.log(_renameState('!this is dummy smSTATE more stuff\r\nint smSTATE_desc(int p);*', 'int smSTATE_desc(int p);', '//----smSTATE=smNEW', {machineName: 'sm', tags:{fn_proto_start: '!', fn_proto_end: '*', transition_table_start: '!', transition_table_end: '*', fn_defn_start: '!', fn_defn_end: '*'}} ));
      * Output: ["int smNEW_desc(int p);", "!this is dummy smNEW more stuff\r\nint smNEW_desc(int p);*"]
      */                      
      var _renameState = function(codeIn, oldFnDfn, oldToNewStateName, smObj){
          var oldName = '';
          var newName = '';
          var re;
          var newFnDfn;
          var fTags={};
          
          oldName = S(oldToNewStateName).strip('//----').collapseWhitespace().strip(' ').s
          newName = oldName.split('=')[1];
          oldName = oldName.split('=')[0];
          
          //remove statemachine name from state name if its been included
          newName = S(newName).chompLeft(smObj.machineName).s;
          oldName = S(oldName).chompLeft(smObj.machineName).s;
          
          if ((newName == '') || (oldName == '') || (newName == undefined) || (oldName == undefined)){
              Logger.info("Error renaming state - there is a malformed //---- tag in the function prototypes");
              return []
     	 }
     	 
     	 if (oldFnDfn.indexOf(oldName) == -1){
              Logger.info("Error renaming state - the old state name is missing");
              return []
     	 }
         
          // update the function string 
          re = new RegExp('(^\\s*\\w+\\s*\\w+)(' + oldName + ')', 'gm');
          newFnDfn = oldFnDfn.replace(re, '$1' + newName);

     	  // update the fn prototype name & remove rename tag from fn prototype
          codeIn = _updateBetween(smObj.tags.fn_proto_start, smObj.tags.fn_proto_end, codeIn, '$1'+newName, '(^\\s*\\w+\\s*\\w+)(' + oldName + ')');
          codeIn = _updateBetween(smObj.tags.fn_proto_start, smObj.tags.fn_proto_end, codeIn, '', '(\\/\\/----.*' + oldName + '.*$)');
          
          // update state name between transition tags
          codeIn = _updateBetween(smObj.tags.transition_table_start, smObj.tags.transition_table_end, codeIn, '$1$2' + newName, '(,|\\s*|\\{)(' + smObj.machineName + ')(' + oldName + ')');
     	 
     	 // update state name between function definition tags
          codeIn = _updateBetween(smObj.tags.fn_defn_start, smObj.tags.fn_defn_end, codeIn, '$1' + newName + '$3', '(^\\w+\\s+' + smObj.machineName + ')(' + oldName + ')(_\\w+\\s*\\(.+\\)\\s*\\{)');
     	 
     	 return [newFnDfn, codeIn];
      };

      /**
      * Takes in a string which is in the smObj and represents tagged C code and based on the fn_proto_tags 
      * locates the function prototypes for the state machine and pulls out the details from 
      * the function prototypes based on the function naming convention which is
      * int smST_desc (int p)  where sm = state machine name, ST = the state name, desc is the state description. 
      * This function identifies each of those parts, the return type and the parameters, puts them into an object 
      * and also does some basic checking like the parameters are all the same for a particular state machine. 
      * @private
      * @function _analyseFunctionPrototypes
      * @param {object} smObjIn - The statemachine object with at least newCode and tags defined (see example). 
      * @returns {object} returns a new smObj with a stateOrder and states added to the object. See example. stage order is using the order of the function prototypes into an array. states pulles the fn prototypes appart according to the naming convention. 
      * @example
      * console.log(_analyseFunctionPrototypes({newCode:'<int smST_desc(int p);\r\nint smST2_desc2(int p);>', tags:{fn_proto_start: '<', fn_proto_end: '>'}}));
      * Output: {newCode: "<int smST_desc(int p);\r\nint smST2_desc2(int p);>", tags: {fn_proto_start: '<', fn_proto_end: '>'}, stateOrder: ["smST", "smST2"], states: {smST: {fnDetails: {declaration: "int smST_desc (int p)", description: "desc", fnName: "smST_desc", fnParams: "(int p)", fnTypeParams: "(int)", returnType: "int"}}, smST2: {fnDetails: {…}}}}
      */                           
      var _analyseFunctionPrototypes = function(smObjIn){
         var fnPrototypes;
         var line = "";
         var returnType;
         var fnName;
         var fnParams;
         var state;
         var description;
         var fnParamsTypes;
         var paramError = false;
         var duplicateError = false;
         var parameterTypeList = "";
         var parameterTypeString = "";
         var smObj = JSON.parse(JSON.stringify(smObjIn));
     	 var newStateName;
     	 var renameUpdate;
         
         fnPrototypes= S(smObj.newCode).between(smObj.tags.fn_proto_start, smObj.tags.fn_proto_end).lines();
     
         smObj["stateOrder"] = [];
         smObj["states"] = {};
         
         for (var i in fnPrototypes){        
           line = S(fnPrototypes[i]).trim().collapseWhitespace().s;
           if (line.length > 2){
     		  newStateName = line.split(';')[1];
     		  line = S(line.split(';')[0]);   
     		  if (newStateName.indexOf('//----') !== -1) {
     			  renameUpdate = _renameState(smObj.newCode, line.s, newStateName, smObj);
     			  if (renameUpdate.length == 2) {
     				  line = S(renameUpdate[0]);
     				  smObj.newCode = renameUpdate[1];
     			  }
     		  }   
               line = line.replaceAll(" (" , "(").replaceAll("(" , " (");
               returnType = line.between("", " ").s;
               fnName = line.between(" ", "(").trim().s;
               fnParams = "(" + (line.between("(", ")").trim().s) +  ")";
               fnParams = (S(fnParams).collapseWhitespace().trim()).s;
               state = S(fnName).between("", "_").s;
               description = (S(fnName).strip(state+'_')).s;
               declaration = line.s;
               parameterTypeList = S(fnParams).strip("(").strip(")");
               parameterTypeList = parameterTypeList.parseCSV();
               parameterTypeString = "";
               for (var c in parameterTypeList) {
                   if (parameterTypeString.length != 0) parameterTypeString += ", ";
                   parameterTypeString += ((S(parameterTypeList[c]).trim().collapseWhitespace().parseCSV(" ", null))[0]);
               }
               parameterTypeString = "(" + parameterTypeString + ")";
               
               if (smObj.states.hasOwnProperty(state)){
                   duplicateError = true;
                   break;
               }
               smObj.stateOrder.push(state);
               smObj.states[state] = {fnDetails: {}};
               smObj.states[state].fnDetails["returnType"] = returnType;
               smObj.states[state].fnDetails["fnName"] = fnName;
               smObj.states[state].fnDetails["description"] = description;
               smObj.states[state].fnDetails["declaration"] = declaration;
               smObj.states[state].fnDetails["fnParams"] = fnParams;
               smObj.states[state].fnDetails["fnTypeParams"] = parameterTypeString;
               if (smObj.states[smObj.stateOrder[0]].fnDetails.fnParams != fnParams) {
                   paramError = true;
                   break;
               }
           }
         };
         
         if (paramError) {
             Logger.error("Function prototype parameters defined after the tag: '" + smObj.tags.fn_proto_start + "' must all be the same and they aren't");
             return {};
         }
         
         if (duplicateError) {
             Logger.error("There are duplicate states after the tag: '" + smObj.tags.fn_proto_start + "'.");
             return {};      
         }   
         else if (smObj.stateOrder.length == 0) {
             Logger.error("No recognisable function prototypes defined after the tag: '" + smObj.tags.fn_proto_start + "'.");
             return {};
         }
                     
         return smObj;
      }

      /**
      * newCode is a string from smObj and is in the form of tagged C code. 
      * The function finds the enum tags and  within that string and 
      * updates the enum string between the tags based on the order of the function prototypes which are 
      * beteen the function prototype tags and have been extracted into the state order array. 
      * @private
      * @function _updateReplaceEnum
      * @param {object} smObjIn - The statemachine object with at least newCode, stateOrder and tags defined (see example). 
      * @returns {object} returns a new smObj with newCode updated  with a new enum string in the newCode part of smObj.  
      * @example
      * console.log(_updateReplaceEnum({newCode:'<>', stateOrder:['SM1', 'SM2'], tags:{enum_arraysize: 'AS', nullState: 'NS', enum_header: ' enum = {', enum_start: '<', enum_end: '>'}}));
      * Output: {newCode: "<\r\n enum = {SM1, SM2, \r\n    AS, NS\r\n};\r\n>", stateOrder: ['SM1', 'SM2'], tags: {enum_arraysize: 'AS', nullState: 'NS', enum_header: ' enum = ', enum_start: '<', enum_end: '>'}}
      */                                 
      var _updateReplaceEnum = function(smObjIn){
          var stateList = "";
          var count = 0;
          var remove;
          var smObj = JSON.parse(JSON.stringify(smObjIn));
          var cdata = S(smObj.newCode);
     
          for (var i in smObj.stateOrder) {
               if (count > 8){
                   // 8 is just a arbitrary formatting number. 
                   count = 0;
                   stateList += "\r\n    ";
               }
               stateList += smObj.stateOrder[i] + ", ";
               count++;
          }
          stateList += "\r\n    " + smObj.tags.enum_arraysize + ", " + smObj.tags.nullState;
          stateList = smObj.tags.enum_header + stateList;  
        
          remove = cdata.between(smObj.tags.enum_start, smObj.tags.enum_end);
          remove = smObj.tags.enum_start + remove + smObj.tags.enum_end;
          smObj.newCode = cdata.replaceAll(remove, smObj.tags.enum_start + "\r\n" + stateList + "\r\n};\r\n" + smObj.tags.enum_end).s;        
          
          return smObj;
      }; 

      /**
      * Basically the same as _updateReplaceEnum but for creating the function array string
      * between the function tags instead of the enum tags. Review comments for 
      * the _updateReplaceEnum for more details. 
      * @private
      * @function _updateReplaceFnArray
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj with newCode updated  with a new function array string in the newCode part of smObj.  
      * @example
      *  Similar to _updateReplaceEnum()    
      */            
      var _updateReplaceFnArray = function(smObjIn){
          var declarationString = "";
          var fnListString = "";
          var count = 0;
          var fnArrayString = "";
          var remove = "";
          var smObj = JSON.parse(JSON.stringify(smObjIn));
          var cdata = S(smObj.newCode);
                      
          declarationString = smObj.states[smObj.stateOrder[0]].fnDetails.returnType + " (*" + smObj.tags.fnArrayName + "[" +  smObj.tags.enum_arraysize + "])";
          declarationString += smObj.states[smObj.stateOrder[0]].fnDetails.fnTypeParams + " = { \r\n"; 
          for (var i in smObj.stateOrder) {
              if (fnListString.length == 0) fnListString += "    ";
              else fnListString += ", ";
              if (count > 4){
                   count = 0;
                   fnListString += "\r\n    ";
               }
               fnListString += smObj.states[smObj.stateOrder[i]].fnDetails.fnName;
               count++;
          }
          
          fnArrayString = declarationString + fnListString;
     
          remove = cdata.between(smObj.tags.fn_array_start, smObj.tags.fn_array_end).s;
          remove = smObj.tags.fn_array_start + remove + smObj.tags.fn_array_end;
          smObj.newCode = cdata.replaceAll(remove, smObj.tags.fn_array_start + "\r\n" + fnArrayString + "\r\n};\r\n" + smObj.tags.fn_array_end).s;        
          
          return smObj;
      };

      /**
      * Pull apart an existing transition table by locating it within the tags in newCode. 
      * Store the next states from the transition table into smObj under the states entry of smObj  
      * @private
      * @function _buildNextStates
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj with an updated set of next states   
      * @example
      * Similar to _updateReplaceEnum()    
      */           
      var _buildNextStates = function(smObjIn){
          var rows;
          var rowOk;
          var state;
          var smObj = JSON.parse(JSON.stringify(smObjIn));    
              
          rows = S(smObj.newCode).between(smObj.tags.transition_table_start, smObj.tags.transition_table_end);
          rows = rows.between('{', '};').strip(' ').s;
          if (rows.length > 0) rows = _arrayFromTaggedCSV(null, null, '{', '}', rows, ',');
          else rows = [];
          
          // make it a 2D array even if there is just one row. 
          if (rows.length > 0) {
              if (rows[0].constructor !== Array) {
     			 rows = [rows, []];
     	     }
     	 }
               
          // add existing information from the existing transition table if it exists as a state and is the 
          // same dimension. 
          for (r in rows) { 
             row = rows[r];
             if (row.length == 0) break;  
             if (row.length == smObj.validReturns.length-1) { 
                 rowOk = true;
                 for (var i in row){
                     if (i == 0) {
                         if (!(smObj.states.hasOwnProperty(row[i]))) rowOk = false;
                     }
                     else {
                         if (!((row[i] == smObj.tags.nullState) || (smObj.states.hasOwnProperty(row[i])))){
                              rowOk = false;
                          }
                     }
     
                 }
             }
             else rowOk = false;
             
             if (rowOk){
                 smObj.states[row[0]]["next"] = {};
                 smObj.states[row[0]]["changed"] = "false";
                 for (var vr in smObj.validReturns){
                     if (vr == 0) continue;
                     if (vr >= smObj.validReturns.length-1) break;
                     smObj.states[row[0]]["next"][smObj.validReturns[vr]] = row[vr];
                 }
             }   
          }
          
          // Add null next states for any state which is in the object but not in the 
          // exising transition table or the tranition table data was wrong dimension
          for (i in smObj.stateOrder){
              state = smObj.stateOrder[i];
              if (!(smObj.states[state].hasOwnProperty("next"))){
                  smObj.states[state]["next"] = {};
                  smObj.states[state]["changed"] = "true";
                  for (var vr in smObj.validReturns){
                     if (vr == 0) continue;
                     if (vr >= smObj.validReturns.length-1) break;
                     smObj.states[state]["next"][smObj.validReturns[vr]] = smObj.tags.nullState;
                  }
              }
          }
          
          return smObj;
      };

      /**
      * Locate the function defintions witin newCode by extracting the substring between the approprate tags. 
      * For each function that has a matching function prototype, store the function body into smObj. 
      * Any function that doesn't have a matching prototype won't be stored and so this gives the feature that
      * deleting a function prototype will also end up deleting the function definition. 
      * @private
      * @function _extractFnBodies
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj the function bodies stored in smObj for each state.   
      * @example
      * Similar to _updateReplaceEnum()    
      */                 
      var _extractFnBodies = function(smObjIn){
          var fns;
          var lines;
          var name;
          var charCount;
          var searchString;
          var line;
          var remainder;
          var remove;
          var bracketIndex;
          var scd;
          var smObj = JSON.parse(JSON.stringify(smObjIn));    
          var cdata = S(smObj.newCode);
               
          fns = cdata.between(smObj.tags.fn_defn_start, smObj.tags.fn_defn_end);
          lines = fns.lines();
          
          // extract existing function bodies where they match up with fn prototypes
          for (var state in smObj.stateOrder){
              name = smObj.stateOrder[state];
              charCount = 0;
              searchString = smObj.states[name]["fnDetails"]["returnType"] + " " + smObj.states[name]["fnDetails"]["fnName"]; 
              for (var i in lines){
                  line = S(lines[i]).collapseWhitespace().trim();
                  if (i > 0) charCount += (lines[i-1].length +1);
                  if (line.contains(searchString)){
                      remainder = fns.substring(charCount);
                      bracketIndex = _getIndexOfMatchingBracket(remainder, 0);
                      remainder = fns.substring(charCount, charCount+bracketIndex);
                      // make sure the spaces are consistant
                      remove = remainder.between("", '{');
                      remainder = remainder.strip(remove.s);
                      remove = smObj.states[name]["fnDetails"]["declaration"];
                      remove = remove.replace(" (", "(");
                      remove = remove.replace("(", " (");
                      remainder = remove + remainder.s;
                      smObj.states[name]["fnDetails"]["fn"] = remainder;
                      break;
                  }
              }
          }
          
          // create empty fn bodies where there is no matchup .
          for (var state in smObj.stateOrder){
              name = smObj.stateOrder[state];
              scd = smObj.states[name]["fnDetails"];
              if (!(scd.hasOwnProperty("fn"))){
                  scd.fn = scd.returnType + " " + scd.fnName + " " + scd.fnParams + "{\r\n}";
              }
          }
          return smObj;       
      };

      /**
      * Basically the same as _updateReplaceEnum but for creating the transition table 2D array string
      * between the transition table tags instead of the enum tags. Review comments for 
      * the _updateReplaceEnum for more details. Note that an existing transition table will already have been
      * analysed and the existing data in the transition table will be re-used where possible. 
      * The transition table is formatted so that the colums line up. 
      * @private
      * @function _updateReplaceTransitionTable
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj with newCode updated  with an updated transition table string in the newCode part of smObj.  
      * @example
      * Similar to _updateReplaceEnum()    
      */                 
      var _updateReplaceTransitionTable = function(smObjIn){ 
          var maxCharactersInColumn = [];
          var colHeading = "//   current";
          var state;
          var row;
          var table;
          var declarationString; 
          var smObj = JSON.parse(JSON.stringify(smObjIn));    
          var cdata = S(smObj.newCode);  
               
          // find out the maximum number of characters used in a state name for each column of state names so that the table 
          // can be layed out nicely. 
          
          maxCharactersInColumn.push(0);
          for (state in smObj.stateOrder) {
              if (smObj.stateOrder[state].length > maxCharactersInColumn[0]) maxCharactersInColumn[0] = smObj.stateOrder[state].length;
          }
          if ("current".length > maxCharactersInColumn[0]) maxCharactersInColumn[0] = "current".length;
          colHeading += S(" ").repeat(maxCharactersInColumn[0] - 5);
          
          //Logger.info("valid returns");
          //Logger.info(smObj.validReturns);
          
          for (var vr in smObj.validReturns) {
              // don't do the first or the last. First is current state done just above, last is array size. 
              if (vr == 0) continue;
              if (vr == smObj.validReturns.length -1) break;
              
              //Logger.info(smObj.validReturns[vr]);
              maxCharactersInColumn.push(0);
              for (var i in smObj.stateOrder) {
                  state = smObj.stateOrder[i];
                  if (smObj.states[state]["next"][smObj.validReturns[vr]].length > maxCharactersInColumn[vr]) maxCharactersInColumn[vr] = smObj.states[state]["next"][smObj.validReturns[vr]].length;
              }
              if (smObj.validReturns[vr].length > maxCharactersInColumn[vr]) maxCharactersInColumn[vr] = smObj.validReturns[vr].length;
              
              space = maxCharactersInColumn[vr] - (smObj.validReturns[vr].length -2);
              colHeading += smObj.validReturns[vr] + S(" ").repeat(space);
          }
          colHeading  += "\r\n";
          
          // create table
          row = "";
          table = "";
          for (var i in smObj.stateOrder) {
              state = smObj.stateOrder[i];
              for (var vr in smObj.validReturns) {
                  // last entry in validStateReturns is array size. 
                  if (vr == smObj.validReturns.length - 1) break;  
                  if (vr == 0) {
                      row = state;
                      space =  maxCharactersInColumn[vr] - state.length;
                  }
                  else {
                      row += ", " + S(" ").repeat(space).s + smObj.states[state]["next"][smObj.validReturns[vr]];
                      space = maxCharactersInColumn[vr] - smObj.states[state]["next"][smObj.validReturns[vr]].length;
                  }
              }
              row += S(" ").repeat(space).s;
              row = "    {" + row + "}";
              table += row; 
              if (i < smObj.stateOrder.length-1) table += ",";
              if (smObj.states[state]["changed"] == "true") {
                  if (i < smObj.stateOrder.length-1) table += " // *** changed";
                  else table += "  // *** changed";
              }
              table += "\r\n";
         }
         table += "};\r\n";
         
         declarationString = smObj.states[smObj.stateOrder[0]]["fnDetails"]["returnType"] + smObj.tags.transitionTableName + "[" +  smObj.tags.enum_arraysize + "]" + "[rvARRAYSIZE] = { \r\n";
         table = declarationString + colHeading + table;
     
          remove = cdata.between(smObj.tags.transition_table_start, smObj.tags.transition_table_end).s;
          remove = smObj.tags.transition_table_start + remove + smObj.tags.transition_table_end;
          table = smObj.tags.transition_table_start + "\r\n" + table + smObj.tags.transition_table_end;
          smObj.newCode = cdata.replaceAll(remove, table).s;    
          
          return smObj;   
      };

      /**
      * Locate the function defintions witin newCode by extracting the substring between the approprate tags. 
      * For each function that has a matching function prototype, find any messages as delimited by the 
      * specially formatted //---- tag and store against the state in smObj.  
      * @private
      * @function _extractFnMessages
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj the function bodies stored in smObj for each state.   
      * @example
      * Similar to _updateReplaceEnum()    
      */                  
      var _extractFnMessages = function(smObjIn){
          var state;
          var fnCode;
          var fnCodeLines;
          var fnCodeLinesIterator;
          var fnString;
          var validReturn;
          var searchString;
          var declaration;
          var msg;
          var added;
          var found;
          var smObj = JSON.parse(JSON.stringify(smObjIn));    
          
          // extract existing messages
          for (var i in smObj.stateOrder){
              state = smObj.stateOrder[i];
              smObj.states[state]["msg"] = {};
              fnCode = smObj.states[state]["fnDetails"]["fn"];
              fnCodeLines = S(fnCode).lines();
              found = false; 
              for (var rv in smObj.validReturns){
                  if (rv == 0) continue;
                  if (rv >= smObj.validReturns.length -1) break;
                  validReturn = smObj.validReturns[rv];
                  searchString = "//----" + validReturn;
                  for (var line in fnCodeLines){
                      if (S(fnCodeLines[line]).strip(' ').contains(searchString)){
                          smObj.states[state]["msg"][validReturn] = S(fnCodeLines[line]).between('[', ']').s;
                          found = true;
                          break;
                      }               
                  } 
              }
              if (!(found)){
                  // there were no message comments so add a placeholder after the declaration.
                  smObj.states[state]["fnDetails"]["fn"] = _insert(fnCode, fnCode.indexOf('{')+1, "\r\n" + "//----");              
              }               
          } 
          
          // remove the old messages from the code and add the new ones. 
          for (var i in smObj.stateOrder){
              state = smObj.stateOrder[i];
              fnCode = smObj.states[state]["fnDetails"]["fn"];
              fnCodeLines = [];
              fnCodeLinesIterator = S(fnCode).lines();
              searchString = "//----";
              fnString = "";
              msg = [];
              // create new messages
              for (var next in smObj.states[state]["next"]){
                if (smObj.states[state]["next"][next] != smObj.tags.nullState){  
                  if (smObj.states[state]["msg"].hasOwnProperty(next)){
                    msg.push("    //----" + next + " = " + smObj.states[state]["next"][next] + " [" + smObj.states[state]["msg"][next] + "]");
                  } else {
                    smObj.states[state]["msg"][next] = "";
                    msg.push("    //----" + next + " = " + smObj.states[state]["next"][next] + " [" + smObj.states[state]["msg"][next] + "]                *** changed");
                  }
                }
              }
              // remove and replace existing msgs in the same location
              added = false; 
              for (var line in fnCodeLinesIterator){
                if (S(fnCodeLinesIterator[line]).contains(searchString)){
                    if (!(added)){
                      for (var i in msg) {
                        fnCodeLines.push(msg[i]);
                        added = true;
                      }
                    }               
                } else {
                  fnCodeLines.push(fnCodeLinesIterator[line]);
                }
              }
              fnString = "";
              for (var i in fnCodeLines){
                  fnString += fnCodeLines[i] + "\r\n";
              }
              smObj.states[state]["fnDetails"]["fn"] = fnString;
          }
          return smObj;
      };

      /**
      * Go through each state as per the stateOrder in smObj and assemble the function body
      * and messages. If there isn't an existing message but there is a state transition then
      * create a place holder message which at least shows the the transition states. Each recreated
      * function is then inserted back into newCode between the tags.
      * @private
      * @function _updateReplaceFnBodies
      * @param {object} smObjIn - The statemachine object with at least newCode, states, stateOrder, tags defined (see example). 
      * @returns {object} returns a new smObj the function definitions recreated.  
      * @example
      * Similar to _updateReplaceEnum()    
      */                        
      var _updateReplaceFnBodies = function(smObjIn){
          
          var state;
          var fnString = "\r\n\r\n";
          var newCode;
          var remove;
          var smObj = JSON.parse(JSON.stringify(smObjIn));
          
          newCode = S(smObj.newCode);
          remove = newCode.between(smObj.tags.fn_defn_start, smObj.tags.fn_defn_end);
          remove = smObj.tags.fn_defn_start + remove + smObj.tags.fn_defn_end;
          
          for (var i in smObj.stateOrder){
              state = smObj.stateOrder[i];        
              fnString += smObj.states[state]["fnDetails"]["fn"] + "\r\n";          
          }
          
          fnString = smObj.tags.fn_defn_start + fnString + smObj.tags.fn_defn_end;
          
          newCode = newCode.replaceAll(remove, fnString);
          smObj.newCode = newCode.s;
          
          return smObj;
      };
    
      /**
      * Check to see if the openTag and closeTag exist in codeIn. If they don't exist then add the
      * tags and between the tags, add the dummyContent. If addToStart is true then add the tags
      * to the begginning of the codeIn string otherwise add it to the end. 
      * @private
      * @function _checkAtag
      * @param {string} openTag - a string to search for in codeIn 
      * @params {string} closeTag - a string to search for in codeIn  
      * @params {string} dummyContent - a string to add between the tags if the tags don't exist
      * @params {boolean} addtoStart - if true then if the tags don't exist, add them to the beginning of codeIn, otherwise add to end  
      * @params {string} codeIn - a string representing tagged C code. Can also be an empty string. 
      * @returns {string} returns codeIn with the tags added if necessary (if the tags already exist then its the same string as was passed into the function). 
      * @example
      * console.log(_checkAtag('!', '@', 'blah', false, 'some test text/r/n'));  
      * Output: some test text\r\n!blah@ 
      */                  
      var _checkAtag = function(openTag, closeTag, dummyContent, addToStart, codeIn) {
          var addToStart = (typeof addToStart !== 'undefined') ? addToStart : true;
          var openTag = (typeof openTag !== 'undefined') ? openTag : "";
          var closeTag = (typeof closeTag !== 'undefined') ? closeTag : "";
          var dummyContent = (typeof dummyContent !== 'undefined') ? dummyContent : "";
          var codeIn = (typeof codeIn !== 'undefined') ? codeIn : "";    
          var code = S(codeIn);
          var unrecoverable_error = "";
          
          if ((openTag === "") || (closeTag === "")) {
              Logger.error("Error - _checkAtag - openTag or closeTag parameter not provided");
              return "";
          }
          
          if (codeIn === "") {
              Logger.error("Error - _checkAtag - CodeIn parameter not provided or empty");
              return "";
          }     
              
          if (code.count(openTag) > 1) unrecoverable_error = ("More than one " + openTag + ". ");
          if (code.count(closeTag) > 1) unrecoverable_error += ("More than one " + closeTag + ". ");
          if (code.count(openTag) !== code.count(closeTag)) unrecoverable_error += ("Different number of " + openTag + " and " + closeTag + ". ");
          
          if (unrecoverable_error !== ""){
              Logger.error("Error - _checkAtag - " + unrecoverable_error);
              return "";         
          }    
          
          
          // Add in tags and dummy content if there aren't other problems.  
          if ((code.count(openTag) === 0) && (addToStart)){
              return openTag + dummyContent + closeTag + "\r\n" + code.s;
          }
          else if ((code.count(openTag) === 0) && (!(addToStart))){
              return code.s + "\r\n" + openTag + dummyContent + closeTag + "\r\n" ;
          } 
          return code.s;
      };

      /**
      * Run through all the tags and for each set use _checkAtag to verify that they are
      * in the right number, they exist, if they don't add them (and some example content) 
      * @private
      * @function _checkTags
      * @param {object} smObjIn - statemachine object 
      * @returns {object} returns a new verion of the stage machine object with newCode updated with tags if needed. 
      */                        
      var _checkTags = function(smObjIn){
          var smObj = JSON.parse(JSON.stringify(smObjIn));
          
          var dummyCode = "";
          
          dummyCode = "\r\nenum return_values {rvCURRENT, rFORWARD, rBRANCH, rBACK, rvARRAYSIZE};\r\n";  
          smObj.newCode = _checkAtag(smObj.tags.return_values_start, smObj.tags.return_values_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;    
     
          dummyCode = "\r\nint " + smObj.machineName + "DEMOSTATE_exampleDescription (int previous_state);\r\n";
          smObj.newCode = _checkAtag(smObj.tags.fn_proto_start, smObj.tags.fn_proto_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;   
     
          dummyCode = "\r\nenum " + smObj.machineName + "STATESENUM {\r\n      " +  smObj.machineName + "ARRAYSIZE, " +  smObj.machineName + "NULL // leave these two in place at the end of the enum\r\n};\r\n";
          smObj.newCode = _checkAtag(smObj.tags.enum_start, smObj.tags.enum_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;        
                    
          dummyCode = "\r\nint (*" + smObj.machineName + "FnArray[" +  smObj.machineName + "MAX_STATES])(int) = {\r\n};\r\n"
          smObj.newCode = _checkAtag(smObj.tags.fn_array_start, smObj.tags.fn_array_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;             
          
          dummyCode = "\r\n"
          smObj.newCode = _checkAtag(smObj.tags.transition_table_start, smObj.tags.transition_table_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;                
          
          dummyCode = "\r\n"
          smObj.newCode = _checkAtag(smObj.tags.fn_defn_start, smObj.tags.fn_defn_end, dummyCode, false, smObj.newCode); 
          if (smObj.newCode === "") return smObj;                       
          
          return smObj;
      };
     
      /**
      * Takes in an array of state machine names and a string representing tagged
      * C source code. Go through the code and remove any code related to statemachines
      * which aren't in the array.  
      * @private
      * @function _removeUnusedSM
      * @param {string} codeIn - A string of tagged C source code. 
      * @params {array} smList - An array of statemachine names.   
      * @returns {string} returns codeIn updated so that any code related to statemachines which aren't in the array has been removed.  
      * @example
      * console.log(_removeUnusedSM('//----pp_states_enum_start \r\n codehere \r\n //----pp_states_enum_end \r\n //----oo_states_enum_start \r\n morecodehere \r\n //----oo_states_enum_end \r\n','[pp]'));
      * Output: //----pp_states_enum_start \r\n codehere \r\n //----pp_states_enum_end 
      */                      
      var _removeUnusedSM = function(codeIn, smList){
        //var smList;
        var codeLines;
        var smStr = '';
        var re_unknown;
        var re_tag;
        var re_start;
        var line = '';
        var startTag;
        var endTag;
        var re_remove;
        
        //approach - go line by line and check for existance of a 
        // tag. if exists, chec sm name if its one of the ones in smList - ignore. 
        // if it isnt in the list add it to the remove list. 
        
        codeLines = S(codeIn).lines();  
        
        for (var i in smList){
          smStr += smList[i];
          if (i < smList.length -1) smStr += '|';
        }
     
        // regex which will match any of the start tags which are NOT in the list of statemachines.        
        re_unknown = new RegExp('^\\s*\\/\\/----(?!' + smStr + ')(\\w+)_(state)s*_(enum_)*(functions*_)*(prototypes_)*(transition_)*(array_)*(table_)*start', 'gm');
        re_tag = new RegExp('\\/\\/----\\w+_start', 'gm');
        re_start = new RegExp('(^\\s*)(\\/\\/----\\w+)(_start)', 'gm');
        
        // If a line has a recognisable tag in it, but with an unknown state machine name, 
        // extract the tag and create the end version of the tag, check the end tag exists
        // and then delete everything between the tags and the tags themselves. 
        // if there is a missing end tag - its an error.
     
        for (var i in codeLines){
            line = codeLines[i];
            if (line.search(re_unknown) !== -1){
     		    startTag = line.match(re_tag)[0];	
     		    startTag = S(startTag).trim().s;
     		    endTag = line.replace(re_start, '$2'+'_end');
     		    endTag = S(endTag).trim().s;
     		    if (S(codeIn).contains(endTag)){
     				startTag = S(startTag).replaceAll('/', '\\/').s; // slashes need escaping for regex
     				endTag = S(endTag).replaceAll('/', '\\/').s;
     				re_remove = new RegExp('(' + startTag + ')[\\s\\S]*(' + endTag + ')\\s{1,2}', 'gm');
     				codeIn = codeIn.replace(re_remove, '');
     			}
     			else Logger.info("There is a start tag without an end tag. The following tag is missing: " + endTag);
     		}
        }
        
        // check for any floating end tags without a start tag. Note - the case where an end tag is put 
        // before a start tag isn't covered. 
        codeLines = S(codeIn).lines();  
        re_unknown = new RegExp('^\\s*\\/\\/----(?!' + smStr + ')(\\w+)_(state)s*_(enum_)*(functions*_)*(prototypes_)*(transition_)*(array_)*(table_)*end', 'gm');
        re_tag = new RegExp('\\/\\/----\\w+_end', 'gm');
     
        for (var i in codeLines){
            line = codeLines[i];
            if (line.search(re_unknown) !== -1){
     		   endTag = line.match(re_tag)[0];
                Logger.info("There is a floating end tag (or the start tag could be after the end tag): " + endTag);
     	   }
        }
        
        return (codeIn);
           
      };

      /**
      * Takes in a string representing tagged C source code and a string representing the old and 
      * new state machine names - go through the code and update the old state machine name to the new name. 
      * Some parts of the code don't need updating (such as between the enum tags) because they are regenerated.  
      * @private
      * @function _renameSM
      * @param {string} codeIn - A string of tagged C source code. 
      * @params {string} smName - A string of the form oldName=newName  
      * @returns {array} returns codeIn updated so that oldName is now newName. 
      */                           
      var _renameSM = function(codeIn, smName){
     	 var origName;
     	 var newName;
     	 var re; 
     	 var tag;
     	 var start_tag;
     	 var end_tag;
     	 var nc="";
     	 var fp;
     	 var fp2;
     	 var remove;
     	 
          origName = S(smName).parseCSV('=')[0].trim();
          newName = S(smName).parseCSV('=')[1].trim();
          
          // Replace the state machine name with a new one in an existing function prototype tag. 
          tag = S(_tags.fn_proto_start).template({"machineName" : ""}).strip("//----").strip("_start");
          re = new RegExp('(^.*\/\/----)(' + origName + ')(' + tag + ')', 'gm');
          nc=codeIn.replace(re, '$1' + newName + '$3');
          
          // Replace the state machine name with a new one for each function prototype name
          start_tag = S(_tags.fn_proto_start).template({"machineName" : newName});
          end_tag = S(_tags.fn_proto_end).template({"machineName" : newName});
          fp = S(nc).between(start_tag, end_tag).s;
          re = new RegExp('(^.*?)(' + origName + ')', 'gm');
          fp2=fp.replace(re, '$1'+newName);
          nc = S(nc).replaceAll(start_tag + fp + end_tag, start_tag + fp2 + end_tag).s;
      
           // Replace states_enum tags. Also delete contents between tags, they will be reconstituted later 
           start_tag = S(_tags.enum_start).template({"machineName" : origName});
           end_tag = S(_tags.enum_end).template({"machineName" : origName});  
           remove = S(nc).between(start_tag, end_tag).s;
           remove = start_tag + remove + end_tag;
           //Logger.info(remove);
           start_tag = S(_tags.enum_start).template({"machineName" : newName}).s;
           end_tag = S(_tags.enum_end).template({"machineName" : newName}).s; 
           tag = start_tag + "\r\n" + end_tag;
           //Logger.info(tag);
           //Logger.info(S(nc).count(remove));
           nc = S(nc).replaceAll(remove, tag).s;
           
           // Replace state_functions_array. Also delete contents between tags, they will be reconstituted later 
           start_tag = S(_tags.fn_array_start).template({"machineName" : origName});
           end_tag = S(_tags.fn_array_end).template({"machineName" : origName});  
           remove = S(nc).between(start_tag, end_tag).s;
           remove = start_tag + remove + end_tag;
           //Logger.info(remove);
           start_tag = S(_tags.fn_array_start).template({"machineName" : newName}).s;
           end_tag = S(_tags.fn_array_end).template({"machineName" : newName}).s; 
           tag = start_tag + "\r\n" + end_tag;
           //Logger.info(tag);
           //Logger.info(S(nc).count(remove));
           nc = S(nc).replaceAll(remove, tag).s;      
     
          // Update state transition table tags with new state machine name.  
          tag = S(_tags.transition_table_start).template({"machineName" : ""}).strip("//----").strip("_start");
          re = new RegExp('(^.*\/\/----)(' + origName + ')(' + tag + ')', 'gm');
          nc=nc.replace(re, '$1' + newName + '$3');
          
          // Replace the state machine name with a new one in the state transition table tag
          start_tag = S(_tags.transition_table_start).template({"machineName" : newName});
          end_tag = S(_tags.transition_table_end).template({"machineName" : newName});
          fp = S(nc).between(start_tag, end_tag).s;
          re = new RegExp('({|,)(\\s*?)(' + origName + ')', 'gm');
          fp2=fp.replace(re, '$1$2'+newName);
          nc = S(nc).replaceAll(start_tag + fp + end_tag, start_tag + fp2 + end_tag).s;
     
          // Update function bodies tags with new state machine name.  
          tag = S(_tags.fn_defn_start).template({"machineName" : ""}).strip("//----").strip("_start");
          re = new RegExp('(^.*\/\/----)(' + origName + ')(' + tag + ')', 'gm');
          nc=nc.replace(re, '$1' + newName + '$3');
     
          // Replace the function definition names with the new state machine name
          start_tag = S(_tags.fn_defn_start).template({"machineName" : newName});
          end_tag = S(_tags.fn_defn_end).template({"machineName" : newName});
          fp = S(nc).between(start_tag, end_tag).s;
          re = new RegExp('(^\\w+\\s+)('+origName+')(\\w+_\\w+\\s*\\(.+\\)\\s*{)', 'gm');
          fp2=fp.replace(re, '$1'+newName+'$3');
          nc = S(nc).replaceAll(start_tag + fp + end_tag, start_tag + fp2 + end_tag).s;
           
          //Logger.info(nc);
          
          return nc;
      };
 
      /**
      * Takes in a string representing tagged C source code and analyzes it. 
      * It checks that it has the necessary tags matching to the defined state machine names
      * and puts in dummy tags and content where they don't exist. If updates to function prototypes
      * have been made they are filtered through the code by adding to the array and enum and creating
      * function bodies. A state machine object is created for each state machine in the string and the 
      * statmachine objects are returned as an array. 
      * @public
      * @function _analyzeAndUpdateCode
      * @param {string} stringIn - a string of tagged C source code. 
      * @returns {array} an array of statemachine objects 
      * @example
      * console.log(analyzeAndUpdateCode(""));
      * Output: You will get an array with one entry. It will be a statemachine 
      * object with everything completed with example data. 
      */                           
      var analyzeAndUpdateCode = function(stringIn) {
          var machineList;
          var machineName;
          var stateMachines = [];
          var smObj;
          var fnDetails;
          var ctags = {};
          var origCode = "";
          var newCode = "";
          var remove = "";
          var updatedML = "";
          

                    
          //var smObj = {tags:{}, validReturns:{}, origCode: "", newCode: ""};
          //Logger.info(stringIn);
          var origCode = stringIn;
          
          if (origCode === "") origCode = "\r\n";
        
          newCode = _checkAtag(_tags.machine_list_start, _tags.machine_list_end, "\r\n" + "//{eg}\r\n", true, origCode);
          
          if (newCode === "") return [];
          
          machineList = _arrayFromTaggedCSV(_tags.machine_list_start, _tags.machine_list_end, '{', '}', newCode, ',');
          // TODO - CHECK if there are multiple state machines with the same name.....
         
          for (machineName in machineList) {
              smObj = {};
              smObj.origCode = origCode;
              if (S(machineList[machineName]).count('=') > 0) {
                  newCode = _renameSM(newCode, machineList[machineName]);
                  machineList[machineName] = S(machineList[machineName]).parseCSV('=')[1].trim();
                  remove = S(newCode).between(_tags.machine_list_start, _tags.machine_list_end).s;
                  remove = _tags.machine_list_start + remove + _tags.machine_list_end;
                  updatedML = S(machineList).toCSV(',', null).replaceAll(',', ', ').s;
                  updatedML = _tags.machine_list_start + '\r\n' + '//{' + updatedML + '}' + '\r\n' + _tags.machine_list_end;
                  newCode = S(newCode).replaceAll(remove, updatedML).s;                    
              }         
              smObj.newCode = newCode;
              smObj.machineName = machineList[machineName]; 
        
        
              // Complete the tag templates for each state machine.
              smObj.tags = {};
              for (var tag in _tags) {
                  smObj.tags[tag] = S(_tags[tag]).template({'machineName': smObj.machineName}).s;
              }
              
              smObj = _checkTags(smObj);
              
              if (smObj.newCode === "") return [];
        
              smObj.validReturns = _arrayFromTaggedCSV(smObj.tags.return_values_start, smObj.tags.return_values_end, '{', '}', smObj.newCode, ',');
        
              //Logger.info(smObj.validReturns);
              //Logger.info(stateMachines[stateMachines.length - 1].validReturns);
                      
              smObj = _analyseFunctionPrototypes(smObj);
              smObj = _updateReplaceEnum(smObj);
              smObj = _updateReplaceFnArray(smObj);    
              smObj = _buildNextStates(smObj);
              smObj = _updateReplaceTransitionTable(smObj);
              smObj = _extractFnBodies(smObj);
              smObj = _extractFnMessages(smObj);
              smObj = _updateReplaceFnBodies(smObj);
              
              // next statemachine starts with the updated code from this statemachine.
              newCode = smObj.newCode;
        
              // NB - all the functions reurn a NEW object so add the final object after all
              // the changes made by each functino to the array so that it points to the right object.      
              stateMachines.push(smObj);         
          } 
        
          //Logger.info(machineList);
          
          newCode = _removeUnusedSM(newCode, machineList);
          
          // update the newCode in each of the statemachines to reflect the final with all 
          // the state machine having been updated. Only relevent for more than one state machine.
          for (var sm in stateMachines) {
              stateMachines[sm].newCode = newCode;
          }           
          
          //Logger.info(stateMachines);
              
          //Logger.info(smObj);
        
          return stateMachines;
          //return (newCode);
          
     }; 
      
      return {
        analyzeAndUpdateCode: analyzeAndUpdateCode
      };    
})();
     
     


