/* A Bison parser, made by GNU Bison 3.8.2.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2021 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* DO NOT RELY ON FEATURES THAT ARE NOT DOCUMENTED in the manual,
   especially those whose name start with YY_ or yy_.  They are
   private implementation details that can be changed or removed.  */

#ifndef YY_YY_PARSER_TAB_H_INCLUDED
# define YY_YY_PARSER_TAB_H_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int yydebug;
#endif

/* Token kinds.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    YYEMPTY = -2,
    YYEOF = 0,                     /* "end of file"  */
    YYerror = 256,                 /* error  */
    YYUNDEF = 257,                 /* "invalid token"  */
    TOK_PATIENT = 258,             /* TOK_PATIENT  */
    TOK_LOCATION = 259,            /* TOK_LOCATION  */
    TOK_SEVERITY = 260,            /* TOK_SEVERITY  */
    TOK_AMBULANCE = 261,           /* TOK_AMBULANCE  */
    TOK_HOSPITAL = 262,            /* TOK_HOSPITAL  */
    TOK_DISPATCH = 263,            /* TOK_DISPATCH  */
    TOK_ROUTE = 264,               /* TOK_ROUTE  */
    TOK_PRIORITY = 265,            /* TOK_PRIORITY  */
    TOK_STATUS = 266,              /* TOK_STATUS  */
    TOK_DISTANCE = 267,            /* TOK_DISTANCE  */
    TOK_TRANSFER = 268,            /* TOK_TRANSFER  */
    TOK_SPEED = 269,               /* TOK_SPEED  */
    TOK_REGISTER = 270,            /* TOK_REGISTER  */
    TOK_AVAILABLE = 271,           /* TOK_AVAILABLE  */
    TOK_ASSIGN = 272,              /* TOK_ASSIGN  */
    TOK_REPORT = 273,              /* TOK_REPORT  */
    TOK_CRITICAL = 274,            /* TOK_CRITICAL  */
    TOK_HIGH = 275,                /* TOK_HIGH  */
    TOK_MEDIUM = 276,              /* TOK_MEDIUM  */
    TOK_LOW = 277,                 /* TOK_LOW  */
    TOK_EQ = 278,                  /* TOK_EQ  */
    TOK_NEQ = 279,                 /* TOK_NEQ  */
    TOK_GTE = 280,                 /* TOK_GTE  */
    TOK_LTE = 281,                 /* TOK_LTE  */
    TOK_GT = 282,                  /* TOK_GT  */
    TOK_LT = 283,                  /* TOK_LT  */
    TOK_ASSIGN_OP = 284,           /* TOK_ASSIGN_OP  */
    TOK_IDENTIFIER = 285,          /* TOK_IDENTIFIER  */
    TOK_STRING = 286,              /* TOK_STRING  */
    TOK_INTEGER = 287,             /* TOK_INTEGER  */
    TOK_FLOAT = 288                /* TOK_FLOAT  */
  };
  typedef enum yytokentype yytoken_kind_t;
#endif

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
union YYSTYPE
{
#line 59 "parser.y"

    int   int_val;
    float float_val;
    char *str_val;

#line 103 "parser.tab.h"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif


extern YYSTYPE yylval;


int yyparse (void);


#endif /* !YY_YY_PARSER_TAB_H_INCLUDED  */
