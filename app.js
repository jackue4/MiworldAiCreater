const form = document.querySelector("#promptForm");
const input = document.querySelector("#promptInput");
const promptLog = document.querySelector("#promptLog");
const fullLog = document.querySelector("#fullLog");
const logButton = document.querySelector("#logButton");
const logDrawer = document.querySelector("#logDrawer");
const logClose = document.querySelector("#logClose");
const sendButton = form.querySelector(".send-button");
const gameVideo = document.querySelector(".game-video");

const introMessage = "输入你的世界生成需求并发送，我会理解关键词、规划地形与建筑，然后立即开始播放生成过程。";

const aiGenerationSteps = [
  "收到。我正在拆解你的需求：建筑风格、地形规模、附近生成范围、核心视觉元素和危险氛围。",
  "我会先规划主体结构，再补充山体、道路、岩浆流向和地形高低差，让生成结果更像一个完整场景。",
  "我正在同步生成脚本逻辑，把你的自然语言需求转换成可执行的 UGC 组件代码。",
  "方案已确认。现在开始执行生成，并把重点放在宏伟感、空间层次和玩家第一眼看到的冲击力。"
];

const generatedLuaCode = `-- 官方定义的函数，不能修改变动
local Script = {}

-- 组件启动时调用
function Script:OnStart()
    -- 添加玩家点击事件监听
    self:AddTriggerEvent(TriggerEvent.PlayerClickBlock, self.Player_Click)
    --TriggerEvent.PlayerClickBlock是官方提供的事件监听，可以在wiki中查看更多的事件
    --self.Player_Click 是自定义的一个函数名，可以改成其他你喜欢的
end

-- 定义事件触发时的动作
function Script:Player_Click(event)
    -- 玩家点击方块时，判断点的是否是草块
    if event.blockid == 100 then
        local success = Block:ReplaceBlock(452, event.x, event.y, event.z)
        -- Block:ReplaceBlock是官方提供的放置方块方法，可以在wiki中查看更多的方法
        -- local success 用来接收Block:ReplaceBlock运行后的结果，可以用来做是否成功放置的判断
    end
end

-- 官方定义的函数，不能修改变动
return Script`;

let replyTimers = [];
let typewriterTimer = null;
let hasStartedVideo = false;
let isGenerating = false;
const conversation = [{ text: introMessage, type: "ai", kind: "message" }];

function autosizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 92)}px`;
  sendButton.disabled = input.value.trim().length === 0;
}

function createMessage(text, type, modifier = "") {
  const message = document.createElement("div");
  message.className = type === "user" ? "user-message" : `ai-message ai-message--assistant ${modifier}`.trim();

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = type === "user" ? "你" : "AI";

  const content = document.createElement("p");
  content.textContent = text;

  message.append(avatar, content);
  return message;
}

function createLogMessage(entry) {
  const item = document.createElement("article");
  item.className = `log-entry log-entry--${entry.type}${entry.kind === "code" ? " log-entry--code" : ""}`;

  const speaker = document.createElement("span");
  speaker.className = "log-entry__speaker";
  speaker.textContent = entry.kind === "code" ? "AI 生成脚本" : entry.type === "user" ? "你" : "AI";

  if (entry.kind === "code") {
    const codeShell = document.createElement("div");
    codeShell.className = "code-shell";

    const header = document.createElement("div");
    header.className = "code-shell__header";
    header.innerHTML = "<span></span><span></span><span></span><strong>Lua</strong>";

    const pre = document.createElement("pre");
    pre.className = "code-typewriter";

    const code = document.createElement("code");
    code.textContent = entry.visibleText ?? entry.text;

    pre.append(code);
    codeShell.append(header, pre);
    item.append(speaker, codeShell);
    return item;
  }

  const content = document.createElement("p");
  content.textContent = entry.text;

  item.append(speaker, content);
  return item;
}

function renderConversation() {
  promptLog.replaceChildren();
  fullLog.replaceChildren();

  const visibleMessages = isGenerating ? conversation.filter((entry) => entry.kind !== "code").slice(-1) : conversation.filter((entry) => entry.kind !== "code").slice(-3);
  visibleMessages.forEach(({ text, type }, index) => {
    const isLatestMessage = index === visibleMessages.length - 1;
    const isFinalAi = type === "ai" && isLatestMessage && conversation.length > 1;
    promptLog.append(createMessage(text, type, isFinalAi ? "ai-message--final" : ""));
  });

  conversation.forEach((entry) => {
    fullLog.append(createLogMessage(entry));
  });

  fullLog.scrollTop = fullLog.scrollHeight;
}

function addConversationMessage(text, type, kind = "message") {
  conversation.push({ text, type, kind });
  renderConversation();
}

function clearPendingReplies() {
  replyTimers.forEach((timer) => window.clearTimeout(timer));
  replyTimers = [];

  if (typewriterTimer) {
    window.clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
}

function playVideoFromPrompt() {
  if (!gameVideo) return;

  gameVideo.controls = false;

  if (!hasStartedVideo) {
    gameVideo.currentTime = 0;
    hasStartedVideo = true;
  }

  gameVideo.play().catch(() => {
    gameVideo.controls = true;
  });
}

function startCodeTypewriter() {
  const codeEntry = {
    text: generatedLuaCode,
    visibleText: "",
    type: "ai",
    kind: "code"
  };
  conversation.push(codeEntry);
  renderConversation();

  let index = 0;
  typewriterTimer = window.setInterval(() => {
    index += 3;
    codeEntry.visibleText = generatedLuaCode.slice(0, index);
    renderConversation();

    if (index >= generatedLuaCode.length) {
      window.clearInterval(typewriterTimer);
      typewriterTimer = null;
      codeEntry.visibleText = generatedLuaCode;
      renderConversation();
    }
  }, 22);
}

function pushAiGenerationFlow() {
  clearPendingReplies();

  aiGenerationSteps.forEach((reply, index) => {
    const timer = window.setTimeout(() => {
      addConversationMessage(reply, "ai");
    }, 360 + index * 1250);

    replyTimers.push(timer);
  });

  const codeTimer = window.setTimeout(() => {
    startCodeTypewriter();
    setLogOpen(true);
  }, 360 + aiGenerationSteps.length * 1250);

  replyTimers.push(codeTimer);
}

function pushPrompt(text) {
  isGenerating = true;
  addConversationMessage(text, "user");
  playVideoFromPrompt();
  pushAiGenerationFlow();
}

function setLogOpen(isOpen) {
  logDrawer.classList.toggle("is-open", isOpen);
  logDrawer.setAttribute("aria-hidden", String(!isOpen));
  logButton.setAttribute("aria-expanded", String(isOpen));
}

input.addEventListener("input", autosizeInput);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  pushPrompt(text);
  input.value = "";
  autosizeInput();
});

logButton.addEventListener("click", () => {
  setLogOpen(!logDrawer.classList.contains("is-open"));
});

logClose.addEventListener("click", () => {
  setLogOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setLogOpen(false);
  }
});

renderConversation();
autosizeInput();
