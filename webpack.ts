import * as babel from "@babel/core";
import * as parser from "@babel/parser";
import * as fs from "fs";
import * as path from "path";
import * as traverse from "@babel/traverse";

const getModuleinfo = (file: string) => {
	const code = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");

	// ast
	const ast = parser.parse(code, {
		sourceType: "module",
	});

	// console.log("ast", ast);

	// dep map
	const deps = {};

	traverse.default(ast, {
		ImportDeclaration({ node }) {
			// console.log("import", node);

			// console.log(path.dirname(file));
			const abspath = "./" + path.join(path.dirname(file), node.source.value).replace('\\', '/');

			deps[node.source.value] = abspath;
		},
	});

	// ES6 => ES5
	const { code: es5code } = babel.transformFromAstSync(ast, null, {
		presets: ["@babel/preset-env"],
	});

	return { file, deps, code: es5code  };
};

console.log(getModuleinfo("./example/index.ts"))