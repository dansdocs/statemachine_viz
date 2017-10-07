var Template = (function () {
    dPage = {"html": '\
		<!doctype html>                                                 \n\
		<html lang="en">                                                \n\
		    <head>                                                      \n\
		        <meta charset="utf-8">                                  \n\
		        <title>                                                 \n\
		            ^^title^^                                           \n\
		        </title>                                                \n\
		        <style>                                                 \n\
		            * {                                                 \n\
		                margin: 0;                                      \n\
		                padding: 0;                                     \n\
		            }                                                   \n\
		                                                                \n\
		            html,                                               \n\
		            body {                                              \n\
						font: 12px sans-serif;                          \n\
					}                                                   \n\
					                                                    \n\
					body {                                              \n\
						padding-top: 0em;                               \n\
						-webkit-box-sizing: border-box;                 \n\
						-moz-box-sizing: border-box;                    \n\
						box-sizing: border-box;                         \n\
					}                                                   \n\
					                                                    \n\
					html,                                               \n\
					body,                                               \n\
					table,                                              \n\
					tbody,                                              \n\
					tr,                                                 \n\
					td {                                                \n\
						height: 100%                                    \n\
					}                                                   \n\
					                                                    \n\
					table {                                             \n\
						table-layout: fixed;                            \n\
						width: 100%;                                    \n\
				    }                                                   \n\
				                                                        \n\
				    td {                                                \n\
						width: 33%;                                     \n\
						padding: 3px 4px;                               \n\
						border: 1px solid transparent;                  \n\
						vertical-align: top;                            \n\
						font: 1em monospace;                            \n\
						text-align: left;                               \n\
						white-space: pre-wrap;                          \n\
					}                                                   \n\
					                                                    \n\
					h1 {                                                \n\
						display: inline;                                \n\
						font-size: 100%;                                \n\
					}                                                   \n\
					                                                    \n\
					del {                                               \n\
						text-decoration: none;                          \n\
						color: #b30000;                                 \n\
						background: #fadad7;                            \n\
					}                                                   \n\
						                                                \n\
					ins {                                               \n\
						background: #eaf2c2;                            \n\
						color: #406619;                                 \n\
						text-decoration: none;                          \n\
					}                                                   \n\
					                                                    \n\
					#settings {                                         \n\
					    position: absolute;                             \n\
					    top: 0;                                         \n\
					    left: 5px;                                      \n\
					    right: 5px;                                     \n\
					    height: 2em;                                    \n\
					    line-height: 2em;                               \n\
					}                                                   \n\
					                                                    \n\
					#settings label {                                   \n\
					    margin-left: 1em;                               \n\
					}                                                   \n\
					                                                    \n\
					#outputdiv {                                        \n\
					    white-space:pre;                                \n\
					    font-family:monospace,monospace; font-size:1em; \n\
				    }                                                   \n\
					                                                    \n\
					.source {                                           \n\
						position: absolute;                             \n\
						right: 1%;                                      \n\
						top: .2em;                                      \n\
					}                                                   \n\
					                                                    \n\
					[contentEditable] {                                 \n\
						background: #F9F9F9;                            \n\
						border-color: #BBB #D9D9D9 #DDD;                \n\
						border-radius: 4px;                             \n\
						-webkit-user-modify: read-write-plaintext-only; \n\
						outline: none;                                  \n\
					}                                                   \n\
					                                                    \n\
					[contentEditable]:focus {                           \n\
						background: #FFF;                               \n\
						border-color: #6699cc;                          \n\
						box-shadow: 0 0 4px #2175c9;                    \n\
					}                                                   \n\
					                                                    \n\
					@-moz-document url-prefix() {                       \n\
						body {                                          \n\
							height: 99%; /* Hide scroll bar Firefox */  \n\
						}                                               \n\
					}                                                   \n\
		        </style>                                                \n\
		    </head>                                                     \n\
		    <body>                                                      \n\
		        <br><h2>^^heading^^</h2><br><br>                          \n\
		        <div id="outputdiv">^^outputdiv^^</div>                 \n\
		    </body>                                                     \n\
		</html>'
    }
    
     return {
        dPage: dPage
      };        
})();
