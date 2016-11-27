/*global exports:true, require:true*/
(function () {
    'use strict';

    const assert = require('assert');

    var acorn = require('acorn');
    var escodegen = require('escodegen');

    var estraverse = require('estraverse');
    var Syntax = estraverse.Syntax;

    var iterate = require('./traversal.js').iterate;

    function createEmptyBlockStatement() {
        return {
            type: "BlockStatement",
            body: [],
        };
    }

    var mutator = {
        Identifier: function*(node) {
        },

        Literal: function*(node) {
        },

        RegExpLiteral: function*(node) {
        },

        Program: function*(node) {
        },

        ExpressionStatement: function*(node) {
        },

        BlockStatement: function*(node) {
            yield createEmptyBlockStatement();
        },

        EmptyStatement: function*(node) {
            yield null;
        },

        DebuggerStatement: function*(node) {
        },

        WithStatement: function*(node) {
        },

        // Control flow

        ReturnStatement: function*(node) {
        },

        LabeledStatement: function*(node) {
        },

        BreakStatement: function*(node) {
        },

        ContinueStatement: function*(node) {
        },

        // Choice

        IfStatement: function*(node) {
            yield node.consequent;
            yield null;
        },

        SwitchStatement: function*(node) {
            yield null;
        },

        SwitchCase: function*(node) {
            yield null;
        },

        // Exceptions

        ThrowStatement: function*(node) {
        },

        TryStatement: function*(node) {
        },

        CatchClause: function*(node) {
        },

        // Loops

        WhileStatement: function*(node) {
            yield null;
        },

        DoWhileStatement: function*(node) {
            yield null;
        },

        ForStatement: function*(node) {
            yield null;
        },

        ForInStatement: function*(node) {
            yield null;
        },

        // Declarations

        FunctionDeclaration: function*(node) {
            yield null;
        },

        VariableDeclaration: function*(node) {
        },

        VariableDeclarator: function*(node) {
        },

        // Expressions

        ThisExpression: function*(node) {
        },

        ArrayExpression: function*(node) {
        },

        ObjectExpression: function*(node) {
        },

        Property: function*(node) {
        },

        FunctionExpression: function*(node) {
        },

        // Unary operations

        UnaryExpression: function*(node) {
        },

        UpdateExpression: function*(node) {
        },

        // Binary operations

        BinaryExpression: function*(node) {
        },

        AssignmentExpression: function*(node) {
        },

        LogicalExpression: function*(node) {
        },

        MemberExpression: function*(node) {
        },

        ConditionalExpression: function*(node) {
        },

        CallExpression: function*(node) {
        },

        NewExpression: function*(node) {
        },

        SequenceExpression: function*(node) {
        },
    };

    function replace(value, mutation) {
        var parent = value.parent;
        var key = value.key;
        var i = value.i;
        var replaced = value.node;

        if (Array.isArray(parent[key])) {
            parent[key][i] = mutation;
        } else {
            parent[key] = mutation;
        }

        return replaced;
    }

    function mutate(ast, interesting, value) {
        assert(value.node.type in mutator,
               'Unimplemented type: ' + value.node.type);
        var iter = mutator[value.node.type](value.node);
        var result = null;

        for (var m = iter.next(); !m.done; m = iter.next()) {
            var mutation = m.value;
            var replacement = replace(value, mutation);

            var tmp = generate(ast);

            if (!interesting(tmp, ast))
                replace(value, replacement);
            else
                result = tmp;
        }

        return result;
    }

    var CodegenOptions = {
        format: {
            semicolons: false,
        },
    };

    function generate(ast) {
        return escodegen.generate(ast, CodegenOptions);
    }

    function run(source, interesting) {
        // Verify that the original source code is interesting.
        if (!interesting(source, ast))
            return;

        // Convert original JS source code to an AST.
        var ast = acorn.parse(source);
        assert.equal(ast.type, Syntax.Program);

        // Generate JS code for the original AST. The result is overwritten
        // when an interesting mutation occured.
        var result = generate(ast);

        // Traverse the AST and try each mutation.
        var iter = iterate(ast);
        for (var cur = iter.next(); !cur.done; cur = iter.next()) {
            var tmp = mutate(ast, interesting, cur.value);
            if (tmp)
                result = tmp;
        }

        return result;
    }

    exports.run = run;
    exports.iterate = iterate;
}());
