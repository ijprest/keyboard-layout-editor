/* ECMA-262 5th Edition, 15.12.1 The JSON Grammar. */
/* Parses JSON strings into objects. */
/* This parser supports a 'lenient' version of JSON that doesn't require quotes around identifiers. */
/* Author: Zach Carter; Ian Prest (lenient bits) */

%lex
/* Lexer Macros */
digit   [0-9]
int     \-?(?:[0-9]|[1-9][0-9]+)
exp     (?:[eE][-+]?[0-9]+)
frac    (?:\.[0-9]+)
esc     \\

%%
/* Lexical Tokens */
\s+                                                                     /* skip whitespace */
{int}{frac}?{exp}?\b                                                    return 'NUMBER';
'"'(?:{esc}["bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^"{esc}]|\(|\))*'"'     yytext = eval(yytext); return 'STRING';
'{'                                                                     return '{'
'}'                                                                     return '}'
'['                                                                     return '['
']'                                                                     return ']'
','                                                                     return ','
':'                                                                     return ':'
'true'\b                                                                return 'TRUE'
'false'\b                                                               return 'FALSE'
'null'\b                                                                return 'NULL'
[_a-zA-Z][_a-zA-Z0-9]*                                                  return 'IDENTIFIER'

/lex

/* language grammar */
%start JSONText
%%

JSONString
    : STRING                                { $$ = yytext; }
    ;

JSONIdentifier
    : STRING                                { $$ = yytext; }
    | IDENTIFIER                            { $$ = yytext; }
    ;

JSONNumber
    : NUMBER                                { $$ = Number(yytext); }
    ;

JSONNullLiteral
    : NULL                                  { $$ = null; }
    ;

JSONBooleanLiteral
    : TRUE                                  { $$ = true; }
    | FALSE                                 { $$ = false; }
    ;

JSONText
    : JSONValue                             { return $$ = $1; }
    ;

JSONValue
    : JSONNullLiteral                       { $$ = $1; }
    | JSONBooleanLiteral                    { $$ = $1; }
    | JSONString                            { $$ = $1; }
    | JSONNumber                            { $$ = $1; }
    | JSONObject                            { $$ = $1; }
    | JSONArray                             { $$ = $1; }
    ;

JSONObject
    : '{' '}'                               { $$ = {}; }
    | '{' JSONMemberList '}'                { $$ = $2; }
    ;

JSONMember
    : JSONIdentifier ':' JSONValue          { $$ = [$1, $3]; }
    ;

JSONMemberList
    : JSONMember                            { $$ = {}; $$[$1[0]] = $1[1]; }
    | JSONMemberList ',' JSONMember         { $$ = $1; $1[$3[0]] = $3[1]; }
    ;

JSONArray
    : '[' ']'                               { $$ = []; }
    | '[' JSONElementList ']'               { $$ = $2; }
    ;

JSONArrayValue
    : JSONValue                             { $$ = $1; }
    | /*empty*/                             { $$ = undefined; }
    ;

JSONElementList
    : JSONValue                             { $$ = [$1]; }
    | JSONElementList ',' JSONArrayValue    { $$ = $1; $1.push($3); }
    ;
