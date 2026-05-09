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
  "方案已确认。现在开始执行生成，并把重点放在宏伟感、空间层次和玩家第一眼看到的冲击力。"
];

let replyTimers = [];
let hasStartedVideo = false;
let isGenerating = false;
const conversation = [{ text: introMessage, type: "ai" }];

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

function createLogMessage(text, type) {
  const item = document.createElement("article");
  item.className = `log-entry log-entry--${type}`;

  const speaker = document.createElement("span");
  speaker.className = "log-entry__speaker";
  speaker.textContent = type === "user" ? "你" : "AI";

  const content = document.createElement("p");
  content.textContent = text;

  item.append(speaker, content);
  return item;
}

function renderConversation() {
  promptLog.replaceChildren();
  fullLog.replaceChildren();

  const visibleMessages = isGenerating ? conversation.slice(-1) : conversation.slice(-3);
  visibleMessages.forEach(({ text, type }, index) => {
    const isLatestMessage = index === visibleMessages.length - 1;
    const isFinalAi = type === "ai" && isLatestMessage && conversation.length > 1;
    promptLog.append(createMessage(text, type, isFinalAi ? "ai-message--final" : ""));
  });

  conversation.forEach(({ text, type }) => {
    fullLog.append(createLogMessage(text, type));
  });

  fullLog.scrollTop = fullLog.scrollHeight;
}

function addConversationMessage(text, type) {
  conversation.push({ text, type });
  renderConversation();
}

function clearPendingReplies() {
  replyTimers.forEach((timer) => window.clearTimeout(timer));
  replyTimers = [];
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

function pushAiGenerationFlow() {
  clearPendingReplies();

  aiGenerationSteps.forEach((reply, index) => {
    const timer = window.setTimeout(() => {
      addConversationMessage(reply, "ai");
    }, 360 + index * 1250);

    replyTimers.push(timer);
  });
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
