(_ => {

    const geval = eval;

    const $ = (selector: string): HTMLElement => document.querySelector(selector);
    const el = (tagName: string): HTMLElement => document.createElement(tagName);

    const commandHistory = [];
    let commandHistoryIdx = 0;
    let commandChache = "";
    let tabPushed = false;
    let currentInput: HTMLInputElement;
    const commandAwaitFlg = Symbol();

    const name = "[a-z|A-Z|_|$][a-z|A-Z|0-9|_|$]*"
    const variable = "^" + name + "$";
    const object = "^" + name + "(\\." + name + ")*$";
    const variableExp = new RegExp(variable);
    const objectExp = new RegExp(object);

    const processingLine = (e: KeyboardEvent): void => {

        const { key } = e;
        // console.log(key);
        if (key !== "Tab") {
            tabPushed = false;
        } else {
            e.preventDefault();
        }
        switch (key) {
            case "Enter":
            {
                const rawCommand = (e.target as HTMLInputElement).value;
                if (rawCommand.length) {
                    let command = rawCommand;
                    if (commandChache) command = commandChache + command;
                    let result;
                    try {
                        result = geval(command);
                    } catch (e) {
                        if (command.endsWith(";") || e.name !== "SyntaxError") {
                            result = e;
                        } else {
                            result = commandAwaitFlg;
                            commandChache += rawCommand + " ";
                        }
                    } finally {
                        // console.log(result);
                        if (result !== commandAwaitFlg) {
                            const resultLine = el("div") as HTMLDivElement;
                            const resultType = typeof result;
                            setOutputValue(resultLine, resultType, result);
                            if (typeof result === "object" && result !== null) {
                                if (result instanceof Error) {
                                    resultLine.textContent = result.toString();
                                } else {
                                    appendObjectData(resultLine, result, 0);
                                }
                            }
                            $(".term").appendChild(resultLine);
                            commandChache = "";
                            if (command.includes("const") || command.includes("let")) {
                                const script = el("script");
                                script.innerHTML = command;
                                document.body.appendChild(script).remove();
                            }
                        } else {
                            // console.log(commandChache, result);
                        }
                        commandHistory.push(rawCommand);
                        commandHistoryIdx = commandHistory.length;
                    }
                }
                displayPrompt();
                break;
            }
            case "ArrowUp":
            {
                currentInput.value = commandHistory[--commandHistoryIdx] || "";
                if (commandHistoryIdx < 0) commandHistoryIdx = -1;
                break;
            }
            case "ArrowDown":
            {
                currentInput.value = commandHistory[++commandHistoryIdx] || "";
                if (commandHistoryIdx >= commandHistory.length) commandHistoryIdx = commandHistory.length;
                break;
            }
            case "Tab": {
                if (!tabPushed) {
                    tabPushed = true;
                } else {
                    const command = currentInput.value;
                    
                }
                break;
            }
        }

    };

    const appendObjectData = (elm: HTMLDivElement, obj: any, cnt: number): void => {

        const bracketHead = el("div");
        bracketHead.innerHTML = "&nbsp;".repeat(cnt * 2) + "{";
        elm.appendChild(bracketHead);
        if (cnt < 3) {
            for (const key in obj) {
                const val = obj[key];
                const type = typeof val;
                const line = el("div");
                const keyElm = el("span");
                keyElm.innerHTML = "&nbsp;".repeat((cnt + 1) * 2) + key + ": &nbsp;";
                line.appendChild(keyElm);
                if (type !== "object" || val === null) {
                    const valElm = el("span");
                    setOutputValue(valElm, type, val);
                    line.appendChild(valElm);
                    elm.appendChild(line);
                } else {
                    elm.appendChild(line);
                    appendObjectData(elm, val, cnt + 1);
                }
            }
        } else {
            const line = el("div");
            line.innerHTML = "&nbsp;".repeat((cnt + 1) * 2) + "[Object: object]";
            elm.appendChild(line);
        }
        const bracketFoot = el("div");
        bracketFoot.innerHTML = "&nbsp;".repeat(cnt * 2) + "}";
        elm.appendChild(bracketFoot);

    };

    const setOutputValue = (elm: HTMLElement, type: string, val: any): void => {

        switch (type) {
            case "number":
            case "boolean":
            {
                elm.textContent = val;
                elm.className = "number";
                break;
            }
            case "string":
            {
                elm.textContent = "'" + val + "'";
                elm.className = "string";
                break;
            }
            case "undefined":
            {
                elm.textContent = "undefined";
                elm.className = "undefined";
                break;
            }
            case "symbol":
            {
                elm.textContent = val.toString();
                elm.className = "string";
                break;
            }
            case "function":
            {
                elm.textContent = "[Function: " + val.name + "]";
                elm.className = "function";
                break;
            }
            case "object":
            {
                if (val === null) {
                    elm.textContent = "null";
                    elm.className = "null";
                }
                break;
            }
        }

    }

    const displayPrompt = (): void => {

        const promptLine = el("div") as HTMLDivElement;
        promptLine.className = "promptLine";
        const prompt = el("span") as HTMLSpanElement;
        prompt.innerHTML = !commandChache ? ">&nbsp;" : "...&nbsp;";
        promptLine.appendChild(prompt);
        const input = el("input") as HTMLInputElement;
        input.type = "text";
        input.className = "commandInput";
        promptLine.appendChild(input);
        input.addEventListener("keydown", processingLine);
        $(".term").appendChild(promptLine);
        currentInput = input;
        input.focus();

    }

    $("html").addEventListener("click", (e: MouseEvent): void => {

        currentInput.focus();

    });

    displayPrompt();

})();
