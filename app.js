const form = document.querySelector("#promptForm");
const input = document.querySelector("#promptInput");
const promptLog = document.querySelector("#promptLog");
const fullLog = document.querySelector("#fullLog");
const logButton = document.querySelector("#logButton");
const logDrawer = document.querySelector("#logDrawer");
const logClose = document.querySelector("#logClose");
const sendButton = form.querySelector(".send-button");
const gameVideo = document.querySelector(".game-video");
const generationStatus = document.querySelector("#generationStatus");
const generationProgress = document.querySelector("#generationProgress");
const conversationScroll = document.querySelector("#conversationScroll");
const modeButtons = document.querySelectorAll(".mode-button");
const modeStatus = document.querySelector("#modeStatus");

const introMessage = "Enter your world-generation request and send it. I will plan the task, drive the live preview, and show what the Agent is doing in real time.";

const modeLabels = {
  code: "Code Mode",
  scene: "Scene Creation",
  ui: "UI Editing",
  model: "Model Generation"
};

const modeIntro = {
  code: "Code Mode activated. I will focus on scripts, APIs, events, and executable logic.",
  scene: "Scene Creation mode activated. I will focus on terrain, props, lighting, and spatial composition.",
  ui: "UI Editing mode activated. I will focus on panels, controls, interaction states, and screen layout.",
  model: "Model Generation mode activated. I will focus on assets, object style, scale, and generation passes."
};

const aiGenerationSteps = [
  "Request received. I am breaking it down into style, terrain scale, interaction requirements, and preview actions.",
  "I am updating the live viewport so you can preview what the Agent is creating on the left side.",
  "I am now generating the script logic, converting your natural-language request into executable UGC component code.",
  "Generation plan confirmed. I am executing it now and keeping the latest status visible while the full process is saved in Log."
];

const statusSteps = [
  { text: "Waiting for your prompt", progress: "0%" },
  { text: "Planning scene structure", progress: "42%" },
  { text: "Generating logic and assets", progress: "68%" },
  { text: "Preview ready", progress: "100%" }
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
let isGenerating = false;
const conversation = [{ text: introMessage, type: "ai", kind: "message" }];

function autosizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 86)}px`;
  sendButton.disabled = input.value.trim().length === 0;
}

function createMessage(text, type, modifier = "") {
  const message = document.createElement("div");
  message.className = type === "user" ? "user-message" : `ai-message ai-message--assistant ${modifier}`.trim();

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = type === "user" ? "You" : "AI";

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
  speaker.textContent = entry.kind === "code" ? "AI Generated Script" : entry.type === "user" ? "You" : "AI";

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

  const visibleMessages = isGenerating
    ? conversation.filter((entry) => entry.kind !== "code").slice(-2)
    : conversation.filter((entry) => entry.kind !== "code").slice(-3);

  visibleMessages.forEach(({ text, type }, index) => {
    const isLatestMessage = index === visibleMessages.length - 1;
    const isFinalAi = type === "ai" && isLatestMessage && conversation.length > 1;
    promptLog.append(createMessage(text, type, isFinalAi ? "ai-message--final" : ""));
  });

  conversation.forEach((entry) => {
    fullLog.append(createLogMessage(entry));
  });

  fullLog.scrollTop = fullLog.scrollHeight;
  conversationScroll.scrollTop = conversationScroll.scrollHeight;
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

function updatePreviewStatus(stepIndex) {
  const step = statusSteps[Math.min(stepIndex, statusSteps.length - 1)];
  generationStatus.textContent = step.text;
  generationProgress.style.width = step.progress;
}

function showFirstVideoFrame() {
  if (!gameVideo) return;

  gameVideo.controls = false;
  gameVideo.pause();

  const seekToStart = () => {
    gameVideo.currentTime = 0;
  };

  if (gameVideo.readyState >= 1) {
    seekToStart();
    return;
  }

  gameVideo.addEventListener("loadedmetadata", seekToStart, { once: true });
}

function playVideoFromPrompt() {
  if (!gameVideo) return;

  gameVideo.controls = false;
  gameVideo.pause();
  gameVideo.currentTime = 0;

  gameVideo.play().catch(() => {
    generationStatus.textContent = "Tap the preview once to allow playback, then send your prompt again.";
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
  generationStatus.textContent = "Analyzing prompt";
  generationProgress.style.width = "18%";

  aiGenerationSteps.forEach((reply, index) => {
    const timer = window.setTimeout(() => {
      updatePreviewStatus(index + 1);
      addConversationMessage(reply, "ai");
    }, 360 + index * 1250);

    replyTimers.push(timer);
  });

  const codeTimer = window.setTimeout(() => {
    updatePreviewStatus(statusSteps.length - 1);
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

function setMode(mode) {
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });

  modeStatus.textContent = modeLabels[mode];
  addConversationMessage(modeIntro[mode], "ai");
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

gameVideo.addEventListener("ended", () => {
  gameVideo.pause();
  generationStatus.textContent = "Preview paused. Send another prompt to replay.";
});

gameVideo.addEventListener("loadeddata", showFirstVideoFrame, { once: true });

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
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
updatePreviewStatus(0);
showFirstVideoFrame();
