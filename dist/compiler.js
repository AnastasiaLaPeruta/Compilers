// ----------------------- Utility Function ----------------------- //
// Displays output in the element with id "output"
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output");
    outputElement.value = compileOutput;
}
// ----------------------- Lexing Functions ----------------------- //
// Modified lexProgram accepts an optional lineOffset.
// All tokens are reported with line number = (lineOffset + localLineIndex + 1)
function lexProgram(progText, lineOffset = 0) {
    let tokens = [];
    let errors = 0;
    let output = "";
    const lines = progText.split("\n");
    let position = 0;
    // Process each line
    for (let localLine = 0; localLine < lines.length; localLine++) {
        let line = lines[localLine];
        const globalLine = lineOffset + localLine + 1; // Global line number
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${char}'`);
            // --- Check for End-of-Program marker ---
            if (char === "$") {
                tokens.push({ type: "EOP", lexeme: "$", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - EOP [ $ ] found on line ${globalLine}\n`;
                // Warning 1: Check for extra consecutive '$'
                let extraDollars = "";
                let j = charIndex + 1;
                while (j < line.length && line[j] === "$") {
                    extraDollars += "$";
                    j++;
                }
                if (extraDollars.length > 0) {
                    output += `WARNING Lexer - Warning: line ${globalLine} - Extra "${extraDollars}" detected. Program will continue to execute assuming you meant to do this...\n\n`;
                }
                // Warning 2: Check for any extra characters after '$' (even if they are whitespace)
                if (j < line.length) {
                    output += `WARNING Lexer - Warning: line ${globalLine} - Extra characters after "$" will be ignored.\n\n`;
                }
                // Skip the rest of the line
                charIndex = line.length;
                continue;
            }
            // --- Punctuation and grouping ---
            else if (char === "{") {
                tokens.push({ type: "LBRACE", lexeme: "{", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${globalLine}\n`;
            }
            else if (char === "}") {
                tokens.push({ type: "RBRACE", lexeme: "}", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${globalLine}\n`;
            }
            else if (char === "(") {
                tokens.push({ type: "LPAREN", lexeme: "(", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - LPAREN [ ( ] found on line ${globalLine}\n`;
            }
            else if (char === ")") {
                tokens.push({ type: "RPAREN", lexeme: ")", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - RPAREN [ ) ] found on line ${globalLine}\n`;
            }
            // --- Comments: skip everything between /* and */ ---
            else if (char === "/" && charIndex + 1 < line.length && line[charIndex + 1] === "*") {
                charIndex += 2; // Skip the "/*"
                let commentClosed = false;
                let commentContent = "";
                while (localLine < lines.length) {
                    while (charIndex < line.length - 1) {
                        if (line[charIndex] === "*" && line[charIndex + 1] === "/") {
                            commentClosed = true;
                            charIndex += 2; // Skip the "*/"
                            break;
                        }
                        commentContent += line[charIndex];
                        charIndex++;
                    }
                    if (commentClosed)
                        break;
                    localLine++;
                    if (localLine < lines.length) {
                        line = lines[localLine];
                        charIndex = 0;
                    }
                }
                if (!commentClosed) {
                    output += `ERROR Lexer - Error: Unterminated comment starting on line ${globalLine}. Lexing terminated.\n`;
                    errors++;
                    output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
                    return { tokens, output, errors };
                }
                // Warning: if the comment content is empty (or only whitespace), issue a warning.
                if (commentContent.trim().length === 0) {
                    output += `WARNING Lexer - Warning: line ${globalLine} - Empty comment block detected.\n\n`;
                }
                continue; // Skip further processing inside comment.
            }
            // --- Keywords and operators ---
            else if (line.substring(charIndex, charIndex + 5) === "print") {
                tokens.push({ type: "PRINT", lexeme: "print", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - PRINT [ print ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 5) === "while") {
                tokens.push({ type: "WHILE", lexeme: "while", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - WHILE [ while ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 2) === "if") {
                tokens.push({ type: "IFSTATEMENT", lexeme: "if", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - IFSTATEMENT [ if ] found on line ${globalLine}\n`;
                charIndex++;
            }
            else if (line.substring(charIndex, charIndex + 4) === "true") {
                tokens.push({ type: "BOOLVALT", lexeme: "true", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALT [ true ] found on line ${globalLine}\n`;
                charIndex += 3;
            }
            else if (line.substring(charIndex, charIndex + 5) === "false") {
                tokens.push({ type: "BOOLVALF", lexeme: "false", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALF [ false ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            // --- Type keywords ---
            else if (/^(int|string|boolean)/.test(line.substring(charIndex))) {
                let typeLexeme = "";
                if (line.substring(charIndex, charIndex + 3) === "int") {
                    typeLexeme = "int";
                }
                else if (line.substring(charIndex, charIndex + 6) === "string") {
                    typeLexeme = "string";
                }
                else if (line.substring(charIndex, charIndex + 7) === "boolean") {
                    typeLexeme = "boolean";
                }
                tokens.push({ type: "ITYPE", lexeme: typeLexeme, line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - ITYPE [ ${typeLexeme} ] found on line ${globalLine}\n`;
                charIndex += typeLexeme.length - 1;
            }
            // --- Assignment and comparison operators ---
            else if (char === "=") {
                if (charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                    tokens.push({ type: "BOOL_EQUAL", lexeme: "==", line: globalLine, column: charIndex + 1 });
                    output += `DEBUG Lexer - BOOL_EQUAL [ == ] found on line ${globalLine}\n`;
                    charIndex++;
                }
                else {
                    tokens.push({ type: "ASSIGN_OP", lexeme: "=", line: globalLine, column: charIndex + 1 });
                    output += `DEBUG Lexer - ASSIGN_OP [ = ] found on line ${globalLine}\n`;
                }
            }
            else if (char === "!" && charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                tokens.push({ type: "BOOL_INEQUAL", lexeme: "!=", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOL_INEQUAL [ != ] found on line ${globalLine}\n`;
                charIndex++;
            }
            else if (char === "+") {
                tokens.push({ type: "INTOP", lexeme: "+", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - INTOP [ + ] found on line ${globalLine}\n`;
            }
            // --- String Expressions ---
            else if (char === '"') {
                tokens.push({ type: "LQUOTE", lexeme: "\"", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - StringExpr [ start " ] found on line ${globalLine}\n`;
                charIndex++; // move past the opening quote
                let stringContent = "";
                while (charIndex < line.length && line[charIndex] !== '"') {
                    let currentChar = line[charIndex];
                    if ((currentChar >= "a" && currentChar <= "z") || currentChar === " ") {
                        tokens.push({ type: "CHAR", lexeme: currentChar, line: globalLine, column: charIndex + 1 });
                        stringContent += currentChar;
                        output += `DEBUG Lexer - char [ ${currentChar} ] found on line ${globalLine}\n`;
                    }
                    else {
                        errors++;
                        output += `ERROR Lexer - Error: line ${globalLine} Unrecognized Token in string: ${currentChar} Only lowercase letters a through z and spaces are allowed in strings\n`;
                        output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
                        return { tokens, output, errors };
                    }
                    charIndex++;
                }
                if (charIndex < line.length && line[charIndex] === '"') {
                    tokens.push({ type: "RQUOTE", lexeme: "\"", line: globalLine, column: charIndex + 1 });
                    output += `DEBUG Lexer - StringExpr [ end " ] found on line ${globalLine}\n`;
                }
                else {
                    errors++;
                    output += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${globalLine}. Lexing terminated due to fatal error.\n`;
                    output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
                    return { tokens, output, errors };
                }
                if (stringContent.trim().length === 0) {
                    output += `WARNING Lexer - Warning: line ${globalLine} - Empty string literal detected.\n\n`;
                }
            }
            // --- Digits ---
            else if (/[0-9]/.test(char)) {
                tokens.push({ type: "DIGIT", lexeme: char, line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - DIGIT [ ${char} ] found on line ${globalLine}\n`;
            }
            // --- Identifiers (a single character) ---
            // In the lexProgram function, where ID tokens are created:
            else if (char >= "a" && char <= "z") {
                tokens.push({
                    type: "ID",
                    lexeme: char,
                    line: globalLine,
                    column: charIndex + 1
                });
                console.log(`Added ID token: ${char} at line ${globalLine}`);
                output += `DEBUG Lexer - ID [ ${char} ] found on line ${globalLine}\n`;
            }
            // --- Ignore whitespace ---
            else if (char === " " || char === "\t") {
                // do nothing
            }
            // --- Unrecognized token ---
            else {
                errors++;
                output += `ERROR Lexer - Error: line ${globalLine} Unrecognized Token: ${char} Please reference grammar guide.\n`;
            }
            position++;
        }
        position++; // Account for newline
    }
    // Check that the program ends with "$"
    // Check that the program ends with "$"
    let trimmedText = progText.replace(/\s+$/, "");
    if (!trimmedText.endsWith("$")) {
        output += `ERROR Lexer - Error: last line of program does not end with "$".\n`;
        errors++;
        output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
        return { tokens, output, errors };
    }
    output += `LEXER: Lex completed with ${errors} error(s)\n\n`;
    return { tokens, output, errors };
}
// ----------------------- Program Processing ----------------------- //
// This function splits the input (which may contain multiple programs separated by "$"),
// computes a global line offset for each program, and then lexes and parses each.
function processPrograms() {
    let finalOutput = "DEBUG: Running in verbose mode \n\n";
    const inputElement = document.getElementById("userInput");
    const text = inputElement.value;
    // split input into raw programs, preserving newlines
    let rawPrograms = text.split("$");
    const programs = [];
    let cumulativeLineCount = 0;
    for (let i = 0; i < rawPrograms.length; i++) {
        const raw = rawPrograms[i];
        if (raw.trim().length > 0) {
            if (i < rawPrograms.length - 1) {
                programs.push({ program: raw + "$", offset: cumulativeLineCount });
            }
            else {
                programs.push({ program: raw, offset: cumulativeLineCount });
            }
        }
        cumulativeLineCount += (raw.match(/\n/g) || []).length;
    }
    let programNumber = 1;
    for (const { program, offset } of programs) {
        const lexResult = lexProgram(program, offset);
        let compileOutput = `LEXER - Lexing program ${programNumber}...\n` + lexResult.output;
        if (lexResult.errors === 0) {
            compileOutput += `PARSER: Parsing program ${programNumber}...\n`;
            const parserInstance = new Parser(lexResult.tokens);
            const result = parserInstance.parse();
            compileOutput += result.output;
            if (result.error) {
                compileOutput += `\nPARSER ERROR: ${result.error}\n`;
                compileOutput += `CST for program ${programNumber}: Skipped due to PARSER error(s).\n`;
            }
            else if (result.tree) {
                compileOutput += `PARSER: Parse completed successfully\n`;
                compileOutput += `\nCST for program ${programNumber}:\n` + result.tree.print();
                // --- AST Generation --- //
                if (result.tree) {
                    const astRoot = buildASTFromCST(result.tree.root);
                    if (astRoot) {
                        compileOutput += `\nAST for program ${programNumber}:\n` + astRoot.print();
                        // --- Semantic Analysis --- //
                        // --- Semantic Analysis --- //
                        const semanticAnalyzer = new SemanticAnalyzer();
                        semanticAnalyzer.analyze(astRoot);
                        const errorCount = semanticAnalyzer.errors.length;
                        const warningCount = semanticAnalyzer.warnings.length;
                        compileOutput += `\nProgram ${programNumber} Semantic Analysis produced\n`;
                        compileOutput += `${errorCount} error(s) and ${warningCount} warning(s)\n`;
                        // Print each error and warning in detail
                        for (const err of semanticAnalyzer.errors) {
                            compileOutput += `ERROR: ${err}\n`;
                        }
                        for (const warn of semanticAnalyzer.warnings) {
                            compileOutput += `WARNING: ${warn}\n`;
                        }
                        function formatHexLines(data, perLine) {
                            const lines = [];
                            for (let i = 0; i < data.length; i += perLine) {
                                lines.push(data.slice(i, i + perLine)
                                    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                                    .join(" "));
                            }
                            return lines;
                        }
                        if (errorCount === 0) {
                            compileOutput += "\n" + semanticAnalyzer.symbolTable.display(programNumber);
                        }
                        else {
                            compileOutput += `\nProgram ${programNumber} Symbol Table not produced due to error(s) detected by semantic analysis\n`;
                        }
                        // ── generate 6502a code ──
                        if (lexResult.errors === 0 && !result.error && semanticAnalyzer.errors.length === 0) { // doesn't show op codes if errors are present
                            const cg = new CodeGenerator();
                            const bytes = cg.generateBytes(astRoot);
                            // helper to format 8 per line, e.g. "A9 00 8D 2D 00  A9 01 8D"
                            compileOutput += "\nGenerated 6502a Machine Code:\n"
                                + formatHexLines(bytes, 8).join("\n")
                                + "\n";
                        }
                    }
                    else {
                        compileOutput += `\nAST for program ${programNumber}: AST generation returned no nodes.\n`;
                    }
                }
            }
        }
        else {
            compileOutput += `PARSER: Skipped due to LEXER error(s)\n`;
            compileOutput += `CST for program ${programNumber}: Skipped due to LEXER error(s).\n`;
        }
        finalOutput += compileOutput + "\n";
        programNumber++;
    }
    compileCode(finalOutput);
}
// ----------------------- Parser and CST Classes ----------------------- //
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.output = "";
        this.tokens = tokens;
        this.cst = new CST();
    }
    // Peek at the current token.
    peekToken() {
        return this.current < this.tokens.length ? this.tokens[this.current] : null;
    }
    // Begin parsing.
    parse() {
        try {
            this.output += "PARSER: parse() called\n";
            this.parseProgram();
            return { output: this.output, tree: this.cst, error: null };
        }
        catch (error) {
            if (error instanceof Error) {
                this.output += `\nPARSER: Parse failed with 1 error\n`;
                return { output: this.output, tree: null, error: error.message };
            }
            else {
                this.output += `\nPARSER: Parse failed with 1 error\n`;
                return { output: this.output, tree: null, error: "An unknown error occurred" };
            }
        }
    }
    // Program ::= Block EOP
    parseProgram() {
        this.output += "PARSER: parseProgram()\n";
        this.cst.addNode("branch", "Program");
        this.parseBlock();
        this.match("EOP");
        this.cst.moveUp();
    }
    // Block ::= { StatementList }
    parseBlock() {
        this.output += "PARSER: parseBlock()\n";
        this.cst.addNode("branch", "Block");
        this.match("LBRACE");
        // Create the Statement List node once.
        this.cst.addNode("branch", "Statement List");
        this.parseStatementList();
        this.cst.moveUp(); // finish Statement List
        this.match("RBRACE");
        this.cst.moveUp();
    }
    // StatementList ::= Statement StatementList | ε
    parseStatementList() {
        this.output += "PARSER: parseStatementList()\n";
        const token = this.peekToken();
        if (token && (token.type !== "RBRACE" && token.type !== "EOP")) {
            this.parseStatement();
            this.parseStatementList();
        }
    }
    // Statement ::= PrintStatement | AssignmentStatement | VarDecl | WhileStatement | IfStatement | Block
    parseStatement() {
        this.output += "PARSER: parseStatement()\n";
        this.cst.addNode("branch", "Statement");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseStatement");
        }
        if (token.type === "PRINT") {
            this.parsePrintStatement();
        }
        else if (token.type === "IFSTATEMENT") {
            this.parseIfStatement();
        }
        else if (token.type === "WHILE") {
            this.parseWhileStatement();
        }
        else if (token.type === "ITYPE") {
            this.parseVarDecl();
        }
        else if (token.type === "ID") {
            this.parseAssignmentStatement();
        }
        else if (token.type === "LBRACE") {
            this.parseBlock();
        }
        else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseStatement`);
        }
        this.cst.moveUp();
    }
    // PrintStatement ::= print ( Expr )
    parsePrintStatement() {
        this.output += "PARSER: parsePrintStatement()\n";
        this.cst.addNode("branch", "PrintStatement");
        this.match("PRINT");
        this.match("LPAREN");
        this.parseExpr();
        this.match("RPAREN");
        this.cst.moveUp();
    }
    // AssignmentStatement ::= Id = Expr
    parseAssignmentStatement() {
        this.output += "PARSER: parseAssignmentStatement()\n";
        this.cst.addNode("branch", "AssignmentStatement");
        this.match("ID");
        this.match("ASSIGN_OP");
        this.parseExpr();
        this.cst.moveUp();
    }
    // VarDecl ::= type Id
    parseVarDecl() {
        this.output += "PARSER: parseVarDecl()\n";
        this.cst.addNode("branch", "VarDecl");
        const typeToken = this.matchReturnToken("ITYPE");
        const idToken = this.matchReturnToken("ID");
        this.cst.moveUp();
    }
    matchReturnToken(expected) {
        const token = this.tokens[this.current];
        if (token && token.type === expected) {
            // create a new CST node and store the entire token in it
            const newNode = new CSTNode(token.lexeme);
            newNode.token = token; // storing token data (line, column, etc.)
            if (this.cst.current) {
                newNode.parent = this.cst.current;
                this.cst.current.children.push(newNode);
            }
            else {
                this.cst.root = newNode;
                this.cst.current = newNode;
            }
            this.current++;
            return token;
        }
        else {
            throw new Error(`PARSER ERROR: Expected ${expected} but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
    }
    // WhileStatement ::= while BooleanExpr Block
    parseWhileStatement() {
        this.output += "PARSER: parseWhileStatement()\n";
        this.cst.addNode("branch", "WhileStatement");
        this.match("WHILE");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }
    // IfStatement ::= if BooleanExpr Block
    parseIfStatement() {
        this.output += "PARSER: parseIfStatement()\n";
        this.cst.addNode("branch", "IfStatement");
        this.match("IFSTATEMENT");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }
    // Expr ::= IntExpr | StringExpr | BooleanExpr | Id | boolval
    parseExpr() {
        this.output += "PARSER: parseExpr()\n";
        this.cst.addNode("branch", "Expr");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseExpr");
        }
        if (token.type === "DIGIT") {
            this.parseIntExpr();
        }
        else if (token.type === "LQUOTE") {
            this.parseStringExpr();
        }
        else if (token.type === "LPAREN") {
            this.parseBooleanExpr();
        }
        else if (token.type === "ID") {
            this.match("ID");
        }
        else if (token.type === "BOOLVALT" || token.type === "BOOLVALF") {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseExpr`);
        }
        this.cst.moveUp();
    }
    // IntExpr ::= digit intop Expr | digit
    parseIntExpr() {
        this.output += "PARSER: parseIntExpr()\n";
        this.cst.addNode("branch", "IntExpr");
        this.match("DIGIT");
        const token = this.peekToken();
        if (token && token.type === "INTOP") {
            this.match("INTOP");
            this.parseExpr();
        }
        this.cst.moveUp();
    }
    // StringExpr ::= " CharList "
    parseStringExpr() {
        this.output += "PARSER: parseStringExpr()\n";
        this.cst.addNode("branch", "StringExpr");
        this.match("LQUOTE");
        this.parseCharList();
        this.match("RQUOTE");
        this.cst.moveUp();
    }
    // BooleanExpr ::= ( Expr boolop Expr ) | boolval
    parseBooleanExpr() {
        this.output += "PARSER: parseBooleanExpr()\n";
        this.cst.addNode("branch", "BooleanExpr");
        const token = this.peekToken();
        if (token && token.type === "LPAREN") {
            this.match("LPAREN");
            this.parseExpr();
            this.parseBoolOp();
            this.parseExpr();
            this.match("RPAREN");
        }
        else if (token && (token.type === "BOOLVALT" || token.type === "BOOLVALF")) {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Expected BooleanExpr but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
        this.cst.moveUp();
    }
    // BoolOp ::= == | !=
    parseBoolOp() {
        this.output += "PARSER: parseBoolOp()\n";
        this.cst.addNode("branch", "BoolOp");
        const token = this.peekToken();
        if (token && (token.type === "BOOL_EQUAL" || token.type === "BOOL_INEQUAL")) {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Expected boolean operator at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
        this.cst.moveUp();
    }
    // CharList ::= CHAR CharList | space CharList | ε
    parseCharList() {
        this.output += "PARSER: parseCharList()\n";
        this.cst.addNode("branch", "CharList");
        const token = this.peekToken();
        if (token && token.type === "CHAR") {
            this.match("CHAR");
            this.parseCharList();
        }
        else {
            this.cst.addNode("leaf", "ε");
        }
        this.cst.moveUp();
    }
    // Utility: consume a token if it matches the expected type.
    match(expected) {
        const token = this.tokens[this.current];
        if (token && token.type === expected) {
            this.cst.addNode("leaf", token.lexeme);
            this.current++;
        }
        else {
            throw new Error(`PARSER ERROR: Expected ${expected} but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
    }
}
// CST Classes
class CSTNode {
    constructor(label) {
        this.label = label;
        this.children = [];
        this.parent = null;
    }
}
class CST {
    constructor() {
        this.root = null;
        this.current = null;
    }
    addNode(kind, label) {
        const newNode = new CSTNode(label);
        if (this.root === null) {
            this.root = newNode;
            this.current = newNode;
        }
        else {
            if (this.current) {
                newNode.parent = this.current;
                this.current.children.push(newNode);
            }
            if (kind === "branch") {
                this.current = newNode;
            }
        }
    }
    moveUp() {
        if (this.current && this.current.parent) {
            this.current = this.current.parent;
        }
    }
    print(node = this.root, depth = 0) {
        if (!node)
            return "";
        // allow ε to be visible, ChatGPT's suggestion
        if (node.label === "Îµ") {
            return "";
        }
        const indent = "-".repeat(depth);
        let displayLabel;
        // if it's a punctuation token, use square brackets
        if (node.label === "{" || node.label === "}" || node.label === "$") {
            displayLabel = `[${node.label}]`;
        }
        else if (node.label === "StatementList") {
            // replace "StatementList" with "Statement List"
            displayLabel = `<Statement List>`;
        }
        else {
            displayLabel = `<${node.label}>`;
        }
        let result = indent + displayLabel + "\n";
        for (const child of node.children) {
            result += this.print(child, depth + 1);
        }
        return result;
    }
}
// ----------------------- AST Classes ----------------------- //
class ASTNode {
    constructor(label, line = 0, column = 0) {
        this.label = label;
        this.children = [];
        this.line = line;
        this.column = column;
    }
    addChild(child) {
        this.children.push(child);
    }
    // recursively prints the AST
    print(indent = 0, parentIsBlock = false) {
        // if this node is a BLOCK and its parent is also BLOCK, then do not increase the indent (or even decrease by one)
        const currentIndent = (parentIsBlock && this.label === "BLOCK")
            ? "-".repeat(indent > 0 ? indent - 1 : 0)
            : "-".repeat(indent);
        let result = "";
        if (this.children.length === 0) {
            // leaf node: show in square brackets
            result += `${currentIndent}[ ${this.label} ]\n`;
        }
        else {
            // branch node: show in angle brackets
            result += `${currentIndent}< ${this.label} >\n`;
            // pass whether the current node is a BLOCK to the children
            const isCurrentBlock = this.label === "BLOCK";
            for (const child of this.children) {
                // increase indent by 1 normally, but if the current node is BLOCK and
                // the child is also BLOCK, then we pass the parent's flag so the child stays at the same level
                result += child.print(indent + 1, isCurrentBlock);
            }
        }
        return result;
    }
}
class SymbolTable {
    constructor() {
        this.table = [new Map()]; // initialize with global scope
        this.currentScope = 0; // start at global scope
        this.errors = [];
        this.allSymbols = [];
    }
    enterScope() {
        this.currentScope++;
        this.table.push(new Map()); // Add a new scope
        console.log(`DEBUG: Entered scope ${this.currentScope}`);
    }
    exitScope() {
        if (this.currentScope > 0) {
            this.table.pop(); // Remove the current scope
            console.log(`DEBUG: Exited scope ${this.currentScope}`);
            this.currentScope--;
        }
    }
    addSymbol(name, type, line, column) {
        const current = this.table[this.table.length - 1];
        if (current.has(name)) {
            this.errors.push(`Redeclaration error: '${name}' already declared in scope ${this.currentScope} at line ${line}, column ${column}.`);
        }
        else {
            const entry = {
                name,
                type,
                scope: this.currentScope,
                line,
                column,
                used: false,
                initialized: false
            };
            current.set(name, entry);
            this.allSymbols.push(entry); // Ensure all symbols are recorded
        }
    }
    lookup(name) {
        for (let i = this.table.length - 1; i >= 0; i--) {
            const entry = this.table[i].get(name);
            if (entry !== undefined)
                return entry;
        }
        return undefined;
    }
    display(programNumber) {
        let output = `Program ${programNumber} Symbol Table\n`;
        output += "---\n";
        output += "Name Type    Scope Line\n";
        output += "---\n";
        // Sort symbols by their line numbers to match expected order
        const sortedSymbols = [...this.allSymbols].sort((a, b) => a.line - b.line);
        for (const symbol of sortedSymbols) {
            // Pad the type with spaces to align columns
            const paddedType = symbol.type.padEnd(7);
            output += `${symbol.name}    ${paddedType}${symbol.scope}    ${symbol.line}\n`;
            console.log(`DEBUG: Symbol '${symbol.name}' of type '${symbol.type}' in scope ${symbol.scope} at line ${symbol.line}`);
        }
        return output;
    }
}
class SemanticAnalyzer {
    constructor() {
        this.symbolTable = new SymbolTable();
        this.errors = [];
        this.warnings = [];
        this.alreadyReported = new Set();
    }
    // entry point: pass the AST root node
    analyze(node) {
        // starts traversal with global scope
        this.traverse(node, true);
        // includes any errors collected during symbol table operations
        this.errors.push(...this.symbolTable.errors);
        for (const entry of this.symbolTable.allSymbols) {
            if (entry.initialized && !entry.used) {
                this.warnings.push(`Variable '${entry.name}' declared at line ${entry.line}, column ${entry.column} but never used.`);
            }
            else if (!entry.initialized) {
                this.warnings.push(`Variable '${entry.name}' declared at line ${entry.line}, column ${entry.column} but never assigned a value.`);
            }
        }
    }
    // recursively traverse the AST to perform checking.
    traverse(node, isGlobal = false) {
        if (!node)
            return;
        console.log(`DEBUG: Visiting node '${node.label}', isGlobal: ${isGlobal}, currentScope: ${this.symbolTable.currentScope}`);
        switch (node.label) {
            case "BLOCK":
                if (!isGlobal) {
                    this.symbolTable.enterScope(); // Enter a new scope for nested blocks
                }
                for (const child of node.children) {
                    this.traverse(child, false); // Pass false for nested blocks
                }
                if (!isGlobal) {
                    this.symbolTable.exitScope(); // Exit the scope for nested blocks
                }
                break;
            case "Variable Declaration":
                this.handleVarDecl(node);
                break;
            case "Assignment Statement":
                this.handleAssignment(node);
                break;
            case "Print Statement":
                if (node.children.length > 0) {
                    this.evaluateExpression(node.children[0]);
                }
                break;
            default:
                for (const child of node.children) {
                    this.traverse(child, false); // Pass false for other nodes
                }
                break;
        }
    }
    handleVarDecl(node) {
        if (node.children.length >= 2) {
            const typeNode = node.children[0];
            const idNode = node.children[1];
            const type = typeNode.label === "boolean" ? "bool" : typeNode.label;
            const name = idNode.label;
            // Line/column from the ID node
            const line = idNode.line;
            const column = idNode.column;
            this.symbolTable.addSymbol(name, type, line, column);
            console.log(`DEBUG: Added variable '${name}' of type '${type}' at line ${line}, scope ${this.symbolTable.currentScope}`);
        }
    }
    handleAssignment(node) {
        // expected format: first child is the identifier, second child is the expression
        if (node.children.length >= 2) {
            const idNode = node.children[0];
            const exprNode = node.children[1];
            const entry = this.symbolTable.lookup(idNode.label);
            if (!entry) {
                //
            }
            else {
                entry.initialized = true;
                if (!entry) {
                    this.errors.push(`Semantic Error: Variable '${idNode.label}' used before declaration at line ${idNode.line}, column ${idNode.column}.`);
                    return;
                }
                entry.initialized = true;
                const exprType = this.evaluateExpression(exprNode);
                if (exprType && exprType !== entry.type) {
                    this.errors.push(`Semantic Error: Type mismatch in assignment to '${idNode.label}', found ${exprType}.`);
                }
            }
        }
    }
    handleWhile(node) {
        // while: first child is the boolean condition, second child is the block
        if (node.children.length >= 2) {
            const condition = node.children[0];
            const block = node.children[1];
            const condType = this.evaluateExpression(condition);
            if (condType !== "boolean") {
                this.errors.push(`Semantic Error: While condition must be boolean, found ${condType} at line ${node.line}, column ${node.column}.`);
            }
            this.traverse(block);
        }
    }
    handleIf(node) {
        // if: first child is the boolean condition, second child is the block
        if (node.children.length >= 2) {
            const condition = node.children[0];
            const block = node.children[1];
            const condType = this.evaluateExpression(condition);
            if (condType !== "boolean") {
                this.errors.push(`Semantic Error: If condition must be boolean, found ${condType}.`);
            }
            this.traverse(block);
        }
    }
    // evaluate expressions to infer their types
    evaluateExpression(node) {
        if (!node)
            return null;
        if (node.label === "IntExpr") {
            const types = node.children
                .map(c => this.evaluateExpression(c))
                .filter((t) => !!t);
            if (types.length > 1 && types[1] !== "int") {
                this.errors.push(`Semantic Error: Cannot apply '+' between 'int' and '${types[1]}'.`);
            }
            return "int";
        }
        // catch mixing non-bool in a boolean expression
        if (node.label === "BooleanExpr") {
            const types = node.children
                .map(c => this.evaluateExpression(c))
                .filter((t) => !!t);
            if (types.length > 1 && types[0] !== types[1]) {
                this.errors.push(`Semantic Error: Cannot apply boolean operator between '${types[0]}' and '${types[1]}'.`);
            }
            return "bool";
        }
        if (node.children.length === 0) {
            if (/^[0-9]+$/.test(node.label))
                return "int";
            if (node.label === "true" || node.label === "false")
                return "bool";
            if (/^[a-z]$/.test(node.label)) {
                const entry = this.symbolTable.lookup(node.label);
                if (entry) {
                    entry.used = true;
                    return entry.type;
                }
                else {
                    const key = `${node.label}@${node.line}`;
                    if (!this.alreadyReported.has(key)) {
                        this.errors.push(`Semantic Error: Variable '${node.label}' used before declaration.`);
                        this.alreadyReported.add(key);
                    }
                    return null;
                }
            }
            return "string";
        }
        if (node.label === "IntExpr")
            return "int";
        if (node.label === "BooleanExpr")
            return "bool";
        // tries to infer from children
        for (const child of node.children) {
            const type = this.evaluateExpression(child);
            if (type)
                return type;
        }
        // if nothing matched, return null and preserve line info
        return null;
    }
}
function gatherString(cstNode) {
    let result = "";
    // if we see a child that is a single character or space, we add it to 'result'
    // if we see 'CharList' or more nested nodes, we recurse
    for (const child of cstNode.children) {
        // skips LQUOTE, RQUOTE if present
        if (child.label === "\"" || child.label === "LQUOTE" || child.label === "RQUOTE") {
            continue;
        }
        // if it's a single lowercase character or space, append it
        if (child.label.length === 1 && /[a-z ]/.test(child.label)) {
            result += child.label;
        }
        // if it's a deeper node (like "CharList" or "StringExpr"), recurse
        else {
            result += gatherString(child);
        }
    }
    return result;
}
// ----------------------- CST to AST Conversion ----------------------- //
function buildASTFromCST(cstNode) {
    if (!cstNode || cstNode.label === "ε" || cstNode.label === "Îµ") {
        return null;
    }
    // if this is a leaf node with token info, use that:
    if (cstNode.token) {
        return new ASTNode(cstNode.token.lexeme, cstNode.token.line, cstNode.token.column);
    }
    // special handling for the Program node: ignore the EOP token ("$")
    if (cstNode.label === "Program") {
        // filter out any EOP token
        const meaningfulChildren = cstNode.children.filter(child => child.label !== "$");
        if (meaningfulChildren.length === 1) {
            // directly return the AST conversion of the single meaningful child
            return buildASTFromCST(meaningfulChildren[0]);
        }
    }
    if (cstNode.label === "StringExpr") {
        // collect all characters from the CST subtree
        const fullString = gatherString(cstNode);
        // return a single leaf node with that entire string
        return new ASTNode(fullString);
    }
    const skipLabels = new Set(["Statement List", "{", "}", "(", ")", "$"]);
    if (skipLabels.has(cstNode.label)) {
        let aggregated = null;
        for (const child of cstNode.children) {
            const childAST = buildASTFromCST(child);
            if (childAST) {
                if (!aggregated) {
                    aggregated = childAST;
                }
                else {
                    aggregated.addChild(childAST);
                }
            }
        }
        return aggregated;
    }
    // special transformation for Variable Declarations
    if (cstNode.label === "VarDecl") {
        const astNode = new ASTNode("Variable Declaration");
        let typeAST = null;
        let idAST = null;
        for (const child of cstNode.children) {
            // looks for type tokens
            if (!typeAST && (child.label === "int" || child.label === "string" || child.label === "boolean")) {
                if (child.token) {
                    typeAST = new ASTNode(child.label, child.token.line, child.token.column);
                }
                else {
                    typeAST = new ASTNode(child.label);
                }
            }
            // looks for the identifier token 
            if (!idAST && child.label !== "int" && child.label !== "string" && child.label !== "boolean") {
                if (child.token) {
                    idAST = new ASTNode(child.label, child.token.line, child.token.column);
                }
                else {
                    idAST = new ASTNode(child.label);
                }
            }
        }
        if (typeAST)
            astNode.addChild(typeAST);
        if (idAST)
            astNode.addChild(idAST);
        return astNode;
    }
    // special transformation for Assignment Statements
    if (cstNode.label === "AssignmentStatement") {
        const astNode = new ASTNode("Assignment Statement");
        let idAST = null;
        let exprAST = null;
        for (const child of cstNode.children) {
            // skip the assignment operator token
            if (child.label === "=")
                continue;
            if (!idAST) {
                if (child.token) {
                    idAST = new ASTNode(child.label, child.token.line, child.token.column);
                }
                else {
                    idAST = new ASTNode(child.label);
                }
            }
            else if (!exprAST) {
                let tempAST = buildASTFromCST(child);
                // flatten out any extra layer if it's an expression wrapper
                while (tempAST &&
                    (tempAST.label === "Expr" || tempAST.label === "IntExpr" || tempAST.label === "StringExpr") &&
                    tempAST.children.length === 1) {
                    tempAST = tempAST.children[0];
                }
                exprAST = tempAST;
            }
        }
        if (idAST)
            astNode.addChild(idAST);
        if (exprAST)
            astNode.addChild(exprAST);
        return astNode;
    }
    // special transformation for Print Statements
    if (cstNode.label === "PrintStatement") {
        const astNode = new ASTNode("Print Statement");
        // filter out the print keyword and parentheses
        for (const child of cstNode.children) {
            if (child.label === "print" || child.label === "(" || child.label === ")") {
                continue;
            }
            let childAST = buildASTFromCST(child);
            while (childAST &&
                (childAST.label === "Expr" || childAST.label === "IntExpr" || childAST.label === "StringExpr") &&
                childAST.children.length === 1) {
                childAST = childAST.children[0];
            }
            if (childAST) {
                astNode.addChild(childAST);
            }
        }
        return astNode;
    }
    if (cstNode.label === "Block") {
        const astNode = new ASTNode("BLOCK");
        for (const child of cstNode.children) {
            const childAST = buildASTFromCST(child);
            if (childAST) {
                astNode.addChild(childAST);
            }
        }
        return astNode;
    }
    // mapping for other nodes
    const labelMap = {
        "Program": "BLOCK",
        "Block": "BLOCK",
        "WhileStatement": "While Statement",
        "IfStatement": "If Statement",
    };
    const newLabel = labelMap[cstNode.label] || cstNode.label;
    let line = 0;
    let column = 0;
    // Try to get line/column info from first token-bearing child
    for (const child of cstNode.children) {
        if (child.token) {
            line = child.token.line;
            column = child.token.column;
            break;
        }
    }
    const astNode = new ASTNode(newLabel, line, column);
    // recursively add transformed children
    for (const child of cstNode.children) {
        const childAST = buildASTFromCST(child);
        if (childAST) {
            astNode.addChild(childAST);
        }
    }
    return astNode;
}
// ChatGPT used here
// ----------------------- Code Generator ----------------------- //
class CodeGenerator {
    constructor() {
        this.code = [];
        this.varAddrs = new Map();
        this.strLits = new Map();
        this.nextDataAddr = 0x0010;
        this.tempAddr = 0x00F0;
        this.labelCount = 0;
    }
    // emit one byte
    emitByte(b) {
        this.code.push(b & 0xFF);
    }
    // emit a 16‑bit word, little‑endian
    emitWord(w) {
        this.emitByte(w & 0xFF);
        this.emitByte((w >> 8) & 0xFF);
    }
    generateBytes(ast) {
        this.code.length = 0;
        // --- text section ---
        this.walk(ast);
        // BRK
        this.emitByte(0x00);
        // --- reserve vars (one byte each) ---
        for (const _ of this.varAddrs)
            this.emitByte(0x00);
        // --- string literals (ascii …,0) ---
        for (const [str] of this.strLits) {
            for (const c of str)
                this.emitByte(c.charCodeAt(0));
            this.emitByte(0x00);
        }
        return this.code;
    }
    walk(node) {
        switch (node.label) {
            case 'BLOCK':
                node.children.forEach(c => this.walk(c));
                break;
            case 'Variable Declaration':
                this.allocVar(node.children[1].label);
                break;
            case 'Assignment Statement':
                this.emitAssign(node);
                break;
            case 'Print Statement':
                this.emitPrint(node);
                break;
            case 'If Statement':
                this.emitIf(node);
                break;
            case 'While Statement':
                this.emitWhile(node);
                break;
            default:
                node.children.forEach(c => this.walk(c));
        }
    }
    allocVar(name) {
        if (!this.varAddrs.has(name)) {
            this.varAddrs.set(name, `$${this.nextDataAddr.toString(16).padStart(4, '0')}`);
            this.nextDataAddr++;
        }
        return this.varAddrs.get(name);
    }
    allocString(str) {
        if (!this.strLits.has(str)) {
            const lbl = `STR${this.labelCount++}`;
            this.strLits.set(str, lbl);
            this.nextDataAddr += str.length + 1;
        }
        return this.strLits.get(str);
    }
    emitAssign(n) {
        const id = n.children[0].label;
        const varAddr = parseInt(this.allocVar(id).slice(1), 16);
        const rhs = n.children[1].label;
        // ---- strings ----
        if (typeof rhs === "string" && rhs.length > 1 && isNaN(+rhs)) {
            // allocate the literal into data segment and get its heap address
            const strAddr = parseInt(this.allocString(rhs).slice(3), 10);
            // LDX #<addr>
            this.emitByte(0xA2);
            this.emitByte(strAddr & 0xFF);
            // STX <varAddr>  (store pointer into zero‑page)
            this.emitByte(0x8E);
            this.emitWord(varAddr);
            return;
        }
        // ---- numbers or expressions ----
        this.genExpr(n.children[1]);
        this.emitByte(0x8D);
        this.emitWord(varAddr);
    }
    emitPrint(n) {
        const varName = n.children[0].label;
        const zpAddr = parseInt(this.allocVar(varName).slice(1), 16);
        // LDY zpAddr
        this.emitByte(0xA0);
        this.emitByte(zpAddr & 0xFF);
        // LDX #$02   (print‐string syscall)
        this.emitByte(0xA2);
        this.emitByte(0x02);
        // FF         
        this.emitByte(0xFF);
    }
    emitIf(n) {
        const elseL = this.labelCount++;
        const endL = this.labelCount++;
        this.genExpr(n.children[0]);
        this.emitByte(0xC0);
        this.emitByte(0x01);
        this.emitByte(0xD0);
        this.emitByte(0x00);
        this.walk(n.children[1]);
        this.emitByte(0x4C);
        this.emitWord(0x0000);
    }
    emitWhile(n) {
        // remember where the top of the loop lives
        const loopStartAddr = this.code.length;
        // generate the condition (leaves result in Y)
        this.genExpr(n.children[0]);
        // CPY #$01
        this.emitByte(0xC0);
        this.emitByte(0x01);
        // BNE exitLoop
        this.emitByte(0xD0);
        // placeholder for offset
        const bneOffsetIdx = this.code.length;
        this.emitByte(0x00);
        // emit the body
        this.walk(n.children[1]);
        // JMP loopStart
        this.emitByte(0x4C);
        this.emitWord(loopStartAddr);
        // now patch that BNE so it skips over the body
        const exitAddr = this.code.length;
        // offset is from after the branch’s operand
        const offset = exitAddr - (bneOffsetIdx + 1);
        this.code[bneOffsetIdx] = offset & 0xFF;
    }
    genExpr(n) {
        if (/^[0-9]+$/.test(n.label)) {
            const v = parseInt(n.label, 10);
            this.emitByte(0xA9);
            this.emitByte(v & 0xFF);
            return;
        }
        // addition
        if (n.label === 'IntExpr') {
            const tmp = this.tempAddr++;
            this.genExpr(n.children[0]);
            this.emitByte(0x8D);
            this.emitWord(tmp);
            this.genExpr(n.children[1]);
            this.emitByte(0x6D);
            this.emitWord(tmp);
            return;
        }
        // variable load
        if (/^[a-z]$/.test(n.label)) {
            const addr = parseInt(this.allocVar(n.label).slice(1), 16);
            this.emitByte(0xAD);
            this.emitWord(addr);
        }
    }
}
// ----------------------- DOM Event Listener ----------------------- //
document.addEventListener("DOMContentLoaded", () => {
    const compileBtn = document.getElementById("compile-btn");
    if (!compileBtn) {
        console.error("Compile button not found! Check that the id is 'compile-btn' in your HTML.");
        return;
    }
    compileBtn.addEventListener("click", () => {
        try {
            processPrograms();
        }
        catch (err) {
            console.error("Compilation error:", err);
            compileCode("Compilation error: " + err);
        }
    });
});
//# sourceMappingURL=compiler.js.map