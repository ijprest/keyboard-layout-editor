//
// compile with:
//   node jsonl_grammar.js > js/jsonl.js 
//   uglify js/jsonl.js > js/jsonl.min.js 
//
var Generator = require("/jison/lib/jison").Generator;

exports.grammar = {
    "comment": "ECMA-262 5th Edition, 15.12.1 The JSON Grammar. Parses JSON strings into objects. This parser supports a 'lenient' version of JSON that doesn't require quotes around identifiers.",
    "author": "Zach Carter; Ian Prest",

    "lex": {
        "macros": {
            "digit": "[0-9]",
            "esc": "\\\\",
            "int": "-?(?:[0-9]|[1-9][0-9]+)",
            "exp": "(?:[eE][-+]?[0-9]+)",
            "frac": "(?:\\.[0-9]+)"
        },
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["{int}{frac}?{exp}?\\b", "return 'NUMBER';"],
            ["\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}]|\\(|\\))*\"", "yytext = eval(yytext); return 'STRING';"],
            ["\\{", "return '{'"],
            ["\\}", "return '}'"],
            ["\\[", "return '['"],
            ["\\]", "return ']'"],
            [",", "return ','"],
            [":", "return ':'"],
            ["true\\b", "return 'TRUE'"],
            ["false\\b", "return 'FALSE'"],
            ["null\\b", "return 'NULL'"],
            ["[_a-zA-Z][_a-zA-Z0-9]*", "return 'IDENTIFIER'" ]
        ]
    },

    "tokens": "STRING NUMBER { } [ ] , : TRUE FALSE NULL IDENTIFIER",
    "start": "JSONText",

    "bnf": {
        "JSONString": [[ "STRING", "$$ = yytext;" ]],
        "JSONIdentifier": [[ "STRING", "$$ = yytext;" ],
                           [ "IDENTIFIER", "$$ = yytext;" ]],
        
        "JSONNumber": [[ "NUMBER", "$$ = Number(yytext);" ]],

        "JSONNullLiteral": [[ "NULL", "$$ = null;" ]],

        "JSONBooleanLiteral": [[ "TRUE", "$$ = true;" ],
                               [ "FALSE", "$$ = false;" ]],


        "JSONText": [[ "JSONValue", "return $$ = $1;" ]],

        "JSONValue": [[ "JSONNullLiteral",    "$$ = $1;" ],
                      [ "JSONBooleanLiteral", "$$ = $1;" ],
                      [ "JSONString",         "$$ = $1;" ],
                      [ "JSONNumber",         "$$ = $1;" ],
                      [ "JSONObject",         "$$ = $1;" ],
                      [ "JSONArray",          "$$ = $1;" ]],

        "JSONObject": [[ "{ }", "$$ = {};" ],
                       [ "{ JSONMemberList }", "$$ = $2;" ]],

        "JSONMember": [[ "JSONIdentifier : JSONValue", "$$ = [$1, $3];" ]],

        "JSONMemberList": [[ "JSONMember", "$$ = {}; $$[$1[0]] = $1[1];" ],
                           [ "JSONMemberList , JSONMember", "$$ = $1; $1[$3[0]] = $3[1];" ]],

        "JSONArray": [[ "[ ]", "$$ = [];" ],
                      [ "[ JSONElementList ]", "$$ = $2;" ]],

        "JSONElementList": [[ "JSONValue", "$$ = [$1];" ],
                            [ "JSONElementList , JSONValue", "$$ = $1; $1.push($3);" ]]
    }
};

var options = {type: "slr", moduleType: "commonjs", moduleName: "jsonl"};

exports.main = function main (args) {
    var code = new Generator(exports.grammar, options).generate();
    console.log(code);
};

if (require.main === module)
    exports.main();

