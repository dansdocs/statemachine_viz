/**
 * @fileOverview provides a smObj for testing purposes. It is what is produced if you give 
 * Codeupdater.analyzeAndUpdateCode("") an empty string. 
 * 
 * @author Daniel Burke 2017
 * @exports  smObj
 * @requires nothing
 * @version 0.0.1
 */

var Demo_smObj = (function () {
    smObj1 = {
        "origCode": "\r\n",
        "newCode": "//----state_machine_list_start\r\n//{eg}\r\n//----state_machine_list_end\r\n\r\n\r\n//----valid_state_return_values_start\r\nenum return_values {rvCURRENT, rFORWARD, rBRANCH, rBACK, rvARRAYSIZE};\r\n//----valid_state_return_values_end\r\n\r\n//----eg_state_function_prototypes_start\r\nint egDEMOSTATE_exampleDescription (int previous_state);\r\n//----eg_state_function_prototypes_end\r\n\r\n//----eg_states_enum_start\r\nenum egSTATESENUM {\r\n    egDEMOSTATE, \r\n    egARRAYSIZE, egNULL\r\n};\r\n//----eg_states_enum_end\r\n\r\n//----eg_state_functions_array_start\r\nint (*egFnArray[egARRAYSIZE])(int) = { \r\n    egDEMOSTATE_exampleDescription\r\n};\r\n//----eg_state_functions_array_end\r\n\r\n//----eg_state_transition_table_start\r\nint egTransitionTable[egARRAYSIZE][rvARRAYSIZE] = { \r\n//   current      rFORWARD  rBRANCH  rBACK   \r\n    {egDEMOSTATE, egNULL,   egNULL,  egNULL}  // *** changed\r\n};\r\n//----eg_state_transition_table_end\r\n\r\n//----eg_state_functions_start\r\n\r\nint egDEMOSTATE_exampleDescription (int previous_state) {\r\n}\r\n\r\n//----eg_state_functions_end\r\n",
        "machineName": "eg",
        "tags": {
            "machine_list_start": "//----state_machine_list_start",
            "machine_list_end": "//----state_machine_list_end",
            "return_values_start": "//----valid_state_return_values_start",
            "return_values_end": "//----valid_state_return_values_end",
            "fn_proto_start": "//----eg_state_function_prototypes_start",
            "fn_proto_end": "//----eg_state_function_prototypes_end",
            "enum_start": "//----eg_states_enum_start",
            "enum_end": "//----eg_states_enum_end",
            "fn_array_start": "//----eg_state_functions_array_start",
            "fn_array_end": "//----eg_state_functions_array_end",
            "transition_table_start": "//----eg_state_transition_table_start",
            "transition_table_end": "//----eg_state_transition_table_end",
            "fn_defn_start": "//----eg_state_functions_start",
            "fn_defn_end": "//----eg_state_functions_end",
            "enum_header": "enum egSTATESENUM {\r\n    ",
            "enum_arraysize": "egARRAYSIZE",
            "nullState": "egNULL",
            "fnArrayName": "egFnArray",
            "transitionTableName": " egTransitionTable"
        },
        "validReturns": [
            "rvCURRENT",
            "rFORWARD",
            "rBRANCH",
            "rBACK",
            "rvARRAYSIZE"
        ],
        "stateOrder": [
            "egDEMOSTATE"
        ],
        "states": {
            "egDEMOSTATE": {
                "fnDetails": {
                    "returnType": "int",
                    "fnName": "egDEMOSTATE_exampleDescription",
                    "description": "exampleDescription",
                    "declaration": "int egDEMOSTATE_exampleDescription (int previous_state)",
                    "fnParams": "(int previous_state)",
                    "fnTypeParams": "(int)",
                    "fn": "int egDEMOSTATE_exampleDescription (int previous_state) {\r\n}\r\n"
                },
                "next": {
                    "rFORWARD": "egNULL",
                    "rBRANCH": "egNULL",
                    "rBACK": "egNULL"
                },
                "changed": "true",
                "msg": {}
            }
        }
    };
    
    smObj2 = {
        "origCode": "\n\n//----state_machine_list_start \n//{tx}\n//----state_machine_list_end\n\n//----tx_state_function_prototypes_start\nuint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd);\nuint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd);\nuint8_t txCOLON_sendColon(uint8_t previous_state, TXRXdata* txd);\nuint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd);\n//----tx_state_function_prototypes_end\n\n//----tx_states_enum_start\nenum txSTATESENUM {\n    txSTART, txSLAVEID, txCOLON, txFINISH, \n    txARRAYSIZE, txNULL\n};\n//----tx_states_enum_end\n\n//----tx_state_functions_array_start\nuint8_t (*txFnArray[txARRAYSIZE])(uint8_t, TXRXdata*) = { \n    txSTART_initState, txSLAVEID_slaveAddress, txCOLON_sendColon, txFINISH_endState\n};\n//----tx_state_functions_array_end\n\n// The ONLY valid return values from a state machine function\n// noting that CURRENTST and rvARRAYSIZE are not a valid return values.\n// CURRENTST is a placeholder representing the current state, rvARRAYSIZE lets\n// us define state transitiontable array size. \n\n//----valid_state_return_values_start\nenum return_values {rvCURRENT, rFORWARD, rBRANCH, rBACK, rvARRAYSIZE};\n//----valid_state_return_values_end\n\n\n\n//----tx_state_transition_table_start\nuint8_t txTransitionTable[txARRAYSIZE][rvARRAYSIZE] = { \n//   current    rFORWARD   rBRANCH  rBACK      \n    {txSTART,   txSLAVEID, txNULL,  txNULL   },\n    {txSLAVEID, txCOLON,   txNULL,  txSLAVEID},\n    {txCOLON,   txFINISH,  txNULL,  txCOLON  },\n    {txFINISH,  txSTART,   txNULL,  txNULL   }\n};\n//----tx_state_transition_table_end\n\n\n//----tx_state_functions_start\n\nuint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd){\n    //----rFORWARD = txSLAVEID [forward when \\n start notes]\n}\n\nuint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd){\n    //----rFORWARD = txCOLON [forward when \\n slave notes]\n    //----rBACK = txSLAVEID [repeat if \\n slave notes]\n}\n\nuint8_t txCOLON_sendColon (uint8_t previous_state, TXRXdata* txd){\n\n    //----rFORWARD = txFINISH [forward when \\n colon notes]\n    //----rBACK = txCOLON [repeat if \\n colon notes]\n\n    if (!MODBUS_TIMER_EXPIRED()) REPEAT_UNTIL(\"Delay timer has expired\"); \n    UART_SEND_BYTE(':');\n    FORWARD_WHEN(\"Delay timer expired and ':' sent\");  \n}\n\nuint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd){\n    //----rFORWARD = txSTART [forward when \\n finish notes]\n}\n\n//----tx_state_functions_end\n\n\n",
        "newCode": "\n\n//----state_machine_list_start \n//{tx}\n//----state_machine_list_end\n\n//----tx_state_function_prototypes_start\nuint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd);\nuint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd);\nuint8_t txCOLON_sendColon(uint8_t previous_state, TXRXdata* txd);\nuint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd);\n//----tx_state_function_prototypes_end\n\n//----tx_states_enum_start\r\nenum txSTATESENUM {\r\n    txSTART, txSLAVEID, txCOLON, txFINISH, \r\n    txARRAYSIZE, txNULL\r\n};\r\n//----tx_states_enum_end\n\n//----tx_state_functions_array_start\r\nuint8_t (*txFnArray[txARRAYSIZE])(uint8_t, TXRXdata*) = { \r\n    txSTART_initState, txSLAVEID_slaveAddress, txCOLON_sendColon, txFINISH_endState\r\n};\r\n//----tx_state_functions_array_end\n\n// The ONLY valid return values from a state machine function\n// noting that CURRENTST and rvARRAYSIZE are not a valid return values.\n// CURRENTST is a placeholder representing the current state, rvARRAYSIZE lets\n// us define state transitiontable array size. \n\n//----valid_state_return_values_start\nenum return_values {rvCURRENT, rFORWARD, rBRANCH, rBACK, rvARRAYSIZE};\n//----valid_state_return_values_end\n\n\n\n//----tx_state_transition_table_start\r\nuint8_t txTransitionTable[txARRAYSIZE][rvARRAYSIZE] = { \r\n//   current    rFORWARD   rBRANCH  rBACK      \r\n    {txSTART,   txSLAVEID, txNULL,  txNULL   },\r\n    {txSLAVEID, txCOLON,   txNULL,  txSLAVEID},\r\n    {txCOLON,   txFINISH,  txNULL,  txCOLON  },\r\n    {txFINISH,  txSTART,   txNULL,  txNULL   }\r\n};\r\n//----tx_state_transition_table_end\n\n\n//----tx_state_functions_start\r\n\r\nuint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txSLAVEID [forward when \\n start notes]\r\n}\r\n\r\nuint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txCOLON [forward when \\n slave notes]\r\n    //----rBACK = txSLAVEID [repeat if \\n slave notes]\r\n}\r\n\r\nuint8_t txCOLON_sendColon (uint8_t previous_state, TXRXdata* txd){\r\n\r\n    //----rFORWARD = txFINISH [forward when \\n colon notes]\r\n    //----rBACK = txCOLON [repeat if \\n colon notes]\r\n\r\n    if (!MODBUS_TIMER_EXPIRED()) REPEAT_UNTIL(\"Delay timer has expired\"); \r\n    UART_SEND_BYTE(':');\r\n    FORWARD_WHEN(\"Delay timer expired and ':' sent\");  \r\n}\r\n\r\nuint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txSTART [forward when \\n finish notes]\r\n}\r\n\r\n//----tx_state_functions_end\n\n\n",
        "machineName": "tx",
        "tags": {
            "machine_list_start": "//----state_machine_list_start",
            "machine_list_end": "//----state_machine_list_end",
            "return_values_start": "//----valid_state_return_values_start",
            "return_values_end": "//----valid_state_return_values_end",
            "fn_proto_start": "//----tx_state_function_prototypes_start",
            "fn_proto_end": "//----tx_state_function_prototypes_end",
            "enum_start": "//----tx_states_enum_start",
            "enum_end": "//----tx_states_enum_end",
            "fn_array_start": "//----tx_state_functions_array_start",
            "fn_array_end": "//----tx_state_functions_array_end",
            "transition_table_start": "//----tx_state_transition_table_start",
            "transition_table_end": "//----tx_state_transition_table_end",
            "fn_defn_start": "//----tx_state_functions_start",
            "fn_defn_end": "//----tx_state_functions_end",
            "enum_header": "enum txSTATESENUM {\r\n    ",
            "enum_arraysize": "txARRAYSIZE",
            "nullState": "txNULL",
            "fnArrayName": "txFnArray",
            "transitionTableName": " txTransitionTable"
        },
        "validReturns": [
            "rvCURRENT",
            "rFORWARD",
            "rBRANCH",
            "rBACK",
            "rvARRAYSIZE"
        ],
        "stateOrder": [
            "txSTART",
            "txSLAVEID",
            "txCOLON",
            "txFINISH"
        ],
        "states": {
            "txSTART": {
                "fnDetails": {
                    "returnType": "uint8_t",
                    "fnName": "txSTART_initState",
                    "description": "initState",
                    "declaration": "uint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd)",
                    "fnParams": "(uint8_t previous_state, TXRXdata* txd)",
                    "fnTypeParams": "(uint8_t, TXRXdata*)",
                    "fn": "uint8_t txSTART_initState (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txSLAVEID [forward when \\n start notes]\r\n}\r\n"
                },
                "next": {
                    "rFORWARD": "txSLAVEID",
                    "rBRANCH": "txNULL",
                    "rBACK": "txNULL"
                },
                "changed": "false",
                "msg": {
                    "rFORWARD": "forward when \\n start notes"
                }
            },
            "txSLAVEID": {
                "fnDetails": {
                    "returnType": "uint8_t",
                    "fnName": "txSLAVEID_slaveAddress",
                    "description": "slaveAddress",
                    "declaration": "uint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd)",
                    "fnParams": "(uint8_t previous_state, TXRXdata* txd)",
                    "fnTypeParams": "(uint8_t, TXRXdata*)",
                    "fn": "uint8_t txSLAVEID_slaveAddress (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txCOLON [forward when \\n slave notes]\r\n    //----rBACK = txSLAVEID [repeat if \\n slave notes]\r\n}\r\n"
                },
                "next": {
                    "rFORWARD": "txCOLON",
                    "rBRANCH": "txNULL",
                    "rBACK": "txSLAVEID"
                },
                "changed": "false",
                "msg": {
                    "rFORWARD": "forward when \\n slave notes",
                    "rBACK": "repeat if \\n slave notes"
                }
            },
            "txCOLON": {
                "fnDetails": {
                    "returnType": "uint8_t",
                    "fnName": "txCOLON_sendColon",
                    "description": "sendColon",
                    "declaration": "uint8_t txCOLON_sendColon (uint8_t previous_state, TXRXdata* txd)",
                    "fnParams": "(uint8_t previous_state, TXRXdata* txd)",
                    "fnTypeParams": "(uint8_t, TXRXdata*)",
                    "fn": "uint8_t txCOLON_sendColon (uint8_t previous_state, TXRXdata* txd){\r\n\r\n    //----rFORWARD = txFINISH [forward when \\n colon notes]\r\n    //----rBACK = txCOLON [repeat if \\n colon notes]\r\n\r\n    if (!MODBUS_TIMER_EXPIRED()) REPEAT_UNTIL(\"Delay timer has expired\"); \r\n    UART_SEND_BYTE(':');\r\n    FORWARD_WHEN(\"Delay timer expired and ':' sent\");  \r\n}\r\n"
                },
                "next": {
                    "rFORWARD": "txFINISH",
                    "rBRANCH": "txNULL",
                    "rBACK": "txCOLON"
                },
                "changed": "false",
                "msg": {
                    "rFORWARD": "forward when \\n colon notes",
                    "rBACK": "repeat if \\n colon notes"
                }
            },
            "txFINISH": {
                "fnDetails": {
                    "returnType": "uint8_t",
                    "fnName": "txFINISH_endState",
                    "description": "endState",
                    "declaration": "uint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd)",
                    "fnParams": "(uint8_t previous_state, TXRXdata* txd)",
                    "fnTypeParams": "(uint8_t, TXRXdata*)",
                    "fn": "uint8_t txFINISH_endState (uint8_t previous_state, TXRXdata* txd){\r\n    //----rFORWARD = txSTART [forward when \\n finish notes]\r\n}\r\n"
                },
                "next": {
                    "rFORWARD": "txSTART",
                    "rBRANCH": "txNULL",
                    "rBACK": "txNULL"
                },
                "changed": "false",
                "msg": {
                    "rFORWARD": "forward when \\n finish notes"
                }
            }
        }
    }

      return {
        smObj1: smObj1,
        smObj2: smObj2
      };    
})();

//jQuery(document).ready(function () {
//  Logger.info(Demo_smObj.smObj2);
//});

