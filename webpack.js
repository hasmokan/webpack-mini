"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babel = require("@babel/core");
var parser = require("@babel/parser");
var fs = require("fs");
var path = require("path");
var traverse = require("@babel/traverse");
var getModuleinfo = function (file) {
    var code = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
    // ast
    var ast = parser.parse(code, {
        sourceType: "module",
    });
    // console.log("ast", ast);
    // dep map
    var deps = {};
    traverse.default(ast, {
        ImportDeclaration: function (_a) {
            // console.log("import", node);
            var node = _a.node;
            // console.log(path.dirname(file));
            var abspath = "./" + path.join(path.dirname(file), node.source.value);
            deps[node.source.value] = abspath;
        },
    });
    // ES6 => ES5
    var es5code = babel.transformFromAstSync(ast, null, {
        presets: ["@babel/preset-env"],
    }).code;
    return { file: file, deps: deps, code: es5code };
};
console.log(getModuleinfo("./example/index.ts"));
