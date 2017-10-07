
/**
 * @fileOverview create state machine object from tagged C code string. 
 * Also, update the tagged source code based on updates to the function prototypes and 
 * addition/removal of state machines. 
 * 
 * @author Daniel Burke 2017
 * @exports  analyzeAndUpdateCode(stringIn) and returns an array of state machine objects
 * @requires nothing
 * @version 0.0.1
 */

var Createdot = (function () {

 
      /**
      * Creates a string that graphviz can use to generate a statemachine diagram.  
      * @private
      * @function createDotString
      * @param {object} smObj - a state machine object 
      * @returns {string} A string which graphviz can process to create a drawing. 
      * @example
      */        
      function createDotString(smObj){
          var obKey;
          var nextKey
          var nextState;
          var stateLabel;
          var circle = "";
          var doubleCircle = "";
          var octagon = "";
          var dotString = "";
          var branchType;
          
          // Any state with start in its name will be a double circle shape. 
          // Any state with finish in its name will be an octogon. 
          // Everything else is a plain circle. 
          for (var i in smObj.stateOrder){
			  obKey = smObj.stateOrder[i];
              if (obKey.indexOf("START") >=  0 ) doubleCircle = doubleCircle + " " + obKey;
              else if (obKey.indexOf("FINISH") >=  0 ) octagon = octagon + " " + obKey;
              else circle = circle + " " + obKey;
          }
          
          dotString = 'digraph finite_state_machine {\n    rankdir=LR;\n    size="8,5";\n'        
          if (doubleCircle != "") dotString = dotString + "    node [shape = doublecircle];" + doubleCircle + "; \n";
          if (circle != "") dotString = dotString + "    node [shape = circle];" + circle + "; \n";
          if (octagon != "") dotString = dotString + "    node [shape = octagon];" + octagon + "; \n\n";
          
          // Set the label inside of each state circle (or double circle).
          for (var i in smObj.stateOrder){
			  obKey = smObj.stateOrder[i];
               stateLabel = smObj.states[obKey]["fnDetails"]["description"];
               stateLabel = stateLabel.replace(/([A-Z])/g, " $1"); // Space out the camel case. 
               stateLabel = stateLabel.toLowerCase();
               stateLabel = obKey + ' \\n ' + stateLabel;
              
              dotString = dotString + "        " + obKey + ' [label = "' + stateLabel + '"];\n';
          }
          
          dotString = dotString + "\n";
          

          // Complete the state transitions and label the transitions.        
          for (var i in smObj.stateOrder){
		      obKey = smObj.stateOrder[i];
		      for (var vr in smObj.validReturns){
                  branchType = smObj.validReturns[vr];
		          if (branchType.substr(0,2) == "rv") continue; // ignore rvCURRENT and rvARRAYSIZE
                  nextState = smObj.states[obKey]["next"];
                  //Logger.info(nextState);
                  if (nextState.hasOwnProperty(branchType)) {
		              if (nextState[branchType].indexOf('NULL') == -1) {
                        dotString = dotString + "        " + obKey + " -> " + nextState[branchType] + ' [label = "' + branchType + ': ' + smObj.states[obKey]["msg"][branchType] + '"];\n';
                      }
                  } 
              }
          }
                
          dotString = dotString + " }\n";
          return dotString;
          
          //Logger.info(dotString);
          //Logger.info("here i am");
     }
 
     
      
      return {
        createDotString: createDotString
      };    
})();
     
     

//jQuery(document).ready(function () {
  //Logger.info(Demo_smObj.smObj2);
//  Logger.info(Createdot.createDotString(Demo_smObj.smObj2));
//});
  
 
 
 
