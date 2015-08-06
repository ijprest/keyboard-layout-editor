/* Parser for CSS3, as defined by http://www.w3.org/TR/css-syntax-3 */

%lex
/* Lexer Macros */
comment       \/\*([^\*](\*[^\/])?)*\*\/
newline       \r\n|\n|\r|\f
whitespace    [ \t\n\r\f]
hex           [0-9a-fA-F]
escape        \\([^0-9a-fA-F\n\r\f]|({hex}{1,6}{whitespace}?))
ws            {whitespace}*

nonascii      [\200-\377]
token_start   ({escape}|[a-zA-Z_]|{nonascii})
token_char    ({escape}|[a-zA-Z_0-9-]|{nonascii})
identifier    \-?{token_start}{token_char}*

string        \"({escape}|\\{newline}|[^"\\\r\n\f])*\"|\'({escape}|\\{newline}|[^'\\\r\n\f])*\'
urlu          ({escape}|[^'"\(\)\\ \t\n\r\f\000-\010\016-\037\177])+
number        [+-]?(\d+\.\d+|\.\d+|\d+)([eE][+-]?\d+)?
range         [uU]'+'({hex}{1,6}('-'{hex}{1,6})?|'?'{6}|{hex}'?'{5}|{hex}{2}'?'{4}|{hex}{3}'?'{3}|{hex}{4}'?'{2}|{hex}{5}'?'{1})

%%

/* Lexical Tokens */
{comment}                                 return 'WHITESPACE';
{whitespace}+                             return 'WHITESPACE';
{identifier}'('                           return 'FUNCTION';
{identifier}                              return 'IDENTIFIER';
'#'{token_char}+                          return 'HASH';
'@'{identifier}                           return 'AT_KEYWORD';
'!'{ws}'important'{ws}                    return 'IMPORTANT';
{string}                                  return 'STRING';
'url('{w}({string}|{urlu})?{w}')'         return 'URL';
{number}{identifier}                      return 'DIMENSION';
{number}'%'                               return 'PERCENTAGE';
{number}                                  return 'NUMBER';
{range}                                   return 'UNICODE_RANGE';
[~|^$\*]?'='                              return 'MATCH_TOKEN';
'||'                                      return 'COLUMN_TOKEN';
'<!--'                                    return 'CDO';
'-->'                                     return 'CDC';
<<EOF>>                                   return 'EOF';
'\''                                      return 'SQUOTE';
.                                         return yytext;

/lex

/* language grammar */
%start stylesheet
%ebnf
%%

stylesheet
  : WS EOF                                                        { return $$ = []; }
  | stylesheet_content WS EOF                                     { return $$ = ($stylesheet_content && $stylesheet_content.length) ? $stylesheet_content : []; }
  ;

stylesheet_content
  : stylesheet_item                                               { $$ = []; if($stylesheet_item !== null) $$.push($stylesheet_item); }
  | stylesheet_content stylesheet_item                            { $$ = $stylesheet_content; if($stylesheet_item !== null) $$.push($stylesheet_item); }
  ;

stylesheet_item
  : WS CDO                                                        { $$ = null; }
  | WS CDC                                                        { $$ = null; }
  | qualified_rule                                                { $$ = $qualified_rule; }
  | at_rule                                                       { $$ = $at_rule; }
  ;

at_rule
  : WS AT_KEYWORD ';'                                             { $$ = { name: $AT_KEYWORD }}
  | WS AT_KEYWORD at_rule_selector ';'                            { $$ = { name: $AT_KEYWORD, selector: $at_rule_selector.trim() }; if(!$$.selector) delete $$.selector; }
  | WS AT_KEYWORD '{' '}'                                         { $$ = { name: $AT_KEYWORD }; }
  | WS AT_KEYWORD '{' at_rule_content '}'                         { $$ = { name: $AT_KEYWORD, content: $at_rule_content.trim() }; if(!$$.content) delete $$.content; }
  | WS AT_KEYWORD at_rule_selector '{' '}'                        { $$ = { name: $AT_KEYWORD, selector: $at_rule_selector.trim() }; if(!$$.selector) delete $$.selector; }
  | WS AT_KEYWORD at_rule_selector '{' at_rule_content '}'        { $$ = { name: $AT_KEYWORD, selector: $at_rule_selector.trim(), content: $at_rule_content.trim() }; if(!$$.selector) delete $$.selector; if(!$$.content) delete $$.content; }
  ;

at_rule_selector
  : any_token                                                     { $$ = $any_token; }
  | at_rule_selector any_token                                    { $$ = $at_rule_selector + $any_token; }
  ;

at_rule_content
  : any_token                                                     { $$ = $any_token; }
  | at_rule_content ';'                                           { $$ = $at_rule_content + ';'; }
  | at_rule_content '{' at_rule_content '}'                       { $$ = $at_rule_content1 + '{' + $at_rule_content2 + '}'; }
  | at_rule_content any_token                                     { $$ = $at_rule_content + $any_token; }
  ;

qualified_rule
  : qualified_rule_prelude '{' WS '}'                             { $$ = { selector: $qualified_rule_prelude } }
  | qualified_rule_prelude '{' WS declaration_list '}'            { $$ = { selector: $qualified_rule_prelude, decls: $declaration_list } }
  | qualified_rule_prelude '{' WS declaration_list ';' WS '}'     { $$ = { selector: $qualified_rule_prelude, decls: $declaration_list } }
  ;

declaration_list
  : declaration                                                   { $$ = [$declaration]; }
  | declaration_list ';' WS declaration                           { $$ = $declaration_list; $$.push($declaration); }
  ;

declaration
  : IDENTIFIER WS ':' declaration_value                           { $$ = [$IDENTIFIER,$declaration_value.trim()]; }
  ;

// Anything other than a semi-colon or a closing brace
declaration_value
  : any_token                                                     { $$ = $any_token; }
  | declaration_value any_token                                   { $$ = $declaration_value + $any_token; }
  ;

// Does not include semi-colon, or open/close braces
any_token
  : (WHITESPACE | FUNCTION | IDENTIFIER | HASH | AT_KEYWORD | 
     IMPORTANT | STRING | URL | DIMENSION | PERCENTAGE | NUMBER | 
     UNICODE_RANGE | MATCH_TOKEN | COLUMN_TOKEN | CDO | CDC | EOF | SQUOTE |
     '!'|'"'|'#'|'$'|'%'|'&'|'('|')'|'*'|'+'|','|'-'|'.'|'/'|
     ':'|'<'|'='|'>'|'?'|'@'|'['|'\'|']'|'^'|'_'|'`'|'|'|'~') { $$ = $1; }
  ;

qualified_rule_prelude
  : WS selector WS                                                { $$ = [$selector]; }
  | qualified_rule_prelude ',' WS selector WS                     { $$ = $qualified_rule_prelude; $$.push($selector); }
  ;

selector
  : single_selector                                               { $$ = $single_selector; }
  | selector WHITESPACE single_selector                           { $$ = $selector + ' ' + $single_selector; }
  | selector WS '>' WS single_selector                            { $$ = $selector + '>' + $single_selector; }
  | selector WS '+' WS single_selector                            { $$ = $selector + '+' + $single_selector; }
  | selector WS '~' WS single_selector                            { $$ = $selector + '~' + $single_selector; }
  | ':' IDENTIFIER                                                { $$ = ':' + $IDENTIFIER; }
  | ':' ':' IDENTIFIER                                            { $$ = '::' + $IDENTIFIER; }
  | selector ':' IDENTIFIER                                       { $$ = $selector + ':' + $IDENTIFIER; }
  | selector ':' ':' IDENTIFIER                                   { $$ = $selector + '::' + $IDENTIFIER; }
  | ':' FUNCTION WS selector_function_params                      { $$ = ':' + $FUNCTION + $selector_function_params + ')'; }
  | selector ':' FUNCTION WS selector_function_params             { $$ = $selector + ':' + $FUNCTION + $selector_function_params + ')'; }
  ;

selector_function_params
  : IDENTIFIER WS ')'                                             { $$ = $IDENTIFIER; }
  | NUMBER WS ')'                                                 { $$ = $NUMBER; }
  | DIMENSION WS ')'                                              { $$ = $DIMENSION; }                  // 2n
  | IDENTIFIER WS NUMBER WS ')'                                   { $$ = $IDENTIFIER + $NUMBER; }       // n+1
  | IDENTIFIER WS '+' WS NUMBER WS ')'                            { $$ = $IDENTIFIER + '+' + $NUMBER; } // n+1
  | IDENTIFIER WS '-' WS NUMBER WS ')'                            { $$ = $IDENTIFIER + '-' + $NUMBER; } // n+1
  | DIMENSION WS NUMBER WS ')'                                    { $$ = $DIMENSION + $NUMBER; }        // 2n+1
  | DIMENSION WS '+' WS NUMBER WS ')'                             { $$ = $DIMENSION + '+' + $NUMBER; }  // 2n+1
  | DIMENSION WS '-' WS NUMBER WS ')'                             { $$ = $DIMENSION + '-' + $NUMBER; }  // 2n+1
  ;

single_selector
  : '*'                                                           { $$ = $1; }
  | '.' IDENTIFIER                                                { $$ = '.' + $IDENTIFIER; }
  | HASH                                                          { $$ = $HASH; }
  | IDENTIFIER                                                    { $$ = $IDENTIFIER; }
  | single_selector '.' IDENTIFIER                                { $$ = $single_selector + '.' + $IDENTIFIER; }
  | single_selector HASH                                          { $$ = $single_selector + $HASH; }
  | single_selector '[' WS attribute_selector ']'                 { $$ = $single_selector + '[' + $attribute_selector + ']'; }
  ;

attribute_selector
  : attribute_name WS                                             { $$ = $attribute_name; }
  | attribute_name WS MATCH_TOKEN WS attribute_value              { $$ = $attribute_name + $MATCH_TOKEN + $attribute_value; }
  ;

attribute_name
  : IDENTIFIER                                                    { $$ = $IDENTIFIER; }
  ;

attribute_value
  : unquoted_attribute_value                                      { $$ = $unquoted_attribute_value; }
  | STRING                                                        { $$ = $STRING; }
  ;

unquoted_attribute_value
  : unquoted_attribute_value_char                                 { $$ = $unquoted_attribute_value_char; }
  | IDENTIFIER                                                    { $$ = $IDENTIFIER; }
  | unquoted_attribute_value unquoted_attribute_value_char        { $$ = $unquoted_attribute_value + $unquoted_attribute_value_char; }
  | unquoted_attribute_value IDENTIFIER                           { $$ = $unquoted_attribute_value + $IDENTIFIER; }
  ;

unquoted_attribute_value_char
  : ('.'|':'|'-'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|NUMBER)      { $$ = $1; } // technically shouldn't allow full number syntax
  ;

WS
  : /*empty*/                                                     { $$ = ''; }
  | WHITESPACE+                                                   { $$ = ''; }
  ;

